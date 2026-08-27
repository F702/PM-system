import 'reflect-metadata'
import { validate } from 'class-validator'
import { describe, expect, it } from 'vitest'
import { ProjectDto, RegisterDto, ServiceDto } from './auth.dto'

describe('public input validation', () => {
  it('rejects weak registration credentials', async () => {
    const input = Object.assign(new RegisterDto(), { username: 'a', password: 'short' })
    expect(await validate(input)).not.toHaveLength(0)
  })
  it('accepts a complete project payload', async () => {
    const service = Object.assign(new ServiceDto(), { serviceType: 'BIDDING', stage: '准备', ownerId: '11111111-1111-1111-1111-111111111111' })
    const project = Object.assign(new ProjectDto(), { name: '项目', clientId: '22222222-2222-2222-2222-222222222222', ownerId: '11111111-1111-1111-1111-111111111111', status: 'ACTIVE', businessYear: 2026, services: [service] })
    expect(await validate(project)).toHaveLength(0)
  })
})
