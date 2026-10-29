import { getMission } from '../data/missions';
import { summarize, type AgeBand, type QuestionResult } from '../lib/mission';
import { Stars } from '../components/ui';
import type { Booking } from '../data/booking';
import { formatDay, formatTimeZoned } from '../lib/time';

interface Props {
  band: AgeBand;
  results: QuestionResult[];
  booking: Booking;
  onRetry: () => void;
  onOtherLevel: () => void;
  onParent: () => void;
  onHome: () => void;
}

const RESULT_LABEL: Record<QuestionResult, string> = {
  first: 'Solved first try',
  second: 'Solved with a hint',
  missed: 'Learned the answer',
};

export function Complete({ band, results, booking, onRetry, onOtherLevel, onParent, onHome }: Props) {
  const mission = getMission(band);
  const s = summarize(results);
  const name = booking.childFirstName;
  const demo = new Date(booking.demoAt);
  const tricky = s.tricky.map((i) => mission.questions[i]?.skill).filter(Boolean);

  return (
    <div className="stack-lg">
      <section className="complete-hero">
        <div className="badge-medal" aria-hidden="true">
          <span>{mission.badge.split(' ').map((w) => w[0]).join('')}</span>
        </div>
        <p className="eyebrow">Mission complete</p>
        <h1 id="screen-title" tabIndex={-1}>
          Well done, {name}! You're a {mission.badge}.
        </h1>
        <Stars count={s.stars} />
        <p className="lead">
          You solved {s.solved} of {s.total} puzzles{s.firstTry > 0 ? `, ${s.firstTry} on the first try` : ''}. Tell Ms. {booking.teacherFirstName} about
          your badge when class starts on {formatDay(demo)} at {formatTimeZoned(demo)}.
        </p>
        <div className="action-row center">
          <button type="button" className="btn primary" onClick={onRetry}>
            Play again
          </button>
          <button type="button" className="btn secondary" onClick={onOtherLevel}>
            Try another level
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="result-heading">
        <h2 id="result-heading">Puzzle by puzzle</h2>
        <ul className="result-list">
          {results.map((r, i) => (
            <li key={mission.questions[i].id}>
              <span className={`res-dot ${r}`} aria-hidden="true" />
              <span className="res-skill">{mission.questions[i].skill}</span>
              <span className="res-label">{RESULT_LABEL[r]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card parent-note" aria-labelledby="pnote-heading">
        <p className="eyebrow">For parents</p>
        <h2 id="pnote-heading">What this tells the teacher</h2>
        <p>
          {tricky.length === 0
            ? `${name} solved every puzzle on the first try. The teacher can start with a stretch challenge.`
            : `${name} finished the mission and needed a little help with ${tricky.join(', ').toLowerCase()}. That's normal, and it gives the teacher a starting point.`}
        </p>
        <p className="muted small">
          In the full product, this summary would be shared with the demo teacher and the Academic Counsellor before class, so the
          class starts where {name} is and the follow-up call is about {name}, not a sales script. In this prototype nothing is sent.
        </p>
        <p className="next-line">
          Class is on <strong>{formatDay(demo)}</strong> at <strong>{formatTimeZoned(demo)}</strong>.
        </p>
        <div className="action-row">
          <button type="button" className="btn primary" onClick={onParent}>
            Get ready for class
          </button>
          <button type="button" className="btn ghost" onClick={onHome}>
            Back to home
          </button>
        </div>
      </section>
    </div>
  );
}
