import { describe, expect, it } from 'vitest';
import { initialsOf, isRisky, validIban } from './rules';

const rules = { checkNew: true, favouriteIds: ['anna'], limit: 250 };

describe('isRisky', () => {
  it('lets a favourite through up to the limit', () => {
    expect(isRisky(rules, { id: 'anna' }, 250)).toBe(false);
  });

  it('flags a favourite above the limit', () => {
    expect(isRisky(rules, { id: 'anna' }, 250.01)).toBe(true);
  });

  it('flags a new person even for a small amount', () => {
    expect(isRisky(rules, { id: 'new-person' }, 5)).toBe(true);
  });

  it('ignores a new person when that check is off', () => {
    expect(isRisky({ ...rules, checkNew: false }, { id: 'new-person' }, 5)).toBe(false);
  });

  it('has no amount limit when the limit is off', () => {
    expect(isRisky({ ...rules, limit: null }, { id: 'anna' }, 100_000)).toBe(false);
  });
});

describe('validIban', () => {
  it('accepts a correct IBAN', () => {
    expect(validIban('DE89370400440532013000')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(validIban('DE88370400440532013000')).toBe(false);
  });
});

describe('initialsOf', () => {
  it('takes up to two initials', () => {
    expect(initialsOf('  maria anna kask ')).toBe('MA');
  });
});
