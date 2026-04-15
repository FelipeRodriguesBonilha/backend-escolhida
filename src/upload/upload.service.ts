import { Injectable, NotFoundException } from '@nestjs/common';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class UploadService {
    private readonly uploadPath = join(process.cwd(), 'uploads');

    async saveFile(file: Express.Multer.File): Promise<string> {
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = join(this.uploadPath, fileName);
        
        await writeFile(filePath, file.buffer);
        
        return `/uploads/${fileName}`;
    }

    async getFile(fileName: string): Promise<Buffer> {
        const filePath = join(this.uploadPath, fileName);
        
        if (!existsSync(filePath)) {
            throw new NotFoundException('Arquivo não encontrado');
        }
        
        return await readFile(filePath);
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!fileUrl) return;
        
        const fileName = fileUrl.split('/').pop();
        
        if (!fileName) return;
        
        const filePath = join(this.uploadPath, fileName);
        
        if (existsSync(filePath)) {
            await unlink(filePath);
        }
    }
}
