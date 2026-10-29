export type CountdownState = 'upcoming' | 'soon' | 'live' | 'past';

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  state: CountdownState;
}

export const DEMO_MINUTES = 60;
const MIN = 60_000;

/** Countdown to a demo. "soon" = within 30 minutes, "live" = during the class. */
export function getCountdown(target: Date, now: Date, durationMin = DEMO_MINUTES): Countdown {
  const diff = target.getTime() - now.getTime();
  const zero = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (diff <= -durationMin * MIN) return { ...zero, state: 'past' };
  if (diff <= 0) return { ...zero, state: 'live' };
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86_400),
    hours: Math.floor((s % 86_400) / 3_600),
    minutes: Math.floor((s % 3_600) / 60),
    seconds: s % 60,
    state: diff <= 30 * MIN ? 'soon' : 'upcoming',
  };
}

/** Whole calendar days between two dates in local time (the "booking gap"). */
export function calendarDayGap(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

const SLOT_TIMES: Array<[number, number]> = [
  [10, 0],
  [17, 30],
  [19, 0],
];

/**
 * Simulated open slots for rescheduling. Soonest first: the data suggests
 * shorter gaps attend better, so the nearest workable slot is the default.
 * Slots need at least 2 hours' notice and exclude the current booking.
 */
export function generateSlots(now: Date, current: Date | null, days = 4, max = 6): Date[] {
  const out: Date[] = [];
  for (let d = 0; d <= days; d++) {
    for (const [h, m] of SLOT_TIMES) {
      const slot = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, h, m, 0, 0);
      if (slot.getTime() < now.getTime() + 2 * 60 * MIN) continue;
      if (current && slot.getTime() === current.getTime()) continue;
      out.push(slot);
    }
  }
  return out.slice(0, max);
}

export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDay(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** Time with a short zone label, e.g. "5:30 pm IST", so families abroad see whose clock it is. */
export function formatTimeZoned(d: Date): string {
  try {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short' });
  } catch {
    return formatTime(d);
  }
}

export function relativeDayLabel(d: Date, now: Date): string {
  const gap = calendarDayGap(now, d);
  if (gap === 0) return 'Today';
  if (gap === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}
