# Product Spec — Bhanzu Math Mission

**Status:** working prototype for the case study. Production integrations are proposed, not built.

## 1. Problem

About one in three booked demos is not attended, and about 45% of demos booked a week ahead. Between booking and class the family has no reason to re-engage, the child is usually not involved, and joining and scheduling friction appears only at the last minute.

## 2. Users

| User | Situation | Needs |
|---|---|---|
| **Parent** (usually the mother) | Booked from an ad on her phone; busy evenings; wants her child to do well; wary of sales pressure | Remember the class; know what to expect; set the child up without stress; change the time easily |
| **Child, 6–14** | Often didn't choose the class; "more maths" can feel like a chore | A reason to be curious; a small win; no sense of being tested |
| **Demo teacher** (secondary) | Meets the child cold | A quick sense of the child's level and something to open with |
| **Academic Counsellor** (secondary) | Calls the parent after class | A specific, child-centred starting point |

## 3. Goals and non-goals

**Goals:** increase demo attendance (primary); give families a reason to re-engage during the wait (24-hour activation); turn silent no-shows into reschedules; carry engagement into the demo and counsellor call.

**Non-goals:** assessing or placing the child; replacing the reminder sequence; collecting more personal data than the booking holds; selling during the wait; building a full practice product.

## 4. Requirements

### Functional

| ID | Requirement | Prototype |
|---|---|---|
| F1 | Home shows child first name, demo date, time **with time zone**, length, teacher, status, live countdown | Built |
| F2 | Countdown handles upcoming, soon (≤30 min), live and past; past state offers a new time | Built |
| F3 | Child onboarding explains the mission (5 puzzles, hints, badge) before choosing | Built |
| F4 | Age bands 6–8, 9–11, 12–14; five puzzles each, easiest first, ending with a mental-math trick | Built |
| F5 | Multiple-choice and typed answers; typed input validated (empty, non-numeric, too long) | Built |
| F6 | Feedback: correct → ✓, praise, explanation; first miss → ✗, hint, retry; second miss → answer and explanation | Built |
| F7 | Progress bar and per-puzzle dots update after each resolved puzzle | Built |
| F8 | **Progress survives refresh or leaving**; home offers *Continue mission (n of 5 done)* and *Start over* | Built |
| F9 | Completion: badge, 1–3 stars (never 0), per-puzzle summary, play again, other level, class time | Built |
| F10 | Parent note: skills that needed help, framed for teacher and counsellor; states that nothing is sent | Built (not shared) |
| F11 | Prep page: what to expect before/during/after, tips, FAQ, next steps | Built |
| F12 | Join page: steps, join button (explains it opens 15 min before), readiness checklist, Google Calendar link, copy details, .ics where downloads are allowed | Built (simulated class link) |
| F13 | Reschedule: soonest slots first, 2-hour notice, current slot excluded, choice required, Rescheduled status; original booking time kept for analysis | Built (simulated slots) |
| F14 | Unreadable link data shows a notice and a working sample booking | Built |
| F15 | Reset clears all prototype state | Built |
| F16 | Persistent disclosure that data and integrations are simulated | Built |
| F17 | Event log showing every tracked event with pseudonymous IDs | Built (reviewer tool) |
| F18 | Production: tokenized link per booking, no login, booking from API | Proposed |
| F19 | Production: summary in teacher dashboard and CRM | Proposed |
| F20 | Production: reschedule writes to scheduling and sends a new confirmation | Proposed |

### Non-functional

- Low-end phones: one static file, about 206 KB uncompressed (65 KB gzip), no login, no install.
- Text ≥16 px; token colour pairs meet WCAG AA 4.5:1 in light and dark themes (checked by `tests/contrast_check.py`).
- Keyboard: native controls; focus moves to each new screen's heading; Escape closes the event log; visible focus outlines.
- Screen readers: feedback in a live region; progress bar exposes its value; ✓/✗ states also announced in text.
- Works if browser storage is blocked (state lasts for the visit).
- No fake scarcity or pressure; the only countdown is the real class time.

## 5. User flows

```
Confirmation message ─▶ Home
                        ├─▶ Start Math Mission ─▶ How it works + pick age band ─▶ 5 puzzles ─▶ Complete
                        │                                                    │            ├─▶ Play again / other level
                        │                                                    │            └─▶ Get ready for class
                        │                                       leave/refresh └─▶ Home: Continue mission
                        ├─▶ Get ready for class ─▶ How to join
                        ├─▶ How to join ─▶ checklist / calendar / Can't make it? ─▶ Change time
                        └─▶ Change time ─▶ pick slot ─▶ confirm ─▶ Home (Rescheduled)
```

## 6. Acceptance criteria (each covered by `tests/e2e_journey.py` unless marked)

- Home shows date, time with a zone label, and a ticking countdown for a valid booking.
- A wrong first answer shows a hint, marks the option ✗, and does not advance progress.
- A second wrong answer shows the answer and lets the child continue.
- Empty or non-numeric typed answers show an inline error and use no attempt.
- After two answered puzzles, a refresh shows *Continue mission (2 of 5 done)*, which returns to puzzle 3.
- Completion shows the band's badge and stars consistent with the results.
- *Confirm new time* without a choice shows "Choose a time first."; with a choice, home shows Rescheduled, and this persists after refresh.
- A link with an unreadable `demo` value shows a notice and a working sample booking.
- Event log contains the journey events with `booking_id` and `experiment_arm`, and never the child's name.
- Escape closes the event log.
- No horizontal scroll at 390 px (phone) or 768 px (tablet).
- Colour pairs pass 4.5:1 in both themes (`tests/contrast_check.py`).

## 7. Edge cases

| Case | Behaviour |
|---|---|
| Demo time passed | "This class time has passed"; status "Time passed"; primary action "Pick a new time" |
| Class live | "The class is happening now"; join button reads "Join class now" |
| Same-day booking late at night | Sample demo 3 hours ahead (production uses the real slot) |
| Unreadable link data | Notice + sample booking |
| Storage blocked | Works; state lasts for the visit |
| Corrupted saved progress | Discarded (validated before resuming) |
| Downloads blocked (embedded viewers) | .ics hidden; Google Calendar and copy remain |
| Copy blocked | Message asks the parent to select the text, which is shown |
| No open slots | Message explains; production offers a callback |
| Name with symbols | Only the first name's letters kept |

## 8. Privacy

See `docs/ANALYTICS_PLAN.md` §6. In short: first name for display only, age band instead of age, pseudonymous booking ID in analytics, per-question child telemetry is prototype-only pending legal review, no compliance claimed.
