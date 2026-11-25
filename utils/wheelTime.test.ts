import {
  formatWheelClockPreview,
  hhmmToWheelClock,
  wheelClockToHhmm,
} from './wheelTime.ts';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function roundTrip(hhmm: string): void {
  const wheel = hhmmToWheelClock(hhmm);
  assert(wheel !== null, `${hhmm} parses`);
  assert(wheelClockToHhmm(wheel) === hhmm, `${hhmm} round-trips (got ${wheelClockToHhmm(wheel)})`);
}

function runWheelTimeChecks(): void {
  for (const value of [
    '00:00',
    '00:30',
    '01:00',
    '07:30',
    '11:59',
    '12:00',
    '12:30',
    '13:00',
    '21:00',
    '23:59',
  ]) {
    roundTrip(value);
  }

  assert(hhmmToWheelClock('00:00')?.period === 'am' && hhmmToWheelClock('00:00')?.hour12 === 12, 'midnight');
  assert(hhmmToWheelClock('12:00')?.period === 'pm' && hhmmToWheelClock('12:00')?.hour12 === 12, 'noon');
  assert(hhmmToWheelClock('21:00')?.period === 'pm' && hhmmToWheelClock('21:00')?.hour12 === 9, '9pm');
  assert(hhmmToWheelClock('07:30')?.period === 'am' && hhmmToWheelClock('07:30')?.hour12 === 7, '7:30am');

  assert(
    wheelClockToHhmm({ period: 'am', hour12: 12, minute: 0 }) === '00:00',
    'am 12 → 00:00',
  );
  assert(
    wheelClockToHhmm({ period: 'pm', hour12: 12, minute: 0 }) === '12:00',
    'pm 12 → 12:00',
  );
  assert(
    wheelClockToHhmm({ period: 'pm', hour12: 9, minute: 0 }) === '21:00',
    'pm 9 → 21:00',
  );

  assert(
    formatWheelClockPreview({ period: 'pm', hour12: 9, minute: 0 }).includes('오후 9시'),
    'preview evening',
  );
  assert(
    formatWheelClockPreview({ period: 'am', hour12: 7, minute: 30 }).includes('30분'),
    'preview morning minutes',
  );
}

runWheelTimeChecks();
console.log('wheelTime.test.ts passed');
