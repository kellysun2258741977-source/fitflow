import { describe, expect, test } from 'vitest';
import { calcMealCalories, isoDate } from './utils';

describe('calcMealCalories', () => {
  test('converts per-100g calories to portion calories', () => {
    expect(calcMealCalories(200, 150)).toBe(300);
  });

  test('returns 0 for invalid input', () => {
    expect(calcMealCalories('x', 100)).toBe(0);
    expect(calcMealCalories(100, 0)).toBe(0);
  });
});

describe('isoDate', () => {
  test('formats date to YYYY-MM-DD', () => {
    const d = new Date('2026-04-12T12:00:00.000Z');
    expect(isoDate(d)).toBe('2026-04-12');
  });
});
