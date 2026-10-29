import { MISSIONS } from '../data/missions';
import type { AgeBand } from '../lib/mission';
import { BackButton, ScreenTitle } from '../components/ui';

interface Props {
  selected: AgeBand | null;
  onPick: (band: AgeBand) => void;
  onBack: () => void;
}

export function AgeSelect({ selected, onPick, onBack }: Props) {
  return (
    <div className="stack">
      <BackButton onClick={onBack} />
      <ScreenTitle eyebrow="Step 1 of 2">Pick your mission</ScreenTitle>
      <ul className="how-list" aria-label="How the mission works">
        <li>
          <strong>5 puzzles</strong>
          <span>They start easy and get a little harder.</span>
        </li>
        <li>
          <strong>Stuck? Get a hint</strong>
          <span>You get a second try, and we show the answer if it's still tricky.</span>
        </li>
        <li>
          <strong>Earn a badge</strong>
          <span>Show it to your teacher when class starts.</span>
        </li>
      </ul>
      <p className="lead">Choose by age. Parents, a quick tap is enough; we only use this to pick the puzzles and never ask for your child's exact age.</p>
      <div className="band-grid">
        {MISSIONS.map((m) => (
          <button
            type="button"
            key={m.band}
            className={`band-card ${selected === m.band ? 'selected' : ''}`}
            onClick={() => onPick(m.band)}
            aria-pressed={selected === m.band}
          >
            <span className="band-age">{m.label}</span>
            <span className="band-grade">{m.grades}</span>
            <span className="band-badge">{m.badge}</span>
            <span className="band-blurb">{m.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
