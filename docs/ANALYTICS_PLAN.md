# Analytics Plan

Covers the events, metric formulas, data quality checks and privacy rules for the Math Mission experiment. Each event is marked by where it lives today:

- **P — implemented in the prototype** (fires in the browser, visible in the Event log, never leaves the device)
- **B — needs a backend or external integration** (booking system, WhatsApp provider, class platform, CRM, payments)
- **R — required before a production experiment** (applies to every B event and to P events, which must move to a real pipeline)

## 1. Identifiers

| ID | What it is | Used for |
|---|---|---|
| `booking_id` | Pseudonymous ID from the booking system (prototype: `bk_sample_xxxxxx`) | Joins every event for a booking; the unit of analysis |
| `household_key` | Salted SHA-256 of the normalized parent phone number | Randomization and deduplication only; never stored with names |
| `event_id` | UUID generated per event | Deduplication |
| `session_id` | Random ID per device (prototype: stored in the browser) | Sessionizing views |
| `experiment_arm` | `control` or `treatment`, from assignment | Every event carries it (prototype always `treatment`) |

The child's name, parent's name, phone and email are **never** event properties. The prototype enforces this: properties whose names suggest personal data are stripped before an event is recorded (`sanitizeProps`, unit-tested), and the browser test checks the event log never contains the child's name.

## 2. Event envelope

Every event has:

| Field | Rule |
|---|---|
| `event_id` | UUID; server drops repeats |
| `name` | From the list below |
| `ts` | UTC, ISO-8601 with milliseconds |
| `tz` | Device IANA time zone (e.g. `Asia/Kolkata`); used to compute local-time features such as "booked in the evening" |
| `schema_version` | Integer; bump on breaking change (prototype: 2) |
| `props.booking_id`, `props.experiment_arm`, `props.session_id`, `props.booking_gap_days` | Added to every event |

**Time rules.** Store everything in UTC. Compute day gaps in the **family's** time zone as calendar days (booked Monday 11 pm, demo Tuesday 9 am = 1 day), because that matches how families experience the wait. Server-side events (`booking_confirmed`, `demo_attended`) are the source of truth for the timestamps that define windows; client timestamps are used only for ordering within a session.

## 3. Events

| Event | Status | Trigger | Required properties | Dedup rule | Source of truth | Metric use | Privacy notes |
|---|---|---|---|---|---|---|---|
| `booking_confirmed` | B, R | Booking saved in the booking system | booking_id, household_key, child_age_band, booked_at, demo_at, gap_days, channel, campaign, market, slot_offered_first | One per booking_id | Booking DB | Eligibility, strata, denominator | Age band, not date of birth |
| `experiment_assigned` | B, R | Assignment at booking | booking_id, household_key, arm, stratum, salt_version | One per booking_id | Assignment service | Arm, sample ratio checks | — |
| `reminder_sent` | B, R | Provider accepts a template message | booking_id, template, message_no, arm | One per booking × template | WhatsApp provider | Exposure checks | Provider message ID only |
| `message_delivered` / `message_read` | B, R | Provider webhook | booking_id, template, message_no | One per booking × template × status | WhatsApp provider | Activation denominator (Message 1 delivered); delivery parity by arm | — |
| `experience_viewed` | **P**, R | Hub or details page opened from the link | entry, hours_to_demo | First per booking per 30-minute session counts | Client → pipeline | Open rate (both arms) | — |
| `mission_viewed` | **P**, R | Mission start screen (age choice) shown | from | First per booking per session | Client | Funnel: viewed → started | — |
| `mission_started` | **P**, R | Age band chosen; first puzzle shown | age_band, attempt_number | **First per booking** counts for activation | Client | **24-hour activation** numerator | Age band only |
| `mission_resumed` | **P** | Continue after leaving or refreshing | age_band, question_index | — | Client | Content length diagnostics | — |
| `mission_answer_submitted` | **P** (prototype only, see §6) | Each answer | age_band, question_id, question_index, attempt, outcome | event_id | Client | Content difficulty | Child behavioural data; **not for production without legal sign-off** |
| `mission_completed` | **P**, R | Last puzzle resolved | age_band, first_try, solved, total | First per booking counts | Client | Completion rate; teacher/counsellor summary | Skills and outcomes only |
| `mission_retried` | **P** | Play again / other level | mode | — | Client | Engagement depth | — |
| `demo_details_viewed` | **P**, R | Prep page opened | from | First per booking per session | Client | Parent engagement | — |
| `joining_instructions_opened` | **P**, R | Join page opened | from | First per booking per session | Client | Readiness | — |
| `calendar_add_clicked` | **P**, R | Google Calendar link, copy details, or .ics | method | One per booking × method | Client | Readiness. **Does not mean an event was saved** | — |
| `readiness_item_checked` | **P** | Checklist item ticked | item | One per booking × item | Client | Readiness | — |
| `reschedule_started` | **P**, R | Change-time page opened | from | First per booking per session | Client | Conflict detection | — |
| `reschedule_completed` | **P** (simulated), B, R | New slot confirmed | old_days_to_demo, new_days_to_demo, reschedule_count | One per booking × new slot | Scheduling system (prototype: simulated) | Reschedule rate; window handling | — |
| `demo_attended` | B, R | Class platform records the child joining | booking_id, join_offset_min, minutes_attended | One per booking (final scheduled demo) | Class platform | **Primary metric** | — |
| `demo_no_show` | B, R | Derived: scheduled demo ended with no join | booking_id, demo_at | One per booking × scheduled demo | Derived from class platform + schedule | Primary metric complement; triggers Message 5 | — |
| `booking_cancelled` | B, R | Family or ops cancels | booking_id, reason_code | One per booking | Booking DB | Guardrail | Reason code, not free text |
| `counsellor_call_completed` | B, R | CRM logs a connected call | booking_id, connected, duration_bucket, summary_viewed | One per booking × call | CRM | Guardrail (workload); downstream | Call notes stay in the CRM |
| `enrollment_completed` | B, R | Payment succeeds | booking_id, plan, days_from_demo | One per booking | Payments | Guardrail / downstream | No payment details in analytics |
| `experience_reset` | **P** (prototype only) | Reset clicked | — | — | Client | None (reviewer tool) | — |

