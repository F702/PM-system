"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const manager_service_1 = require("./domain/manager.service");
const cos_service_1 = require("./documents/cos.service");
const prisma_service_1 = require("./database/prisma.service");
const auth_service_1 = require("./auth/auth.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [throttler_1.ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
        controllers: [app_controller_1.AppController],
        providers: [prisma_service_1.PrismaService, auth_service_1.AuthService, manager_service_1.ManagerService, cos_service_1.CosService, { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }]
    })
], AppModule);
