import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DatabaseService } from './domain/database.service'

async function bootstrap() { const app = await NestFactory.create(AppModule, { cors: true }); app.setGlobalPrefix(''); app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })); await app.get(DatabaseService).init(); await app.listen(Number(process.env.PORT || 3000)); console.log('API listening on http://localhost:3000/api/v1') }
bootstrap()
