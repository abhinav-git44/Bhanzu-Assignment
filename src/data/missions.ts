import type { AgeBand, Question } from '../lib/mission';

export interface MissionBand {
  band: AgeBand;
  label: string;
  grades: string;
  badge: string;
  blurb: string;
  questions: Question[];
}

// Five puzzles per band, easiest first. Each band ends on a mental-math
// "trick" so the child arrives at the demo having already tasted the
// speed-math style the class teaches.
export const MISSIONS: MissionBand[] = [
  {
    band: '6-8',
    label: 'Ages 6–8',
    grades: 'Class 1–3',
    badge: 'Number Explorer',
    blurb: 'Counting, patterns and a first speed trick',
    questions: [
      {
        id: 'e1',
        prompt: 'Riya has 3 mangoes. Her grandma gives her 4 more. How many mangoes does Riya have now?',
        visual: '🥭🥭🥭 + 🥭🥭🥭🥭',
        kind: 'choice',
        options: ['6', '7', '8'],
        answer: '7',
        hint: 'Count the first group, then keep counting the second group.',
        explain: '3 and 4 more makes 7. Counting on from 3: 4, 5, 6, 7.',
        skill: 'Addition',
      },
      {
        id: 'e2',
        prompt: 'What number comes next? 2, 4, 6, 8, …',
        kind: 'choice',
        options: ['9', '10', '12'],
        answer: '10',
        hint: 'How much bigger is each number than the one before?',
        explain: 'Each number is 2 more than the last, so 8 + 2 = 10.',
        skill: 'Patterns',
      },
      {
        id: 'e3',
        prompt: 'Which number is bigger?',
        kind: 'choice',
        options: ['47', '74'],
        answer: '74',
        hint: 'Look at the tens digit first.',
        explain: '74 has 7 tens and 47 has only 4 tens, so 74 is bigger.',
        skill: 'Place value',
      },
      {
        id: 'e4',
        prompt: 'A triangle has how many corners?',
        visual: '🔺',
        kind: 'choice',
        options: ['3', '4', '5'],
        answer: '3',
        hint: '"Tri" means three.',
        explain: 'A triangle has 3 sides and 3 corners.',
        skill: 'Shapes',
      },
      {
        id: 'e5',
        prompt: 'Speed trick: to add 9, add 10 and take away 1. What is 23 + 9?',
        kind: 'number',
        answer: '32',
        hint: '23 + 10 = 33. Now take away 1.',
        explain: '23 + 10 = 33, and 33 − 1 = 32. Your teacher has more tricks like this.',
        skill: 'Mental math',
      },
    ],
  },
  {
    band: '9-11',
    label: 'Ages 9–11',
    grades: 'Class 4–6',
    badge: 'Pattern Navigator',
    blurb: 'Multiplication, fractions and a speed trick',
    questions: [
      {
        id: 'n1',
        prompt: 'What is 25 × 4?',
        kind: 'choice',
        options: ['90', '100', '125'],
        answer: '100',
        hint: 'Four quarters make a whole. Four 25-paise coins make…?',
        explain: '25 × 4 = 100, just like four 25-paise coins make one rupee.',
        skill: 'Multiplication',
      },
      {
        id: 'n2',
        prompt: 'What number comes next? 3, 6, 12, 24, …',
        kind: 'choice',
        options: ['36', '48', '30'],
        answer: '48',
        hint: 'This pattern multiplies instead of adding.',
        explain: 'Each number doubles: 24 × 2 = 48.',
        skill: 'Patterns',
      },
      {
        id: 'n3',
        prompt: 'A pizza is cut into 8 equal slices. You eat 3. What fraction of the pizza is left?',
        visual: '🍕',
        kind: 'choice',
        options: ['3/8', '5/8', '1/2'],
        answer: '5/8',
        hint: 'How many slices are still on the plate?',
        explain: '8 − 3 = 5 slices are left, so 5/8 of the pizza.',
        skill: 'Fractions',
      },
      {
        id: 'n4',
        prompt: 'Which is bigger: 1/2 or 3/8?',
        kind: 'choice',
        options: ['1/2', '3/8', 'They are equal'],
        answer: '1/2',
        hint: 'Write 1/2 with 8 as the bottom number.',
        explain: '1/2 = 4/8, and 4/8 is more than 3/8.',
        skill: 'Comparing fractions',
      },
      {
        id: 'n5',
        prompt: 'Speed trick: add 99 by adding 100 and taking away 1. What is 47 + 99?',
        kind: 'number',
        answer: '146',
        hint: '47 + 100 = 147. Now take away 1.',
        explain: '47 + 100 = 147, and 147 − 1 = 146. That is faster than column addition.',
        skill: 'Mental math',
      },
    ],
  },
  {
    band: '12-14',
    label: 'Ages 12–14',
    grades: 'Class 7–9',
    badge: 'Logic Challenger',
    blurb: 'Percentages, algebra and a squaring shortcut',
    questions: [
      {
        id: 'c1',
        prompt: 'What is 15% of 80?',
        kind: 'choice',
        options: ['8', '12', '15'],
        answer: '12',
        hint: '10% of 80 is 8. What is 5%?',
        explain: '10% is 8 and 5% is 4, so 15% is 12.',
        skill: 'Percentages',
      },
      {
        id: 'c2',
        prompt: 'Solve for x: 3x + 5 = 20',
        kind: 'choice',
        options: ['x = 4', 'x = 5', 'x = 6'],
        answer: 'x = 5',
        hint: 'Take 5 from both sides first.',
        explain: '3x = 15, so x = 5.',
        skill: 'Linear equations',
      },
      {
        id: 'c3',
        prompt: 'What comes next? 1, 4, 9, 16, …',
        kind: 'choice',
        options: ['20', '25', '32'],
        answer: '25',
        hint: '1×1, 2×2, 3×3…',
        explain: 'These are square numbers. 5 × 5 = 25.',
        skill: 'Number patterns',
      },
      {
        id: 'c4',
        prompt: 'A class has boys and girls in the ratio 2 : 3. There are 25 students. How many are girls?',
        kind: 'choice',
        options: ['10', '15', '12'],
        answer: '15',
        hint: '2 + 3 = 5 parts. How many students in each part?',
        explain: '25 ÷ 5 = 5 per part, and girls are 3 parts: 3 × 5 = 15.',
        skill: 'Ratios',
      },
      {
        id: 'c5',
        prompt: 'Squaring trick for numbers ending in 5: for 35², do 3 × 4 = 12, then write 25 after it. What is 35²?',
        kind: 'number',
        answer: '1225',
        hint: 'Write 12, then 25 right after it.',
        explain: '3 × 4 = 12, then add 25 at the end: 1225. Try 65² the same way: 6 × 7 = 42, so 4225.',
        skill: 'Mental math',
      },
    ],
  },
];

export function getMission(band: AgeBand): MissionBand {
  return MISSIONS.find((m) => m.band === band) ?? MISSIONS[0];
}
