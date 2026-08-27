import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AppController } from './app.controller'
import { ManagerService } from './domain/manager.service'
import { CosService } from './documents/cos.service'
import { PrismaService } from './database/prisma.service'
import { AuthService } from './auth/auth.service'

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
  controllers: [AppController],
  providers: [PrismaService, AuthService, ManagerService, CosService, { provide: APP_GUARD, useClass: ThrottlerGuard }]
})
export class AppModule {}
