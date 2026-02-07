import { z } from 'zod';

export const admissionScoreQuerySchema = z.object({
  facility_id: z.string().min(1).max(128),
  child_age_band: z.enum(['0', '1', '2', '3', '4', '5']),
  waiting_position: z
    .preprocess(
      (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : undefined),
      z.coerce.number().int().min(1).max(500).optional()
    ),
  priority_type: z
    .enum(['dual_income', 'sibling', 'single_parent', 'multi_child', 'disability', 'low_income', 'general'])
    .default('general'),
});

export type AdmissionScoreQuery = z.infer<typeof admissionScoreQuerySchema>;
