import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { CashRegisterModule } from './cash-register/cash-register.module';
import { CatalogModule } from './catalog/catalog.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { PrismaService } from './prisma.service';
import { ProductsModule } from './products/products.module';
import { ReportsModule } from './reports/reports.module';
import { RolesGuard } from './guards/auth.guard';
import { SalesModule } from './sales/sales.module';
import { StockModule } from './stock/stock.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    SuppliersModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    StockModule,
    SalesModule,
    ReportsModule,
    PaymentMethodsModule,
    CashRegisterModule,
    CatalogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }
