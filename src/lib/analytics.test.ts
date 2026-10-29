import { describe, expect, it } from 'vitest';
import { buildEvent, clearEvents, getEvents, sanitizeProps, setBaseProps, track, SCHEMA_VERSION, PROTOTYPE_EVENTS } from './analytics';

describe('analytics envelope', () => {
  it('stamps id, UTC timestamp, time zone and schema version', () => {
    const e = buildEvent('mission_started', { age_band: '9-11' }, new Date(Date.UTC(2026, 9, 28, 17, 0)), 'fixed-id');
    expect(e.event_id).toBe('fixed-id');
    expect(e.ts).toBe('2026-10-28T17:00:00.000Z');
    expect(typeof e.tz).toBe('string');
    expect(e.schema_version).toBe(SCHEMA_VERSION);
    expect(e.props.age_band).toBe('9-11');
  });
  it('merges base props (booking id, arm) into every event', () => {
    setBaseProps({ booking_id: 'bk_1', experiment_arm: 'treatment' });
    const e = buildEvent('experience_viewed');
    expect(e.props).toMatchObject({ booking_id: 'bk_1', experiment_arm: 'treatment' });
    setBaseProps({});
  });
  it('drops properties that look like personal data', () => {
    expect(sanitizeProps({ child_name: 'Aarav', parent_phone: '99', email: 'x', age_band: '6-8' })).toEqual({ age_band: '6-8' });
  });
  it('deduplicates by event id', () => {
    clearEvents();
    expect(track('mission_viewed', {}, 'dup-1')).toBe(true);
    expect(track('mission_viewed', {}, 'dup-1')).toBe(false);
    expect(getEvents()).toHaveLength(1);
    clearEvents();
  });
  it('lists every prototype event once', () => {
    expect(new Set(PROTOTYPE_EVENTS).size).toBe(PROTOTYPE_EVENTS.length);
    expect(PROTOTYPE_EVENTS).toContain('mission_answer_submitted');
    expect(PROTOTYPE_EVENTS).toContain('calendar_add_clicked');
  });
});
