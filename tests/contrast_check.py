"""WCAG 2.1 contrast check of the colour pairs the UI actually uses, in light and dark themes.
Reads the tokens from src/styles.css. Run: python3 tests/contrast_check.py"""
import re, os, sys
css = open(os.path.join(os.path.dirname(__file__), "..", "src", "styles.css")).read()
def block(sel):
    m = re.search(re.escape(sel) + r"\s*\{(.*?)\}", css, re.S)
    return dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", m.group(1)))
light = block(":root")
dark = {**light, **block(":root[data-theme='dark']")}
def lum(h):
    c = [int(h[i:i+2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)
# (foreground, background, minimum, where it is used)
PAIRS = [
    ("ink", "paper", 4.5, "body text on page"), ("ink", "surface", 4.5, "card text"),
    ("ink-2", "surface", 4.5, "secondary text on cards"), ("ink-2", "paper", 4.5, "secondary text on page"),
    ("primary", "surface", 4.5, "links, secondary buttons, eyebrows"), ("primary-ink", "primary", 4.5, "primary button text"),
    ("sun-ink", "sun", 4.5, "child panel text"), ("sun", "sun-ink", 4.5, "child panel button"),
    ("ink", "sun-soft", 4.5, "notice band, hints"), ("good", "good-soft", 4.5, "correct state, chips"),
    ("bad", "bad-soft", 4.5, "wrong answer"), ("warn", "warn-soft", 4.5, "time-passed chip"),
    ("bad", "surface", 4.5, "input errors"), ("good", "surface", 3.0, "success accents"),
    ("line", "surface", 1.0, "decorative borders (no minimum)"),
]
fails = 0
for theme, t in (("light", light), ("dark", dark)):
    for fg, bg, need, where in PAIRS:
        r = ratio(t[fg], t[bg]); ok = r >= need
        fails += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {theme:5}  {fg:>11} on {bg:<9} {r:5.2f}:1 (need {need})  {where}")
print(f"\n{fails} failing pairs")
sys.exit(1 if fails else 0)
