# Bhanzu Math Mission — Growth PM case study

Submission for the Bhanzu Growth PM case study on demo attendance. It contains the written answer to all four parts and a working prototype of the proposed micro-experience: between booking a free demo and attending it, the **child** plays a 5-minute Math Mission and earns a badge to show the teacher, and the **parent** gets the class details with a live countdown, preparation help, joining instructions and one-tap rescheduling.

> **Concept prototype, not an official Bhanzu product.** Booking details, teacher name and time slots are sample data. No messages, bookings or calls are made. Analytics events stay in the browser and are shown in an on-screen Event log.

## Where to start

| File | What it is |
|---|---|
| **`Bhanzu_Growth_PM_Case_Study_Final.md`** | The case study: Parts 1–4, message copy, measurement summary |
| **`pdf/`** | Every document below as a print-ready PDF in the submission palette (start with `01_Case_Study.pdf`) |
| `dist/index.html` | The built prototype, a single self-contained file. Double-click to open |
| `docs/PRODUCT_SPEC.md` | Users, requirements, flows, acceptance criteria, edge cases |
| `docs/EXPERIMENT_PLAN.md` | Test design, metrics, sample-size inputs, guardrails, decision matrix |
| `docs/ANALYTICS_PLAN.md` | Events, identifiers, metric formulas, data quality, privacy |
| `docs/VERIFICATION_REPORT.md` | Commands run and their real results |
| `docs/QUALITY_AUDIT.md` | Review of the first version, what changed, requirements traceability, self-score |
| `docs/INTERVIEW_DEFENSE.md` | Talk track and answers to likely challenges |
| `docs/attendance_by_gap.png` | Chart of the brief's data with the 65% benchmark |

## Architecture

A client-only React 18 + TypeScript (strict) app built with Vite 8. `vite-plugin-singlefile` inlines all JS and CSS so the build is one HTML file (~206 KB, ~65 KB gzip). No backend, accounts, API keys or network calls other than Google Fonts (with system-font fallbacks).

```
src/
  App.tsx              screen state, persistence, analytics base properties
  screens/             Home, AgeSelect, Mission, Complete, Parent (Prep + Join), Reschedule
  components/ui.tsx    countdown, progress, stars, next steps, event log drawer
  lib/mission.ts       answer checking, attempts, scoring, resume validation (pure, unit-tested)
  lib/time.ts          countdown, calendar-day gap, reschedule slots, formatting
  lib/calendar.ts      Google Calendar link and .ics builder
  lib/analytics.ts     event envelope, PII stripping, dedup, local event log
  lib/storage.ts       localStorage wrappers that fail safely
  data/missions.ts     the 15 puzzles across three age bands
  data/booking.ts      sample booking and link-parameter handling
tests/
  e2e_journey.py       49 browser checks (Playwright, headless Chromium)
  contrast_check.py    WCAG contrast of the colour tokens, both themes
```

## Run

Requires Node 22.12+ (the test runner needs it; verified with Node 22.23.4, npm 10.9.9). Opening `dist/index.html` needs only a browser.

```bash
npm install
npm run dev        # dev server, prints a local URL (default http://localhost:5173)
```

Or open `dist/index.html` directly in a browser; no install needed.

## Build and test

```bash
npm run lint        # ESLint (typescript-eslint + react-hooks), zero warnings allowed
npm run typecheck   # tsc --noEmit, strict
npm test            # Vitest unit tests
npm run build       # type check + production build → dist/index.html
npm run check       # all four in sequence

# Browser and accessibility checks (need Python 3):
pip install playwright && python -m playwright install chromium
python3 tests/e2e_journey.py      # run after npm run build
python3 tests/contrast_check.py
```

## Rebuild the PDFs

The PDFs in `pdf/` are generated from the Markdown sources, so edit the `.md` file and re-render:

```bash
pip install markdown pymdown-extensions pypdf reportlab playwright && python -m playwright install chromium
npm run docs:pdf          # runs python3 tools/render_docs.py
```

Palette: Midnight `#013D5A` and Lionsmane `#FCF3E3` (primary); Celeste `#BDD3CE`, Herb `#708C69`, Marigold `#F4A258` (secondary). Type: Raleway (headings), Lato (body), JetBrains Mono (code), embedded from `tools/fonts/` under the SIL Open Font License.

## Deploy

`dist/index.html` is static. Any static host works (S3/CloudFront, Netlify, Vercel, GitHub Pages, Nginx): upload the file and serve it. No environment variables or build-time secrets.

For the review, the same build was also published as a private claude.ai page owned by the author; it is visible to others only once shared. No public URL has been verified.

## Try it in two minutes

1. Open the app: Aarav's sample booking, 3 days out, with a live countdown and the time zone.
2. **Start Math Mission** → read *How it works* → **Ages 9–11**.
3. Answer 90 (wrong, see the hint and ✗), then 100. Answer the next puzzle.
4. **Refresh the page.** Home now offers *Continue mission (2 of 5 done)*. Continue.
5. Finish. On the last puzzle, try an empty answer and some letters to see validation.
6. Read the parent note → **Get ready for class** → **See how to join** → tick a checklist item.
7. Back home → **Change time** → pick a slot → confirm. Status becomes **Rescheduled**.
8. **Event log** (top right): every tracked event with a pseudonymous booking ID. Escape closes it.
9. Footer: switch the sample booking gap (same day … 7 days), or **Reset prototype**.
10. Optional: open `dist/index.html?demo=next-tuesday` to see how unreadable link data is handled.

## Known limitations

- Sample data only; production would load the booking from a signed link.
- No WhatsApp, booking, class platform, CRM or analytics backend. The message sequence is specified, not sent.
- The join button explains when the real link would open; it doesn't open a class.
- In viewers that block downloads, the .ics option is hidden; Google Calendar and copy still work.
- Tested in headless Chromium only (phone, tablet and desktop sizes); not on physical devices, Safari or Firefox, or with a screen reader.
- Puzzles have not been reviewed by Bhanzu teachers or tried with children.
- Per-question child analytics are prototype-only pending legal review (see `docs/ANALYTICS_PLAN.md` §6).
