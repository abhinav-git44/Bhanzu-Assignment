import { load, save } from './storage';

// Prototype instrumentation, following docs/ANALYTICS_PLAN.md.
// Events are kept in this browser only and shown in the "Event log" drawer.
// Nothing is sent to a server. Production would send the same envelope to the
// analytics pipeline, keyed by a pseudonymous booking_id — never by the child's name.

export const SCHEMA_VERSION = 2;

/** Events the prototype actually fires. Backend-only events are listed in the analytics plan. */
export type EventName =
  | 'experience_viewed'
  | 'mission_viewed'
  | 'mission_started'
  | 'mission_resumed'
  | 'mission_answer_submitted'
  | 'mission_completed'
  | 'mission_retried'
  | 'demo_details_viewed'
  | 'joining_instructions_opened'
  | 'calendar_add_clicked'
  | 'readiness_item_checked'
  | 'reschedule_started'
  | 'reschedule_completed'
  | 'experience_reset';

export const PROTOTYPE_EVENTS: readonly EventName[] = [
  'experience_viewed',
  'mission_viewed',
  'mission_started',
  'mission_resumed',
  'mission_answer_submitted',
  'mission_completed',
  'mission_retried',
  'demo_details_viewed',
  'joining_instructions_opened',
  'calendar_add_clicked',
  'readiness_item_checked',
  'reschedule_started',
  'reschedule_completed',
  'experience_reset',
];

export type EventProps = Record<string, string | number | boolean>;

/** Envelope shared by every event (see ANALYTICS_PLAN.md §2). */
export interface TrackedEvent {
  event_id: string; // unique per event, used for deduplication
  name: EventName;
  ts: string; // UTC ISO-8601
  tz: string; // viewer's IANA time zone, for local-time analysis
  schema_version: number;
  props: EventProps;
}

type Listener = (events: TrackedEvent[]) => void;

let events: TrackedEvent[] = load<TrackedEvent[]>('events', []).filter((e) => e && e.event_id);
const seen = new Set(events.map((e) => e.event_id));
const listeners = new Set<Listener>();
let baseProps: EventProps = {};

// Keys that must never appear in analytics properties (child or parent PII).
const BLOCKED_KEYS = /name|phone|email|address|school|dob|birth/i;

export function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function viewerTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function setBaseProps(props: EventProps): void {
  baseProps = props;
}

/** Removes any property whose key looks like personal data. */
export function sanitizeProps(props: EventProps): EventProps {
  return Object.fromEntries(Object.entries(props).filter(([k]) => !BLOCKED_KEYS.test(k)));
}

export function buildEvent(name: EventName, props: EventProps = {}, now = new Date(), id = newId()): TrackedEvent {
  return {
    event_id: id,
    name,
    ts: now.toISOString(),
    tz: viewerTimeZone(),
    schema_version: SCHEMA_VERSION,
    props: sanitizeProps({ ...baseProps, ...props }),
  };
}

/** Records an event. Returns false if an event with the same id was already recorded. */
export function track(name: EventName, props: EventProps = {}, id?: string): boolean {
  const e = buildEvent(name, props, new Date(), id);
  if (seen.has(e.event_id)) return false;
  seen.add(e.event_id);
  events = [...events, e].slice(-300);
  save('events', events);
  listeners.forEach((l) => l(events));
  return true;
}

export function getEvents(): TrackedEvent[] {
  return events;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function clearEvents(): void {
  events = [];
  seen.clear();
  save('events', events);
  listeners.forEach((l) => l(events));
}
