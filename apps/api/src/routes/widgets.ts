import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@ujuz/db';

const router = Router();

router.get('/:widgetKey', async (req, res) => {
  const widgetKey = z.string().min(1).parse(req.params.widgetKey);

  const widget = await prisma.partnerWidget.findUnique({
    where: { widgetKey },
    include: { cafe: true }
  });

  if (!widget || !widget.isActive) return res.status(404).json({ error: 'NOT_FOUND' });

  let data: any = null;

  if (widget.type === 'TO_ALERT') {
    const posts = await prisma.externalPost.findMany({
      where: { cafeId: widget.cafeId, toMention: true },
      orderBy: { fetchedAt: 'desc' },
      take: 10,
      select: { title: true, url: true, postedAt: true, toConfidence: true }
    });
    data = { items: posts };
  }

  if (widget.type === 'DEALS') {
    const deals = await prisma.deal.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, title: true, price: true, status: true }
    });
    data = { items: deals };
  }

  res.json({
    widget: {
      type: widget.type,
      config: widget.config ?? {},
      cafe: { id: widget.cafeId, name: widget.cafe.name, url: widget.cafe.url }
    },
    data
  });
});

export default router;
