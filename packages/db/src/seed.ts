import 'dotenv/config';
import { prisma } from './client.js';
import { createHash, randomBytes } from 'crypto';

function sha256(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

function makeCode(prefix = 'cafe') {
  const rand = randomBytes(5).toString('hex'); // 10 chars
  return `${prefix}_${rand}`;
}

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

  // Partner sample (Momcafe monetization)
  const org = await prisma.partnerOrg.upsert({
    where: { name: '대치맘카페(샘플)' },
    update: {},
    create: { name: '대치맘카페(샘플)', orgType: 'momcafe', contactName: '관리자', contactEmail: 'admin@example.com' }
  });

  let cafe = await prisma.partnerCafe.findFirst({ where: { platform: 'NAVER_CAFE', platformCafeId: '12345' } });
  if (!cafe) {
    cafe = await prisma.partnerCafe.create({
      data: {
        orgId: org.id,
        platform: 'NAVER_CAFE',
        platformCafeId: '12345',
        name: '대치맘카페',
        url: 'https://cafe.naver.com/sample',
        region: '서울 강남구',
        shareRateSubscription: 0.2,
        shareRateCommerce: 0.1,
      }
    });
  }

  // Partner API key (store hash)
  const rawKey = process.env.PARTNER_API_KEY_SAMPLE ?? `dev_${randomBytes(16).toString('hex')}`;
  await prisma.partnerApiKey.upsert({
    where: { keyHash: sha256(rawKey) },
    update: { revokedAt: null },
    create: { orgId: org.id, label: 'sample', keyHash: sha256(rawKey) }
  });

  // Widget key
  const widgetKey = process.env.PARTNER_WIDGET_KEY_SAMPLE ?? makeCode('widget');
  await prisma.partnerWidget.upsert({
    where: { widgetKey },
    update: { isActive: true },
    create: { cafeId: cafe.id, type: 'TO_ALERT', widgetKey, config: { title: '우리 동네 TO 알림', theme: 'light' } }
  });

  // Referral link code
  const code = process.env.PARTNER_REFERRAL_CODE_SAMPLE ?? makeCode('ref');
  await prisma.referralLink.upsert({
    where: { code },
    update: { isActive: true },
    create: { cafeId: cafe.id, code, channel: 'banner', landingPath: '/install' }
  });

  // Example event (for settlement preview)
  await prisma.referralEvent.create({
    data: { code, type: 'INSTALL', anonymousId: 'anon_sample', metadata: { source: 'seed' } }
  });
  console.log('✅ Seed complete');
  console.log('--- Partner sample ---');
  console.log('PARTNER_API_KEY_SAMPLE (raw):', rawKey);
  console.log('PARTNER_WIDGET_KEY_SAMPLE:', widgetKey);
  console.log('PARTNER_REFERRAL_CODE_SAMPLE:', code);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });