import { PrismaClient, CashBleed, CashEntry, Sale, SalePaymentMethod, PaymentMethod } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type SalePaymentWithMethod = SalePaymentMethod & { paymentMethod: PaymentMethod };
type SaleWithPayments = Sale & { payments: SalePaymentWithMethod[] };

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function recalculateCashRegisters() {
  console.log('🔍 Buscando caixas fechados...');

  const closedCashRegisters = await prisma.cashRegister.findMany({
    where: { status: 'CLOSED' },
    include: {
      bleeds: true,
      entries: true,
      sales: {
        include: {
          payments: {
            include: {
              paymentMethod: true,
            },
          },
        },
      },
    },
  });

  console.log(`Encontrados ${closedCashRegisters.length} caixas fechados\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const cashRegister of closedCashRegisters) {
    try {
      const bleeds = cashRegister.bleeds as CashBleed[];
      const entries = cashRegister.entries as CashEntry[];
      const sales = cashRegister.sales as SaleWithPayments[];

      const totalBleeds = bleeds.reduce((sum, b) => sum + Number(b.amount), 0);
      const totalEntries = entries.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalCashSales = sales.reduce((sum, sale) => {
        const cashPayment = sale.payments.find(p => p.paymentMethod.code === 'CASH');
        return sum + (cashPayment ? Number(cashPayment.amount) : 0);
      }, 0);

      const newFinalAmount = Number(cashRegister.initialAmount) + totalEntries + totalCashSales - totalBleeds;
      const oldFinalAmount = Number(cashRegister.finalAmount);

      if (Math.abs(newFinalAmount - oldFinalAmount) > 0.01) {
        console.log(`Caixa ID: ${cashRegister.id}`);
        console.log(`Data abertura: ${cashRegister.openedAt.toLocaleString('pt-BR')}`);
        console.log(`Valor antigo:  R$ ${oldFinalAmount.toFixed(2)}`);
        console.log(`Valor correto: R$ ${newFinalAmount.toFixed(2)}`);
        console.log(`Diferença:     R$ ${(newFinalAmount - oldFinalAmount).toFixed(2)}`);

        await prisma.cashRegister.update({
          where: { id: cashRegister.id },
          data: { finalAmount: newFinalAmount },
        });

        console.log(`Atualizado!\n`);
        updatedCount++;
      } else {
        console.log(`Caixa ID: ${cashRegister.id} — valor correto, pulando`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`Erro ao processar caixa ID: ${cashRegister.id}:`, error);
      errorCount++;
    }
  }

  console.log('\n============================');
  console.log(`Atualizados: ${updatedCount}`);
  console.log(`Sem alteração: ${skippedCount}`);
  console.log(`Erros: ${errorCount}`);
  console.log('============================');
}

recalculateCashRegisters()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
