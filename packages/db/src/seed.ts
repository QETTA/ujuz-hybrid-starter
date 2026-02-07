import 'dotenv/config';
import { prisma } from './client.js';

async function main() {
  // Neighborhoods (예시)
  const neighborhoods = [
    { city: '서울', district: '강남구', name: '대치동' },
    { city: '서울', district: '강남구', name: '삼성동' },
    { city: '서울', district: '마포구', name: '상암동' },
    { city: '서울', district: '서초구', name: '반포동' }
  ];

  for (const n of neighborhoods) {
    await prisma.neighborhood.upsert({
      where: { city_district_name: { city: n.city, district: n.district, name: n.name } },
      update: {},
      create: n
    });
  }

  // Subscription plans
  const plans = [
    { tier: 'FREE', priceMonthly: 0, alertLimit: 2, aiMonthlyLimit: 2 },
    { tier: 'BASIC', priceMonthly: 9900, alertLimit: 5, aiMonthlyLimit: 20 },
    { tier: 'PRO', priceMonthly: 19900, alertLimit: 999, aiMonthlyLimit: 9999 },
    { tier: 'FAMILY', priceMonthly: 29900, alertLimit: 999, aiMonthlyLimit: 9999 }
  ] as const;

  for (const p of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { tier: p.tier },
      update: { priceMonthly: p.priceMonthly, alertLimit: p.alertLimit, aiMonthlyLimit: p.aiMonthlyLimit },
      create: p as any
    });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
