import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';

@Module({
  controllers: [CashRegisterController],
  providers: [CashRegisterService, PrismaService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
