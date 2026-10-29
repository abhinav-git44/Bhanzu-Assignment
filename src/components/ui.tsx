import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getCountdown } from '../lib/time';
import { clearEvents, getEvents, subscribe, type TrackedEvent } from '../lib/analytics';

export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function ScreenTitle({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <header className="screen-head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 id="screen-title" tabIndex={-1}>
        {children}
      </h1>
    </header>
  );
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="btn-link back" onClick={onClick}>
      <span aria-hidden="true">←</span> {label}
    </button>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownDisplay({ demoAt, now }: { demoAt: Date; now: Date }) {
  const c = getCountdown(demoAt, now);
  if (c.state === 'live') return <p className="countdown-msg live">The class is happening now. Join from the joining page.</p>;
  if (c.state === 'past') return <p className="countdown-msg past">This class time has passed. Pick a new time below.</p>;
  const units: Array<[number, string]> = [
    [c.days, c.days === 1 ? 'day' : 'days'],
    [c.hours, 'hrs'],
    [c.minutes, 'min'],
    [c.seconds, 'sec'],
  ];
  return (
    <div className="countdown" role="timer" aria-label={`Class starts in ${c.days} days ${c.hours} hours ${c.minutes} minutes`}>
      {units.map(([v, l]) => (
        <div className="cd-unit" key={l}>
          <span className="cd-num">{l === 'day' || l === 'days' ? v : pad(v)}</span>
          <span className="cd-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={i < count ? 'star on' : 'star'} aria-hidden="true">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

const STEPS = [
  { t: 'Math Mission', d: 'A 5-minute warm-up for your child. Optional, and not a test.' },
  { t: 'Live demo class', d: '60 minutes with a Bhanzu teacher. Your child answers, the teacher guides.' },
  { t: 'Counsellor call', d: 'An Academic Counsellor calls you to share how your child did.' },
  { t: 'You decide', d: 'There is no obligation to enroll. Take the time you need.' },
];

export function NextSteps({ current = 0 }: { current?: number }) {
  return (
    <ol className="steps">
      {STEPS.map((s, i) => (
        <li key={s.t} className={i < current ? 'done' : i === current ? 'current' : ''}>
          <span className="step-dot" aria-hidden="true">
            {i < current ? '✓' : i + 1}
          </span>
          <div>
            <strong>{s.t}</strong>
            <span>{s.d}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EventLog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<TrackedEvent[]>(getEvents());
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => subscribe(setEvents), []);
  // Escape closes the drawer; focus moves into it and returns to the trigger on close.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      trigger?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="log-title" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2 id="log-title">Event log</h2>
          <button type="button" ref={closeRef} className="btn-link" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="muted small">
          Prototype instrumentation. Events stay in this browser and are not sent anywhere. Each event carries a pseudonymous booking ID, never a
          name. Event definitions are in the analytics plan.
        </p>
        {events.length === 0 ? (
          <p className="muted">No events yet. Start a mission or open the joining page.</p>
        ) : (
          <ol className="log-list">
            {[...events].reverse().map((e) => (
              <li key={e.event_id}>
                <div className="log-row">
                  <code>{e.name}</code>
                  <time>{new Date(e.ts).toLocaleTimeString('en-IN')}</time>
                </div>
                <pre>{JSON.stringify({ ...e.props, event_id: e.event_id.slice(0, 8), tz: e.tz })}</pre>
              </li>
            ))}
          </ol>
        )}
        <button type="button" className="btn ghost small-btn" onClick={clearEvents}>
          Clear log
        </button>
      </aside>
    </div>
  );
}
