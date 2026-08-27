import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import type { Request, Response } from 'express'
import * as XLSX from 'xlsx'
import { AuthService } from './auth/auth.service'
import { ChangePasswordDto, FinanceDto, LoginDto, NamedItemDto, ProjectDto, ProjectQueryDto, QuickUpdateDto, RegisterDto } from './auth/auth.dto'
import { Prisma } from '@prisma/client'
import { PrismaService } from './database/prisma.service'
import { ManagerService } from './domain/manager.service'
import { CosService } from './documents/cos.service'

@Controller('api/v1')
export class AppController {
  constructor(private readonly auth: AuthService, private readonly manager: ManagerService, private readonly prisma: PrismaService, private readonly cos: CosService) {}
  private async user(req: Request, write = false) { const user = await this.auth.requireUser(req); if (write) { this.auth.assertSameOrigin(req); this.auth.requireWritable(user) } return user }
  @Get('health/live') live() { return { ok: true } }
  @Get('health/ready') async ready() { await this.prisma.$queryRaw`SELECT 1`; return { ok: true } }
  @Post('auth/register') @HttpCode(201) async register(@Body() body: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) { const user = await this.auth.register(body.username, body.password, req); return { user: await this.auth.login(user.username, body.password, req, res) } }
  @Post('auth/login') @HttpCode(200) async login(@Body() body: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) { return { user: await this.auth.login(body.username, body.password, req, res) } }
  @Post('auth/logout') @HttpCode(204) async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.auth.logout(req, res) }
  @Get('auth/me') async me(@Req() req: Request) { return { user: await this.user(req) } }
  @Post('auth/change-password') async changePassword(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: ChangePasswordDto) { const user = await this.user(req, true); await this.auth.changePassword(user, body.password, req, res); return { ok: true } }
  @Get('dashboard') async dashboard(@Req() req: Request) { return this.manager.dashboard(await this.user(req)) }
  @Get('projects') async projects(@Req() req: Request, @Query() query: ProjectQueryDto) { return this.manager.list(await this.user(req), query) }
  @Post('projects') async createProject(@Req() req: Request, @Body() body: ProjectDto) { return this.manager.create(await this.user(req, true), body) }
  @Get('projects/:id') async project(@Req() req: Request, @Param('id') id: string) { return this.manager.get(await this.user(req), id) }
  @Patch('projects/:id') async updateProject(@Req() req: Request, @Param('id') id: string, @Body() body: ProjectDto) { return this.manager.update(await this.user(req, true), id, body) }
  @Post('projects/:id/quick-update') async quickUpdate(@Req() req: Request, @Param('id') id: string, @Body() body: QuickUpdateDto) { return this.manager.quickUpdate(await this.user(req, true), id, body) }
  @Get('finance/overview') async financeOverview(@Req() req: Request, @Query() query: ProjectQueryDto) { return this.manager.finance(await this.user(req), query) }
  @Get('finance/projects') async financeProjects(@Req() req: Request, @Query() query: ProjectQueryDto) { return this.manager.finance(await this.user(req), query) }
  @Post('finance/:type') async recordFinance(@Req() req: Request, @Param('type') type: string, @Body() body: FinanceDto) { return this.manager.recordFinance(await this.user(req, true), type, body) }
  @Get('settings/employees') async employees(@Req() req: Request) { return this.manager.employees(await this.user(req)) }
  @Post('settings/employees') async employee(@Req() req: Request, @Body() body: NamedItemDto) { return this.manager.addEmployee(await this.user(req, true), body.name, body.note) }
  @Get('settings/clients') async clients(@Req() req: Request) { return this.manager.clients(await this.user(req)) }
  @Post('settings/clients') async client(@Req() req: Request, @Body() body: NamedItemDto) { return this.manager.addClient(await this.user(req, true), body.name, body.note) }
  @Get('search') async search(@Req() req: Request, @Query('q') q = '') { return this.manager.search(await this.user(req), q.slice(0, 120)) }
  @Post('imports/history/preview') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async previewImport(@Req() req: Request, @UploadedFile() file?: Express.Multer.File) {
    const user = await this.user(req, true)
    if (!file) throw new BadRequestException('请选择不超过 10 MB 的 Excel 文件')
    if (!/\.(xlsx|xls)$/i.test(file.originalname) || (!file.buffer.subarray(0, 2).equals(Buffer.from('PK')) && !file.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])))) throw new BadRequestException('文件格式不正确，仅支持 Excel .xlsx/.xls')
    let rows: Array<Record<string, unknown>>
    try { const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false, dense: true }); if (!workbook.SheetNames[0]) throw new Error('empty'); rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' }) } catch { throw new BadRequestException('Excel 文件无法读取') }
    if (rows.length > 5000) throw new BadRequestException('单次最多导入 5,000 行')
    const required = ['项目名称*', '客户*', '年份*', '服务类型*', '状态*'], errors = rows.flatMap((row, index) => required.filter(key => !String(row[key] ?? '').trim()).map(key => ({ row: index + 2, message: `${key} 不能为空` })))
    rows.forEach((row, index) => { const year = Number(row['年份*']); if (!Number.isInteger(year) || year < 2000 || year > 2100) errors.push({ row: index + 2, message: '年份必须是 2000–2100 的整数' }); if (!['在办', '已完成', '已取消'].includes(String(row['状态*']))) errors.push({ row: index + 2, message: '状态必须为 在办、已完成 或 已取消' }) })
    const existing = await this.prisma.project.findMany({ where: { userId: user.id }, select: { name: true, businessYear: true } }), duplicateCount = rows.filter(row => existing.some(project => project.name === String(row['项目名称*']).trim() && project.businessYear === Number(row['年份*']))).length
    const stored = await this.cos.upload(user.id, 'imports', file.originalname, file.buffer)
    const batch = await this.prisma.importBatch.create({ data: { userId: user.id, originalName: file.originalname.slice(0, 255), objectKey: stored.objectKey, rowsJson: rows as unknown as Prisma.InputJsonValue, errorsJson: errors as Prisma.InputJsonValue, total: rows.length, validCount: Math.max(0, rows.length - errors.length - duplicateCount), duplicateCount, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } })
    return { id: batch.id, total: batch.total, validCount: batch.validCount, duplicateCount: batch.duplicateCount, errors }
  }
  @Post('imports/history/:id/confirm') async confirmImport(@Req() req: Request, @Param('id') id: string) {
    const user = await this.user(req, true), batch = await this.prisma.importBatch.findFirst({ where: { id, userId: user.id } })
    if (!batch || batch.status !== 'PREVIEW' || batch.expiresAt <= new Date()) throw new BadRequestException('导入批次不存在、已过期或已处理')
    const errors = batch.errorsJson as unknown as Array<{ row: number }>; if (errors.length) throw new BadRequestException('请先修正所有阻断错误')
    const rows = batch.rowsJson as unknown as Array<Record<string, unknown>>, serviceMap: Record<string, 'BIDDING' | 'COST' | 'SUPERVISION' | 'OTHER'> = { '招标代理': 'BIDDING', '造价/预结算': 'COST', '监理': 'SUPERVISION', '其他': 'OTHER' }, statusMap: Record<string, 'ACTIVE' | 'COMPLETED' | 'CANCELLED'> = { '在办': 'ACTIVE', '已完成': 'COMPLETED', '已取消': 'CANCELLED' }
    const employee = await this.prisma.employee.findFirst({ where: { userId: user.id, active: true }, orderBy: { createdAt: 'asc' } }); if (!employee) throw new BadRequestException('请先在设置中新增至少一名在职员工')
    let created = 0
    await this.prisma.$transaction(async tx => { for (const row of rows) { const name = String(row['项目名称*']).trim(), businessYear = Number(row['年份*']); if (await tx.project.findFirst({ where: { userId: user.id, name, businessYear } })) continue; const clientName = String(row['客户*']).trim(), client = await tx.client.upsert({ where: { userId_name: { userId: user.id, name: clientName } }, create: { userId: user.id, name: clientName }, update: {} }); const label = String(row['服务类型*']), serviceType = serviceMap[label] ?? 'OTHER'; await tx.project.create({ data: { userId: user.id, name, projectNo: String(row['项目编号'] ?? '').trim() || null, businessYear, clientId: client.id, ownerId: employee.id, status: statusMap[String(row['状态*'])] ?? 'ACTIVE', startDate: row['开始日期'] ? new Date(`${String(row['开始日期'])}T00:00:00.000Z`) : undefined, plannedEndDate: row['计划完成日期'] ? new Date(`${String(row['计划完成日期'])}T00:00:00.000Z`) : undefined, actualEndDate: row['实际完成日期'] ? new Date(`${String(row['实际完成日期'])}T00:00:00.000Z`) : undefined, note: String(row['备注'] ?? '').trim() || null, services: { create: { serviceType, stage: '历史导入', ownerId: employee.id, otherDescription: serviceType === 'OTHER' ? label : null } } } }); created++ } await tx.importBatch.update({ where: { id: batch.id }, data: { status: 'IMPORTED', importedCount: created } }) })
    await this.prisma.auditEvent.create({ data: { userId: user.id, action: 'IMPORT', entityType: 'ImportBatch', entityId: id, afterJson: { created } } }); return { created }
  }
}
