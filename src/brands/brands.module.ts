import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';

@Module({
  providers: [BrandsService, PrismaService],
  controllers: [BrandsController]
})
export class BrandsModule { }