import 'dotenv/config';
import { Worker } from 'bullmq';
import { connectMongo, getMongoDb, closeMongo } from '@ujuz/db';
import { env, logger } from '@ujuz/config';
import { ObjectId, type Db } from 'mongodb';

const redisUrl = env.REDIS_URL;
const provider = env.AI_PROVIDER.toLowerCase();

interface InquiryMessageInput {
  institutionName?: string;
  topic?: string;
  childAge?: string;
}

interface CompareCandidate {
  name?: string;
  distanceMin?: number;
  pros?: string[];
  cons?: string[];
  todos?: string[];
}

interface CompareTableInput {
  candidates?: CompareCandidate[];
}

function stubInquiryMessage(input: InquiryMessageInput) {
  const institutionName = input.institutionName ?? '기관';
  const topic = input.topic ?? '모집/대기/적응';
  const childAge = input.childAge ?? '아이';

  const variants = [
    {
      name: '간단',
      text: `안녕하세요. ${institutionName} 관련해서 ${topic} 문의드립니다. ${childAge} 기준으로 현재 가능한 일정/절차가 있을까요? 감사합니다.`,
    },
    {
      name: '정중',
      text: `안녕하세요. ${institutionName} 담당자님. ${topic} 관련 문의드립니다. ${childAge} 기준으로 대기/상담/서류 준비가 필요하다면 안내 부탁드립니다. 감사합니다.`,
    },
    {
      name: '디테일',
      text: `안녕하세요. ${institutionName} 문의드립니다.\n1) 현재 모집/추가모집(TO) 일정이 있는지\n2) 대기 등록 방식과 예상 소요\n3) 적응/식단/하원 시간 등 운영 관련 확인 사항\n답변 가능하실 때 안내 부탁드립니다. 감사합니다.`,
    },
  ];

  return { variants };
}

function stubCompareTable(input: CompareTableInput) {
  const candidates: CompareCandidate[] = Array.isArray(input.candidates) ? input.candidates : [];
  const headers = ['기관', '거리', '장점', '단점', '확인'];
  const rows = candidates.map((c) => [
    String(c.name ?? '-'),
    c.distanceMin != null ? `${c.distanceMin}분` : '-',
    Array.isArray(c.pros) ? c.pros.join(', ') : '-',
    Array.isArray(c.cons) ? c.cons.join(', ') : '-',
    Array.isArray(c.todos) ? c.todos.join(', ') : '-',
  ]);

  const md = [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n');

  return { tableMarkdown: md };
}

async function runJob(db: Db, aiJobId: string) {
  const col = db.collection('ai_jobs');
  const job = await col.findOne({ _id: new ObjectId(aiJobId) });
  if (!job) return;

  await col.updateOne({ _id: new ObjectId(aiJobId) }, { $set: { status: 'RUNNING', updatedAt: new Date() } });

  try {
    if (provider !== 'stub') {
      throw new Error(`AI_PROVIDER=${provider} 는 아직 연결되지 않았습니다. (stub만 제공)`);
    }

    let output: Record<string, unknown> | null = null;
    if (job.type === 'inquiry_message') output = stubInquiryMessage(job.input as InquiryMessageInput);
    if (job.type === 'compare_table') output = stubCompareTable(job.input as CompareTableInput);

    await col.updateOne(
      { _id: new ObjectId(aiJobId) },
      { $set: { status: 'SUCCEEDED', output, updatedAt: new Date() } },
    );
  } catch (e) {
    await col.updateOne(
      { _id: new ObjectId(aiJobId) },
      { $set: { status: 'FAILED', error: e instanceof Error ? e.message : String(e), updatedAt: new Date() } },
    );
  }
}

async function main() {
  if (env.MONGODB_URI && env.MONGODB_DB_NAME) {
    await connectMongo(env.MONGODB_URI, env.MONGODB_DB_NAME, 5);
    logger.info('AI worker connected to MongoDB');
  }

  const db = getMongoDb();
  if (!db) {
    logger.fatal('MongoDB not available - AI worker requires database');
    process.exit(1);
  }

  const worker = new Worker(
    'ai',
    async (bullJob) => {
      const aiJobId = bullJob.data?.aiJobId as string | undefined;
      if (!aiJobId) return;
      await runJob(db, aiJobId);
    },
    { connection: { url: redisUrl } },
  );

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'AI job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'AI job failed'));

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'AI worker shutting down');
    await worker.close();
    await closeMongo();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info('AI worker started');
}

main().catch((err) => {
  console.error('Failed to start AI worker:', err);
  process.exit(1);
});
