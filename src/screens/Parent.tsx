import { useState } from 'react';
import type { Booking } from '../data/booking';
import { BackButton, CountdownDisplay, NextSteps, ScreenTitle } from '../components/ui';
import { formatDay, formatTimeZoned, getCountdown, DEMO_MINUTES } from '../lib/time';
import { buildIcs, canDownloadFiles, googleCalendarUrl, type CalendarEvent } from '../lib/calendar';
import { track } from '../lib/analytics';

function calendarEvent(booking: Booking): CalendarEvent {
  return {
    title: `${booking.childFirstName}'s free Bhanzu math demo`,
    start: new Date(booking.demoAt),
    durationMin: DEMO_MINUTES,
    description:
      'Live 60-minute math demo class. Join 5 minutes early from the link in your confirmation message. (Sample event created by the Math Mission prototype.)',
  };
}

/* ---------- Get ready ---------- */

interface PrepProps {
  booking: Booking;
  now: Date;
  missionDone: boolean;
  onBack: () => void;
  onJoin: () => void;
  onMission: () => void;
}

const TIPS = [
  { t: 'Use a laptop or tablet if you can', d: 'A bigger screen makes the puzzles easier to see. A phone works too.' },
  { t: 'Find a quiet corner', d: 'Keep a pencil and some paper nearby for rough work.' },
  { t: 'Join 5 minutes early', d: 'It gives you time to sort out sound and settle in.' },
  { t: 'Stay close for the first few minutes', d: "Then let your child answer on their own, even if they're unsure. Mistakes are how the teacher sees where to help." },
  { t: 'Shy is fine', d: 'Many children are quiet at first. The teacher is used to drawing them in.' },
];

const FAQ = [
  {
    q: 'Does my child need to prepare?',
    a: 'No. The Math Mission is an optional warm-up. The class is designed for children to come as they are.',
  },
  {
    q: 'Will I be pushed to buy something?',
    a: 'After class, an Academic Counsellor calls you to talk about how your child did and answer your questions. Whether to enroll is entirely your decision.',
  },
  {
    q: "What if the time doesn't work anymore?",
    a: 'Change it from the home screen. Picking a new time takes less than a minute, and it helps another family get a seat.',
  },
];

