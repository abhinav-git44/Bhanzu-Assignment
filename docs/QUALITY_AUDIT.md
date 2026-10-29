# Quality Audit

Review of the first submitted version (v1), the corrections made in v2, requirements traceability against the brief, and a self-assessment. v1 is preserved unchanged outside this package (`archive/v1_submission/` and `archive/v1_submission.zip` in the working folder) so the two can be compared.

**Source material inspected:** the brief (`Bhanzu_Growth_PM_Case_Study.pdf`, 3 pages, rendered and read page by page), all v1 documents, the React/TypeScript source, tests, screenshots, and the build.

## 1. What was already strong (kept)

- Correct data, the day 3→4 step, the day-6 rebound, the 11-point spread, and the open acknowledgement that row counts are missing.
- Hypotheses covering forgetting, competing priorities, child motivation, uncertainty, joining friction, rescheduling and cohort selection.
- Disagreement with "a 5-day booker is no different", argued through selection.
- Baseline message, calendar and rescheduling improvements, with full message copy including a Hinglish variant.
- The Math Mission and parent hub as the micro-experience.
- A working, tested prototype with honest labelling of simulated features.

## 2. Weaknesses found in v1

| # | Area | Issue | Evidence | Why it matters |
|---|---|---|---|---|
| W1 | Prioritization | Scores ranked reminders 21, calendar 20 and the Mission 18, yet the Mission was chosen | v1 Solution §3.2 | An experienced interviewer would see a contradiction |
| W2 | Leading indicator | "Within 72 hours, or before the demo if sooner" gave longer-gap bookings more time to activate | v1 §4.3 | The metric would move with the gap mix, not the product |
| W3 | Eligibility | Primary-metric eligibility required Message 1 to be delivered, which happens after randomization | v1 Experiment plan §4 | Conditioning on a post-assignment event can bias the comparison |
| W4 | Primary metric | Defined "attended" as ≥10 minutes, which the brief never states | v1 Measurement framework | Results wouldn't be comparable to the 65% benchmark |
| W5 | Data | Claimed most bookings "must sit" in the day 0–1 rows | v1 §1.3 | True at face value, but rounding to whole percentages removes the bound; overstated |
| W6 | Data | Weighted vs unweighted average not explained; 65% not framed as provisional; cost of the gap not quantified | v1 §1 | Rigor and operational relevance |
| W7 | Privacy | Product spec said the design was "compliant with India's DPDP Act"; per-answer timing of children was logged | v1 PRODUCT_SPEC §10; `time_ms` in events | Unsupported legal claim; the Act prohibits behavioural monitoring of children |
| W8 | Analytics | No identifiers, deduplication, time-zone rules or source of truth; implemented vs proposed events not clearly split | v1 event table | Not operational for a real experiment |
| W9 | Experiment | Decision rules thin on guardrail trade-offs and segment results; no contamination section | v1 Experiment plan §9 | Ambiguous decisions after the test |
| W10 | Prototype | Refresh mid-mission lost progress | Code review | The brief and the product both depend on families returning |
| W11 | Prototype | Unreadable link data fell back silently | `sampleBooking` | Misleading behaviour when data is missing |
| W12 | Prototype | Times shown without a time zone | Home card | International families |
| W13 | Prototype | Correct/incorrect partly signalled by colour; no Escape or focus handling in the event log | UI review | Accessibility |
| W14 | Prototype | Success colour failed AA contrast (4.32:1) | New contrast check | Accessibility |
| W15 | Prototype | Copy promised "Your teacher will ask about it in class" | Home hero | Over-promise the prototype can't guarantee |
| W16 | Prototype | Rescheduling overwrote the original booking time | `App.tsx` | Would corrupt gap stratification in analytics |
| W17 | Technical | No linter; two hook-dependency problems hidden by comments; no analytics tests | Code review | Correctness and credibility |
| W18 | Technical | Dev toolchain had 7 audit advisories (2 critical) | `npm audit` | Hygiene |
| W19 | Packaging | Documents at the root with overlapping content (walkthrough vs Q&A); no analytics plan | v1 folder | Navigation for evaluators |
| W20 | Readiness | The hosted page is private; v1 summary didn't make clear no public URL was verified | v1 README | Honesty about deployment |

## 3. Corrections made

