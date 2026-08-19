"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const database_service_1 = require("./domain/database.service");
async function bootstrap() { const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true }); app.setGlobalPrefix(''); app.useGlobalPipes(new common_1.ValidationPipe({ transform: true, whitelist: true })); await app.get(database_service_1.DatabaseService).init(); await app.listen(Number(process.env.PORT || 3000)); console.log('API listening on http://localhost:3000/api/v1'); }
bootstrap();
