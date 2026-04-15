import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UploadModule } from 'src/upload/upload.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [UploadModule],
  providers: [ProductsService, PrismaService],
  controllers: [ProductsController]
})
export class ProductsModule { }
