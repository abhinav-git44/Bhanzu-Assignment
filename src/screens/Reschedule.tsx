import { useState } from 'react';
import type { Booking } from '../data/booking';
import { BackButton, ScreenTitle } from '../components/ui';
import { formatDay, formatTime, formatTimeZoned, generateSlots, relativeDayLabel } from '../lib/time';

interface Props {
  booking: Booking;
  now: Date;
  onConfirm: (slot: Date) => void;
  onBack: () => void;
}

export function Reschedule({ booking, now, onConfirm, onBack }: Props) {
  const current = new Date(booking.demoAt);
  // Slots are computed once per visit so the list doesn't shift while choosing.
  // Slots are fixed when the page opens so the list doesn't shift while the parent is choosing.
  const [slots] = useState(() => generateSlots(now, current));
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    if (picked === null) {
      setError('Choose a time first.');
      return;
    }
    const slot = slots[picked];
    setDone(slot);
    onConfirm(slot);
  }

  if (done) {
    return (
      <div className="stack-lg">
        <ScreenTitle eyebrow="Rescheduled">All set for {formatDay(done)}</ScreenTitle>
        <section className="card success-card" role="status">
          <p className="strong big-text">
            {booking.childFirstName}'s class is now on {formatDay(done)} at {formatTimeZoned(done)}.
          </p>
          <p className="muted">
            Prototype note: no booking system or message was updated. In the live product a new confirmation would go out on WhatsApp right away,
            and the old seat would be freed for another family.
          </p>
          <div className="action-row">
            <button type="button" className="btn primary" onClick={onBack}>
              Back to home
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <BackButton onClick={onBack} />
      <ScreenTitle eyebrow="For parents">Pick a new time</ScreenTitle>
      <p className="lead">
        Current time: <strong>{formatDay(current)}, {formatTimeZoned(current)}</strong>. The soonest openings are listed first.
      </p>

      <fieldset className="slot-grid">
        <legend className="sr-only">Available times</legend>
        {slots.map((s, i) => (
          <label key={s.toISOString()} className={`slot ${picked === i ? 'selected' : ''}`}>
            <input
              type="radio"
              name="slot"
              id={`slot-${i}`}
              checked={picked === i}
              onChange={() => {
                setPicked(i);
                setError(null);
              }}
            />
            <span className="slot-day">{relativeDayLabel(s, now)}</span>
            <span className="slot-date">{s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            <span className="slot-time">{formatTime(s)}</span>
          </label>
        ))}
      </fieldset>
      {slots.length === 0 && <p className="muted">No open times right now. In the live product you could ask for a callback here.</p>}

      {error && (
        <p className="input-error" role="alert">
          {error}
        </p>
      )}
      <div className="action-row">
        <button type="button" className="btn primary" onClick={confirm} disabled={slots.length === 0}>
          Confirm new time
        </button>
        <button type="button" className="btn ghost" onClick={onBack}>
          Keep current time
        </button>
      </div>
      <p className="muted small">Sample times for this prototype. Nothing is booked.</p>
    </div>
  );
}
