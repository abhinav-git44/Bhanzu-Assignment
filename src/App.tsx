import { useCallback, useEffect, useRef, useState } from 'react';
import { bookingFromLink, sampleBooking, type Booking } from './data/booking';
import { getMission } from './data/missions';
import { isResumable, summarize, type AgeBand, type MissionState, type QuestionResult, type SavedMission } from './lib/mission';
import { load, save, clearAll } from './lib/storage';
import { newId, setBaseProps, track, clearEvents } from './lib/analytics';
import { calendarDayGap } from './lib/time';
import { EventLog, useNow } from './components/ui';
import { Home } from './screens/Home';
import { AgeSelect } from './screens/AgeSelect';
import { Mission } from './screens/Mission';
import { Complete } from './screens/Complete';
import { Prep, Join } from './screens/Parent';
import { Reschedule } from './screens/Reschedule';

type Screen = 'home' | 'age' | 'mission' | 'complete' | 'prep' | 'join' | 'reschedule';

export interface CompletedMission {
  band: AgeBand;
  results: QuestionResult[];
  stars: 1 | 2 | 3;
  completedAt: string;
}

const totalFor = (b: AgeBand) => getMission(b).questions.length;

function initialLoad(): { booking: Booking; notice: string | null } {
  const params = new URLSearchParams(window.location.search);
  const hasParams = ['child', 'demo', 'gap'].some((k) => params.has(k));
  const stored = load<Booking | null>('booking', null);
  if (!hasParams && stored && !Number.isNaN(new Date(stored.demoAt).getTime())) {
    // Older saved bookings may predate the pseudonymous id.
    return { booking: stored.bookingId ? stored : { ...stored, bookingId: `bk_sample_${newId().slice(0, 6)}` }, notice: null };
  }
  return bookingFromLink(new Date(), params);
}

function sessionId(): string {
  const existing = load<string | null>('session', null);
  if (existing) return existing;
  const id = newId();
  save('session', id);
  return id;
}

function loadInProgress(): SavedMission | null {
  const saved = load<unknown>('inprogress', null);
  return isResumable(saved, totalFor) ? saved : null;
}

