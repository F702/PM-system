"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = __importStar(require("xlsx"));
const auth_service_1 = require("./auth/auth.service");
const auth_dto_1 = require("./auth/auth.dto");
const prisma_service_1 = require("./database/prisma.service");
const manager_service_1 = require("./domain/manager.service");
const cos_service_1 = require("./documents/cos.service");
let AppController = class AppController {
    auth;
    manager;
    prisma;
    cos;
    constructor(auth, manager, prisma, cos) {
        this.auth = auth;
        this.manager = manager;
        this.prisma = prisma;
        this.cos = cos;
    }
    async user(req, write = false) { const user = await this.auth.requireUser(req); if (write) {
        this.auth.assertSameOrigin(req);
        this.auth.requireWritable(user);
    } return user; }
    live() { return { ok: true }; }
    async ready() { await this.prisma.$queryRaw `SELECT 1`; return { ok: true }; }
    async register(body, req, res) { const user = await this.auth.register(body.username, body.password, req); return { user: await this.auth.login(user.username, body.password, req, res) }; }
    async login(body, req, res) { return { user: await this.auth.login(body.username, body.password, req, res) }; }
    async logout(req, res) { await this.auth.logout(req, res); }
    async me(req) { return { user: await this.user(req) }; }
    async changePassword(req, res, body) { const user = await this.user(req, true); await this.auth.changePassword(user, body.password, req, res); return { ok: true }; }
    async dashboard(req) { return this.manager.dashboard(await this.user(req)); }
    async projects(req, query) { return this.manager.list(await this.user(req), query); }
    async createProject(req, body) { return this.manager.create(await this.user(req, true), body); }
    async project(req, id) { return this.manager.get(await this.user(req), id); }
    async updateProject(req, id, body) { return this.manager.update(await this.user(req, true), id, body); }
    async quickUpdate(req, id, body) { return this.manager.quickUpdate(await this.user(req, true), id, body); }
    async financeOverview(req, query) { return this.manager.finance(await this.user(req), query); }
    async financeProjects(req, query) { return this.manager.finance(await this.user(req), query); }
    async recordFinance(req, type, body) { return this.manager.recordFinance(await this.user(req, true), type, body); }
    async employees(req) { return this.manager.employees(await this.user(req)); }
    async employee(req, body) { return this.manager.addEmployee(await this.user(req, true), body.name, body.note); }
    async clients(req) { return this.manager.clients(await this.user(req)); }
    async client(req, body) { return this.manager.addClient(await this.user(req, true), body.name, body.note); }
    async search(req, q = '') { return this.manager.search(await this.user(req), q.slice(0, 120)); }
    async previewImport(req, file) {
        const user = await this.user(req, true);
        if (!file)
            throw new common_1.BadRequestException('请选择不超过 10 MB 的 Excel 文件');
        if (!/\.(xlsx|xls)$/i.test(file.originalname) || (!file.buffer.subarray(0, 2).equals(Buffer.from('PK')) && !file.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))))
            throw new common_1.BadRequestException('文件格式不正确，仅支持 Excel .xlsx/.xls');
        let rows;
        try {
            const workbook = XLSX.read(file.buffer, { type: 'buffer', raw: false, dense: true });
            if (!workbook.SheetNames[0])
                throw new Error('empty');
            rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
        }
        catch {
            throw new common_1.BadRequestException('Excel 文件无法读取');
        }
        if (rows.length > 5000)
            throw new common_1.BadRequestException('单次最多导入 5,000 行');
        const required = ['项目名称*', '客户*', '年份*', '服务类型*', '状态*'], errors = rows.flatMap((row, index) => required.filter(key => !String(row[key] ?? '').trim()).map(key => ({ row: index + 2, message: `${key} 不能为空` })));
        rows.forEach((row, index) => { const year = Number(row['年份*']); if (!Number.isInteger(year) || year < 2000 || year > 2100)
            errors.push({ row: index + 2, message: '年份必须是 2000–2100 的整数' }); if (!['在办', '已完成', '已取消'].includes(String(row['状态*'])))
            errors.push({ row: index + 2, message: '状态必须为 在办、已完成 或 已取消' }); });
        const existing = await this.prisma.project.findMany({ where: { userId: user.id }, select: { name: true, businessYear: true } }), duplicateCount = rows.filter(row => existing.some(project => project.name === String(row['项目名称*']).trim() && project.businessYear === Number(row['年份*']))).length;
        const stored = await this.cos.upload(user.id, 'imports', file.originalname, file.buffer);
        const batch = await this.prisma.importBatch.create({ data: { userId: user.id, originalName: file.originalname.slice(0, 255), objectKey: stored.objectKey, rowsJson: rows, errorsJson: errors, total: rows.length, validCount: Math.max(0, rows.length - errors.length - duplicateCount), duplicateCount, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) } });
        return { id: batch.id, total: batch.total, validCount: batch.validCount, duplicateCount: batch.duplicateCount, errors };
    }
    async confirmImport(req, id) {
        const user = await this.user(req, true), batch = await this.prisma.importBatch.findFirst({ where: { id, userId: user.id } });
        if (!batch || batch.status !== 'PREVIEW' || batch.expiresAt <= new Date())
            throw new common_1.BadRequestException('导入批次不存在、已过期或已处理');
        const errors = batch.errorsJson;
        if (errors.length)
            throw new common_1.BadRequestException('请先修正所有阻断错误');
        const rows = batch.rowsJson, serviceMap = { '招标代理': 'BIDDING', '造价/预结算': 'COST', '监理': 'SUPERVISION', '其他': 'OTHER' }, statusMap = { '在办': 'ACTIVE', '已完成': 'COMPLETED', '已取消': 'CANCELLED' };
        const employee = await this.prisma.employee.findFirst({ where: { userId: user.id, active: true }, orderBy: { createdAt: 'asc' } });
        if (!employee)
            throw new common_1.BadRequestException('请先在设置中新增至少一名在职员工');
        let created = 0;
        await this.prisma.$transaction(async (tx) => { for (const row of rows) {
            const name = String(row['项目名称*']).trim(), businessYear = Number(row['年份*']);
            if (await tx.project.findFirst({ where: { userId: user.id, name, businessYear } }))
                continue;
            const clientName = String(row['客户*']).trim(), client = await tx.client.upsert({ where: { userId_name: { userId: user.id, name: clientName } }, create: { userId: user.id, name: clientName }, update: {} });
            const label = String(row['服务类型*']), serviceType = serviceMap[label] ?? 'OTHER';
            await tx.project.create({ data: { userId: user.id, name, projectNo: String(row['项目编号'] ?? '').trim() || null, businessYear, clientId: client.id, ownerId: employee.id, status: statusMap[String(row['状态*'])] ?? 'ACTIVE', startDate: row['开始日期'] ? new Date(`${String(row['开始日期'])}T00:00:00.000Z`) : undefined, plannedEndDate: row['计划完成日期'] ? new Date(`${String(row['计划完成日期'])}T00:00:00.000Z`) : undefined, actualEndDate: row['实际完成日期'] ? new Date(`${String(row['实际完成日期'])}T00:00:00.000Z`) : undefined, note: String(row['备注'] ?? '').trim() || null, services: { create: { serviceType, stage: '历史导入', ownerId: employee.id, otherDescription: serviceType === 'OTHER' ? label : null } } } });
            created++;
        } await tx.importBatch.update({ where: { id: batch.id }, data: { status: 'IMPORTED', importedCount: created } }); });
        await this.prisma.auditEvent.create({ data: { userId: user.id, action: 'IMPORT', entityType: 'ImportBatch', entityId: id, afterJson: { created } } });
        return { created };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('health/live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('health/ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "ready", null);
__decorate([
    (0, common_1.Post)('auth/register'),
    (0, common_1.HttpCode)(201),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.RegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('auth/logout'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('auth/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('auth/change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, auth_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ProjectQueryDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "projects", null);
__decorate([
    (0, common_1.Post)('projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ProjectDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createProject", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "project", null);
__decorate([
    (0, common_1.Patch)('projects/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, auth_dto_1.ProjectDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Post)('projects/:id/quick-update'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, auth_dto_1.QuickUpdateDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "quickUpdate", null);
__decorate([
    (0, common_1.Get)('finance/overview'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ProjectQueryDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "financeOverview", null);
__decorate([
    (0, common_1.Get)('finance/projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.ProjectQueryDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "financeProjects", null);
__decorate([
    (0, common_1.Post)('finance/:type'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, auth_dto_1.FinanceDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "recordFinance", null);
__decorate([
    (0, common_1.Get)('settings/employees'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "employees", null);
__decorate([
    (0, common_1.Post)('settings/employees'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.NamedItemDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "employee", null);
__decorate([
    (0, common_1.Get)('settings/clients'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "clients", null);
__decorate([
    (0, common_1.Post)('settings/clients'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_dto_1.NamedItemDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "client", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('imports/history/preview'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Post)('imports/history/:id/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "confirmImport", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, manager_service_1.ManagerService, prisma_service_1.PrismaService, cos_service_1.CosService])
], AppController);
