import 'dotenv/config'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'

function required(name: string) { if (!process.env[name]) throw new Error(`缺少必需环境变量：${name}`) }
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') ['DATABASE_URL', 'SESSION_SECRET', 'APP_ORIGIN', 'COS_REGION', 'COS_BUCKET', 'COS_SECRET_ID', 'COS_SECRET_KEY'].forEach(required)
  const app = await NestFactory.create(AppModule, { cors: { origin: process.env.APP_ORIGIN || 'http://localhost:5173', credentials: true } })
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-site' } }))
  app.use(cookieParser())
  app.getHttpAdapter().getInstance().set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false)
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, transformOptions: { enableImplicitConversion: false } }))
  app.enableShutdownHooks()
  const port = Number(process.env.PORT || 3000), host = process.env.API_HOST || '127.0.0.1'
  await app.listen(port, host)
  console.log(`API listening on ${host}:${port}`)
}
void bootstrap()
