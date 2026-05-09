import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CashRegisterModule } from '../cash-register/cash-register.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [CashRegisterModule],
  controllers: [SalesController],
  providers: [SalesService, PrismaService]
})
export class SalesModule { }