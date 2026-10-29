import type { Booking } from '../data/booking';
import type { CompletedMission } from '../App';
import type { SavedMission } from '../lib/mission';
import { getMission } from '../data/missions';
import { CountdownDisplay, NextSteps, Stars } from '../components/ui';
import { calendarDayGap, formatDay, formatTimeZoned, getCountdown } from '../lib/time';

interface Props {
  booking: Booking;
  now: Date;
  completed: CompletedMission | null;
  inProgress: SavedMission | null;
  onStartMission: () => void;
  onResumeMission: () => void;
  onOpenPrep: () => void;
  onOpenJoin: () => void;
  onReschedule: () => void;
}

export function Home({ booking, now, completed, inProgress, onStartMission, onResumeMission, onOpenPrep, onOpenJoin, onReschedule }: Props) {
  const demo = new Date(booking.demoAt);
  const cd = getCountdown(demo, now);
  const name = booking.childFirstName;
  const dayGap = calendarDayGap(now, demo);
  const daysText = dayGap <= 0 ? 'later today' : dayGap === 1 ? 'tomorrow' : `in ${dayGap} days`;

  return (
    <div className="stack-lg">
      <section className="kid-hero" aria-labelledby="screen-title">
        <div className="kid-hero-text">
          <p className="eyebrow on-accent">For {name}</p>
          <h1 id="screen-title" tabIndex={-1}>
            {cd.state === 'upcoming' || cd.state === 'soon' ? (
              <>
                Hi {name}! Your math class is {daysText}.
              </>
            ) : (
              <>Hi {name}! Ready for some math?</>
            )}
          </h1>
          {completed ? (
            <div className="hero-done">
              <Stars count={completed.stars} />
              <p>
                You earned the <strong>{getMission(completed.band).badge}</strong> badge. Show it to your teacher when class starts.
              </p>
            </div>
          ) : (
            <p className="kid-hero-sub">Warm up with 5 puzzles and learn a secret speed trick before you meet your teacher.</p>
          )}
          {inProgress ? (
            <div className="resume-row">
              <button type="button" className="btn primary big" onClick={onResumeMission}>
                Continue mission ({inProgress.state.results.length} of {getMission(inProgress.band).questions.length} done)
              </button>
              <button type="button" className="btn-link on-accent" onClick={onStartMission}>
                Start over
              </button>
            </div>
          ) : (
            <button type="button" className="btn primary big" onClick={onStartMission}>
              {completed ? 'Play another mission' : 'Start Math Mission'}
            </button>
          )}
          <p className="hero-meta">About 5 minutes · Not a test · No sign-up</p>
        </div>
        <div className="kid-hero-art" aria-hidden="true">
          <span className="tile t1">7</span>
          <span className="tile t2">+</span>
          <span className="tile t3">×</span>
          <span className="tile t4">25</span>
          <span className="tile t5">?</span>
        </div>
      </section>

      <section className="card parent-card" aria-labelledby="demo-heading">
        <div className="card-head">
          <div>
            <p className="eyebrow">For parents</p>
            <h2 id="demo-heading">{name}'s free demo class</h2>
          </div>
          <span className={`chip ${cd.state === 'past' ? 'warn' : 'ok'}`}>
            {cd.state === 'past' ? 'Time passed' : booking.status === 'rescheduled' ? 'Rescheduled' : 'Confirmed'}
          </span>
        </div>

        <dl className="demo-facts">
          <div>
            <dt>Date</dt>
            <dd>{formatDay(demo)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>{formatTimeZoned(demo)}</dd>
          </div>
          <div>
            <dt>Length</dt>
            <dd>60 min, live online</dd>
          </div>
          <div>
            <dt>Teacher</dt>
            <dd>Ms. {booking.teacherFirstName}</dd>
          </div>
        </dl>

        <CountdownDisplay demoAt={demo} now={now} />

        <div className="action-row">
          <button type="button" className="btn secondary" onClick={onOpenJoin}>
            How to join
          </button>
          <button type="button" className="btn secondary" onClick={onOpenPrep}>
            Get ready for class
          </button>
          <button type="button" className={cd.state === 'past' ? 'btn primary' : 'btn ghost'} onClick={onReschedule}>
            {cd.state === 'past' ? 'Pick a new time' : 'Change time'}
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="next-heading">
        <h2 id="next-heading">What happens next</h2>
        <NextSteps current={completed ? 1 : 0} />
      </section>
    </div>
  );
}
