# Verification Report

Final run: 28 Oct 2026, Linux container, Node 22.23.4, npm 10.9.9, Python 3 + Playwright (headless Chromium). Every result below was observed in this run; nothing is assumed.

## 1. Commands and results

| # | Command | Result |
|---|---|---|
| 1 | `rm -rf node_modules dist && npm ci` | Added 173 packages; **0 vulnerabilities** |
| 2 | `npm audit` | **0 vulnerabilities** (see §4 for how this was reached) |
| 3 | `npm run lint` (ESLint 9, typescript-eslint, react-hooks; `--max-warnings 0`) | **Pass**, 0 errors, 0 warnings |
| 4 | `npm run typecheck` (`tsc --noEmit`, strict) | **Pass** |
| 5 | `npm test` (Vitest 5) | **Pass**: 3 files, **37 tests** |
| 6 | `npm run build` (tsc + Vite 8, single-file) | **Pass**: `dist/index.html` 205.58 kB, 64.86 kB gzip |
| 7 | `python3 tests/e2e_journey.py` | **Pass: 49 checks** |
| 8 | `python3 tests/contrast_check.py` | **Pass**: 30 colour pairs, 0 failing |
| 9 | Open `dist/index.html` via `file://` in Chromium | **Pass**: home renders ("Hi Aarav! Your math class is in 3 days."), no page errors |
| 10 | `npx vite --port 5182` | **Pass**: Vite 8.3.5 ready in ~0.4 s, HTTP 200 |
| 11 | Publish build as a claude.ai artifact (version 2) | Publish succeeded. The page is **private to its owner**; it was not opened as an outside viewer, so no public URL is claimed |

`npm run check` runs 3–6 in sequence.

## 2. What the tests cover

### Unit tests (37)

- **Mission logic:** answer checking (choices, typed numbers), input validation messages, attempt flow (first try, retry, reveal, no double answers, no skipping, finishing), progress, star rules, "needed help" list, content integrity (5 per band, answers among options, unique IDs).
- **Resume:** accepts consistent unfinished progress (including mid-retry); rejects empty, unknown band, inconsistent, out-of-range and finished progress.
- **Time:** countdown split and states; calendar-day gap; reschedule slots (2h notice, current excluded, soonest first); invalid date parameters; time-zone label present.
- **Booking:** gap parameter, default 3-day gap, bad input fallback, first-name sanitizing, unreadable-link notice, clean link has no notice, pseudonymous booking ID.
- **Calendar:** .ics escaping, end time, 30-minute alarm; Google Calendar URL.
- **Analytics:** envelope (ID, UTC timestamp, time zone, schema version), base properties merged, personal-data keys stripped, deduplication by event ID, unique event list.

### Browser checks (49)

Desktop 1280 px: default booking 3 days out · Confirmed status · countdown · time shows zone label ("5:30 pm IST") · onboarding on age screen · mission starts · wrong answer shows hint and ✗ · correct after retry with ✓ · progress 20% · **refresh keeps progress ("Continue mission (2 of 5 done)")** · resume returns to puzzle 3 · two misses reveal answer · progress 80% · empty and letter inputs rejected · typed answer accepted · completion · stars match results · per-puzzle summary · prep "What to expect" · tips · join page · checklist updates · simulated join disclosed · Google Calendar link prefilled · home shows badge and no stale resume button · reschedule needs a choice · reschedule success disclosed · Rescheduled status · persists after refresh · event log has all 11 journey events · events carry `booking_id` and `experiment_arm` and never the child's name · Escape closes event log · reset · 7-day gap switcher.

Bad link (`?demo=next-tuesday`): notice shown · falls back to a working booking.

Phone 390 px: home, age screen, mission, reschedule have no horizontal scroll.
Tablet 768 px: home and prep have no horizontal scroll.
Dark theme applies. Keyboard: Tab + Enter starts the mission and focus lands on the new heading; focus outline visible. No console or page errors across all pages.

Screenshots: `tests/screenshots/` (10 files: home desktop, retry hint, completion, join, event log, home phone, mission phone, reschedule phone, home dark, prep tablet).

## 3. Defects found and fixed in this round

| Defect | Found by | Fix |
|---|---|---|
| Refreshing mid-mission lost all answers | Review against brief §6 ("refreshes … do not destroy progress") | Progress saved after every change, validated on load; *Continue mission* on home |
| Success green on its soft background was 4.32:1 (below AA 4.5) | `contrast_check.py` | Darkened to `#166b41` (now passes) |
| Two React hooks with incomplete dependencies (hidden by comments) | ESLint `react-hooks/exhaustive-deps` | Completion moved into the click handler; reschedule slots fixed with a state initializer |
| Event log effect would refocus every second (inline close handler + 1 s clock) | Code review while adding Escape support | Stable `useCallback` handler |
| Rescheduling overwrote the booking time, which would corrupt gap stratification | Review of experiment plan vs code | Original `bookedAt` kept; reschedule event reports old and new days to demo |
| Wrong-answer strike-through also crossed the ✗ icon | Screenshot review | Icon rendered as inline-block |
| Footer floated mid-screen on short pages | Screenshot review | App min-height set to the viewport |
| 7 dev-dependency advisories (2 critical) in the test/build toolchain | `npm audit` | Upgraded Vite 5→8, Vitest 2→5, plugin-react 4→6, singlefile 2.0→2.3; all checks re-run and pass |

## 4. Toolchain note

`npm audit fix` without `--force` left 7 advisories (esbuild dev-server exposure, tinypool, @vitest/mocker). They are dev-only, but the fix was a major-version upgrade, so it was done deliberately and every check was re-run afterwards. The upgrade raised the minimum Node version to 22.12 (Vitest 5), recorded in `package.json` `engines` and the README.

## 5. Not verified

| Item | Why | Manual procedure |
|---|---|---|
| Physical phones; Safari and Firefox | Only headless Chromium available | Open `dist/index.html` on an Android phone (Chrome) and an iPhone (Safari); run the README's two-minute walkthrough |
| Screen reader output | No screen reader in the environment | VoiceOver (iOS/macOS) or TalkBack: confirm screen headings are announced on navigation, feedback is read after each answer, progress value is read |
| Google Fonts rendering | Font requests blocked in tests (system fallbacks used in screenshots) | Open online; headings should use Baloo 2 |
| .ics download in a calendar app | Downloads not exercised end to end | Open `dist/index.html` directly (not embedded), *How to join* → *Download .ics*, open in Apple Calendar / Outlook |
| .ics button hidden inside the embedded claude.ai viewer | The publish tool warns statically about the download code; the button is designed to hide when the page is framed, but this was not observed in the real viewer | Open the shared page; *How to join* should show only *Add to Google Calendar* and *Copy details* |
| Public URL | The published page is private until the owner shares it | Owner shares it from the page's Share menu, then opens it in a signed-out browser |
| Any production integration | None is built | — |
| Content with real children or Bhanzu teachers | Out of scope for a take-home | Five-family hallway test before launch |
