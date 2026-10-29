import { describe, expect, it } from 'vitest';
import { initialMission, isCorrect, isResumable, nextQuestion, progress, submitAnswer, summarize, validateNumberInput, type Question } from './mission';
import { MISSIONS } from '../data/missions';

const choiceQ: Question = { id: 'q', prompt: '', kind: 'choice', options: ['6', '7'], answer: '7', hint: '', explain: '', skill: '' };
const numQ: Question = { id: 'n', prompt: '', kind: 'number', answer: '32', hint: '', explain: '', skill: '' };

describe('answer checking', () => {
  it('accepts the right choice and rejects others', () => {
    expect(isCorrect(choiceQ, '7')).toBe(true);
    expect(isCorrect(choiceQ, ' 7 ')).toBe(true);
    expect(isCorrect(choiceQ, '6')).toBe(false);
  });
  it('compares typed numbers numerically', () => {
    expect(isCorrect(numQ, '32')).toBe(true);
    expect(isCorrect(numQ, '032')).toBe(true);
    expect(isCorrect(numQ, '33')).toBe(false);
    expect(isCorrect(numQ, 'abc')).toBe(false);
  });
  it('validates typed input with friendly errors', () => {
    expect(validateNumberInput('').ok).toBe(false);
    expect(validateNumberInput('12a').ok).toBe(false);
    expect(validateNumberInput('1234567').ok).toBe(false);
    expect(validateNumberInput(' 146 ').ok).toBe(true);
  });
});

describe('attempt flow', () => {
  it('first-try correct is recorded as first', () => {
    const s = submitAnswer(initialMission(), choiceQ, '7');
    expect(s.status).toBe('correct');
    expect(s.results).toEqual(['first']);
  });
  it('one miss gives a retry, then correct counts as second', () => {
    let s = submitAnswer(initialMission(), choiceQ, '6');
    expect(s.status).toBe('retry');
    expect(s.results).toEqual([]);
    s = submitAnswer(s, choiceQ, '7');
    expect(s.status).toBe('correct');
    expect(s.results).toEqual(['second']);
  });
  it('two misses reveal the answer', () => {
    let s = submitAnswer(initialMission(), choiceQ, '6');
    s = submitAnswer(s, choiceQ, '6');
    expect(s.status).toBe('revealed');
    expect(s.results).toEqual(['missed']);
  });
  it('ignores answers after the question is resolved', () => {
    const s = submitAnswer(initialMission(), choiceQ, '7');
    expect(submitAnswer(s, choiceQ, '6')).toBe(s);
  });
  it('advances and finishes after the last question', () => {
    let s = submitAnswer(initialMission(), choiceQ, '7');
    s = nextQuestion(s, 2);
    expect(s.index).toBe(1);
    expect(s.status).toBe('answering');
    expect(progress(s, 2)).toBe(0.5);
    s = submitAnswer(s, choiceQ, '7');
    s = nextQuestion(s, 2);
    expect(s.status).toBe('done');
    expect(progress(s, 2)).toBe(1);
  });
  it('cannot skip an unanswered question', () => {
    const s = initialMission();
    expect(nextQuestion(s, 5)).toBe(s);
  });
});

describe('summary', () => {
  it('gives 3 stars only for all first-try answers', () => {
    expect(summarize(['first', 'first', 'first']).stars).toBe(3);
    expect(summarize(['first', 'second', 'first']).stars).toBe(2);
  });
  it('never gives fewer than 1 star', () => {
    expect(summarize(['missed', 'missed', 'missed']).stars).toBe(1);
  });
  it('lists questions that needed help', () => {
    expect(summarize(['first', 'second', 'missed']).tricky).toEqual([1, 2]);
  });
});

describe('mission content', () => {
  it('has 5 questions per band, each choice answer among its options', () => {
    for (const m of MISSIONS) {
      expect(m.questions).toHaveLength(5);
      for (const q of m.questions) {
        if (q.kind === 'choice') expect(q.options).toContain(q.answer);
        else expect(Number.isFinite(Number(q.answer))).toBe(true);
      }
    }
  });
  it('has unique question ids', () => {
    const ids = MISSIONS.flatMap((m) => m.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resuming a mission', () => {
  const total = () => 5;
  it('accepts unfinished, consistent progress', () => {
    let s = submitAnswer(initialMission(), choiceQ, '7');
    expect(isResumable({ band: '9-11', state: s, startedAt: 'x' }, total)).toBe(true);
    s = nextQuestion(s, 5);
    expect(isResumable({ band: '9-11', state: s, startedAt: 'x' }, total)).toBe(true);
  });
  it('accepts a child mid-retry on the first puzzle', () => {
    const s = submitAnswer(initialMission(), choiceQ, '6');
    expect(isResumable({ band: '6-8', state: s, startedAt: 'x' }, total)).toBe(true);
  });
  it('rejects empty, corrupted or finished progress', () => {
    expect(isResumable(null, total)).toBe(false);
    expect(isResumable({ band: '9-11', state: initialMission(), startedAt: 'x' }, total)).toBe(false);
    expect(isResumable({ band: 'adult', state: initialMission(), startedAt: 'x' }, total)).toBe(false);
    expect(isResumable({ band: '9-11', state: { index: 3, attempts: 0, results: ['first'], status: 'answering', lastInput: null }, startedAt: 'x' }, total)).toBe(false);
    expect(isResumable({ band: '9-11', state: { index: 9, attempts: 0, results: [], status: 'answering', lastInput: null }, startedAt: 'x' }, total)).toBe(false);
    expect(isResumable({ band: '9-11', state: { index: 4, attempts: 0, results: ['first','first','first','first','first'], status: 'done', lastInput: null }, startedAt: 'x' }, total)).toBe(false);
  });
});
