// Pure mission logic: answer checking, attempt handling, scoring.
// No React here, so it is unit-tested directly.

export type AgeBand = '6-8' | '9-11' | '12-14';

export interface Question {
  id: string;
  prompt: string;
  visual?: string; // short visual cue, e.g. "🍎🍎🍎 + 🍎🍎🍎🍎"
  kind: 'choice' | 'number';
  options?: string[];
  answer: string;
  hint: string;
  explain: string;
  skill: string; // what the question exercises; shown to parents and the teacher
}

export type QuestionResult = 'first' | 'second' | 'missed';
export type MissionStatus = 'answering' | 'retry' | 'correct' | 'revealed' | 'done';

export interface MissionState {
  index: number;
  attempts: number; // wrong attempts on the current question
  results: QuestionResult[];
  status: MissionStatus;
  lastInput: string | null;
}

export const MAX_ATTEMPTS = 2;

export function initialMission(): MissionState {
  return { index: 0, attempts: 0, results: [], status: 'answering', lastInput: null };
}

export interface InputCheck {
  ok: boolean;
  error?: string;
}

/** Validation for typed answers. Friendly, specific messages for children. */
export function validateNumberInput(raw: string): InputCheck {
  const v = raw.trim();
  if (v === '') return { ok: false, error: 'Type your answer in the box first.' };
  if (!/^-?\d+(\.\d+)?$/.test(v)) return { ok: false, error: 'Use digits only, like 42.' };
  if (v.replace('-', '').replace('.', '').length > 6) return { ok: false, error: 'That number is too long. Check it and try again.' };
  return { ok: true };
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

export function isCorrect(q: Question, input: string): boolean {
  if (q.kind === 'number') {
    const n = Number(input.trim());
    return Number.isFinite(n) && n === Number(q.answer);
  }
  return normalize(input) === normalize(q.answer);
}

/** Apply an answer. First miss → retry with a hint; second miss → reveal and explain. */
export function submitAnswer(state: MissionState, q: Question, input: string): MissionState {
  if (state.status !== 'answering' && state.status !== 'retry') return state;
  if (isCorrect(q, input)) {
    const result: QuestionResult = state.attempts === 0 ? 'first' : 'second';
    return { ...state, results: [...state.results, result], status: 'correct', lastInput: input };
  }
  if (state.attempts + 1 < MAX_ATTEMPTS) {
    return { ...state, attempts: state.attempts + 1, status: 'retry', lastInput: input };
  }
  return { ...state, attempts: state.attempts + 1, results: [...state.results, 'missed'], status: 'revealed', lastInput: input };
}

export function nextQuestion(state: MissionState, total: number): MissionState {
  if (state.status !== 'correct' && state.status !== 'revealed') return state;
  const index = state.index + 1;
  if (index >= total) return { ...state, status: 'done', lastInput: null };
  return { index, attempts: 0, results: state.results, status: 'answering', lastInput: null };
}

/** Share of the mission finished, counting answered questions only. */
export function progress(state: MissionState, total: number): number {
  return total === 0 ? 0 : Math.min(1, state.results.length / total);
}

export interface MissionSummary {
  total: number;
  firstTry: number;
  solved: number;
  stars: 1 | 2 | 3;
  tricky: number[]; // indexes of questions that needed help
}

/** Stars never drop below 1: finishing is the achievement we reward. */
export function summarize(results: QuestionResult[]): MissionSummary {
  const total = results.length;
  const firstTry = results.filter((r) => r === 'first').length;
  const solved = results.filter((r) => r !== 'missed').length;
  let stars: 1 | 2 | 3 = 1;
  if (total > 0 && firstTry === total) stars = 3;
  else if (total > 0 && solved / total >= 0.6) stars = 2;
  const tricky = results.flatMap((r, i) => (r === 'first' ? [] : [i]));
  return { total, firstTry, solved, stars, tricky };
}

/** Saved mid-mission progress, so a refresh or a "Leave mission" does not lose answers. */
export interface SavedMission {
  band: AgeBand;
  state: MissionState;
  startedAt: string;
}

const RESULTS = new Set<QuestionResult>(['first', 'second', 'missed']);
const STATUSES = new Set<MissionStatus>(['answering', 'retry', 'correct', 'revealed']);

/** Accepts only well-formed, unfinished progress for a known band. Anything else is discarded. */
export function isResumable(saved: unknown, totalForBand: (b: AgeBand) => number): saved is SavedMission {
  if (!saved || typeof saved !== 'object') return false;
  const s = saved as Partial<SavedMission>;
  if (s.band !== '6-8' && s.band !== '9-11' && s.band !== '12-14') return false;
  const st = s.state;
  if (!st || typeof st !== 'object') return false;
  const total = totalForBand(s.band);
  if (!Array.isArray(st.results) || !st.results.every((r) => RESULTS.has(r))) return false;
  if (!STATUSES.has(st.status as MissionStatus)) return false;
  if (!Number.isInteger(st.index) || st.index < 0 || st.index >= total) return false;
  if (!Number.isInteger(st.attempts) || st.attempts < 0 || st.attempts >= MAX_ATTEMPTS + 1) return false;
  // Answered questions must line up with the current position.
  const resolved = st.status === 'correct' || st.status === 'revealed';
  if (st.results.length !== st.index + (resolved ? 1 : 0)) return false;
  // Nothing answered yet is not worth resuming.
  return st.results.length > 0 || st.status === 'retry';
}
