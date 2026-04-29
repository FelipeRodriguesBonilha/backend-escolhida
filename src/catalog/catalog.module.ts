import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { PrismaService } from 'src/prisma.service';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [UploadModule],
    controllers: [CatalogController],
    providers: [PrismaService],
})
export class CatalogModule {}
