import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/users/__enums__/role.enum';
import { CreateProductDto } from './__dtos__/createProduct.dto';
import { ReturnProductDto, ReturnProductColorDto } from './__dtos__/returnProduct.dto';
import { UpdateProductDto } from './__dtos__/updateProduct.dto';
import { CreateProductColorDto } from './__dtos__/createProductColor.dto';
import { ProductsService } from './products.service';

@Roles(Role.Admin)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10))
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.create(dto, files));
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('showInactive') showInactive?: string,
  ) {
    const result = await this.productsService.findAll(
      search,
      parseInt(page ?? '1') || 1,
      parseInt(limit ?? '20') || 20,
      showInactive === 'true',
    );
    return { ...result, data: result.data.map(p => new ReturnProductDto(p)) };
  }

  @Get('low-stock')
  async findLowStock(): Promise<ReturnProductDto[]> {
    return (await this.productsService.findLowStock()).map(product => new ReturnProductDto(product));
  }

  @Get('barcode/:barcode')
  async findByBarcode(@Param('barcode') barcode: string): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.findByBarcode(barcode));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.findOne(id));
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 10))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.update(id, dto, files));
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.remove(id));
  }

  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.reactivate(id));
  }

  @Delete(':id/permanent')
  async permanentDelete(@Param('id') id: string) {
    await this.productsService.permanentDelete(id);
    return { message: 'Produto excluído permanentemente' };
  }

  @Post(':id/colors')
  @UseInterceptors(FileInterceptor('image'))
  async addColor(
    @Param('id') id: string,
    @Body() dto: CreateProductColorDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReturnProductColorDto> {
    return new ReturnProductColorDto(await this.productsService.addColor(id, dto, file));
  }

  @Patch(':id/colors/:colorId')
  @UseInterceptors(FileInterceptor('image'))
  async updateColor(
    @Param('id') id: string,
    @Param('colorId') colorId: string,
    @Body() dto: CreateProductColorDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReturnProductColorDto> {
    return new ReturnProductColorDto(await this.productsService.updateColor(id, colorId, dto, file));
  }

  @Delete(':id/colors/:colorId')
  async removeColor(
    @Param('id') id: string,
    @Param('colorId') colorId: string,
  ): Promise<void> {
    await this.productsService.removeColor(id, colorId);
  }

  @Patch(':id/images/:imageId/set-main')
  async setMainImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.productsService.setMainImage(id, imageId);
  }
}