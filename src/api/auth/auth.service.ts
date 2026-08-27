import { ConflictException, ForbiddenException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common'
import { User, UserRole } from '@prisma/client'
import argon2 from 'argon2'
import { createHmac, randomBytes } from 'node:crypto'
import type { Request, Response } from 'express'
import { PrismaService } from '../database/prisma.service'

const SESSION_COOKIE = 'pm_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 12
type PublicUser = Pick<User, 'id' | 'username' | 'role'>

@Injectable()
export class AuthService {
  private readonly attempts = new Map<string, { count: number; resetAt: number }>()
  constructor(private readonly prisma: PrismaService) {}
  private hash(token: string) { return createHmac('sha256', process.env.SESSION_SECRET || 'development-only-session-secret').update(token).digest('hex') }
  private isProduction() { return process.env.NODE_ENV === 'production' }
  private cookieOptions() { return { httpOnly: true, secure: this.isProduction(), sameSite: 'lax' as const, path: '/', maxAge: SESSION_TTL_MS } }
  private key(req: Request, username: string) { return `${req.ip}|${username.toLowerCase()}` }
  private checkRate(req: Request, username: string) {
    const key = this.key(req, username), now = Date.now(), entry = this.attempts.get(key)
    if (entry && entry.resetAt > now && entry.count >= 10) throw new HttpException('尝试次数过多，请 15 分钟后再试', HttpStatus.TOO_MANY_REQUESTS)
  }
  private failed(req: Request, username: string) {
    const key = this.key(req, username), now = Date.now(), old = this.attempts.get(key)
    this.attempts.set(key, { count: (old?.resetAt && old.resetAt > now ? old.count : 0) + 1, resetAt: now + 15 * 60_000 })
  }
  private clearFailed(req: Request, username: string) { this.attempts.delete(this.key(req, username)) }
  async register(username: string, password: string, req: Request) {
    const normalized = username.trim().toLowerCase()
    if (normalized === 'admin') throw new ConflictException('该用户名保留用于演示账户')
    const exists = await this.prisma.user.findUnique({ where: { username: normalized } })
    if (exists) throw new ConflictException('用户名已被使用')
    let user: User
    try {
      user = await this.prisma.$transaction(async tx => {
        const created = await tx.user.create({ data: { username: normalized, passwordHash: await argon2.hash(password, { type: argon2.argon2id }) } })
        await tx.employee.create({ data: { userId: created.id, name: '我' } })
        await tx.auditEvent.create({ data: { userId: created.id, action: 'REGISTER', entityType: 'User', entityId: created.id, ip: req.ip } })
        return created
      })
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') throw new ConflictException('用户名已被使用')
      throw error
    }
    return user
  }
  async login(username: string, password: string, req: Request, res: Response) {
    const normalized = username.trim().toLowerCase(); this.checkRate(req, normalized)
    const user = await this.prisma.user.findUnique({ where: { username: normalized } })
    const invalid = !user || user.disabledAt || (user.lockedUntil && user.lockedUntil > new Date()) || !await argon2.verify(user.passwordHash, password)
    if (invalid) {
      this.failed(req, normalized)
      if (user) await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: { increment: 1 }, lockedUntil: user.failedAttempts + 1 >= 5 ? new Date(Date.now() + 15 * 60_000) : undefined } })
      throw new UnauthorizedException('用户名或密码不正确')
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { failedAttempts: 0, lockedUntil: null } }); this.clearFailed(req, normalized)
    const token = randomBytes(32).toString('base64url')
    await this.prisma.session.create({ data: { tokenHash: this.hash(token), userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
    res.cookie(SESSION_COOKIE, token, this.cookieOptions())
    await this.prisma.auditEvent.create({ data: { userId: user.id, action: 'LOGIN', entityType: 'User', entityId: user.id, ip: req.ip } })
    return this.publicUser(user)
  }
  async requireUser(req: Request): Promise<PublicUser> {
    const token = req.cookies?.[SESSION_COOKIE]
    if (typeof token !== 'string' || token.length < 30) throw new UnauthorizedException('登录已过期，请重新登录')
    const session = await this.prisma.session.findUnique({ where: { tokenHash: this.hash(token) }, include: { user: true } })
    if (!session || session.expiresAt <= new Date() || session.user.disabledAt) { if (session) await this.prisma.session.delete({ where: { id: session.id } }); throw new UnauthorizedException('登录已过期，请重新登录') }
    if (Date.now() - session.lastSeenAt.getTime() > 10 * 60_000) await this.prisma.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    return this.publicUser(session.user)
  }
  requireWritable(user: PublicUser) { if (user.role === UserRole.DEMO) throw new ForbiddenException('演示账户为只读模式，请注册正式账户后录入或修改数据') }
  assertSameOrigin(req: Request) {
    const origin = req.headers.origin
    const appOrigin = process.env.APP_ORIGIN
    if (origin && appOrigin && origin !== appOrigin) throw new ForbiddenException('请求来源不受信任')
  }
  async logout(req: Request, res: Response) { const token = req.cookies?.[SESSION_COOKIE]; if (typeof token === 'string') await this.prisma.session.deleteMany({ where: { tokenHash: this.hash(token) } }); res.clearCookie(SESSION_COOKIE, this.cookieOptions()) }
  async changePassword(user: PublicUser, password: string, req: Request, res: Response) { this.requireWritable(user); const hash = await argon2.hash(password, { type: argon2.argon2id }); await this.prisma.$transaction([this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } }), this.prisma.session.deleteMany({ where: { userId: user.id } }), this.prisma.auditEvent.create({ data: { userId: user.id, action: 'CHANGE_PASSWORD', entityType: 'User', entityId: user.id, ip: req.ip } })]); res.clearCookie(SESSION_COOKIE, this.cookieOptions()) }
  publicUser(user: Pick<User, 'id' | 'username' | 'role'>): PublicUser { return { id: user.id, username: user.username, role: user.role } }
}