export default function App() {
  const now = useNow();
  const [first] = useState(initialLoad);
  const [booking, setBooking] = useState<Booking>(first.booking);
  const [linkNotice, setLinkNotice] = useState<string | null>(first.notice);
  const [screen, setScreen] = useState<Screen>('home');
  const [band, setBand] = useState<AgeBand | null>(() => load<AgeBand | null>('band', null));
  const [runKey, setRunKey] = useState(0);
  const [resumeState, setResumeState] = useState<MissionState | undefined>(undefined);
  const [inProgress, setInProgress] = useState<SavedMission | null>(loadInProgress);
  const [lastResults, setLastResults] = useState<QuestionResult[] | null>(null);
  const [completed, setCompleted] = useState<CompletedMission | null>(() => load<CompletedMission | null>('completed', null));
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => load('checklist', {}));
  const [logOpen, setLogOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const viewed = useRef(false);
  const missionStartedAt = useRef<string>(new Date().toISOString());
  const closeLog = useCallback(() => setLogOpen(false), []);

  const gapDays = calendarDayGap(new Date(booking.bookedAt), new Date(booking.demoAt));

  useEffect(() => {
    // The prototype always represents the treatment arm of the experiment.
    setBaseProps({
      booking_id: booking.bookingId,
      session_id: sessionId(),
      experiment_arm: 'treatment',
      booking_gap_days: gapDays,
      prototype: true,
    });
  }, [booking.bookingId, gapDays]);

  useEffect(() => save('booking', booking), [booking]);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    const hours = Math.max(0, Math.round((new Date(booking.demoAt).getTime() - Date.now()) / 3_600_000));
    track('experience_viewed', { hours_to_demo: hours, entry: 'confirmation_link' });
  }, [booking.demoAt]);

  // Move focus to the new screen's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const el = document.getElementById('screen-title') ?? document.getElementById('q-prompt');
    el?.focus({ preventScroll: true });
  }, [screen]);

  function go(next: Screen) {
    if (next === 'age') track('mission_viewed', { from: screen });
    if (next === 'prep') track('demo_details_viewed', { from: screen });
    if (next === 'join') track('joining_instructions_opened', { from: screen });
    if (next === 'reschedule') track('reschedule_started', { from: screen });
    setScreen(next);
  }

  function clearInProgress() {
    save('inprogress', null);
    setInProgress(null);
  }

  function startMission(b: AgeBand) {
    setBand(b);
    save('band', b);
    clearInProgress();
    setResumeState(undefined);
    missionStartedAt.current = new Date().toISOString();
    setRunKey((k) => k + 1);
    track('mission_started', { age_band: b, attempt_number: completed ? 2 : 1 });
    setScreen('mission');
  }

  function resumeMission() {
    if (!inProgress) return;
    setBand(inProgress.band);
    setResumeState(inProgress.state);
    missionStartedAt.current = inProgress.startedAt;
    setRunKey((k) => k + 1);
    track('mission_resumed', { age_band: inProgress.band, question_index: inProgress.state.index + 1 });
    setScreen('mission');
  }

  const saveProgress = useCallback(
    (state: MissionState) => {
      if (!band) return;
      const saved: SavedMission = { band, state, startedAt: missionStartedAt.current };
      if (isResumable(saved, totalFor)) {
        save('inprogress', saved);
        setInProgress(saved);
      }
    },
    [band],
  );

  function finishMission(results: QuestionResult[]) {
    if (!band) return;
    const c: CompletedMission = { band, results, stars: summarize(results).stars, completedAt: new Date().toISOString() };
    clearInProgress();
    setLastResults(results);
    setCompleted(c);
    save('completed', c);
    setScreen('complete');
  }

  function reschedule(slot: Date) {
    const prev = new Date(booking.demoAt);
    // bookedAt is kept: the experiment stratifies on the original booking gap.
    const next: Booking = { ...booking, demoAt: slot.toISOString(), status: 'rescheduled', rescheduleCount: booking.rescheduleCount + 1 };
    track('reschedule_completed', {
      old_days_to_demo: calendarDayGap(new Date(), prev),
      new_days_to_demo: calendarDayGap(new Date(), slot),
      reschedule_count: next.rescheduleCount,
    });
    setBooking(next);
  }

  function toggleCheck(id: string, value: boolean) {
    const next = { ...checklist, [id]: value };
    setChecklist(next);
    save('checklist', next);
    if (value) track('readiness_item_checked', { item: id });
  }

  function resetAll() {
    track('experience_reset');
    clearAll();
    clearEvents();
    setBooking(sampleBooking(new Date(), new URLSearchParams(window.location.search)));
    setLinkNotice(null);
    setBand(null);
    setCompleted(null);
    setLastResults(null);
    setInProgress(null);
    setResumeState(undefined);
    setChecklist({});
    setConfirmReset(false);
    setScreen('home');
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <button type="button" className="brand" onClick={() => setScreen('home')} aria-label="Math Mission home">
            <span className="brand-mark" aria-hidden="true">
              ∑
            </span>
            <span className="brand-text">
              Math Mission
              <span className="brand-sub">before your Bhanzu demo</span>
            </span>
          </button>
          <button type="button" className="log-btn" onClick={() => setLogOpen(true)} aria-haspopup="dialog">
            Event log
          </button>
        </div>
      </header>

      <div className="notice" role="note">
        <div className="notice-inner">
          <strong>Concept prototype</strong> for a Bhanzu Growth PM case study, not an official Bhanzu product. The booking, teacher, and times are
          sample data. No messages, bookings, or calls are made, and analytics stay in this browser.
        </div>
      </div>

      <main className="main">
        {linkNotice && screen === 'home' && (
          <div className="link-notice" role="status">
            <span>{linkNotice}</span>
            <button type="button" className="btn-link" onClick={() => setLinkNotice(null)}>
              Dismiss
            </button>
          </div>
        )}
        {screen === 'home' && (
          <Home
            booking={booking}
            now={now}
            completed={completed}
            inProgress={inProgress}
            onStartMission={() => go('age')}
            onResumeMission={resumeMission}
            onOpenPrep={() => go('prep')}
            onOpenJoin={() => go('join')}
            onReschedule={() => go('reschedule')}
          />
        )}
        {screen === 'age' && <AgeSelect selected={band} onPick={startMission} onBack={() => setScreen('home')} />}
        {screen === 'mission' && band && (
          <Mission
            key={runKey}
            band={band}
            childName={booking.childFirstName}
            initial={resumeState}
            onProgress={saveProgress}
            onDone={finishMission}
            onExit={() => setScreen('home')}
          />
        )}
        {screen === 'complete' && band && lastResults && (
          <Complete
            band={band}
            results={lastResults}
            booking={booking}
            onRetry={() => {
              track('mission_retried', { age_band: band, mode: 'same_level' });
              startMission(band);
            }}
            onOtherLevel={() => {
              track('mission_retried', { age_band: band, mode: 'other_level' });
              go('age');
            }}
            onParent={() => go('prep')}
            onHome={() => setScreen('home')}
          />
        )}
        {screen === 'prep' && (
          <Prep
            booking={booking}
            now={now}
            missionDone={!!completed}
            onBack={() => setScreen('home')}
            onJoin={() => go('join')}
            onMission={() => go('age')}
          />
        )}
        {screen === 'join' && (
          <Join booking={booking} now={now} checklist={checklist} onToggle={toggleCheck} onBack={() => setScreen('home')} onReschedule={() => go('reschedule')} />
        )}
        {screen === 'reschedule' && <Reschedule booking={booking} now={now} onConfirm={reschedule} onBack={() => setScreen('home')} />}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          {confirmReset ? (
            <div className="reset-confirm" role="group" aria-label="Confirm reset">
              <span>Clear progress, sample booking changes, and the event log?</span>
              <button type="button" className="btn danger small-btn" onClick={resetAll}>
                Yes, reset
              </button>
              <button type="button" className="btn ghost small-btn" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" className="btn-link" onClick={() => setConfirmReset(true)}>
              Reset prototype
            </button>
          )}
          <div className="gap-tester" role="group" aria-label="Try a different sample booking gap">
            <span className="muted small">Sample booking, days until demo:</span>
            {[0, 1, 3, 5, 7].map((g) => (
              <button
                type="button"
                key={g}
                className={`gap-btn ${gapDays === g ? 'on' : ''}`}
                aria-pressed={gapDays === g}
                aria-label={g === 0 ? 'Same-day sample booking' : `Sample booking ${g} days ahead`}
                onClick={() => {
                  const params = new URLSearchParams({ gap: String(g), child: booking.childFirstName });
                  setBooking(sampleBooking(new Date(), params));
                  setLinkNotice(null);
                  setScreen('home');
                }}
              >
                {g === 0 ? 'Same day' : g}
              </button>
            ))}
          </div>
        </div>
      </footer>

      <EventLog open={logOpen} onClose={closeLog} />
    </div>
  );
}
