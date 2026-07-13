import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateActiveStreak, getLocalDateString } from '../src/progress.ts';

test('counts a streak that includes today', () => {
  const today = new Date(2026, 6, 12, 12);
  const dates = [
    getLocalDateString(today),
    getLocalDateString(new Date(2026, 6, 11, 12)),
    getLocalDateString(new Date(2026, 6, 10, 12))
  ];

  const originalNow = Date.now;
  Date.now = () => today.getTime();
  assert.equal(calculateActiveStreak(dates), 3);
  Date.now = originalNow;
});

test('does not continue a streak after a missing day', () => {
  const today = new Date(2026, 6, 12, 12);
  const originalNow = Date.now;
  Date.now = () => today.getTime();

  assert.equal(calculateActiveStreak([
    getLocalDateString(today),
    getLocalDateString(new Date(2026, 6, 10, 12))
  ]), 1);

  Date.now = originalNow;
});
