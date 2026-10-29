# Interview Defense

## A. Nine-minute talk track

| Time | Beat | Key lines |
|---|---|---|
| 0:00–0:45 | Frame | "Every lost demo is almost always a lost family. We've already paid for the click and the booking, so attendance is the cheapest lever in the funnel." |
| 0:45–2:15 | Data | "66% at same day and next day, 55% at day 7. Not a slope: a 5-point step at day 4, a rebound at day 6. Forgetting alone can't make a rebound, so gap is a proxy. And even the best rows lose a third. Without row counts I can't tell signal from noise row by row." |
| 2:15–3:30 | Diagnosis | "Booking is warm, attending is cold. The forces: forgetting, competing priorities, zero sunk cost, doubt about a pitch, joining friction, and the child, who attends but usually didn't choose. And the wait is silent." |
| 3:30–5:00 | Prioritization | "Two decisions. What to ship: reminders, rescheduling, calendar help. Cheap and well understood, so they're the baseline for both arms. What to test: the Math Mission, because it's the most valuable uncertainty and the only child lever." |
| 5:00–7:30 | Prototype | Home → mission with one wrong answer → refresh and continue → completion and parent note → prep and join → change time → event log |
| 7:30–9:00 | Measurement | "Primary metric is attendance, ITT, on Bhanzu's own definition. Leading signal is 24-hour activation with a fixed window so the gap mix can't move it. Six pre-agreed outcomes with actions. The test isn't powered until we agree the baseline, MDE and volume." |

## B. Likely challenges

**1. Why demo attendance as the primary outcome, not enrollment?**
Attendance is the step the brief identifies as the leak, it is measured for every booking within days, and the brief says non-attendees are almost never recovered. Enrollment is the business goal, but it is several steps downstream and far noisier, so a test powered on it would need much more volume. I track enrollment as a guardrail so an attendance gain can't hide a conversion loss.

**2. What evidence supports the Math Mission?**
No direct evidence from Bhanzu's data, and I say that. The case rests on the diagnosis: the child is the attendee and is absent from today's flow; the wait is silent; small investments and anticipation are known commitment levers. That's why it's an experiment, not a rollout, and why the first read (24-hour activation) tests the weakest assumption, that families will open it at all.

**3. Why not just send more reminders?**
I do improve reminders, for everyone, first. But reminders only address forgetting. They don't touch the child's motivation, the parent's doubts, or the empty week. Because the control arm also gets the improved reminders, the test measures exactly what the mission adds beyond "better reminders".

**4. Why does day 6 rebound?**
I don't know, and the data given can't say. My first check is weekday alignment: if demos cluster on weekends, a 6-day gap may mostly be "book Sunday for Saturday", which planners do deliberately. Second, slot supply and campaign mix. Third, a small row. My recommendation doesn't depend on the answer.

**5. Could weekday effects or cohort mix explain the whole pattern?**
Possibly. Gap is confounded with demo weekday, booking weekday, slot availability and audience. The cross-tabs in Part 1.5 would show it. If mix explains most of it, waiting-period fixes help less and top-of-funnel and slot-supply fixes help more. The experiment still measures the mission's causal effect either way, because randomization balances the mix.

**6. Your first scoring had reminders at 21 and the mission at 18. Why pick the mission?**
That table mixed two decisions. On "what to ship now", reminders should win, and they do: they ship to everyone. On "what to test first", an idea we're already confident in teaches us little. The mission scores highest on learning value and signal speed. I separated the two lenses rather than re-scoring to fit the answer; I even lowered the mission's confidence score, which makes it rank lower on shipping.

**7. How will you tell activation apart from business impact?**
Activation only tells me the hook works. Activators are self-selected and probably more motivated, so comparing their attendance with non-activators proves nothing. Impact is the intent-to-treat difference in attendance between randomized arms, with enrollment as a guardrail.

**8. How do you handle rescheduled demos?**
The booking keeps its arm and is measured at its final scheduled time, if that falls within 14 days of the original slot. Cancellations count as not attended. I also track whether rescheduled bookings attend, so rescheduling can't hide deferral.

**9. How will you calculate the sample size?**
Two-proportion formula with the control-arm baseline after the new reminders ship (65% is only a placeholder), the minimum lift worth shipping, α 0.05 and power 0.8, then divide by weekly eligible bookings and round up to whole weeks. With placeholders, +3 points needs about 3,900 bookings per arm. I won't call the test powered until those inputs are real.

**10. What if activation rises but attendance doesn't?**
Families like the mission but it doesn't change the decision to attend. I'd strengthen the bridge to the class (the teacher mentions the badge in the day-before message), keep the parent hub, and retest once. If still flat, stop the mission.

**11. What would make you stop the experiment?**
Any guardrail breach (opt-outs, complaints, cancellations, enrollment, technical errors), a sample ratio mismatch, or a failure affecting one arm. I would not stop early for apparent success without a pre-registered sequential method.

**12. What's the smallest viable test?**
The prototype is already one static file. Host it, generate a signed link per booking with date, time, first name and age band, and add the mission paragraph and button to the existing confirmation template for half of households. Events go to whatever analytics SDK Bhanzu uses. No new backend beyond the link signer and assignment.

**13. If engineering resources were limited?**
Ship the baseline as copy changes in the existing messaging tool. Run the mission as above (static hosting, signed links). Defer the teacher/counsellor summary: it's the carry-over benefit, but not needed to test whether the mission lifts attendance. If even that's too much, a 3-puzzle mission inside WhatsApp quick replies is a cruder fallback.

**14. What evidence before a full rollout?**
An ITT attendance lift with a confidence interval excluding zero and at least the agreed minimum lift; no guardrail breaches; enrollment not lower; consistent direction across gap buckets (or a decision to roll out only where it works); then a 5–10% holdout for four weeks to confirm it persists. Plus legal sign-off on children's data.

**15. Which assumptions are most likely wrong?**
(1) That families open a confirmation link at a useful rate. (2) That the 65% and the gap table describe the same population. (3) That short-gap bookings dominate volume: the table hints at it, but rounding means it can't show it. (4) That a child's excitement moves the parent's decision. (5) That slot supply allows "soonest first" rescheduling.

**16. Isn't per-question tracking of children a privacy problem?**
Yes, in India it's a real one: the DPDP Act prohibits behavioural monitoring of children. The prototype logs per-question events only to show what could be measured; the production proposal keeps booking-level events (started, completed, attended) and needs legal sign-off for anything finer.
