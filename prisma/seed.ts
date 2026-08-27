import { PrismaClient, ProjectStatus, ServiceType, UserRole } from '@prisma/client'
import argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({ where: { username: 'admin' }, update: { role: UserRole.DEMO, disabledAt: null, passwordHash: await argon2.hash('admin', { type: argon2.argon2id }) }, create: { username: 'admin', role: UserRole.DEMO, passwordHash: await argon2.hash('admin', { type: argon2.argon2id }) } })
  const count = await prisma.project.count({ where: { userId: admin.id } })
  if (count) return
  await prisma.employee.createMany({ data: [{ userId: admin.id, name: '张三' }, { userId: admin.id, name: '李四' }, { userId: admin.id, name: '王五' }] })
  await prisma.client.createMany({ data: [{ userId: admin.id, name: 'XX教育局' }, { userId: admin.id, name: 'XX城投' }, { userId: admin.id, name: 'XX医院' }] })
  const employees = await prisma.employee.findMany({ where: { userId: admin.id } })
  const clients = await prisma.client.findMany({ where: { userId: admin.id } })
  const zhang = employees.find(item => item.name === '张三')!, li = employees.find(item => item.name === '李四')!, wang = employees.find(item => item.name === '王五')!
  const education = clients.find(item => item.name === 'XX教育局')!, city = clients.find(item => item.name === 'XX城投')!, hospital = clients.find(item => item.name === 'XX医院')!
  await prisma.project.create({ data: { userId: admin.id, name: 'XX学校改造项目', projectNo: 'PM-2026-001', clientId: education.id, ownerId: zhang.id, businessYear: 2026, status: ProjectStatus.ACTIVE, startDate: new Date('2026-04-01'), plannedEndDate: new Date('2026-09-01'), lastReviewedAt: new Date('2026-07-20'), services: { create: [{ serviceType: ServiceType.SUPERVISION, stage: '施工中', ownerId: zhang.id }, { serviceType: ServiceType.COST, stage: '最终版', ownerId: zhang.id }] }, milestones: { create: { name: '整改复查', plannedDate: new Date('2026-08-15'), critical: true } }, contracts: { create: { contractNo: 'HT-2026-01', amount: '85000', signedDate: new Date('2026-04-10'), expectedPaymentDate: new Date('2026-08-07'), invoices: { create: { invoiceNo: 'FP-001', invoiceDate: new Date('2026-06-10'), amount: '30000' } }, payments: { create: { paymentDate: new Date('2026-06-20'), amount: '20000' } } } } } })
  await prisma.project.create({ data: { userId: admin.id, name: 'XX道路招标', projectNo: 'PM-2026-002', clientId: city.id, ownerId: wang.id, businessYear: 2026, status: ProjectStatus.ACTIVE, services: { create: { serviceType: ServiceType.BIDDING, stage: '开标准备', ownerId: wang.id } }, milestones: { create: { name: '开标', plannedDate: new Date('2026-08-22'), critical: true } }, contracts: { create: { contractNo: 'HT-2026-02', amount: '120000', signedDate: new Date('2026-05-03'), expectedPaymentDate: new Date('2026-09-01'), invoices: { create: { invoiceNo: 'FP-002', invoiceDate: new Date('2026-07-10'), amount: '60000' } }, payments: { create: { paymentDate: new Date('2026-07-20'), amount: '60000' } } } } } })
  await prisma.project.create({ data: { userId: admin.id, name: 'XX采购代理', projectNo: 'PM-2025-011', clientId: hospital.id, ownerId: li.id, businessYear: 2025, status: ProjectStatus.COMPLETED, actualEndDate: new Date('2025-10-20'), services: { create: { serviceType: ServiceType.BIDDING, stage: '已完成', ownerId: li.id } }, contracts: { create: { contractNo: 'HT-2025-11', amount: '56000', signedDate: new Date('2025-06-01'), expectedPaymentDate: new Date('2025-11-01'), invoices: { create: { invoiceNo: 'FP-003', invoiceDate: new Date('2025-07-10'), amount: '56000' } }, payments: { create: { paymentDate: new Date('2025-10-30'), amount: '20000' } } } } } })
}
main().finally(() => prisma.$disconnect())
