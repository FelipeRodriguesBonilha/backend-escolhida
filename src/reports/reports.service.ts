import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) { }

    async dailyReport(dateStr: string) {
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) throw new BadRequestException('Data inválida. Use formato YYYY-MM-DD');
        
        const start = new Date(year, month - 1, day, 0, 0, 0, 0);
        const end = new Date(year, month - 1, day, 23, 59, 59, 999);
        
        if (isNaN(start.getTime())) throw new BadRequestException('Data inválida. Use formato YYYY-MM-DD');

        console.log('Daily report query:', {
            dateStr,
            start: start.toISOString(),
            end: end.toISOString(),
        });

        const sales = await this.prisma.sale.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: {
                items: { include: { product: { include: { category: true } } } },
                payments: { include: { paymentMethod: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`Found ${sales.length} sales for ${dateStr}`);

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.finalTotal), 0);
        const totalSales = sales.length;

        const byPaymentMethod = sales.reduce((acc, sale) => {
            for (const payment of sale.payments) {
                const method = payment.paymentMethod.name;
                const amount = payment.paymentMethod.code === 'CASH'
                    ? Number(payment.amount) - Number(sale.change)
                    : Number(payment.amount);
                acc[method] = (acc[method] ?? 0) + amount;
            }
            return acc;
        }, {} as Record<string, number>);

        const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
        for (const sale of sales) {
            for (const item of sale.items) {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = {
                        name: item.product.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productMap[item.productId].quantity += item.quantity;
                productMap[item.productId].revenue += Number(item.subtotal);
            }
        }

        const topProducts = Object.entries(productMap)
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            date: dateStr,
            totalSales,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            byPaymentMethod,
            topProducts,
            sales,
        };
    }

    async monthlyReport(year: number, month: number) {
        if (month < 1 || month > 12) throw new BadRequestException('Mês inválido (1-12)');

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const sales = await this.prisma.sale.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: {
                items: { include: { product: { include: { category: true } } } },
                payments: { include: { paymentMethod: true } },
            },
            orderBy: { createdAt: 'asc' },
        });

        const totalRevenue = sales.reduce((sum, s) => sum + Number(s.finalTotal), 0);
        const totalSales = sales.length;

        const byDay: Record<string, { totalSales: number; totalRevenue: number }> = {};
        for (const sale of sales) {
            const saleDate = sale.createdAt;
            const year = saleDate.getFullYear();
            const month = String(saleDate.getMonth() + 1).padStart(2, '0');
            const day = String(saleDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${month}-${day}`;
            
            if (!byDay[dateKey]) byDay[dateKey] = { totalSales: 0, totalRevenue: 0 };
            byDay[dateKey].totalSales += 1;
            byDay[dateKey].totalRevenue += Number(sale.finalTotal);
        }

        const byPaymentMethod = sales.reduce((acc, sale) => {
            for (const payment of sale.payments) {
                const method = payment.paymentMethod.name;
                const amount = payment.paymentMethod.code === 'CASH'
                    ? Number(payment.amount) - Number(sale.change)
                    : Number(payment.amount);
                acc[method] = (acc[method] ?? 0) + amount;
            }
            return acc;
        }, {} as Record<string, number>);

        const productMap: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
        for (const sale of sales) {
            for (const item of sale.items) {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = {
                        name: item.product.name,
                        category: item.product.category.name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productMap[item.productId].quantity += item.quantity;
                productMap[item.productId].revenue += Number(item.subtotal);
            }
        }

        const topProducts = Object.entries(productMap)
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

        return {
            year,
            month,
            period: `${year}-${String(month).padStart(2, '0')}`,
            totalSales,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageTicket: Math.round(averageTicket * 100) / 100,
            byPaymentMethod,
            byDay,
            topProducts,
        };
    }

    async todaySummary() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        const result = await this.dailyReport(today);
        
        const totalProductsSold = result.topProducts.reduce((sum, p) => sum + p.quantity, 0);
        
        const paymentMethodsArray = Object.entries(result.byPaymentMethod).map(([method, amount]) => ({
            method,
            amount
        }));
        
        console.log('Today summary result:', {
            date: result.date,
            totalSales: result.totalSales,
            totalRevenue: result.totalRevenue,
            topProductsCount: result.topProducts.length,
            salesCount: result.sales.length
        });
        
        return {
            ...result,
            totalProductsSold,
            paymentMethodsArray
        };
    }

    async topProductsCurrentMonth(limit: number = 10) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);

        const sales = await this.prisma.sale.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: {
                items: { include: { product: true } }
            }
        });

        const productMap: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
        for (const sale of sales) {
            for (const item of sale.items) {
                if (!productMap[item.productId]) {
                    productMap[item.productId] = {
                        name: item.product.name,
                        sku: item.product.barcode || item.productId,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productMap[item.productId].quantity += item.quantity;
                productMap[item.productId].revenue += Number(item.subtotal);
            }
        }

        const topProducts = Object.entries(productMap)
            .map(([id, data]) => ({ productId: id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return {
            period: `${year}-${String(month).padStart(2, '0')}`,
            topProducts
        };
    }

    async salesChartData(period: 'quarter' | 'semester' | 'annual') {
        const now = new Date();
        const year = now.getFullYear();
        const currentMonth = now.getMonth();

        let startMonth: number;
        let months: number;

        switch (period) {
            case 'quarter':
                months = 3;
                startMonth = currentMonth - 2;
                break;
            case 'semester':
                months = 6;
                startMonth = currentMonth - 5;
                break;
            case 'annual':
                months = 12;
                startMonth = currentMonth - 11;
                break;
        }

        const chartData: Array<{
            month: string;
            monthLabel: string;
            totalSales: number;
            totalRevenue: number;
        }> = [];
        
        for (let i = 0; i < months; i++) {
            const monthIndex = startMonth + i;
            const monthDate = new Date(year, monthIndex, 1);
            const targetYear = monthDate.getFullYear();
            const targetMonth = monthDate.getMonth() + 1;

            const start = new Date(targetYear, targetMonth - 1, 1);
            const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

            const sales = await this.prisma.sale.findMany({
                where: { createdAt: { gte: start, lte: end } }
            });

            const totalRevenue = sales.reduce((sum, s) => sum + Number(s.finalTotal), 0);
            const totalSales = sales.length;

            chartData.push({
                month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`,
                monthLabel: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
                totalSales,
                totalRevenue: Math.round(totalRevenue * 100) / 100
            });
        }

        return {
            period,
            data: chartData
        };
    }
}