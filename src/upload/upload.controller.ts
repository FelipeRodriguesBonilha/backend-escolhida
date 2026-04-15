import { Controller, Get, Param, Res, StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { UploadService } from './upload.service';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';

@Roles(Role.Admin)
@Controller('uploads')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Get(':filename')
    async getFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const file = await this.uploadService.getFile(filename);
        
        const ext = filename.split('.').pop()?.toLowerCase();
        const contentType = this.getContentType(ext);
        
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
        });
        
        return new StreamableFile(file);
    }

    private getContentType(ext?: string): string {
        const types: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
        };
        
        return types[ext || ''] || 'application/octet-stream';
    }
}
