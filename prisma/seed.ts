import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createPasswordHashed } from '../src/utils/password';
import { generateInternalBarcode } from '../src/utils/barcode';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

interface CSVRecord {
  'Código de Barras': string;
  'Tipo de Produto': string;
  'Descrição': string;
  'Preço de Custo': string;
  'Preço Venda Varejo': string;
  'Preço Venda Atacado': string;
  'Quantidade Mínima Atacado': string;
  'Unidade': string;
  'Ativo': string;
  'Categoria do Produto': string;
  'Subcategoria do Produto': string;
  'Movimenta Estoque': string;
  'Estoque mínimo': string;
  'Quantidade em Estoque': string;
  'Marca': string;
  [key: string]: string;
}

async function main() {
  const adminPassword = await createPasswordHashed('D235hc00@');
  
  const admin = await prisma.user.upsert({
    where: { email: 'aescolhidamakeup@gmail.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'aescolhidamakeup@gmail.com',
      password: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  console.log('Usuário admin criado:', admin);

  const paymentMethods = [
    { code: 'PIX', name: 'Pix', order: 1 },
    { code: 'CREDIT_CARD', name: 'Cartão de Crédito', order: 2 },
    { code: 'DEBIT_CARD', name: 'Cartão de Débito', order: 3 },
    { code: 'CASH', name: 'Dinheiro', order: 4 },
    { code: 'OTHER', name: 'Outro', order: 5 },
  ];

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: method.code },
      update: {},
      create: method,
    });
  }

  console.log('Métodos de pagamento criados');

  const csvFilePath = path.join(__dirname, 'seeds', 'Produtos.csv');
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ';',
    trim: true,
    bom: true,
  }) as CSVRecord[];

  console.log(`Importando ${records.length} produtos do CSV...`);

  for (const record of records) {
    try {
      let barcode = record['Código de Barras']?.replace(/"/g, '').trim();
      const description = record['Descrição']?.replace(/"/g, '').trim();
      const costPrice = parseFloat(record['Preço de Custo']?.replace(',', '.') || '0');
      const price = parseFloat(record['Preço Venda Varejo']?.replace(',', '.') || '0');
      const categoryName = record['Categoria do Produto']?.replace(/"/g, '').trim();
      const brandName = record['Marca']?.replace(/"/g, '').trim();
      const active = record['Ativo']?.replace(/"/g, '').trim() === 'Sim';
      const stockQuantity = parseFloat(record['Quantidade em Estoque']?.replace(',', '.') || '0');
      const minStock = parseFloat(record['Estoque mínimo']?.replace(',', '.') || '5');
      
      if (!barcode) {
        barcode = await generateInternalBarcode(prisma);
      }

      if (!description || !categoryName) {
        console.log(`Pulando produto sem descrição ou categoria: ${barcode}`);
        continue;
      }

      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          active: true,
        },
      });

      const brand = await prisma.brand.upsert({
        where: { name: brandName || 'SEM MARCA' },
        update: {},
        create: {
          name: brandName || 'SEM MARCA',
          active: true,
        },
      });

      const existingProduct = barcode 
        ? await prisma.product.findUnique({ where: { barcode } })
        : null;

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: description,
            price: price,
            costPrice: costPrice,
            categoryId: category.id,
            brandId: brand.id,
            active: active,
          },
        });

        await prisma.stock.upsert({
          where: { productId: existingProduct.id },
          update: {
            quantity: Math.floor(stockQuantity),
            minQuantity: Math.floor(minStock),
          },
          create: {
            productId: existingProduct.id,
            quantity: Math.floor(stockQuantity),
            minQuantity: Math.floor(minStock),
          },
        });

        console.log(`Produto atualizado: ${description}`);
      } else {
        const product = await prisma.product.create({
          data: {
            name: description,
            barcode: barcode,
            barcodeGenerated: !record['Código de Barras']?.replace(/"/g, '').trim(),
            price: price,
            costPrice: costPrice,
            categoryId: category.id,
            brandId: brand.id,
            active: active,
          },
        });

        await prisma.stock.create({
          data: {
            productId: product.id,
            quantity: Math.floor(stockQuantity),
            minQuantity: Math.floor(minStock),
          },
        });

        console.log(`Produto criado: ${description}`);
      }
    } catch (error) {
      console.error(`Erro ao processar produto: ${record['Descrição']}`, error);
    }
  }

  console.log('Importação de produtos concluída!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
