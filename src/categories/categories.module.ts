import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  providers: [CategoriesService, PrismaService],
  controllers: [CategoriesController]
})
export class CategoriesModule { }