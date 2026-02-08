import { describe, it, expect } from 'vitest';
import { admissionScoreQuerySchema } from '../admissionV1.validator.js';

describe('admissionScoreQuerySchema', () => {
  const validInput = {
    facility_id: 'fac-123',
    child_age_band: '3' as const,
  };

  it('parses valid input successfully', () => {
    const result = admissionScoreQuerySchema.parse(validInput);

    expect(result.facility_id).toBe('fac-123');
    expect(result.child_age_band).toBe('3');
    expect(result.priority_type).toBe('general');
    expect(result.waiting_position).toBeUndefined();
  });

  it('rejects empty facility_id', () => {
    expect(() =>
      admissionScoreQuerySchema.parse({ ...validInput, facility_id: '' }),
    ).toThrow();
  });

  it('rejects facility_id longer than 128 characters', () => {
    expect(() =>
      admissionScoreQuerySchema.parse({
        ...validInput,
        facility_id: 'x'.repeat(129),
      }),
    ).toThrow();
  });

  it('accepts all valid child_age_band values (0-5)', () => {
    for (const band of ['0', '1', '2', '3', '4', '5']) {
      const result = admissionScoreQuerySchema.parse({
        ...validInput,
        child_age_band: band,
      });
      expect(result.child_age_band).toBe(band);
    }
  });

  it('rejects invalid child_age_band value', () => {
    expect(() =>
      admissionScoreQuerySchema.parse({ ...validInput, child_age_band: '6' }),
    ).toThrow();

    expect(() =>
      admissionScoreQuerySchema.parse({ ...validInput, child_age_band: '-1' }),
    ).toThrow();
  });

  it('coerces waiting_position string to number', () => {
    const result = admissionScoreQuerySchema.parse({
      ...validInput,
      waiting_position: '10',
    });
    expect(result.waiting_position).toBe(10);
  });

  it('enforces waiting_position range (1-500)', () => {
    expect(() =>
      admissionScoreQuerySchema.parse({
        ...validInput,
        waiting_position: '0',
      }),
    ).toThrow();

    expect(() =>
      admissionScoreQuerySchema.parse({
        ...validInput,
        waiting_position: '501',
      }),
    ).toThrow();

    const edge1 = admissionScoreQuerySchema.parse({
      ...validInput,
      waiting_position: '1',
    });
    expect(edge1.waiting_position).toBe(1);

    const edge500 = admissionScoreQuerySchema.parse({
      ...validInput,
      waiting_position: '500',
    });
    expect(edge500.waiting_position).toBe(500);
  });

  it('converts empty string waiting_position to undefined', () => {
    const result = admissionScoreQuerySchema.parse({
      ...validInput,
      waiting_position: '',
    });
    expect(result.waiting_position).toBeUndefined();
  });

  it('defaults priority_type to general', () => {
    const result = admissionScoreQuerySchema.parse(validInput);
    expect(result.priority_type).toBe('general');
  });

  it('accepts valid priority_type values', () => {
    const validTypes = [
      'dual_income',
      'sibling',
      'single_parent',
      'multi_child',
      'disability',
      'low_income',
      'general',
    ] as const;

    for (const ptype of validTypes) {
      const result = admissionScoreQuerySchema.parse({
        ...validInput,
        priority_type: ptype,
      });
      expect(result.priority_type).toBe(ptype);
    }
  });

  it('rejects invalid priority_type', () => {
    expect(() =>
      admissionScoreQuerySchema.parse({
        ...validInput,
        priority_type: 'vip',
      }),
    ).toThrow();
  });
});
