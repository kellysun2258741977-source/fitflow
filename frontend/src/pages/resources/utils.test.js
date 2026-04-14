import { describe, expect, it } from 'vitest';
import { filterResources, flattenResources, formatDateTime } from './utils';
import { resourcesData } from './resourcesData';

describe('resources utils', () => {
  it('flattenResources returns list', () => {
    const list = flattenResources(resourcesData);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('title');
    expect(list[0]).toHaveProperty('url');
  });

  it('filterResources matches by keyword', () => {
    const res = filterResources('fatsecret', resourcesData);
    expect(res.length).toBeGreaterThan(0);
    expect(res.some((x) => String(x.url).includes('fatsecret'))).toBe(true);
  });

  it('formatDateTime outputs expected shape', () => {
    const { dateText, timeText } = formatDateTime(new Date('2026-04-12T03:04:05Z'));
    expect(typeof dateText).toBe('string');
    expect(typeof timeText).toBe('string');
    expect(timeText.split(':').length).toBe(3);
  });
});

