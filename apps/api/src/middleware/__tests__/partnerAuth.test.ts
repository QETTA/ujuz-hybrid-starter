import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('@ujuz/config', () => ({
  env: { PARTNER_KEY_HASH_SALT: 'test-salt' },
}));

const mockFindOne = vi.fn();
const mockCollection = vi.fn(() => ({ findOne: mockFindOne }));
const mockDb = { collection: mockCollection };

vi.mock('../../services/partnerDb.js', () => ({
  getDbOrThrow: vi.fn(async () => mockDb),
}));

vi.mock('../../utils/partnerCrypto.js', () => ({
  hashPartnerKey: vi.fn((raw: string) => `hashed_${raw}`),
}));

import { requirePartnerOrg } from '../partnerAuth.js';
import { getDbOrThrow } from '../../services/partnerDb.js';
import { AppError } from '@ujuz/shared';

function mockReq(headers: Record<string, string> = {}): Partial<Request> {
  return {
    header: vi.fn((name: string) => {
      const key = Object.keys(headers).find(
        (k) => k.toLowerCase() === name.toLowerCase(),
      );
      return key ? headers[key] : undefined;
    }) as any,
  };
}

function mockRes(): Partial<Response> {
  return {};
}

async function expectAppError(
  fn: () => Promise<void>,
  statusCode: number,
  code: string,
) {
  try {
    await fn();
    throw new Error('should have thrown');
  } catch (e) {
    expect(e).toBeInstanceOf(AppError);
    expect((e as AppError).statusCode).toBe(statusCode);
    expect((e as AppError).code).toBe(code);
  }
}

describe('requirePartnerOrg', () => {
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindOne.mockReset();
    mockCollection.mockClear();
  });

  it('throws 401 when x-partner-key header is missing', async () => {
    const req = mockReq();

    await expectAppError(
      () => requirePartnerOrg(req as Request, mockRes() as Response, next),
      401,
      'missing_partner_key',
    );

    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() with valid key and sets req properties', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_valid123' });

    mockFindOne.mockResolvedValueOnce({
      key_hash: 'hashed_pk_valid123',
      org_id: 'org-1',
      key_id: 'key-1',
    });
    mockFindOne.mockResolvedValueOnce({
      org_id: 'org-1',
      status: 'active',
    });

    await requirePartnerOrg(req as Request, mockRes() as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((req as any).partnerOrgId).toBe('org-1');
    expect((req as any).partnerKeyId).toBe('key-1');
  });

  it('throws 401 when key hash not found in DB', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_unknown' });
    mockFindOne.mockResolvedValueOnce(null);

    await expectAppError(
      () => requirePartnerOrg(req as Request, mockRes() as Response, next),
      401,
      'invalid_partner_key',
    );
  });

  it('throws 401 for revoked key (revoked keys excluded by query)', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_revoked' });
    mockFindOne.mockResolvedValueOnce(null);

    await expectAppError(
      () => requirePartnerOrg(req as Request, mockRes() as Response, next),
      401,
      'invalid_partner_key',
    );
  });

  it('throws 403 when org status is disabled', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_disabled_org' });

    mockFindOne.mockResolvedValueOnce({
      key_hash: 'hashed_pk_disabled_org',
      org_id: 'org-disabled',
      key_id: 'key-2',
    });
    mockFindOne.mockResolvedValueOnce({
      org_id: 'org-disabled',
      status: 'disabled',
    });

    await expectAppError(
      () => requirePartnerOrg(req as Request, mockRes() as Response, next),
      403,
      'partner_org_disabled',
    );
  });

  it('throws 403 when org not found in DB', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_no_org' });

    mockFindOne.mockResolvedValueOnce({
      key_hash: 'hashed_pk_no_org',
      org_id: 'org-missing',
      key_id: 'key-3',
    });
    mockFindOne.mockResolvedValueOnce(null);

    await expectAppError(
      () => requirePartnerOrg(req as Request, mockRes() as Response, next),
      403,
      'partner_org_disabled',
    );
  });

  it('propagates error when getDbOrThrow fails', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_db_fail' });

    (getDbOrThrow as any).mockRejectedValueOnce(
      new AppError('MongoDB not configured', 503, 'mongo_not_configured'),
    );

    await expect(
      requirePartnerOrg(req as Request, mockRes() as Response, next),
    ).rejects.toThrow('MongoDB not configured');

    expect(next).not.toHaveBeenCalled();
  });

  it('queries partner_api_keys and partner_orgs collections', async () => {
    const req = mockReq({ 'x-partner-key': 'pk_collections' });

    mockFindOne.mockResolvedValueOnce({
      key_hash: 'hashed_pk_collections',
      org_id: 'org-c',
      key_id: 'key-c',
    });
    mockFindOne.mockResolvedValueOnce({
      org_id: 'org-c',
      status: 'active',
    });

    await requirePartnerOrg(req as Request, mockRes() as Response, next);

    expect(mockCollection).toHaveBeenCalledWith('partner_api_keys');
    expect(mockCollection).toHaveBeenCalledWith('partner_orgs');
  });
});
