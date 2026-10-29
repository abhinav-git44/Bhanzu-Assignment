import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getMission } from '../data/missions';
import {
  initialMission,
  nextQuestion,
  progress,
  submitAnswer,
  validateNumberInput,
  type AgeBand,
  type MissionState,
  type QuestionResult,
} from '../lib/mission';
import { track } from '../lib/analytics';
import { BackButton, ProgressBar } from '../components/ui';

interface Props {
  band: AgeBand;
  childName: string;
  initial?: MissionState;
  onProgress: (state: MissionState) => void;
  onDone: (results: QuestionResult[]) => void;
  onExit: () => void;
}

const PRAISE = ['Brilliant!', 'Spot on!', 'You got it!', 'Super!', 'Sharp thinking!'];

export function Mission({ band, childName, initial, onProgress, onDone, onExit }: Props) {
  const mission = getMission(band);
  const total = mission.questions.length;
  const [state, setState] = useState<MissionState>(() => initial ?? initialMission());
  const [typed, setTyped] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLHeadingElement>(null);

  const q = mission.questions[Math.min(state.index, total - 1)];
  const answered = state.status === 'correct' || state.status === 'revealed';

  // Save progress after every change so a refresh or "Leave mission" keeps the child's answers.
  useEffect(() => {
    if (state.status !== 'done') onProgress(state);
  }, [state, onProgress]);

  useEffect(() => {
    setTyped('');
    setInputError(null);
    promptRef.current?.focus();
  }, [state.index]);

  useEffect(() => {
    if (answered) continueRef.current?.focus();
  }, [answered]);

  function advance() {
    const next = nextQuestion(state, total);
    if (next.status === 'done') {
      // Completion is handled here (not in an effect) so it fires exactly once per mission.
      track('mission_completed', {
        age_band: band,
        first_try: next.results.filter((r) => r === 'first').length,
        solved: next.results.filter((r) => r !== 'missed').length,
        total,
      });
      onDone(next.results);
    }
    setState(next);
  }

  function answer(input: string) {
    const next = submitAnswer(state, q, input);
    if (next === state) return;
    const resolved = next.status === 'correct' ? 'correct' : next.status === 'revealed' ? 'revealed' : 'retry';
    // Per-question detail is for content tuning only; see ANALYTICS_PLAN.md §6 on children's data.
    track('mission_answer_submitted', {
      age_band: band,
      question_id: q.id,
      question_index: state.index + 1,
      attempt: state.attempts + 1,
      outcome: resolved,
    });
    setState(next);
  }

  function submitTyped(e: FormEvent) {
    e.preventDefault();
    const check = validateNumberInput(typed);
    if (!check.ok) {
      setInputError(check.error ?? 'Check your answer.');
      return;
    }
    setInputError(null);
    answer(typed);
  }

  if (state.status === 'done') return null;

  const isLast = state.index === total - 1;
  const praise = PRAISE[state.index % PRAISE.length];

  return (
    <div className="stack mission">
      <div className="mission-top">
        <BackButton onClick={onExit} label="Leave mission" />
        <span className="mission-badge-name">{mission.badge} mission</span>
      </div>

      <div className="progress-wrap">
        <div className="progress-text">
          <span>
            Puzzle {state.index + 1} of {total}
          </span>
          <span className="dots" aria-hidden="true">
            {mission.questions.map((mq, i) => {
              const r = state.results[i];
              const cls = r === 'first' ? 'dot good' : r === 'second' ? 'dot ok' : r === 'missed' ? 'dot miss' : i === state.index ? 'dot now' : 'dot';
              return <span key={mq.id} className={cls} />;
            })}
          </span>
        </div>
        <ProgressBar value={progress(state, total)} label={`${state.results.length} of ${total} puzzles done`} />
      </div>

      <section className="card question-card" aria-labelledby="q-prompt">
        <p className="skill-tag">{q.skill}</p>
        <h1 id="q-prompt" ref={promptRef} tabIndex={-1} className="q-prompt">
          {q.prompt}
        </h1>
        {q.visual && (
          <p className="q-visual" aria-hidden="true">
            {q.visual}
          </p>
        )}

        {q.kind === 'choice' && q.options && (
          <div className="options" role="group" aria-label="Answer choices">
            {q.options.map((opt) => {
              const picked = state.lastInput === opt;
              const isAnswer = opt === q.answer;
              let cls = 'option';
              if (answered && isAnswer) cls += ' right';
              else if (picked && (state.status === 'retry' || state.status === 'revealed')) cls += ' wrong';
              return (
                <button
                  type="button"
                  key={opt}
                  className={cls}
                  disabled={answered || (state.status === 'retry' && picked)}
                  onClick={() => answer(opt)}
                >
                  {cls.includes('right') && (
                    <span className="opt-icon" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  {cls.includes('wrong') && (
                    <span className="opt-icon" aria-hidden="true">
                      ✗
                    </span>
                  )}
                  <span>{opt}</span>
                  {cls.includes('right') && <span className="sr-only"> (correct answer)</span>}
                  {cls.includes('wrong') && <span className="sr-only"> (not correct)</span>}
                </button>
              );
            })}
          </div>
        )}

        {q.kind === 'number' && (
          <form className="number-form" onSubmit={submitTyped} noValidate>
            <label htmlFor="answer-input" className="sr-only">
              Your answer
            </label>
            <input
              id="answer-input"
              inputMode="numeric"
              autoComplete="off"
              value={typed}
              disabled={answered}
              onChange={(e) => {
                setTyped(e.target.value);
                if (inputError) setInputError(null);
              }}
              aria-invalid={inputError ? true : undefined}
              aria-describedby={inputError ? 'answer-error' : undefined}
              placeholder="Your answer"
            />
            <button type="submit" className="btn primary" disabled={answered}>
              Check
            </button>
            {inputError && (
              <p id="answer-error" className="input-error">
                {inputError}
              </p>
            )}
          </form>
        )}

        <div className="feedback-slot" aria-live="polite">
          {state.status === 'retry' && (
            <div className="feedback hint">
              <strong>Not quite, and that's okay.</strong>
              <span>Hint: {q.hint}</span>
              <span className="small">Have another go.</span>
            </div>
          )}
          {state.status === 'correct' && (
            <div className="feedback good">
              <strong>
                {praise} {state.attempts > 0 ? 'You worked it out.' : ''}
              </strong>
              <span>{q.explain}</span>
            </div>
          )}
          {state.status === 'revealed' && (
            <div className="feedback reveal">
              <strong>The answer is {q.answer}.</strong>
              <span>{q.explain}</span>
              <span className="small">Tricky one, {childName}! Your teacher can show you more like this.</span>
            </div>
          )}
        </div>

        {answered && (
          <button type="button" ref={continueRef} className="btn primary big continue" onClick={advance}>
            {isLast ? 'Finish mission' : 'Next puzzle'}
          </button>
        )}
      </section>
    </div>
  );
}
