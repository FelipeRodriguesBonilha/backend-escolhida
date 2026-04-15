export class ReturnMonthlyReportDto {
    year: number;
    month: number;
    period: string;
    totalSales: number;
    totalRevenue: number;
    averageTicket: number;
    byPaymentMethod: Record<string, number>;
    byDay: Record<string, {
        totalSales: number;
        totalRevenue: number;
    }>;
    topProducts: Array<{
        productId: string;
        name: string;
        category: string;
        quantity: number;
        revenue: number;
    }>;

    constructor(data: {
        year: number;
        month: number;
        period: string;
        totalSales: number;
        totalRevenue: number;
        averageTicket: number;
        byPaymentMethod: Record<string, number>;
        byDay: Record<string, { totalSales: number; totalRevenue: number }>;
        topProducts: Array<{
            productId: string;
            name: string;
            category: string;
            quantity: number;
            revenue: number;
        }>;
    }) {
        this.year = data.year;
        this.month = data.month;
        this.period = data.period;
        this.totalSales = data.totalSales;
        this.totalRevenue = data.totalRevenue;
        this.averageTicket = data.averageTicket;
        this.byPaymentMethod = data.byPaymentMethod;
        this.byDay = data.byDay;
        this.topProducts = data.topProducts;
    }
}
