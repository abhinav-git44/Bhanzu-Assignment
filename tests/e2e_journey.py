"""End-to-end checks of the production build (dist/index.html) in headless Chromium.

Run:  python3 tests/e2e_journey.py
Needs: Python 3, `pip install playwright`, `python -m playwright install chromium`, and `npm run build` first.
Serves dist/ on a random local port. Google Fonts requests are blocked so results don't depend on the network.
Screenshots are written to tests/screenshots/.
"""
import functools
import http.server
import os
import threading

from playwright.sync_api import expect, sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..", "dist")
SHOTS = os.path.join(HERE, "screenshots")
os.makedirs(SHOTS, exist_ok=True)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


handler = functools.partial(QuietHandler, directory=ROOT)
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{srv.server_address[1]}/index.html"

passed = []
errors = []


def ok(name):
    passed.append(name)
    print("PASS", name)


def new_page(browser, **kw):
    page = browser.new_page(**kw)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    page.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" and "fonts" not in m.text and "net::" not in m.text else None)
    page.route("**/fonts.googleapis.com/**", lambda r: r.abort())
    page.route("**/fonts.gstatic.com/**", lambda r: r.abort())
    return page


def no_hscroll(page):
    sw = page.evaluate("document.documentElement.scrollWidth")
    cw = page.evaluate("document.documentElement.clientWidth")
    assert sw <= cw, (sw, cw)
    return sw, cw


