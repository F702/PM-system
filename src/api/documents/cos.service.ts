import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import COS from 'cos-nodejs-sdk-v5'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

@Injectable()
export class CosService {
  private readonly configured = Boolean(process.env.COS_REGION && process.env.COS_BUCKET && process.env.COS_SECRET_ID && process.env.COS_SECRET_KEY)
  private readonly client = this.configured ? new COS({ SecretId: process.env.COS_SECRET_ID!, SecretKey: process.env.COS_SECRET_KEY! }) : undefined
  private safeName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'file' }
  async upload(userId: string, category: string, originalName: string, content: Buffer) {
    const key = `users/${userId}/${category}/${randomUUID()}-${this.safeName(originalName)}`, checksum = createHash('sha256').update(content).digest('hex')
    if (this.client) await this.client.putObject({ Bucket: process.env.COS_BUCKET!, Region: process.env.COS_REGION!, Key: key, Body: content, ContentLength: content.length })
    else {
      if (process.env.NODE_ENV === 'production') throw new ServiceUnavailableException('COS 未配置，拒绝在生产环境写入本地磁盘')
      const segments = key.split('/'), path = join(process.cwd(), '.local-storage', ...segments), directory = join(process.cwd(), '.local-storage', ...segments.slice(0, -1)); await mkdir(directory, { recursive: true }); await writeFile(path, content)
    }
    return { objectKey: key, checksum }
  }
  async signedDownloadUrl(key: string) {
    if (!this.client) throw new ServiceUnavailableException('本地开发文件不提供外部下载链接')
    return this.client.getObjectUrl({ Bucket: process.env.COS_BUCKET!, Region: process.env.COS_REGION!, Key: key, Sign: true, Expires: 300 })
  }
}
