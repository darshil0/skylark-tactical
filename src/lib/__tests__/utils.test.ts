import { describe, it, expect } from 'vitest';
import { calculateDistance } from '../utils';

describe('calculateDistance', () => {
  it('calculates distance between same points as 0', () => {
    expect(calculateDistance(0, 0, 0, 0)).toBe(0);
  });

  it('calculates distance between LHR and JFK approximately correctly', () => {
    // LHR: 51.47, -0.45
    // JFK: 40.64, -73.78
    // Distance is approx 3000 NM
    const dist = calculateDistance(51.47, -0.45, 40.64, -73.78);
    expect(dist).toBeGreaterThan(2900);
    expect(dist).toBeLessThan(3100);
  });

  it('handles antipodal points', () => {
    const dist = calculateDistance(90, 0, -90, 0);
    expect(dist).toBeCloseTo(10800, -2); // Approx 10800 NM
  });
});
