import { parseDateParam } from '../lib/time';

// SAMPLE booking data. In production this comes from the booking system via a
// signed per-booking link (e.g. /m/<token>). Nothing here is real.

export interface Booking {
  bookingId: string; // pseudonymous; the only identifier analytics uses
  childFirstName: string; // display only, never sent to analytics
  demoAt: string; // ISO
  bookedAt: string; // ISO
  status: 'confirmed' | 'rescheduled';
  teacherFirstName: string;
  rescheduleCount: number;
}

/** Accepts a first name only; strips anything that is not a letter, space, or hyphen. */
export function sanitizeFirstName(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\p{L}\s-]/gu, '').trim().split(/\s+/)[0] ?? '';
  return cleaned.length >= 1 && cleaned.length <= 20 ? cleaned : null;
}

/**
 * Builds the sample booking. Supports URL parameters so reviewers can test edge cases:
 *   ?child=Meera            first name shown in the experience
 *   ?demo=2026-11-02T17:30  demo date/time (local); invalid values fall back
 *   ?gap=5                  days until the demo (ignored if ?demo is valid)
 */
export function sampleBooking(now: Date, params: URLSearchParams): Booking {
  const explicit = parseDateParam(params.get('demo'));
  let demo: Date;
  if (explicit) {
    demo = explicit;
  } else {
    const gapRaw = params.has('gap') ? Number(params.get('gap')) : NaN;
    const gap = Number.isInteger(gapRaw) && gapRaw >= 0 && gapRaw <= 14 ? gapRaw : 3;
    demo = new Date(now.getFullYear(), now.getMonth(), now.getDate() + gap, 17, 30, 0, 0);
    if (demo.getTime() <= now.getTime()) demo = new Date(now.getTime() + 3 * 3_600_000);
  }
  return {
    bookingId: `bk_sample_${Math.random().toString(36).slice(2, 8)}`,
    childFirstName: sanitizeFirstName(params.get('child')) ?? 'Aarav',
    demoAt: demo.toISOString(),
    bookedAt: now.toISOString(),
    status: 'confirmed',
    teacherFirstName: 'Kavya',
    rescheduleCount: 0,
  };
}

export interface BookingLoad {
  booking: Booking;
  /** Set when the link carried booking data we could not use. */
  notice: string | null;
}

/** Loads the booking from link parameters, reporting unusable values instead of failing silently. */
export function bookingFromLink(now: Date, params: URLSearchParams): BookingLoad {
  const problems: string[] = [];
  if (params.has('demo') && !parseDateParam(params.get('demo'))) problems.push('class time');
  if (params.has('child') && !sanitizeFirstName(params.get('child'))) problems.push('name');
  const gap = params.get('gap');
  if (gap !== null && !(Number.isInteger(Number(gap)) && Number(gap) >= 0 && Number(gap) <= 14)) problems.push('booking gap');
  const booking = sampleBooking(now, params);
  return {
    booking,
    notice: problems.length ? `We couldn't read the ${problems.join(' and ')} in this link, so a sample booking is shown instead.` : null,
  };
}