with sync_playwright() as p:
    b = p.chromium.launch()

    # ---------- Desktop: full journey ----------
    page = new_page(b, viewport={"width": 1280, "height": 900})
    page.goto(URL)
    expect(page.get_by_role("heading", name="Hi Aarav! Your math class is in 3 days.")).to_be_visible(); ok("home: default sample booking is 3 days out")
    expect(page.get_by_text("Confirmed", exact=True)).to_be_visible(); ok("home: Confirmed status")
    expect(page.locator(".countdown")).to_be_visible(); ok("home: countdown visible")
    time_text = page.locator(".demo-facts dd").nth(1).inner_text()
    assert any(ch.isalpha() for ch in time_text.replace("am", "").replace("pm", "")), time_text
    ok(f"home: time shows a zone label ({time_text})")
    page.screenshot(path=f"{SHOTS}/01_home_desktop.png", full_page=True)

    page.get_by_role("button", name="Start Math Mission").click()
    expect(page.get_by_role("heading", name="Pick your mission")).to_be_visible()
    expect(page.get_by_role("list", name="How the mission works")).to_be_visible(); ok("age screen: onboarding explains puzzles, hints, badge")
    page.get_by_role("button", name="Ages 9–11").click()
    expect(page.get_by_text("Puzzle 1 of 5")).to_be_visible(); ok("mission starts at puzzle 1")

    page.get_by_role("button", name="90", exact=True).click()
    expect(page.get_by_text("Not quite")).to_be_visible(); ok("wrong answer: hint and retry")
    expect(page.locator(".option.wrong .opt-icon")).to_have_text("✗"); ok("wrong answer marked with ✗ (not colour alone)")
    page.screenshot(path=f"{SHOTS}/02_retry_hint.png", full_page=True)
    page.get_by_role("button", name="100", exact=True).click()
    expect(page.locator(".feedback.good")).to_be_visible(); ok("correct after retry")
    expect(page.locator(".option.right .opt-icon")).to_have_text("✓"); ok("right answer marked with ✓")
    expect(page.get_by_role("progressbar")).to_have_attribute("aria-valuenow", "20"); ok("progress 20% after puzzle 1")
    page.get_by_role("button", name="Next puzzle").click()
    page.get_by_role("button", name="48", exact=True).click()
    page.get_by_role("button", name="Next puzzle").click()

    # Refresh mid-mission, then resume
    page.reload()
    expect(page.get_by_role("button", name="Continue mission (2 of 5 done)")).to_be_visible(); ok("refresh keeps progress: Continue mission (2 of 5 done)")
    page.get_by_role("button", name="Continue mission (2 of 5 done)").click()
    expect(page.get_by_text("Puzzle 3 of 5")).to_be_visible(); ok("resume returns to puzzle 3")

    page.get_by_role("button", name="3/8", exact=True).click()
    page.get_by_role("button", name="1/2", exact=True).click()
    expect(page.get_by_text("The answer is 5/8.")).to_be_visible(); ok("two misses reveal the answer")
    page.get_by_role("button", name="Next puzzle").click()
    page.get_by_role("button", name="1/2", exact=True).click()
    page.get_by_role("button", name="Next puzzle").click()
    expect(page.get_by_role("progressbar")).to_have_attribute("aria-valuenow", "80"); ok("progress 80% after puzzle 4")

    page.get_by_role("button", name="Check").click()
    expect(page.get_by_text("Type your answer in the box first.")).to_be_visible(); ok("typed answer: empty rejected")
    page.get_by_label("Your answer").fill("abc")
    page.get_by_role("button", name="Check").click()
    expect(page.get_by_text("Use digits only, like 42.")).to_be_visible(); ok("typed answer: letters rejected")
    page.get_by_label("Your answer").fill("146")
    page.get_by_role("button", name="Check").click()
    expect(page.locator(".feedback.good")).to_be_visible(); ok("typed answer accepted")
    page.get_by_role("button", name="Finish mission").click()

    expect(page.get_by_role("heading", name="Well done, Aarav! You're a Pattern Navigator.")).to_be_visible(); ok("completion screen")
    expect(page.get_by_label("2 of 3 stars").first).to_be_visible(); ok("stars match results (3 first-try, 4/5 solved → 2 stars)")
    expect(page.get_by_text("Solved with a hint")).to_be_visible(); ok("per-puzzle summary")
    page.screenshot(path=f"{SHOTS}/03_complete.png", full_page=True)

    page.get_by_role("button", name="Get ready for class").click()
    expect(page.get_by_role("heading", name="What to expect")).to_be_visible(); ok("prep: what to expect (before, during, after)")
    expect(page.get_by_role("heading", name="Five things that help")).to_be_visible(); ok("prep: tips")
    page.get_by_role("button", name="See how to join").click()
    expect(page.get_by_role("heading", name="How to join the class")).to_be_visible(); ok("joining instructions")
    page.get_by_label("Pencil and paper ready").check()
    expect(page.get_by_text("1/4 ready")).to_be_visible(); ok("readiness checklist updates")
    page.get_by_role("button", name="Join class (opens 15 min before)").click()
    expect(page.get_by_text("This is a prototype, so there is no real class link.")).to_be_visible(); ok("join button discloses simulated link")
    href = page.get_by_role("link", name="Add to Google Calendar").get_attribute("href")
    assert href.startswith("https://calendar.google.com/calendar/render?action=TEMPLATE"), href
    ok("Google Calendar link prefilled")
    page.screenshot(path=f"{SHOTS}/04_join.png", full_page=True)

    page.get_by_role("button", name="Back").click()
    expect(page.get_by_text("You earned the")).to_be_visible(); ok("home shows earned badge; no stale resume button")
    assert page.get_by_role("button", name="Continue mission").count() == 0
    page.get_by_role("button", name="Change time").click()
    page.get_by_role("button", name="Confirm new time").click()
    expect(page.get_by_text("Choose a time first.")).to_be_visible(); ok("reschedule requires a choice")
    page.locator(".slot").first.click()
    page.get_by_role("button", name="Confirm new time").click()
    expect(page.get_by_text("Prototype note: no booking system")).to_be_visible(); ok("reschedule success discloses simulation")
    page.get_by_role("button", name="Back to home").click()
    expect(page.get_by_text("Rescheduled", exact=True)).to_be_visible(); ok("home shows Rescheduled")
    page.reload()
    expect(page.get_by_text("Rescheduled", exact=True)).to_be_visible(); ok("reschedule persists across refresh")

    page.get_by_role("button", name="Event log").click()
    expect(page.get_by_role("dialog", name="Event log")).to_be_visible()
    log = page.locator(".log-list").inner_text()
    for ev in ["experience_viewed", "mission_viewed", "mission_started", "mission_resumed", "mission_answer_submitted",
               "mission_completed", "demo_details_viewed", "joining_instructions_opened", "readiness_item_checked",
               "reschedule_started", "reschedule_completed"]:
        assert ev in log, ev
    ok("event log has every journey event")
    assert "Aarav" not in log, "child name leaked into analytics"
    assert "booking_id" in log and "experiment_arm" in log
    ok("events carry booking_id and experiment_arm, never the child's name")
    page.screenshot(path=f"{SHOTS}/05_event_log.png")
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog", name="Event log")).to_have_count(0); ok("Escape closes the event log")

    page.get_by_role("button", name="Reset prototype").click()
    page.get_by_role("button", name="Yes, reset").click()
    expect(page.get_by_text("Confirmed", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Start Math Mission")).to_be_visible(); ok("reset restores a fresh booking")
    page.get_by_role("button", name="Sample booking 7 days ahead").click()
    expect(page.get_by_text("in 7 days")).to_be_visible(); ok("gap switcher: 7-day booking")

    # ---------- Bad link data ----------
    bad = new_page(b, viewport={"width": 1280, "height": 900})
    bad.goto(URL + "?demo=next-tuesday")
    expect(bad.get_by_text("We couldn't read the class time in this link")).to_be_visible(); ok("unreadable link data shows a notice")
    expect(bad.locator(".countdown")).to_be_visible(); ok("…and falls back to a working sample booking")

    # ---------- Phone ----------
    m = new_page(b, viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    m.goto(URL)
    sw, cw = no_hscroll(m); ok(f"phone 390px: home has no horizontal scroll ({sw}<={cw})")
    m.screenshot(path=f"{SHOTS}/06_home_mobile.png", full_page=True)
    m.get_by_role("button", name="Start Math Mission").tap()
    no_hscroll(m); ok("phone: age screen fits")
    m.get_by_role("button", name="Ages 6–8").tap()
    m.locator(".options").get_by_role("button", name="7", exact=True).tap()
    no_hscroll(m); ok("phone: mission fits")
    m.screenshot(path=f"{SHOTS}/07_mission_mobile.png", full_page=True)
    m.goto(URL)
    m.get_by_role("button", name="Change time").tap()
    no_hscroll(m); ok("phone: reschedule fits")
    m.screenshot(path=f"{SHOTS}/08_reschedule_mobile.png", full_page=True)

    # ---------- Tablet ----------
    t = new_page(b, viewport={"width": 768, "height": 1024}, is_mobile=True, has_touch=True)
    t.goto(URL)
    no_hscroll(t); ok("tablet 768px: home fits")
    t.get_by_role("button", name="Get ready for class").tap()
    no_hscroll(t); ok("tablet: prep page fits")
    t.screenshot(path=f"{SHOTS}/10_prep_tablet.png", full_page=True)

    # ---------- Dark theme ----------
    d = new_page(b, viewport={"width": 1280, "height": 900}, color_scheme="dark")
    d.goto(URL)
    bg = d.evaluate("getComputedStyle(document.body).backgroundColor")
    assert bg != "rgb(243, 247, 246)", bg
    ok(f"dark theme applies ({bg})")
    d.screenshot(path=f"{SHOTS}/09_home_dark.png", full_page=True)

    # ---------- Keyboard only ----------
    k = new_page(b, viewport={"width": 1280, "height": 900})
    k.goto(URL)
    for _ in range(15):
        k.keyboard.press("Tab")
        if k.evaluate("document.activeElement && document.activeElement.textContent") == "Start Math Mission":
            break
    k.keyboard.press("Enter")
    expect(k.get_by_role("heading", name="Pick your mission")).to_be_focused(); ok("keyboard: start works and focus moves to the new heading")
    outline = k.evaluate("(() => { const b = document.querySelector('.band-card'); b.focus(); return getComputedStyle(b).outlineStyle; })()")
    assert outline != "none", outline
    ok("keyboard: visible focus outline")

    assert not errors, errors
    ok("no runtime errors in the console")
    b.close()

srv.shutdown()
print(f"\n{len(passed)} checks passed")
