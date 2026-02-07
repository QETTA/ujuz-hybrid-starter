import type { NextFunction, Request, Response } from 'express';
import { hashPartnerKey } from '@ujuz/shared';
import { getDbOrThrow } from '../services/partnerDb.js';
import { AppError } from '@ujuz/shared';

export interface PartnerRequest extends Request {
  partnerOrgId: string;
  partnerKeyId: string;
}

/**
 * Partner API-key auth.
 * Header: x-partner-key: <raw key>
 *
 * Attaches:
 *   req.partnerOrgId
 *   req.partnerKeyId
 */
export async function requirePartnerOrg(req: Request, _res: Response, next: NextFunction) {
  const raw = req.header('x-partner-key');
  if (!raw) {
    throw new AppError('Missing x-partner-key', 401, 'missing_partner_key');
  }

  const db = await getDbOrThrow();
  const keyHash = hashPartnerKey(raw);

  const keyDoc = await db.collection('partner_api_keys').findOne({
    key_hash: keyHash,
    revoked_at: { $exists: false },
  });

  if (!keyDoc) {
    throw new AppError('Invalid partner key', 401, 'invalid_partner_key');
  }

  const orgId = keyDoc.org_id as string;
  const org = await db.collection('partner_orgs').findOne({ org_id: orgId });

  if (!org || org.status === 'disabled') {
    throw new AppError('Partner org disabled', 403, 'partner_org_disabled');
  }

  (req as PartnerRequest).partnerOrgId = orgId;
  (req as PartnerRequest).partnerKeyId = keyDoc.key_id as string;

  next();
}
