import { describe, expect, it } from 'vitest';
import { canTransition, isEditableStatus } from './constants';
import { normalizeSearch } from './text';
import { rangesOverlap } from './time';
import { customerInputSchema } from './schemas/customer';

const at = (hhmm: string) => new Date(`2026-01-01T${hhmm}:00Z`);

describe('rangesOverlap', () => {
  it('detects overlapping ranges', () => {
    expect(rangesOverlap(at('10:00'), at('11:00'), at('10:30'), at('11:30'))).toBe(true);
    expect(rangesOverlap(at('10:00'), at('11:00'), at('09:00'), at('12:00'))).toBe(true);
  });

  it('treats touching edges as free', () => {
    expect(rangesOverlap(at('10:00'), at('11:00'), at('11:00'), at('12:00'))).toBe(false);
    expect(rangesOverlap(at('10:00'), at('11:00'), at('09:00'), at('10:00'))).toBe(false);
  });
});

describe('status transitions', () => {
  it('allows the normal lifecycle', () => {
    expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    expect(canTransition('CONFIRMED', 'COMPLETED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('keeps completed and cancelled terminal', () => {
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    expect(isEditableStatus('COMPLETED')).toBe(false);
  });
});

describe('normalizeSearch', () => {
  it('folds Turkish characters and case', () => {
    expect(normalizeSearch('  IŞIL Çağlayan  ')).toBe('isil caglayan');
    expect(normalizeSearch('İsmail Öztürk')).toBe('ismail ozturk');
  });
});

describe('customerInputSchema', () => {
  it('normalizes phone and empty optionals', () => {
    const parsed = customerInputSchema.parse({
      fullName: ' Ayşe Yılmaz ',
      phone: '0 (532) 111-22 33',
      email: '',
      notes: '',
    });
    expect(parsed).toEqual({ fullName: 'Ayşe Yılmaz', phone: '05321112233', email: null, notes: null });
  });

  it('returns i18n keys as messages', () => {
    const result = customerInputSchema.safeParse({ fullName: 'A', phone: 'abc', email: 'x@' });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((issue) => issue.message);
    expect(messages).toEqual(['validation.minLength2', 'validation.phone', 'validation.email']);
  });
});
