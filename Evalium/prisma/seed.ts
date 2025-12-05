import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@evalium.it' },
    update: {},
    create: {
      email: 'admin@evalium.it',
      name: 'Admin Evalium',
      password: adminPassword,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo user
  const demoPassword = await hash('demo123', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@evalium.it' },
    update: {},
    create: {
      email: 'demo@evalium.it',
      name: 'Marco Rossi',
      password: demoPassword,
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Demo user created:', demoUser.email);

  // Create demo company
  const demoCompany = await prisma.company.upsert({
    where: { id: 'demo-company-1' },
    update: {},
    create: {
      id: 'demo-company-1',
      userId: demoUser.id,
      legalName: 'Rossi Meccanica S.r.l.',
      vatNumber: 'IT12345678901',
      country: 'IT',
      industry: 'manufacturing',
    },
  });
  console.log('✅ Demo company created:', demoCompany.legalName);

  // Create financial statements for demo company
  const years = [2023, 2022, 2021];
  const baseRevenue = 3_500_000;

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const growthFactor = 1 - i * 0.08; // 8% growth per year backwards
    const revenue = Math.round(baseRevenue * growthFactor);
    const ebitda = Math.round(revenue * (0.12 + Math.random() * 0.03)); // 12-15% margin
    const ebitdaMargin = ebitda / revenue;
    const netIncome = Math.round(ebitda * 0.6);
    const totalAssets = Math.round(revenue * 1.2);
    const totalLiabilities = Math.round(totalAssets * 0.55);
    const equity = totalAssets - totalLiabilities;

    await prisma.financialStatement.upsert({
      where: {
        companyId_fiscalYear: {
          companyId: demoCompany.id,
          fiscalYear: year,
        },
      },
      update: {},
      create: {
        companyId: demoCompany.id,
        fiscalYear: year,
        revenue: revenue,
        ebitda: ebitda,
        ebitdaMargin: ebitdaMargin,
        netIncome: netIncome,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        equity: equity,
        netDebt: Math.round(totalLiabilities * 0.4 - revenue * 0.1),
        revenueGrowth: i < years.length - 1 ? 0.08 : null,
        source: 'API',
        currency: 'EUR',
      },
    });
    console.log(`✅ Financial statement created for ${year}`);
  }

  // Create a second demo company
  const demoCompany2 = await prisma.company.upsert({
    where: { id: 'demo-company-2' },
    update: {},
    create: {
      id: 'demo-company-2',
      userId: demoUser.id,
      legalName: 'Tech Solutions Italia S.p.A.',
      vatNumber: 'IT98765432109',
      country: 'IT',
      industry: 'technology',
    },
  });
  console.log('✅ Second demo company created:', demoCompany2.legalName);

  // Create financial statements for second company
  const baseRevenue2 = 1_800_000;

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const growthFactor = 1 - i * 0.15; // 15% growth per year backwards (tech company)
    const revenue = Math.round(baseRevenue2 * growthFactor);
    const ebitda = Math.round(revenue * (0.18 + Math.random() * 0.05)); // 18-23% margin (higher for tech)
    const ebitdaMargin = ebitda / revenue;
    const netIncome = Math.round(ebitda * 0.65);
    const totalAssets = Math.round(revenue * 0.9);
    const totalLiabilities = Math.round(totalAssets * 0.4);
    const equity = totalAssets - totalLiabilities;

    await prisma.financialStatement.upsert({
      where: {
        companyId_fiscalYear: {
          companyId: demoCompany2.id,
          fiscalYear: year,
        },
      },
      update: {},
      create: {
        companyId: demoCompany2.id,
        fiscalYear: year,
        revenue: revenue,
        ebitda: ebitda,
        ebitdaMargin: ebitdaMargin,
        netIncome: netIncome,
        totalAssets: totalAssets,
        totalLiabilities: totalLiabilities,
        equity: equity,
        netDebt: Math.round(totalLiabilities * 0.3 - revenue * 0.15),
        revenueGrowth: i < years.length - 1 ? 0.15 : null,
        source: 'API',
        currency: 'EUR',
      },
    });
  }

  // Create an M&A lead for demo
  await prisma.mAndALead.upsert({
    where: { id: 'demo-lead-1' },
    update: {},
    create: {
      id: 'demo-lead-1',
      companyId: demoCompany.id,
      userId: demoUser.id,
      status: 'NEW',
      maScore: 72,
      reason: {
        highlights: [
          'Ricavi superiori a 2M€',
          'EBITDA margin sopra la media del settore',
          'Crescita costante negli ultimi 3 anni',
        ],
        revenue: 3_500_000,
        ebitda: 455_000,
        growth: 0.08,
      },
      hasUserConsented: true,
      userContactEmail: 'demo@evalium.it',
      userContactPhone: '+39 02 1234567',
      consentDate: new Date(),
      notes: 'Lead di esempio per demo',
    },
  });
  console.log('✅ Demo M&A lead created');

  console.log('🎉 Database seed completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });


