# Experiment Plan — Math Mission

Status: **proposed**. Values marked *proposed* must be agreed with Bhanzu before launch. Nothing here has been run.

## 1. Objective and hypothesis

**Objective:** test whether the Math Mission increases the proportion of eligible booked demos that are attended.

**Hypothesis (H1):** adding the Math Mission and parent hub to the improved baseline messaging increases demo attendance compared with the baseline alone. Expected to be larger for gaps of 3+ days.

**Null (H0):** attendance is the same in both arms.

## 2. Arms

Both arms receive the **baseline**, shipped to all bookings before the test starts: Messages 1, 3, 4, T+5 rescue, 5; one-tap rescheduling; calendar and joining help (copy in the case study §3.4). The baseline is held constant, so the test measures only the mission's increment.

| Element | Control | Treatment |
|---|---|---|
| Message 1 | Baseline confirmation; link opens a plain details page (date, time, join steps, reschedule) | Same, plus the Math Mission paragraph and *Start Math Mission* button; link opens the Math Mission hub |
| Message 2 (T+24h) | Not sent | Sent to non-starters with demo ≥24h away; completed variant otherwise |
| Messages 3, 4, T+5, 5 | Identical | Identical |
| Teacher / counsellor | Standard notes | Also see the mission summary, if one exists |

Treatment differs in two ways (the mission itself and one extra message). If we later need to separate "an extra touchpoint" from "the mission", a follow-up test can add an arm with a plain Message 2.

## 3. Eligibility and exclusions

Determined **at booking, before randomization**, using only pre-treatment information:

- First booking for this household in the last 30 days
- Child aged 6–14 (as entered at booking)
- Phone number in a valid format with WhatsApp messaging opt-in
- Demo scheduled at least 2 hours after booking
- Not internal, test, partner/B2B, or flagged spam

Message delivery is **not** an eligibility condition for the primary metric. Delivery happens after randomization; conditioning on it could bias the comparison if delivery differs by arm. Delivery rates are monitored per arm instead (they should match).

## 4. Randomization and assignment

| Item | Rule |
|---|---|
| Unit | Household: SHA-256 hash of the normalized parent phone number with a test-specific salt |
| Method | Deterministic: `hash(salt + phone) mod 100 < 50` → treatment |
| Timing | At booking creation, before Message 1 is sent |
| Split | 50 / 50 |
| Stratification | Gap bucket (0–1, 2–3, 4–7, 8+ days) and market (India / international), checked for balance daily |
| Persistence | Sticky for the life of the test: siblings, repeat and rescheduled bookings keep the household's arm |
| Sample ratio check | Daily chi-square on arm counts; p < 0.001 pauses the test |

## 5. Metrics

### 5.1 Primary: demo attendance rate (intent-to-treat)

```
attendance rate = eligible bookings attended / eligible bookings assigned to the arm
```

- **"Attended"** uses Bhanzu's existing definition (the one behind the 65% benchmark), confirmed in week 0, so control results are comparable to the historical figure.
- **Denominator:** every eligible, randomized booking, whether or not the family opened anything.
- **Cancellations:** count as not attended (the demo was still lost). Also reported separately.
- **Reschedules:** the booking keeps its arm. Attendance at the **final** scheduled demo counts if that demo falls within **14 days of the original scheduled time**. A booking with no attended demo in that window is not attended.
- **Duplicates:** the same household and child booking again within 7 days is one booking (the first assignment, the latest scheduled time).
- **Measurement window:** a booking is analysed once its 14-day window has closed.

### 5.2 Leading indicator: 24-hour activation rate (treatment only)

```
activation = treatment bookings with mission_started ≤ 24h after Message 1 delivery
             / treatment bookings with Message 1 delivered and demo ≥ 24h after delivery
```

