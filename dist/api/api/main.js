"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
function required(name) { if (!process.env[name])
    throw new Error(`缺少必需环境变量：${name}`); }
async function bootstrap() {
    if (process.env.NODE_ENV === 'production')
        ['DATABASE_URL', 'SESSION_SECRET', 'APP_ORIGIN', 'COS_REGION', 'COS_BUCKET', 'COS_SECRET_ID', 'COS_SECRET_KEY'].forEach(required);
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: { origin: process.env.APP_ORIGIN || 'http://localhost:5173', credentials: true } });
    app.use((0, helmet_1.default)({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }));
    app.use((0, cookie_parser_1.default)());
    app.getHttpAdapter().getInstance().set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);
    app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: false } }));
    app.enableShutdownHooks();
    const port = Number(process.env.PORT || 3000), host = process.env.API_HOST || '127.0.0.1';
    await app.listen(port, host);
    console.log(`API listening on ${host}:${port}`);
}
void bootstrap();
