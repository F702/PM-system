import { Injectable } from '@nestjs/common'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { AuditEvent, Database } from '../../shared/domain'
import { seedDatabase } from './seed'

@Injectable()
export class DatabaseService {
  private file = join(process.cwd(), 'data', 'manager.local.json')
  private db!: Database
  async init() { if (!existsSync(this.file)) { mkdirSync(join(process.cwd(), 'data'), { recursive: true }); this.db = await seedDatabase(); this.persist() } else this.db = JSON.parse(readFileSync(this.file, 'utf8')) }
  data() { return this.db }
  persist() { writeFileSync(this.file, JSON.stringify(this.db, null, 2), 'utf8') }
  audit(action: string, entityType: string, entityId: string, before?: unknown, after?: unknown) { const event: AuditEvent = { id: crypto.randomUUID(), at: new Date().toISOString(), actor: 'admin', action, entityType, entityId, before, after }; this.db.audit.unshift(event); this.persist() }
}
