"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const argon2_1 = __importDefault(require("argon2"));
async function seedDatabase() {
    const passwordHash = await argon2_1.default.hash('admin', { type: argon2_1.default.argon2id });
    const now = new Date().toISOString();
    const employees = [{ id: 'e1', name: '张三', active: true }, { id: 'e2', name: '李四', active: true }, { id: 'e3', name: '王五', active: true }];
    const clients = [{ id: 'c1', name: 'XX教育局' }, { id: 'c2', name: 'XX城投' }, { id: 'c3', name: 'XX医院' }];
    return {
        users: [{ id: 'u1', username: 'admin', passwordHash, mustChangePassword: true, failedAttempts: 0 }], employees, clients,
        projects: [
            { id: 'p1', name: 'XX学校改造项目', projectNo: 'PM-2026-001', clientId: 'c1', businessYear: 2026, ownerId: 'e1', status: 'ACTIVE', startDate: '2026-04-01', plannedEndDate: '2026-09-01', lastReviewedAt: '2026-07-20T08:00:00.000Z', createdAt: now, updatedAt: now, services: [{ id: 's1', serviceType: 'SUPERVISION', stage: '施工中', ownerId: 'e1' }, { id: 's2', serviceType: 'COST', stage: '最终版', ownerId: 'e1' }], milestones: [{ id: 'm1', serviceId: 's1', name: '整改复查', plannedDate: '2026-08-15', critical: true }], costResults: [{ id: 'cr1', projectId: 'p1', resultType: '预算', versionLabel: '终稿', status: 'FINAL', amount: 3820000, date: '2026-07-15' }], issues: [{ id: 'i1', projectId: 'p1', title: '消防通道整改', severity: 'IMPORTANT', responsibleParty: '施工单位', foundDate: '2026-08-01', dueDate: '2026-08-12', status: 'PROCESSING' }] },
            { id: 'p2', name: 'XX道路招标', projectNo: 'PM-2026-002', clientId: 'c2', businessYear: 2026, ownerId: 'e3', status: 'ACTIVE', lastReviewedAt: now, createdAt: now, updatedAt: now, services: [{ id: 's3', serviceType: 'BIDDING', stage: '开标准备', ownerId: 'e3', bidding: { bidDeadline: '2026-08-22', bidOpenDate: '2026-08-22' } }], milestones: [{ id: 'm2', serviceId: 's3', name: '开标', plannedDate: '2026-08-22', critical: true }], costResults: [], issues: [] },
            { id: 'p3', name: 'XX采购代理', projectNo: 'PM-2025-011', clientId: 'c3', businessYear: 2025, ownerId: 'e2', status: 'COMPLETED', actualEndDate: '2025-10-20', lastReviewedAt: now, createdAt: now, updatedAt: now, services: [{ id: 's4', serviceType: 'BIDDING', stage: '已完成', ownerId: 'e2' }], milestones: [], costResults: [], issues: [] }
        ],
        contracts: [{ id: 'ct1', projectId: 'p1', contractNo: 'HT-2026-01', amount: 85000, signedDate: '2026-04-10', expectedPaymentDate: '2026-08-07' }, { id: 'ct2', projectId: 'p2', contractNo: 'HT-2026-02', amount: 120000, signedDate: '2026-05-03', expectedPaymentDate: '2026-09-01' }, { id: 'ct3', projectId: 'p3', contractNo: 'HT-2025-11', amount: 56000, signedDate: '2025-06-01', expectedPaymentDate: '2025-11-01' }],
        invoices: [{ id: 'iv1', contractId: 'ct1', invoiceNo: 'FP-001', invoiceDate: '2026-06-10', amount: 30000 }, { id: 'iv2', contractId: 'ct2', invoiceNo: 'FP-002', invoiceDate: '2026-07-10', amount: 60000 }, { id: 'iv3', contractId: 'ct3', invoiceNo: 'FP-003', invoiceDate: '2025-07-10', amount: 56000 }],
        payments: [{ id: 'py1', contractId: 'ct1', paymentDate: '2026-06-20', amount: 20000 }, { id: 'py2', contractId: 'ct2', paymentDate: '2026-07-20', amount: 60000 }, { id: 'py3', contractId: 'ct3', paymentDate: '2025-10-30', amount: 20000 }],
        documents: [{ id: 'd1', projectId: 'p1', category: 'RESULT', title: '最终预算', final: true, originalName: '最终预算.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 0, createdAt: now }, { id: 'd2', projectId: 'p1', category: 'CONTRACT', title: '服务合同', final: true, originalName: '服务合同.pdf', mimeType: 'application/pdf', size: 0, createdAt: now }], audit: []
    };
}