## 4. Metric formulas

| Metric | Formula | Notes |
|---|---|---|
| Attendance rate (primary) | bookings with `demo_attended` on the final scheduled demo within 14 days of the original slot ÷ eligible assigned bookings | Uses Bhanzu's existing "attended" definition; ITT |
| Meaningful attendance | as above with `minutes_attended ≥ 10` | Secondary |
| 24-hour activation | bookings with first `mission_started` ≤ 24h after Message 1 `message_delivered` ÷ treatment bookings with Message 1 delivered and demo ≥ 24h after delivery | Leading indicator |
| Pre-demo activation (short notice) | bookings with `mission_started` before demo_at ÷ treatment bookings with < 24h from delivery to demo | Reported separately |
| Completion | bookings with `mission_completed` ÷ bookings with `mission_started` | Treatment |
| Open rate | bookings with `experience_viewed` ÷ eligible bookings | Both arms |
| Reschedule rate | bookings with ≥1 `reschedule_completed` ÷ eligible bookings | Both arms |
| Cancellation rate | bookings with `booking_cancelled` ÷ eligible bookings | Guardrail |
| Opt-out rate | bookings whose household opted out during the test ÷ eligible bookings | Guardrail |

## 5. Data quality checks (daily during the test)

- Sample ratio mismatch on arm counts (chi-square, p < 0.001 pauses).
- Gap-bucket and market balance by arm.
- Message 1 delivery rate by arm (should be equal).
- Duplicate `event_id` rate; events with missing `booking_id`; events with timestamps in the future or before the booking.
- Client vs server clock skew on `experience_viewed`.
- `demo_attended` + `demo_no_show` + `booking_cancelled` covers every closed booking exactly once.

## 6. Privacy, consent, retention, access

This section describes design choices; legal compliance has **not** been established and needs review by counsel.

- **Children's data under India's DPDP Act.** The Act requires verifiable parental consent before processing a child's (under 18) personal data and prohibits tracking or behavioural monitoring of children and targeted advertising directed at them. The exemptions in the DPDP Rules are narrow and, per legal commentary, do not cover analytics or profiling ([KS&K summary](https://ksandk.com/data-protection-and-data-privacy/childrens-data-protection-under-indias-dpdp-rules/)). Consequences for this design:
  - Production experiment analytics should be **booking-level**: started, completed, attended. Those describe the booking's progress, which the parent requested by booking.
  - **Per-question events** (`mission_answer_submitted`) are behavioural data about a child. They exist in the prototype to show how content difficulty could be measured. In production they should either be dropped or aggregated on the device into anonymous per-question counts with no booking ID, **subject to legal sign-off**.
  - The teacher/counsellor summary (skills that went well or needed help) is used only to deliver the class the parent booked, and only after consent captured at booking.
  - International markets (e.g. COPPA in the US, GDPR in the EU/UK) need separate review.
- **Consent:** parental consent and WhatsApp opt-in at booking; STOP honoured per booking.
- **Data minimisation:** first name for display only; age band instead of age; no school, location, photo, voice or free text.
- **Retention (*proposed*):** raw events 90 days; aggregated metrics kept; mission summary deleted 14 days after the final scheduled demo unless the family enrolls.
- **Access control (*proposed*):** teachers see only the summary for their own class bookings; counsellors through role-based CRM access; analysts see pseudonymous data only; the household key salt is held by the assignment service.
- **Honesty in the UI:** the prototype never says a message was sent, a calendar event created, a booking changed, or an event reported to a server. Each simulated action is labelled where it happens.
