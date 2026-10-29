import { describe, expect, it } from 'vitest';
import { calendarDayGap, formatTimeZoned, generateSlots, getCountdown, parseDateParam } from './time';
import { buildIcs, googleCalendarUrl, toUtcStamp } from './calendar';
import { bookingFromLink, sampleBooking, sanitizeFirstName } from '../data/booking';

const now = new Date(2026, 9, 28, 22, 40, 0); // 28 Oct 2026, 10:40 pm local

describe('countdown', () => {
  it('splits time into days/hours/minutes/seconds', () => {
    const target = new Date(now.getTime() + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000);
    expect(getCountdown(target, now)).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5, state: 'upcoming' });
  });
  it('flags soon, live and past', () => {
    expect(getCountdown(new Date(now.getTime() + 10 * 60_000), now).state).toBe('soon');
    expect(getCountdown(new Date(now.getTime() - 10 * 60_000), now).state).toBe('live');
    expect(getCountdown(new Date(now.getTime() - 61 * 60_000), now).state).toBe('past');
  });
});

describe('booking gap and slots', () => {
  it('counts calendar days, not 24h blocks', () => {
    expect(calendarDayGap(now, new Date(2026, 9, 29, 9, 0))).toBe(1);
    expect(calendarDayGap(now, new Date(2026, 9, 28, 23, 0))).toBe(0);
  });
  it('offers future slots soonest first with 2h notice, excluding the current one', () => {
    const current = new Date(2026, 9, 29, 17, 30);
    const slots = generateSlots(now, current);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots.every((s) => s.getTime() >= now.getTime() + 2 * 3_600_000)).toBe(true);
    expect(slots.some((s) => s.getTime() === current.getTime())).toBe(false);
    const sorted = [...slots].sort((a, b) => a.getTime() - b.getTime());
    expect(slots).toEqual(sorted);
  });
  it('rejects invalid date params', () => {
    expect(parseDateParam('not-a-date')).toBeNull();
    expect(parseDateParam(null)).toBeNull();
    expect(parseDateParam('2026-11-02T17:30')).toBeInstanceOf(Date);
  });
});

describe('sample booking', () => {
  it('uses a requested gap and a sanitized first name', () => {
    const b = sampleBooking(now, new URLSearchParams({ gap: '5', child: 'Meera<script>' }));
    expect(b.childFirstName).toBe('Meerascript');
    expect(calendarDayGap(now, new Date(b.demoAt))).toBe(5);
  });
  it('falls back to defaults for bad input', () => {
    const b = sampleBooking(now, new URLSearchParams({ gap: '99' }));
    expect(calendarDayGap(now, new Date(b.demoAt))).toBe(3);
    expect(b.childFirstName).toBe('Aarav');
  });
  it('defaults to a 3-day gap when no gap is given', () => {
    expect(calendarDayGap(now, new Date(sampleBooking(now, new URLSearchParams()).demoAt))).toBe(3);
  });
  it('keeps only the first name', () => {
    expect(sanitizeFirstName('Riya Sharma')).toBe('Riya');
    expect(sanitizeFirstName('')).toBeNull();
  });
});

describe('calendar', () => {
  const ev = { title: 'Demo, class; test', start: new Date(Date.UTC(2026, 10, 1, 12, 0)), durationMin: 60, description: 'Line 1\nLine 2' };
  it('builds a valid ics with escaped text and a 30 minute alarm', () => {
    const ics = buildIcs(ev);
    expect(ics).toContain('DTSTART:20261101T120000Z');
    expect(ics).toContain('DTEND:20261101T130000Z');
    expect(ics).toContain('SUMMARY:Demo\\, class\\; test');
    expect(ics).toContain('TRIGGER:-PT30M');
  });
  it('builds a Google Calendar link', () => {
    const url = googleCalendarUrl(ev);
    expect(url.startsWith('https://calendar.google.com/calendar/render?')).toBe(true);
    expect(url).toContain(encodeURIComponent(`${toUtcStamp(ev.start)}/`).replace('%2F', '%2F'));
  });
});

describe('time display', () => {
  it('includes a time-zone label', () => {
    const label = formatTimeZoned(new Date(Date.UTC(2026, 10, 1, 12, 0)));
    expect(label).toMatch(/\d{1,2}:\d{2}/);
    // Some zone name or offset (e.g. IST, UTC, GMT+5:30) must follow the time.
    expect(label.replace(/am|pm/i, '')).toMatch(/[A-Za-z]{2,}/);
  });
});

describe('booking from link', () => {
  it('reports unreadable link data instead of failing silently', () => {
    const r = bookingFromLink(now, new URLSearchParams({ demo: 'next tuesday', gap: '99' }));
    expect(r.notice).toContain('class time');
    expect(r.notice).toContain('booking gap');
    expect(calendarDayGap(now, new Date(r.booking.demoAt))).toBe(3);
  });
  it('has no notice for a clean link', () => {
    expect(bookingFromLink(now, new URLSearchParams({ gap: '2', child: 'Meera' })).notice).toBeNull();
  });
  it('gives every booking a pseudonymous id', () => {
    expect(sampleBooking(now, new URLSearchParams()).bookingId).toMatch(/^bk_sample_/);
  });
});
