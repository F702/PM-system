"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const seed_1 = require("./seed");
let DatabaseService = class DatabaseService {
    file = (0, node_path_1.join)(process.cwd(), 'data', 'manager.local.json');
    db;
    async init() { if (!(0, node_fs_1.existsSync)(this.file)) {
        (0, node_fs_1.mkdirSync)((0, node_path_1.join)(process.cwd(), 'data'), { recursive: true });
        this.db = await (0, seed_1.seedDatabase)();
        this.persist();
    }
    else
        this.db = JSON.parse((0, node_fs_1.readFileSync)(this.file, 'utf8')); }
    data() { return this.db; }
    persist() { (0, node_fs_1.writeFileSync)(this.file, JSON.stringify(this.db, null, 2), 'utf8'); }
    audit(action, entityType, entityId, before, after) { const event = { id: crypto.randomUUID(), at: new Date().toISOString(), actor: 'admin', action, entityType, entityId, before, after }; this.db.audit.unshift(event); this.persist(); }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
