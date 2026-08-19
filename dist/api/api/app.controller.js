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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const argon2_1 = __importDefault(require("argon2"));
const platform_express_1 = require("@nestjs/platform-express");
const XLSX = __importStar(require("xlsx"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const database_service_1 = require("./domain/database.service");
const manager_service_1 = require("./domain/manager.service");
let AppController = class AppController {
    manager;
    database;
    constructor(manager, database) {
        this.manager = manager;
        this.database = database;
    }
    user(req) { const token = req.headers.authorization?.replace('Bearer ', ''); if (token !== 'local-admin-session')
        throw new common_1.UnauthorizedException('登录已过期'); return this.database.data().users[0]; }
    async login(body) { const user = this.database.data().users.find(x => x.username === body.username); if (!user || user.disabled || user.lockedUntil && new Date(user.lockedUntil) > new Date() || !await argon2_1.default.verify(user.passwordHash, body.password || '')) {
        if (user) {
            user.failedAttempts++;
            if (user.failedAttempts >= 5)
                user.lockedUntil = new Date(Date.now() + 15 * 60_000).toISOString();
            this.database.persist();
        }
        throw new common_1.UnauthorizedException('账号或密码不正确，请重新输入。');
    } user.failedAttempts = 0; this.database.persist(); return { token: 'local-admin-session', user: { id: user.id, username: user.username, mustChangePassword: user.mustChangePassword } }; }
    me(req) { const user = this.user(req); return { id: user.id, username: user.username, mustChangePassword: user.mustChangePassword }; }
    async changePassword(req, body) { const user = this.user(req); if (!body.password || body.password.length < 12)
        throw new common_1.UnauthorizedException('密码至少需要 12 位'); user.passwordHash = await argon2_1.default.hash(body.password, { type: argon2_1.default.argon2id }); user.mustChangePassword = false; this.database.audit('CHANGE_PASSWORD', 'User', user.id); return { ok: true }; }
    dashboard(req) { this.user(req); return this.manager.dashboard(); }
    projects(req, query) { this.user(req); return this.manager.list(query); }
    createProject(req, body) { this.user(req); return this.manager.create(body); }
    project(req, id) { this.user(req); return this.manager.get(id); }
    updateProject(req, id, body) { this.user(req); return this.manager.update(id, body); }
    quickUpdate(req, id, body) { this.user(req); return this.manager.quickUpdate(id, body); }
    financeOverview(req, query) { this.user(req); return this.manager.financeOverview(query); }
    financeProjects(req, query) { this.user(req); return this.manager.finance(query); }
    recordFinance(req, type, body) { this.user(req); return this.manager.recordFinance(type, body); }
    employees(req) { this.user(req); return this.database.data().employees; }
    employee(req, body) { this.user(req); if (!body.name?.trim())
        throw new common_1.UnauthorizedException('姓名不能为空'); const item = { id: crypto.randomUUID(), name: body.name.trim(), active: body.active !== false, note: body.note }; this.database.data().employees.push(item); this.database.audit('CREATE', 'Employee', item.id, undefined, item); return item; }
    clients(req) { this.user(req); return this.database.data().clients; }
    client(req, body) { this.user(req); if (!body.name?.trim())
        throw new common_1.UnauthorizedException('客户名称不能为空'); const item = { id: crypto.randomUUID(), name: body.name.trim(), note: body.note }; this.database.data().clients.push(item); this.database.audit('CREATE', 'Client', item.id, undefined, item); return item; }
    search(req, q = '') { this.user(req); const projects = this.manager.list({ q }); const lower = q.toLowerCase(); const documents = this.database.data().documents.filter(d => !d.hidden && (d.title.toLowerCase().includes(lower) || d.originalName.toLowerCase().includes(lower))).map(d => ({ ...d, project: this.database.data().projects.find(p => p.id === d.projectId)?.name })); return { projects, documents }; }
    previewImport(req, file) { this.user(req); if (!file)
        throw new common_1.BadRequestException('请选择 Excel 文件'); if (!/\.(xlsx|xls)$/i.test(file.originalname))
        throw new common_1.BadRequestException('仅支持 .xlsx 或 .xls 文件'); const rows = XLSX.utils.sheet_to_json(XLSX.read(file.buffer, { type: 'buffer' }).Sheets[XLSX.read(file.buffer, { type: 'buffer' }).SheetNames[0]], { defval: '' }); const required = ['项目名称*', '客户*', '年份*', '服务类型*', '状态*']; const errors = rows.flatMap((row, index) => required.filter(key => !String(row[key] || '').trim()).map(key => ({ row: index + 2, message: `${key} 不能为空` }))); const db = this.database.data(); const valid = rows.filter((_, index) => !errors.some(e => e.row === index + 2)); const duplicates = valid.filter(row => db.projects.some(p => p.name === String(row['项目名称*']).trim() && p.businessYear === Number(row['年份*']))).length; const batch = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), originalName: file.originalname, rows, errors, validCount: valid.length - duplicates, duplicateCount: duplicates, status: 'PREVIEW' }; const data = db; data.batches ||= []; data.batches.unshift(batch); (0, node_fs_1.mkdirSync)((0, node_path_1.join)(process.cwd(), 'uploads', 'imports'), { recursive: true }); (0, node_fs_1.writeFileSync)((0, node_path_1.join)(process.cwd(), 'uploads', 'imports', `${batch.id}-${file.originalname}`), file.buffer); this.database.persist(); return { id: batch.id, total: rows.length, validCount: batch.validCount, duplicateCount: duplicates, errors }; }
    confirmImport(req, id) { this.user(req); const data = this.database.data(); const batch = (data.batches || []).find((b) => b.id === id); if (!batch)
        throw new common_1.BadRequestException('导入批次不存在'); if (batch.status !== 'PREVIEW')
        throw new common_1.BadRequestException('该批次已处理'); if (batch.errors.length)
        throw new common_1.BadRequestException('请先修正所有阻断错误'); let created = 0; for (const row of batch.rows) {
        const name = String(row['项目名称*']).trim(), year = Number(row['年份*']);
        if (data.projects.some((p) => p.name === name && p.businessYear === year))
            continue;
        const clientName = String(row['客户*']).trim();
        let client = data.clients.find((c) => c.name === clientName);
        if (!client) {
            client = { id: crypto.randomUUID(), name: clientName };
            data.clients.push(client);
        }
        const owner = data.employees.find((e) => e.name === String(row['负责人'] || '').trim()) || data.employees[0];
        const serviceMap = { '招标代理': 'BIDDING', '造价/预结算': 'COST', '监理': 'SUPERVISION', '其他': 'OTHER' };
        const statusMap = { '在办': 'ACTIVE', '已完成': 'COMPLETED', '已取消': 'CANCELLED' };
        this.manager.create({ name, projectNo: String(row['项目编号'] || '') || undefined, clientId: client.id, businessYear: year, ownerId: owner.id, status: statusMap[String(row['状态*'])] || 'ACTIVE', startDate: String(row['开始日期'] || '') || undefined, plannedEndDate: String(row['计划完成日期'] || '') || undefined, actualEndDate: String(row['实际完成日期'] || '') || undefined, targetAmount: Number(row['项目/采购标的金额'] || 0) || undefined, note: String(row['备注'] || '') || undefined, services: [{ id: crypto.randomUUID(), serviceType: serviceMap[String(row['服务类型*'])] || 'OTHER', stage: '历史导入', ownerId: owner.id, otherDescription: serviceMap[String(row['服务类型*'])] ? undefined : String(row['服务类型*']) }] });
        created++;
    } batch.status = 'IMPORTED'; batch.importedCount = created; this.database.audit('IMPORT', 'ImportBatch', id, undefined, { created }); return { created }; }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Post)('auth/login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('auth/me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('auth/change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "projects", null);
__decorate([
    (0, common_1.Post)('projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "createProject", null);
__decorate([
    (0, common_1.Get)('projects/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "project", null);
__decorate([
    (0, common_1.Patch)('projects/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "updateProject", null);
__decorate([
    (0, common_1.Post)('projects/:id/quick-update'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "quickUpdate", null);
__decorate([
    (0, common_1.Get)('finance/overview'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "financeOverview", null);
__decorate([
    (0, common_1.Get)('finance/projects'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "financeProjects", null);
__decorate([
    (0, common_1.Post)('finance/:type'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "recordFinance", null);
__decorate([
    (0, common_1.Get)('settings/employees'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "employees", null);
__decorate([
    (0, common_1.Post)('settings/employees'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "employee", null);
__decorate([
    (0, common_1.Get)('settings/clients'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "clients", null);
__decorate([
    (0, common_1.Post)('settings/clients'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "client", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('imports/history/preview'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Post)('imports/history/:id/confirm'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "confirmImport", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)('api/v1'),
    __metadata("design:paramtypes", [manager_service_1.ManagerService, database_service_1.DatabaseService])
], AppController);