export function Prep({ booking, now, missionDone, onBack, onJoin, onMission }: PrepProps) {
  const demo = new Date(booking.demoAt);
  return (
    <div className="stack-lg">
      <BackButton onClick={onBack} />
      <ScreenTitle eyebrow="For parents">Getting ready for {booking.childFirstName}'s class</ScreenTitle>

      <section className="card summary-strip" aria-label="Class summary">
        <div>
          <p className="muted small">Class time</p>
          <p className="strong">
            {formatDay(demo)}, {formatTimeZoned(demo)}
          </p>
        </div>
        <CountdownDisplay demoAt={demo} now={now} />
      </section>

      <section className="card" aria-labelledby="expect-heading">
        <h2 id="expect-heading">What to expect</h2>
        <dl className="expect-list">
          <div>
            <dt>Before</dt>
            <dd>The class link arrives about 15 minutes before the start. Joining 5 minutes early leaves time to sort out sound.</dd>
          </div>
          <div>
            <dt>During</dt>
            <dd>
              A live, interactive 60-minute maths class with Ms. {booking.teacherFirstName}. {booking.childFirstName} is asked to answer and try things,
              not just watch.
            </dd>
          </div>
          <div>
            <dt>After</dt>
            <dd>An Academic Counsellor calls you to talk about how {booking.childFirstName} did and answer your questions. Enrolling is your choice.</dd>
          </div>
        </dl>
      </section>

      <section className="card" aria-labelledby="tips-heading">
        <h2 id="tips-heading">Five things that help</h2>
        <ol className="tip-list">
          {TIPS.map((t) => (
            <li key={t.t}>
              <strong>{t.t}</strong>
              <span>{t.d}</span>
            </li>
          ))}
        </ol>
        <div className="action-row">
          <button type="button" className="btn primary" onClick={onJoin}>
            See how to join
          </button>
          {!missionDone && (
            <button type="button" className="btn ghost" onClick={onMission}>
              Let {booking.childFirstName} try the Math Mission
            </button>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Questions parents often ask</h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="after-heading">
        <h2 id="after-heading">What happens next</h2>
        <NextSteps current={missionDone ? 1 : 0} />
      </section>
    </div>
  );
}

/* ---------- How to join ---------- */

interface JoinProps {
  booking: Booking;
  now: Date;
  checklist: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  onBack: () => void;
  onReschedule: () => void;
}

const READY_ITEMS = [
  { id: 'device', label: 'Device charged or plugged in' },
  { id: 'internet', label: 'Internet working in the room you will use' },
  { id: 'audio', label: 'Speaker or earphones working' },
  { id: 'paper', label: 'Pencil and paper ready' },
];

export function Join({ booking, now, checklist, onToggle, onBack, onReschedule }: JoinProps) {
  const demo = new Date(booking.demoAt);
  const cd = getCountdown(demo, now);
  const [joinNote, setJoinNote] = useState(false);
  const [copyMsg, setCopyMsg] = useState<string | null>(null);
  const ev = calendarEvent(booking);
  const details = `${ev.title}\n${formatDay(demo)}, ${formatTimeZoned(demo)} (60 min)\nJoin 5 minutes early from your confirmation message.`;
  const doneCount = READY_ITEMS.filter((i) => checklist[i.id]).length;
  const linkOpen = cd.state === 'soon' || cd.state === 'live';

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(details);
      setCopyMsg('Copied. Paste it into your calendar or a note.');
      track('calendar_add_clicked', { method: 'copy' });
    } catch {
      setCopyMsg('Copy is blocked here. Select the text below and copy it.');
    }
  }

  function downloadIcs() {
    try {
      const blob = new Blob([buildIcs(ev)], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'math-demo.ics';
      a.click();
      URL.revokeObjectURL(url);
      track('calendar_add_clicked', { method: 'ics' });
    } catch {
      setCopyMsg('The download was blocked. Use the Google Calendar link instead.');
    }
  }

  return (
    <div className="stack-lg">
      <BackButton onClick={onBack} />
      <ScreenTitle eyebrow="For parents">How to join the class</ScreenTitle>

      <section className="card" aria-labelledby="join-heading">
        <h2 id="join-heading">
          {formatDay(demo)} at {formatTimeZoned(demo)}
        </h2>
        <CountdownDisplay demoAt={demo} now={now} />
        <ol className="join-steps">
          <li>
            <strong>About 15 minutes before</strong>
            <span>We send the class link on WhatsApp and email. The button below also opens it.</span>
          </li>
          <li>
            <strong>Open the link</strong>
            <span>Chrome works best. If the browser asks, allow sound and camera.</span>
          </li>
          <li>
            <strong>Say hello</strong>
            <span>
              Ms. {booking.teacherFirstName} will greet {booking.childFirstName} and start with a warm-up.
            </span>
          </li>
        </ol>
        <button type="button" className={`btn big ${linkOpen ? 'primary' : 'secondary'}`} onClick={() => setJoinNote(true)}>
          {linkOpen ? 'Join class now' : 'Join class (opens 15 min before)'}
        </button>
        {joinNote && (
          <p className="notice-inline" role="status">
            This is a prototype, so there is no real class link. In the live product this button opens the class
            {linkOpen ? '.' : ' once the room opens, 15 minutes before the start time.'}
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="ready-heading">
        <div className="card-head">
          <h2 id="ready-heading">Quick readiness check</h2>
          <span className={`chip ${doneCount === READY_ITEMS.length ? 'ok' : 'neutral'}`}>
            {doneCount}/{READY_ITEMS.length} ready
          </span>
        </div>
        <ul className="checklist">
          {READY_ITEMS.map((item) => (
            <li key={item.id}>
              <input
                type="checkbox"
                id={`ready-${item.id}`}
                checked={!!checklist[item.id]}
                onChange={(e) => onToggle(item.id, e.target.checked)}
              />
              <label htmlFor={`ready-${item.id}`}>{item.label}</label>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" aria-labelledby="cal-heading">
        <h2 id="cal-heading">Add it to your calendar</h2>
        <p className="muted">
          A calendar reminder means one less thing to remember. Google Calendar opens with the details filled in; nothing is saved until you press
          Save there.
        </p>
        <div className="action-row">
          <a
            className="btn secondary"
            href={googleCalendarUrl(ev)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('calendar_add_clicked', { method: 'google' })}
          >
            Add to Google Calendar
          </a>
          {canDownloadFiles() && (
            <button type="button" className="btn secondary" onClick={downloadIcs}>
              Download .ics (Apple, Outlook)
            </button>
          )}
          <button type="button" className="btn ghost" onClick={copyDetails}>
            Copy details
          </button>
        </div>
        {copyMsg && (
          <p className="notice-inline" role="status">
            {copyMsg}
          </p>
        )}
        <pre className="copy-box">{details}</pre>
      </section>

      <section className="card help-card" aria-labelledby="help-heading">
        <h2 id="help-heading">Can't make it?</h2>
        <p>Pick another time instead of skipping. It takes under a minute.</p>
        <button type="button" className="btn ghost" onClick={onReschedule}>
          Change time
        </button>
      </section>
    </div>
  );
}
