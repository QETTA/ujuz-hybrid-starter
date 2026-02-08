import type { NextFunction, Request, Response } from 'express';
import { hashPartnerKey } from '@ujuz/shared';
import { getDbOrThrow } from '../services/partnerDb.js';
import { AppError } from '@ujuz/shared';

export interface PartnerRequest extends Request {
  partnerOrgId: string;
  partnerKeyId: string;
}

// ─── TTL Cache ────────────────────────────────────────────────────

interface CachedAuth {
  org: { org_id: string; status: string };
  keyId: string;
  expiresAt: number;
}

const authCache = new Map<string, CachedAuth>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedAuth(keyHash: string): CachedAuth | null {
  const cached = authCache.get(keyHash);
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    authCache.delete(keyHash);
    return null;
  }

  return cached;
}

function setCachedAuth(keyHash: string, org: { org_id: string; status: string }, keyId: string) {
  authCache.set(keyHash, {
    org,
    keyId,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

// ─── Middleware ───────────────────────────────────────────────────

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

  const keyHash = hashPartnerKey(raw);

  // Check cache first
  const cached = getCachedAuth(keyHash);
  if (cached) {
    if (cached.org.status === 'disabled') {
      throw new AppError('Partner org disabled', 403, 'partner_org_disabled');
    }
    (req as PartnerRequest).partnerOrgId = cached.org.org_id;
    (req as PartnerRequest).partnerKeyId = cached.keyId;
    return next();
  }

  // Cache miss - fetch from DB
  const db = await getDbOrThrow();

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

  const keyId = keyDoc.key_id as string;

  // Cache the result
  setCachedAuth(keyHash, { org_id: orgId, status: org.status as string }, keyId);

  (req as PartnerRequest).partnerOrgId = orgId;
  (req as PartnerRequest).partnerKeyId = keyId;

  next();
}
