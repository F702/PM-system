"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../database/prisma.service");
const date = (value) => value ? value.toISOString().slice(0, 10) : undefined;
const number = (value) => value == null ? 0 : Number(value);
const today = () => new Date().toISOString().slice(0, 10);
const daysOverdue = (value) => value ? Math.floor((new Date(`${today()}T00:00:00Z`).getTime() - new Date(`${date(value)}T00:00:00Z`).getTime()) / 86_400_000) : 0;
const projectInclude = { client: true, owner: true, services: true, milestones: true, contracts: { include: { invoices: true, payments: true } }, documents: { where: { hidden: false } } };
let ManagerService = class ManagerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async audit(userId, action, entityType, entityId, before, after) { await this.prisma.auditEvent.create({ data: { userId, action, entityType, entityId, beforeJson: before, afterJson: after } }); }
    map(project) {
        const contracts = project.contracts.filter(c => !c.void);
        const invoices = contracts.flatMap(c => c.invoices.filter(i => !i.void));
        const payments = contracts.flatMap(c => c.payments.filter(p => !p.void));
        const finance = { contractAmount: contracts.reduce((sum, c) => sum + number(c.amount), 0), invoiceAmount: invoices.reduce((sum, i) => sum + number(i.amount), 0), paymentAmount: payments.reduce((sum, p) => sum + number(p.amount), 0) };
        return {
            id: project.id, name: project.name, projectNo: project.projectNo, businessYear: project.businessYear, status: project.status, startDate: date(project.startDate), plannedEndDate: date(project.plannedEndDate), actualEndDate: date(project.actualEndDate), targetAmount: number(project.targetAmount), note: project.note, lastReviewedAt: project.lastReviewedAt.toISOString(), createdAt: project.createdAt.toISOString(), updatedAt: project.updatedAt.toISOString(),
            client: project.client, owner: project.owner, clientId: project.clientId, ownerId: project.ownerId,
            services: project.services.map(s => ({ ...s, plannedEndDate: date(s.plannedEndDate), actualEndDate: date(s.actualEndDate) })), milestones: project.milestones.map(m => ({ ...m, plannedDate: date(m.plannedDate), actualDate: date(m.actualDate) })),
            contracts: contracts.map(c => ({ ...c, amount: number(c.amount), signedDate: date(c.signedDate), expectedPaymentDate: date(c.expectedPaymentDate) })), invoices: invoices.map(i => ({ ...i, amount: number(i.amount), invoiceDate: date(i.invoiceDate) })), payments: payments.map(p => ({ ...p, amount: number(p.amount), paymentDate: date(p.paymentDate) })),
            documents: project.documents.map(d => ({ ...d, final: d.isFinal })), finance: { ...finance, receivableAmount: finance.contractAmount - finance.paymentAmount }
        };
    }
    risks(project) {
        if (project.status === client_1.ProjectStatus.CANCELLED)
            return [];
        const risks = [];
        for (const milestone of project.milestones.filter(m => !m.actualDate)) {
            const overdue = daysOverdue(milestone.plannedDate ? new Date(milestone.plannedDate) : null);
            if (overdue > 0 && milestone.critical)
                risks.push({ projectId: project.id, projectName: project.name, owner: project.owner.name, reason: `关键节点“${milestone.name}”已延期 ${overdue} 天`, level: 'danger', days: overdue });
            else if (overdue <= 0 && overdue >= -7)
                risks.push({ projectId: project.id, projectName: project.name, owner: project.owner.name, reason: `关键节点“${milestone.name}”${Math.abs(overdue)} 天后到期`, level: 'warning', days: Math.abs(overdue) });
        }
        for (const contract of project.contracts) {
            const paid = project.payments.filter(p => p.contractId === contract.id).reduce((sum, p) => sum + p.amount, 0), overdue = daysOverdue(contract.expectedPaymentDate ? new Date(contract.expectedPaymentDate) : null);
            if (contract.expectedPaymentDate && contract.amount > paid && overdue > 0)
                risks.push({ projectId: project.id, projectName: project.name, owner: project.owner.name, reason: `应收 ¥${(contract.amount - paid).toLocaleString('zh-CN')} 逾期 ${overdue} 天`, level: 'danger', days: overdue });
        }
        return risks;
    }
    parseDate(value) { return value ? new Date(`${value}T00:00:00.000Z`) : undefined; }
    async assertReferences(actor, dto) {
        const [client, owner, ...serviceOwners] = await Promise.all([this.prisma.client.findFirst({ where: { id: dto.clientId, userId: actor.id, disabled: false } }), this.prisma.employee.findFirst({ where: { id: dto.ownerId, userId: actor.id, active: true } }), ...dto.services.map(s => this.prisma.employee.findFirst({ where: { id: s.ownerId, userId: actor.id, active: true } }))]);
        if (!client)
            throw new common_1.BadRequestException('客户不存在或不可用');
        if (!owner || serviceOwners.some(x => !x))
            throw new common_1.BadRequestException('负责人不存在或不可用');
        if (dto.services.some(s => s.serviceType === client_1.ServiceType.OTHER && !s.otherDescription?.trim()))
            throw new common_1.BadRequestException('“其他”服务必须填写服务说明');
    }
    async list(actor, query) {
        const where = { userId: actor.id, ...(query.status && ['ACTIVE', 'COMPLETED', 'CANCELLED'].includes(query.status) ? { status: query.status } : {}), ...(query.businessYear ? { businessYear: query.businessYear } : {}), ...(query.clientId ? { clientId: query.clientId } : {}), ...(query.serviceType && ['BIDDING', 'COST', 'SUPERVISION', 'OTHER'].includes(query.serviceType) ? { services: { some: { serviceType: query.serviceType } } } : {}), ...(query.q ? { OR: [{ name: { contains: query.q.trim(), mode: 'insensitive' } }, { projectNo: { contains: query.q.trim(), mode: 'insensitive' } }, { client: { name: { contains: query.q.trim(), mode: 'insensitive' } } }] } : {}) };
        const items = (await this.prisma.project.findMany({ where, include: projectInclude, orderBy: { updatedAt: 'desc' }, take: 200 })).map(x => this.map(x));
        return query.hasRisk === 'true' ? items.filter(x => this.risks(x).length) : items.map(x => ({ ...x, risks: this.risks(x) }));
    }
    async get(actor, id) { const project = await this.prisma.project.findFirst({ where: { id, userId: actor.id }, include: projectInclude }); if (!project)
        throw new common_1.NotFoundException('项目不存在'); const mapped = this.map(project); const audit = await this.prisma.auditEvent.findMany({ where: { userId: actor.id, entityId: id }, orderBy: { createdAt: 'desc' }, take: 30 }); return { ...mapped, risks: this.risks(mapped), audit }; }
    async create(actor, dto) { await this.assertReferences(actor, dto); const created = await this.prisma.project.create({ data: { userId: actor.id, name: dto.name.trim(), projectNo: dto.projectNo?.trim() || null, clientId: dto.clientId, ownerId: dto.ownerId, businessYear: dto.businessYear, status: dto.status, startDate: this.parseDate(dto.startDate), plannedEndDate: this.parseDate(dto.plannedEndDate), actualEndDate: this.parseDate(dto.actualEndDate), targetAmount: dto.targetAmount, note: dto.note?.trim() || null, services: { create: dto.services.map(s => ({ serviceType: s.serviceType, stage: s.stage.trim(), ownerId: s.ownerId, otherDescription: s.otherDescription?.trim() || null })) } }, include: projectInclude }); await this.audit(actor.id, 'CREATE', 'Project', created.id, undefined, { name: created.name }); return this.get(actor, created.id); }
    async update(actor, id, dto) { const before = await this.get(actor, id); await this.assertReferences(actor, dto); try {
        await this.prisma.project.update({ where: { id }, data: { name: dto.name.trim(), projectNo: dto.projectNo?.trim() || null, clientId: dto.clientId, ownerId: dto.ownerId, businessYear: dto.businessYear, status: dto.status, startDate: this.parseDate(dto.startDate), plannedEndDate: this.parseDate(dto.plannedEndDate), actualEndDate: this.parseDate(dto.actualEndDate), targetAmount: dto.targetAmount, note: dto.note?.trim() || null, services: { deleteMany: {}, create: dto.services.map(s => ({ serviceType: s.serviceType, stage: s.stage.trim(), ownerId: s.ownerId, otherDescription: s.otherDescription?.trim() || null })) } } });
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new common_1.ConflictException('项目编号已存在');
        throw error;
    } await this.audit(actor.id, 'UPDATE', 'Project', id, { name: before.name }, { name: dto.name }); return this.get(actor, id); }
    async quickUpdate(actor, id, dto) { await this.get(actor, id); await this.prisma.project.update({ where: { id }, data: { ...(dto.status ? { status: dto.status } : {}), ...(dto.note !== undefined ? { note: dto.note.trim() || null } : {}), lastReviewedAt: new Date() } }); await this.audit(actor.id, 'QUICK_UPDATE', 'Project', id, undefined, dto); return this.get(actor, id); }
    async dashboard(actor) {
        const projects = (await this.prisma.project.findMany({ where: { userId: actor.id }, include: projectInclude, orderBy: { updatedAt: 'desc' } })).map(x => this.map(x)), active = projects.filter(p => p.status === client_1.ProjectStatus.ACTIVE), risks = projects.flatMap(p => this.risks(p)).sort((a, b) => b.days - a.days), currentMonth = new Date().toISOString().slice(0, 7), payments = projects.flatMap(p => p.payments).filter(p => p.paymentDate?.startsWith(currentMonth)), finance = this.financeFrom(projects);
        return { activeCount: active.length, attentionCount: new Set(risks.map(r => r.projectId)).size, receivableAmount: finance.receivableAmount, monthPaymentAmount: payments.reduce((sum, p) => sum + p.amount, 0), risks: risks.slice(0, 8), upcoming: active.flatMap(p => p.milestones.filter(m => !m.actualDate && daysOverdue(m.plannedDate ? new Date(m.plannedDate) : null) <= 0 && daysOverdue(m.plannedDate ? new Date(m.plannedDate) : null) >= -14).map(m => ({ ...m, projectId: p.id, projectName: p.name }))).slice(0, 10), recentProjects: active.slice(0, 6) };
    }
    financeFrom(projects) { const contractAmount = projects.reduce((sum, p) => sum + p.finance.contractAmount, 0), invoiceAmount = projects.reduce((sum, p) => sum + p.finance.invoiceAmount, 0), paymentAmount = projects.reduce((sum, p) => sum + p.finance.paymentAmount, 0), overdueAmount = projects.flatMap(p => p.contracts).filter(c => c.expectedPaymentDate && daysOverdue(new Date(c.expectedPaymentDate)) > 0).reduce((sum, c) => sum + Math.max(0, c.amount - projects.flatMap(p => p.payments).filter(p => p.contractId === c.id).reduce((x, p) => x + p.amount, 0)), 0); return { projectCount: projects.length, contractAmount, invoiceAmount, paymentAmount, receivableAmount: contractAmount - paymentAmount, overdueAmount }; }
    async finance(actor, query) { const projects = await this.list(actor, query); return { projects, ...this.financeFrom(projects) }; }
    async recordFinance(actor, type, dto) {
        if (type === 'contract') {
            if (!dto.projectId || !dto.contractNo)
                throw new common_1.BadRequestException('请选择项目并填写合同编号');
            const project = await this.prisma.project.findFirst({ where: { id: dto.projectId, userId: actor.id } });
            if (!project)
                throw new common_1.NotFoundException('项目不存在');
            const item = await this.prisma.contract.create({ data: { projectId: project.id, contractNo: dto.contractNo.trim(), amount: dto.amount, signedDate: this.parseDate(dto.signedDate), expectedPaymentDate: this.parseDate(dto.expectedPaymentDate), note: dto.note?.trim() || null } });
            await this.audit(actor.id, 'CREATE', 'Contract', item.id, undefined, { amount: dto.amount });
            return { ...item, amount: number(item.amount) };
        }
        const contract = dto.contractId ? await this.prisma.contract.findFirst({ where: { id: dto.contractId, project: { userId: actor.id } } }) : null;
        if (!contract)
            throw new common_1.NotFoundException('合同不存在');
        if (type === 'invoice') {
            if (!dto.invoiceNo || !dto.invoiceDate)
                throw new common_1.BadRequestException('请完整填写发票信息');
            const item = await this.prisma.invoice.create({ data: { contractId: contract.id, invoiceNo: dto.invoiceNo.trim(), invoiceDate: this.parseDate(dto.invoiceDate), amount: dto.amount, note: dto.note?.trim() || null } });
            await this.audit(actor.id, 'CREATE', 'Invoice', item.id, undefined, { amount: dto.amount });
            return { ...item, amount: number(item.amount) };
        }
        if (type === 'payment') {
            if (!dto.paymentDate)
                throw new common_1.BadRequestException('请填写回款日期');
            const item = await this.prisma.payment.create({ data: { contractId: contract.id, paymentDate: this.parseDate(dto.paymentDate), amount: dto.amount, note: dto.note?.trim() || null } });
            await this.audit(actor.id, 'CREATE', 'Payment', item.id, undefined, { amount: dto.amount });
            return { ...item, amount: number(item.amount) };
        }
        throw new common_1.BadRequestException('未知经营记录类型');
    }
    async employees(actor) { return this.prisma.employee.findMany({ where: { userId: actor.id }, orderBy: { createdAt: 'asc' } }); }
    async clients(actor) { return this.prisma.client.findMany({ where: { userId: actor.id, disabled: false }, orderBy: { createdAt: 'asc' } }); }
    async addEmployee(actor, name, note) { try {
        const item = await this.prisma.employee.create({ data: { userId: actor.id, name: name.trim(), note: note?.trim() || null } });
        await this.audit(actor.id, 'CREATE', 'Employee', item.id, undefined, { name: item.name });
        return item;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new common_1.ConflictException('员工已存在');
        throw error;
    } }
    async addClient(actor, name, note) { try {
        const item = await this.prisma.client.create({ data: { userId: actor.id, name: name.trim(), note: note?.trim() || null } });
        await this.audit(actor.id, 'CREATE', 'Client', item.id, undefined, { name: item.name });
        return item;
    }
    catch (error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            throw new common_1.ConflictException('客户已存在');
        throw error;
    } }
    async search(actor, q) { const query = q.trim(); if (!query)
        return { projects: [], documents: [] }; const projects = await this.list(actor, { q: query }); const documents = await this.prisma.document.findMany({ where: { project: { userId: actor.id }, hidden: false, OR: [{ title: { contains: query, mode: 'insensitive' } }, { originalName: { contains: query, mode: 'insensitive' } }] }, include: { project: { select: { name: true } } }, take: 50 }); return { projects: projects.slice(0, 50), documents: documents.map(d => ({ ...d, project: d.project.name })) }; }
};
exports.ManagerService = ManagerService;
exports.ManagerService = ManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ManagerService);
