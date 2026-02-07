import 'dotenv/config';
import { Worker } from 'bullmq';
import { prisma } from '@ujuz/db';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

function normalize(s: string) {
  return s.toLowerCase();
}

function containsAny(text: string, needles: string[]) {
  const t = normalize(text);
  return needles.some((n) => t.includes(normalize(n)));
}

async function handleEvent(eventId: string) {
  const event = await prisma.alertEvent.findUnique({
    where: { id: eventId },
    include: { post: true }
  });
  if (!event?.post) return;

  const post = event.post;
  const text = `${post.title}\n${post.body}`;

  const rules = await prisma.alertRule.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ neighborhoodId: null }, { neighborhoodId: post.neighborhoodId ?? undefined }] },
        { OR: [{ cohortYear: null }, { cohortYear: post.cohortYear ?? undefined }] }
      ]
    }
  });

  for (const rule of rules) {
    if (rule.userId === post.userId) continue;

    const hasKeyword = rule.keywords.length > 0 ? containsAny(text, rule.keywords) : false;
    const hasCategory = rule.categories.length > 0 ? containsAny(text, rule.categories) : false;

    // 둘 다 비어있으면 매칭하지 않음 (스팸 방지)
    if (rule.keywords.length === 0 && rule.categories.length === 0) continue;

    if (!hasKeyword && !hasCategory) continue;

    const link = `/posts/${post.id}`;
    const exists = await prisma.notification.findFirst({ where: { userId: rule.userId, link } });
    if (exists) continue;

    await prisma.notification.create({
      data: {
        userId: rule.userId,
        title: `새 글 알림: ${post.title}`,
        body: post.body.slice(0, 120),
        link
      }
    });
  }
}

const worker = new Worker(
  'alerts',
  async (job) => {
    const eventId = job.data?.eventId as string | undefined;
    if (!eventId) return;
    await handleEvent(eventId);
  },
  { connection: { url: redisUrl } }
);

worker.on('completed', (job) => console.log(`✅ alerts job completed: ${job.id}`));
worker.on('failed', (job, err) => console.error(`❌ alerts job failed: ${job?.id}`, err));

console.log('✅ Alert worker started');
