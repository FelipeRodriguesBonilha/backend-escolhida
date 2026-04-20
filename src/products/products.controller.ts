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
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.create(dto, file));
  }

  @Get()
  async findAll(@Query('search') search?: string): Promise<ReturnProductDto[]> {
    return (await this.productsService.findAll(search)).map(product => new ReturnProductDto(product));
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
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.update(id, dto, file));
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ReturnProductDto> {
    return new ReturnProductDto(await this.productsService.remove(id));
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
}