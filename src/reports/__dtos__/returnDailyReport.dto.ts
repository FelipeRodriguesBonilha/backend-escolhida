import { Sale, SaleItem, SalePaymentMethod, PaymentMethod } from "src/generated/prisma/client";
import { ReturnSaleDto } from "src/sales/__dtos__/returnSale.dto";

export class ReturnDailyReportDto {
    date: string;
    totalSales: number;
    totalRevenue: number;
    byPaymentMethod: Record<string, number>;
    topProducts: Array<{
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
    }>;
    sales: ReturnSaleDto[];
    totalProductsSold?: number;
    paymentMethodsArray?: Array<{ method: string; amount: number }>;

    constructor(data: {
        date: string;
        totalSales: number;
        totalRevenue: number;
        byPaymentMethod: Record<string, number>;
        topProducts: Array<{
            productId: string;
            name: string;
            quantity: number;
            revenue: number;
        }>;
        sales: (Sale & { payments?: (SalePaymentMethod & { paymentMethod?: PaymentMethod | null })[] | null; items?: SaleItem[] | null })[];
        totalProductsSold?: number;
        paymentMethodsArray?: Array<{ method: string; amount: number }>;
    }) {
        this.date = data.date;
        this.totalSales = data.totalSales;
        this.totalRevenue = data.totalRevenue;
        this.byPaymentMethod = data.byPaymentMethod;
        this.topProducts = data.topProducts;
        this.sales = data.sales.map(s => new ReturnSaleDto(s));
        this.totalProductsSold = data.totalProductsSold;
        this.paymentMethodsArray = data.paymentMethodsArray;
    }
}
