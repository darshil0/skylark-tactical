import { describe, it, expect } from 'vitest';
import { calculateDistance } from './utils';

describe('calculateDistance', () => {
  it('calculates the distance between London and New York correctly', () => {
    // London: 51.5074° N, 0.1278° W
    // New York: 40.7128° N, 74.0060° W
    const distance = calculateDistance(51.5074, -0.1278, 40.7128, -74.0060);

    // London to NY is roughly 2999-3000 Nautical Miles
    expect(distance).toBeGreaterThan(2900);
    expect(distance).toBeLessThan(3100);
  });

  it('returns 0 for the same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
    expect(distance).toBe(0);
  });
});
