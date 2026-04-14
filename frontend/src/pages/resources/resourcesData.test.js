import { describe, expect, it } from 'vitest';
import { resourcesData } from './resourcesData';

describe('resourcesData', () => {
  it('includes required sections', () => {
    expect(resourcesData).toHaveProperty('home');
    expect(resourcesData).toHaveProperty('nutrition');
    expect(resourcesData).toHaveProperty('vision');
    expect(resourcesData).toHaveProperty('fitness');
    expect(resourcesData).toHaveProperty('dev');
  });

  it('each section has items or is home', () => {
    Object.entries(resourcesData).forEach(([k, v]) => {
      if (k === 'home') return;
      expect(Array.isArray(v.items)).toBe(true);
    });
  });
});