- **Exposure** = `message_delivered` for Message 1 (provider webhook).
- **Activation** = first `mission_started` for the booking (later starts don't count again).
- **Fixed window** so every booking in the denominator has the same 24 hours, regardless of gap. Bookings with less than 24 hours to the demo are excluded and reported as *pre-demo activation* (started before the demo).
- First read on day 3. Decision rules in the case study §4.3.
- Activation is a diagnostic, not a success criterion.

### 5.3 Secondary

| Metric | Definition |
|---|---|
| Completion rate | `mission_completed` ÷ bookings with `mission_started` (treatment) |
| Hub/details open rate | Bookings with `experience_viewed` ÷ eligible bookings, **both arms** (control opens the details page) |
| Meaningful attendance | Joined and stayed ≥10 minutes ÷ eligible bookings |
| Reschedule rate, and attendance among reschedules | `reschedule_completed` bookings ÷ eligible; attended ÷ rescheduled |
| Attendance by gap bucket, age band, market | Pre-specified subgroups |
| Counsellor call connect rate | Connected calls ÷ attended demos |
| Enrollment within 14 days of the demo | Directional; likely underpowered |

### 5.4 Guardrails

| Guardrail | Why | Pause threshold (*proposed*) |
|---|---|---|
| Cancellation rate | The hub's *Change time* could become an exit | Treatment significantly above control with no attendance gain |
| Reschedules that never attend | Rescheduling may become deferral | Share of reschedules attending falls well below control's |
| Booking-to-demo flow health | Booking page is unchanged, so arm counts and gap mix must match | Any sample ratio mismatch or gap-mix imbalance |
| Enrollment | Attendance gains must not come with worse downstream conversion | Enrollment per eligible booking lower in treatment |
| WhatsApp opt-outs and blocks | One extra message | Treatment > control by more than 1 percentage point |
| Complaints (support, reviews, social) | Brand risk with parents | Any cluster about the mission or messages |
| Technical failures | A broken link wastes the touchpoint | Page load or script errors above 2% of views |
| Added friction before the demo | The hub must not delay joining | Median join time after start later in treatment |
| Counsellor workload | More attendees, more calls | Calls per enrollment up more than 15% |
| Segment harm | Benefit in one segment may hide harm in another | Attendance lower in treatment for any pre-specified subgroup with a clear interval |

## 6. Sample size

The test is **not powered until these inputs are agreed and the calculation is re-run with them:**

| Input | Source |
|---|---|
| Baseline rate p₀ | Control-equivalent attendance under the new baseline (first 1–2 weeks after it ships). 65% is a planning placeholder |
| Minimum detectable effect | The smallest lift worth the build and running cost, agreed with the business (*proposed*: 3 points) |
| α | 0.05, two-sided (*proposed*) |
| Power | 0.80 (*proposed*) |
| Weekly eligible bookings | Bhanzu booking data |

Formula (two proportions, equal arms):

```
n per arm = [ z(1−α/2)·√(2·p̄(1−p̄)) + z(1−β)·√(p₀(1−p₀) + p₁(1−p₁)) ]² / (p₁ − p₀)²,  p̄ = (p₀ + p₁)/2
```

Illustration with placeholder inputs (computed, not predicted):

| Lift | p₁ | Per arm | Total |
|---|---|---:|---:|
| +2 pts | 67% | ~8,800 | ~17,600 |
| +3 pts | 68% | ~3,900 | ~7,800 |
| +5 pts | 70% | ~1,400 | ~2,800 |

**Duration** = total ÷ weekly eligible bookings, rounded up to whole weeks, minimum 2 weeks, plus 14 days for reschedules to resolve.

If volume is too low: accept a larger MDE, run longer, use pre-booking covariates (channel, gap, age band) for variance reduction, or restrict to 3+ day gaps and accept a narrower conclusion.

## 7. Analysis

- Intent-to-treat difference in attendance with a 95% confidence interval; logistic regression with strata as a robustness check.
- Pre-specified subgroups: gap bucket, age band, market. Others exploratory.
- An effect among families who actually opened the mission is exploratory only (opening is not random).
- **Statistical vs practical significance:** a result can be statistically clear but too small to justify the build and the extra message (below the agreed MDE), or practically promising but statistically unclear. Both cases are covered in §10.

## 8. Stopping rules

- Run in full weeks; do not stop early for success on the primary metric unless a sequential method (e.g. O'Brien–Fleming boundaries) was pre-registered.
- Stop at any time for a guardrail breach, sample ratio mismatch, or a technical failure affecting one arm.
- Copy or delivery changes after the day-3 read restart the cohort clock, so the treatment stays well defined.

## 9. Contamination and operational risks

| Risk | Mitigation |
|---|---|
| Shared phones or siblings across arms | Household randomization |
| Mission link forwarded to control families | Tokenized links tied to the booking; forwarded opens logged and excluded from activation |
| Teachers or counsellors behaving differently in treatment (they see a badge) | Accepted as part of the treatment; documented; teacher instructions identical otherwise |
| Baseline changes during the test | Freeze baseline copy and cadence for the test's duration |
| Slot supply changes mid-test | Monitor reschedule slot availability by arm |
| Marketing campaign shifts change the gap mix | Stratification; read effects within gap buckets |

## 10. Decision matrix

| # | Outcome | What it means | Action |
|---|---|---|---|
| 1 | **Attendance up (CI excludes 0, lift ≥ agreed MDE), activation healthy, guardrails clear** | The mission works and we can see why | **Roll out** to all bookings; keep a 5–10% holdout for 4 weeks to confirm the effect persists |
| 2 | **Activation up, attendance flat** | Families engage but it doesn't change attendance | **Iterate** on the bridge to the class (e.g. the teacher mentions the badge in the day-before message); keep the hub; retest once. If still flat, **stop** the mission |
| 3 | **Activation low, attendance flat** | The mission never reached families | **Investigate** delivery and copy first (this is not a test of the idea yet); fix and restart, or stop if two rounds fail |
| 4 | **Attendance up, a guardrail worse** (e.g. opt-outs, enrollment, cancellations) | Net effect is unclear | **Do not roll out.** Quantify the trade-off; redesign the part causing harm (e.g. drop Message 2 if opt-outs drive it); retest |
| 5 | **Inconclusive** (CI includes 0) or lift below the agreed MDE | Not enough evidence, or too small to matter | If the direction is positive and volume allows, **extend** to the pre-planned maximum duration; otherwise **stop** and record the bound on the effect |
| 6 | **Attendance up in one segment only** (e.g. 3+ day gaps) | The effect is targeted | **Roll out to that segment only**, confirmed by its holdout; treat other-segment results as exploratory |
