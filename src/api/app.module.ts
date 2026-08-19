import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { DatabaseService } from './domain/database.service'
import { ManagerService } from './domain/manager.service'
@Module({ controllers: [AppController], providers: [DatabaseService, ManagerService] }) export class AppModule {}