| # | Change | Files |
|---|---|---|
| W1 | Split prioritization into *readiness to ship* (decides the baseline) and *value of testing first* (decides the experiment), with criteria definitions, evidence per score, risks, dependencies and revisit conditions. Kept v1 judgements except: removed "time to learn" from the shipping lens (it belongs to testing) and **lowered** the Mission's confidence from 3 to 2, which ranks it lower on shipping, against the recommendation | Final §3.2; INTERVIEW_DEFENSE Q6 |
| W2 | Fixed 24-hour window from Message 1 delivery; denominator only bookings with ≥24h to the demo; short-notice bookings reported separately; first read on day 3 | Final §4.3; EXPERIMENT_PLAN §5.2; ANALYTICS_PLAN §4 |
| W3 | Eligibility now uses pre-randomization data only; delivery parity monitored by arm | EXPERIMENT_PLAN §3 |
| W4 | Primary metric uses Bhanzu's existing attendance definition; ≥10 min is secondary | Final; EXPERIMENT_PLAN §5.1 |
| W5–W6 | New section "What the data tells us — and what it does not"; facts / interpretations / hypotheses / unknowns separated; weighted vs unweighted explained with the rounding caveat; 65% treated as a planning baseline; cost per attended demo (1.2×) and empty seats per 1,000 bookings; table of breakdowns needed | Final §1.2–1.5 |
| W7 | Compliance claim removed; DPDP children's-data obligations described with a source; per-question telemetry marked prototype-only pending legal review; `time_ms` and `duration_sec` removed from events | ANALYTICS_PLAN §6; `Mission.tsx` |
| W8 | New analytics plan: identifiers, envelope, time rules, per-event trigger/properties/dedup/source of truth/metric use/privacy, status P/B/R, metric formulas, daily data-quality checks. Prototype events renamed to match (`mission_answer_submitted`, `calendar_add_clicked`, new `mission_viewed`, `mission_resumed`) and given `event_id`, UTC `ts`, `tz`, `schema_version`, `booking_id`, `experiment_arm` | `docs/ANALYTICS_PLAN.md`; `lib/analytics.ts` |
| W9 | Experiment plan rewritten: assignment method, persistence, reschedule/duplicate/repeat handling, guardrails with thresholds, contamination table, statistical vs practical significance, six-outcome decision matrix | `docs/EXPERIMENT_PLAN.md` |
| W10 | Mission progress saved and validated; *Continue mission (n of 5 done)* / *Start over* | `App.tsx`, `Home.tsx`, `Mission.tsx`, `lib/mission.ts` |
| W11 | Unreadable link data shows a notice and a working sample booking | `data/booking.ts`, `App.tsx` |
| W12 | Times show a zone label (e.g. "5:30 pm IST") everywhere a class time appears | `lib/time.ts`, screens |
| W13 | ✓/✗ icons plus screen-reader text on answers; Escape closes the event log; focus moves in and returns | `Mission.tsx`, `components/ui.tsx` |
| W14 | Success colour darkened; `tests/contrast_check.py` checks 15 pairs in both themes | `styles.css`, `tests/` |
| W15 | Copy changed to "Show it to your teacher when class starts" | `Home.tsx` |
| W16 | Original booking time kept on reschedule | `App.tsx` |
| W17 | ESLint added (zero warnings enforced); hook issues fixed properly; 12 new unit tests (37 total); 15 new browser checks (49 total) | `eslint.config.js`, tests |
| W18 | Toolchain upgraded; 0 advisories; all checks re-run | `package.json`, lockfile |
| W19 | One principal document plus focused docs in `docs/`; walkthrough merged into INTERVIEW_DEFENSE; superseded root files removed | package layout |
| W20 | README and report state the page is private and no public URL was verified | README; VERIFICATION_REPORT §5 |

Also added: child onboarding on the age screen; "What to expect" (before/during/after) for parents; calendar link wording that makes clear nothing is saved automatically; tablet-width checks.

## 4. Requirements traceability (brief → submission)

