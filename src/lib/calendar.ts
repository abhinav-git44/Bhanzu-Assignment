// Calendar helpers. A Google Calendar link works everywhere (it opens a new tab);
// an .ics file is offered only where the page is allowed to start downloads.

export interface CalendarEvent {
  title: string;
  start: Date;
  durationMin: number;
  description: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function buildIcs(ev: CalendarEvent, uid = 'demo@bhanzu-math-mission.prototype'): string {
  const end = new Date(ev.start.getTime() + ev.durationMin * 60_000);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Math Mission Prototype//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(ev.start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(ev.title)}`,
    `DESCRIPTION:${escapeIcs(ev.description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Class starts in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function googleCalendarUrl(ev: CalendarEvent): string {
  const end = new Date(ev.start.getTime() + ev.durationMin * 60_000);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    dates: `${toUtcStamp(ev.start)}/${toUtcStamp(end)}`,
    details: ev.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Embedded/sandboxed viewers block page-started downloads. */
export function canDownloadFiles(): boolean {
  try {
    return window.self === window.top;
  } catch {
    return false;
  }
}