| Brief requirement | Where | Evidence | Status | Action taken |
|---|---|---|---|---|
| P1: What you see in the data | Final §1.1–1.2 | Verified table, chart, facts list | Met | Facts/interpretation split (W5–6) |
| P1: What pattern stands out | Final §1.2 | Step at day 4, day-6 rebound, 34% floor | Met | — |
| P1: What questions it raises | Final §1.2, §1.5 | Unknowns list; breakdown table | Met | Breakdown table added |
| P1: What you'd want to know before concluding | Final §1.2–1.5 | Counts, definitions, weighting, cross-tabs | Met | — |
| P2: Do you agree (attendance falls with gap) | Final §2.1 | Partly; non-monotonic, proxy | Met | — |
| P2: Do you agree (5-day = same-day booker) | Final §2.1 | Disagree; selection argument | Met | — |
| P2: What happens between booking and session | Final §2.2 | Warm vs cold moment | Met | — |
| P2: Forces against attendance over time | Final §2.2–2.4 | 8 forces; hypothesis tree and test table | Met | — |
| P3: Ideas that could improve attendance | Final §3.1 | 8 ideas | Met | — |
| P3: For each, what and why | Final §3.1–3.2 | Table + evidence column | Met | — |
| P3: Behavioural lever | Final §3.1, §3.4 | Lever column; per-message mechanism | Met | — |
| P3: What to prioritise first and why | Final §3.2–3.3 | Two-lens prioritization; sequence | Met | Fixed contradiction (W1) |
| P3: Actual message copy | Final §3.4 | 5 messages + variants, Hinglish | Met | Arm assignment and control version added |
| P4: Pick the idea with most lift that carries into later stages | Final §3.2, §4.1 | Mission; teacher/counsellor carry-over | Met | — |
| P4: Something a parent or child interacts with between booking and demo | Prototype | 49 browser checks | Met | Resume, onboarding, notices added |
| P4: Real enough to try (working page) | `dist/index.html`; README | Opens via file://, dev server, private hosted page | Met | Public URL not verified (owner must share) |
| P4: Why this idea over others | Final §3.2, §4.1 | Lens B | Met | — |
| P4: What parent and child see and do, step by step | Final §4.2; README | 10 steps | Met | — |
| P4: One early signal in first 3 days | Final §4.3 | 24-hour activation, read on day 3 | Met | Window made unambiguous (W2) |
| Look-for: diagnosis before prescription | Final Parts 1–2 precede 3 | — | Met | — |
| Look-for: empathy for the parent | Copy principles; FAQ; no-pressure framing | — | Met | — |
| Look-for: real build | Prototype + tests | — | Met | — |
| Look-for: early signal, not just "watch attendance" | Final §4.3 | — | Met | — |
| Look-for: acknowledge uncertainty | Final §1.2, "Assumptions most likely to be wrong" | — | Met | — |
| Optional (from master prompt, not the brief): slide deck | — | — | Not done | Not required by the brief |

## 5. Self-assessment (internal rubric, not Bhanzu's)

Scores are based only on evidence in the files and the verified results in `VERIFICATION_REPORT.md`. The v1 column applies the same rubric retrospectively.

| Dimension | Weight | v1 | v2 | Remaining deduction (v2) |
|---|---:|---:|---:|---|
| Completeness and traceability | 10 | 9 | 10 | — |
| Data accuracy and rigor | 15 | 12 | 14 | No booking counts exist, so no interval or significance claims are possible; the strongest analytical claims remain hypotheses |
| Diagnosis and insight | 10 | 9 | 9 | Hypotheses are well-structured but untested by any parent conversations or Bhanzu data |
| Prioritization and strategy | 10 | 6 | 9 | Scores are judgement, not evidence; transparent but not validated |
| Experiment design and measurement | 15 | 11 | 14 | Not powered (inputs unknown); thresholds are proposals |
| Product UX and prototype | 15 | 11 | 13 | Not tested with parents or children; puzzles not teacher-reviewed; no physical-device or Safari testing |
| Technical correctness and testing | 10 | 7 | 9 | Headless Chromium only; logic is unit-tested but React components are covered by browser tests, not component tests |
| Documentation and consistency | 5 | 4 | 5 | — |
| Accessibility, privacy, trust | 5 | 3 | 4 | No screen-reader test; legal position on child telemetry not reviewed |
| Submission readiness | 5 | 4 | 4 | Hosted page is private until shared; no verified public URL |
| **Total** | **100** | **76** | **91** | |

**v2: 91/100 ≈ 9.1/10.** The remaining deductions are mostly things a take-home cannot supply (Bhanzu's booking counts, user research, legal review, real devices), and I've chosen not to score past the evidence.
