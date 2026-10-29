"""Render every Markdown document in the package to a branded PDF.

Palette (from the brand board supplied for this submission):
  Midnight  #013D5A  primary   headings, table headers, text
  Lionsmane #FCF3E3  primary   page background
  Celeste   #BDD3CE  secondary table rules, code and quote panels
  Herb      #708C69  secondary rules and quiet accents (never small text)
  Marigold  #F4A258  secondary highlights (with Midnight text only)

Run from the project root:  python3 tools/render_docs.py
Needs: Python 3, `pip install markdown pymdown-extensions playwright`, `python -m playwright install chromium`.
Output: pdf/*.pdf
"""
import base64
import html
import mimetypes
import os
import re
import sys

import io

import markdown
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FONTS = os.path.join(ROOT, "tools", "fonts")
OUT = os.path.join(ROOT, "pdf")

# (source, output name, eyebrow shown above the title, short footer label, landscape?)
DOCS = [
    ("Bhanzu_Growth_PM_Case_Study_Final.md", "01_Case_Study.pdf", "Growth PM Case Study", "Case study", False),
    ("README.md", "02_README.pdf", "Read me first", "README", False),
    ("docs/PRODUCT_SPEC.md", "03_Product_Spec.pdf", "Product specification", "Product spec", False),
    ("docs/EXPERIMENT_PLAN.md", "04_Experiment_Plan.pdf", "Experiment plan", "Experiment plan", False),
    ("docs/ANALYTICS_PLAN.md", "05_Analytics_Plan.pdf", "Analytics plan", "Analytics plan", True),
    ("docs/INTERVIEW_DEFENSE.md", "06_Interview_Defense.pdf", "Interview defense", "Interview defense", False),
    ("docs/VERIFICATION_REPORT.md", "07_Verification_Report.pdf", "Verification report", "Verification", False),
    ("docs/QUALITY_AUDIT.md", "08_Quality_Audit.pdf", "Quality audit", "Quality audit", True),
]

PALETTE = [("Midnight", "#013D5A"), ("Lionsmane", "#FCF3E3"), ("Celeste", "#BDD3CE"), ("Herb", "#708C69"), ("Marigold", "#F4A258")]


def font_face(family, file, weight, style="normal"):
    with open(os.path.join(FONTS, file), "rb") as f:
        data = base64.b64encode(f.read()).decode()
    return (f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{data}) format('woff2');"
            f"font-weight:{weight};font-style:{style};}}")


FONT_CSS = "".join([
    font_face("Raleway", "raleway-latin-700-normal.woff2", 700),
    font_face("Raleway", "raleway-latin-800-normal.woff2", 800),
    font_face("Lato", "lato-latin-400-normal.woff2", 400),
    font_face("Lato", "lato-latin-400-italic.woff2", 400, "italic"),
    font_face("Lato", "lato-latin-700-normal.woff2", 700),
    font_face("Lato", "lato-latin-700-italic.woff2", 700, "italic"),
    font_face("JetBrains Mono", "jetbrains-mono-latin-400-normal.woff2", 400),
])

CSS = """
:root{
  --midnight:#013D5A; --lionsmane:#FCF3E3; --celeste:#BDD3CE; --herb:#708C69; --marigold:#F4A258;
  --celeste-soft:#E6EDE6;  /* Celeste blended into Lionsmane, for zebra rows and panels */
  --display:'Raleway','Lato',sans-serif; --body:'Lato','Segoe UI',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,monospace;
}
html,body{ background:var(--lionsmane); }
body{ margin:0; color:var(--midnight); font:10pt/1.55 var(--body); -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* Cover band: the Midnight swatch card from the brand board */
.band{ background:var(--midnight); color:var(--lionsmane); padding:13mm 11mm 9mm; margin:0 0 3mm; border-radius:2px; }
.band .eyebrow{ font:700 7.5pt var(--display); letter-spacing:.22em; text-transform:uppercase; color:var(--celeste); margin:0 0 5mm; display:flex; justify-content:space-between; }
.band h1{ font:800 25pt/1.08 var(--display); text-transform:uppercase; letter-spacing:.04em; margin:0; color:var(--lionsmane); }
.band .meta{ margin-top:6mm; display:grid; grid-template-columns:repeat(3,auto); justify-content:start; border:1px solid rgba(252,243,227,.45); }
.band .meta div{ padding:2mm 5mm; border-right:1px solid rgba(252,243,227,.45); font:400 8pt var(--body); }
.band .meta div:last-child{ border-right:0; }
.band .meta b{ display:block; font:700 6.5pt var(--display); letter-spacing:.18em; text-transform:uppercase; color:var(--celeste); }
.swatches{ display:grid; grid-template-columns:repeat(5,1fr); height:2.2mm; margin:0 0 8mm; }

h2{ font:800 13.5pt/1.2 var(--display); text-transform:uppercase; letter-spacing:.05em; margin:9mm 0 3mm; padding-bottom:1.6mm; border-bottom:1.6pt solid var(--celeste); break-after:avoid; }
h3{ font:700 11.5pt/1.25 var(--display); margin:6mm 0 2mm; break-after:avoid; }
h4{ font:700 9pt var(--display); text-transform:uppercase; letter-spacing:.12em; margin:5mm 0 1.5mm; break-after:avoid; }
h2+h3{ margin-top:3mm; }
p{ margin:0 0 2.6mm; }
ul,ol{ margin:0 0 3mm; padding-left:5.5mm; }
li{ margin:0 0 1mm; }
li::marker{ color:var(--herb); font-weight:700; }
strong{ font-weight:700; }
a{ color:var(--midnight); text-decoration:underline; text-decoration-color:var(--marigold); text-decoration-thickness:1.4pt; text-underline-offset:2px; }
hr{ border:0; border-top:1pt solid var(--herb); margin:6mm 0; }

/* Tables echo the HEX/RGB/CMYK grid on the swatch cards */
.table-wrap{ margin:2mm 0 4mm; }
table{ width:100%; border-collapse:collapse; font-size:8.6pt; line-height:1.4; }
thead th{ background:var(--midnight); color:var(--lionsmane); font:700 7pt var(--display); text-transform:uppercase; letter-spacing:.12em; text-align:left; padding:2mm 2.2mm; border:1px solid var(--midnight); }
td{ padding:1.6mm 2.2mm; border:1px solid var(--celeste); vertical-align:top; }
tbody tr:nth-child(even) td{ background:var(--celeste-soft); }
tr{ break-inside:avoid; }
table.dense{ font-size:7.6pt; }
table.dense td{ padding:1.3mm 1.6mm; }
td strong{ color:var(--midnight); }
/* A row that is bold all the way across marks a highlighted figure: Marigold, as on the chart */
tr.hl td{ background:var(--marigold) !important; border-color:#E39446; }

code{ font:400 .9em var(--mono); background:var(--celeste-soft); padding:.2mm 1mm; border-radius:2px; }
pre{ background:var(--celeste-soft); border-left:2.4pt solid var(--herb); padding:3mm 4mm; margin:2mm 0 4mm; white-space:pre-wrap; break-inside:avoid; }
pre code{ background:none; padding:0; font-size:8pt; line-height:1.5; }

/* Message copy and quotes: a Celeste card with a Midnight edge */
blockquote{ background:var(--celeste); border-left:3pt solid var(--midnight); margin:2mm 0 4mm; padding:3mm 5mm; border-radius:0 3px 3px 0; break-inside:avoid; }
blockquote p{ margin:0 0 1.6mm; }
blockquote p:last-child{ margin:0; }

img{ max-width:100%; display:block; margin:3mm auto 5mm; border:1px solid var(--celeste); }
.emoji{ font-family:'Noto Color Emoji'; }
"""

FOOTER = """
<div style="-webkit-print-color-adjust:exact;print-color-adjust:exact;width:100%;padding:0 16mm;font:7.5pt Lato, sans-serif;color:#013D5A;display:flex;justify-content:space-between;align-items:center;">
  <span style="letter-spacing:.18em;text-transform:uppercase;font-weight:700;">Bhanzu Growth PM · {label}</span>
  <span style="display:flex;gap:6px;align-items:center;">
    <span style="display:inline-block;width:6px;height:6px;background:#013D5A"></span><span style="display:inline-block;width:6px;height:6px;background:#BDD3CE"></span><span style="display:inline-block;width:6px;height:6px;background:#708C69"></span><span style="display:inline-block;width:6px;height:6px;background:#F4A258"></span>
    <span style="margin-left:6px"><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </span>
</div>"""


def embed_images(body_html, base_dir):
    def repl(m):
        src = m.group(1)
        if src.startswith(("http:", "https:", "data:")):
            return m.group(0)
        path = os.path.normpath(os.path.join(base_dir, src))
        if not os.path.exists(path):
            path = os.path.normpath(os.path.join(ROOT, src))
        mime = mimetypes.guess_type(path)[0] or "image/png"
        with open(path, "rb") as f:
            data = base64.b64encode(f.read()).decode()
        return f'src="data:{mime};base64,{data}"'
    return re.sub(r'src="([^"]+)"', repl, body_html)


def post_process(body_html):
    # Wrap tables; mark wide ones dense; colour fully-bold rows (the brief's highlighted rows) Marigold.
    def table(m):
        t = m.group(0)
        cols = len(re.findall(r"<th", t.split("</tr>")[0]))
        cls = ' class="dense"' if cols >= 6 else ""
        t = t.replace("<table>", f"<table{cls}>", 1)

        def row(r):
            cells = re.findall(r"<td[^>]*>(.*?)</td>", r.group(0), re.S)
            if cells and all(re.fullmatch(r"\s*<strong>.*</strong>\s*", c, re.S) for c in cells):
                return r.group(0).replace("<tr>", '<tr class="hl">', 1)
            return r.group(0)
        t = re.sub(r"<tr>.*?</tr>", row, t, flags=re.S)
        return f'<div class="table-wrap">{t}</div>'
    body_html = re.sub(r"<table>.*?</table>", table, body_html, flags=re.S)
    # Emoji in message copy
    emoji = r"(?:[0-9#*]\uFE0F?\u20E3|[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B50\u2B55]\uFE0F?)+"
    body_html = re.sub(f"({emoji})", r'<span class="emoji">\1</span>', body_html)
    return body_html


def normalize_markdown(md_text):
    """GitHub-style Markdown → Python-Markdown: blank line before lists, 4-space nesting."""
    out, in_code, prev = [], False, ""
    item = re.compile(r"^(\s*)([-*+]|\d+\.)\s")
    for line in md_text.splitlines():
        if line.lstrip().startswith("```"):
            in_code = not in_code
            out.append(line); prev = line; continue
        if not in_code:
            m = item.match(line)
            if m:
                indent = len(m.group(1))
                if indent:
                    line = " " * (indent * 2) + line.lstrip()
                elif prev.strip() and not item.match(prev) and not prev.startswith((">", "|")):
                    out.append("")
        out.append(line); prev = line
    return "\n".join(out)


def paint_background(pdf_path, hex_color="#FCF3E3"):
    """Chromium leaves page margins unpainted; put every page on a full-bleed Lionsmane sheet."""
    reader = PdfReader(pdf_path)
    writer = PdfWriter()
    r, g, b = (int(hex_color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    for page in reader.pages:
        w, h = float(page.mediabox.width), float(page.mediabox.height)
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(w, h))
        c.setFillColorRGB(r, g, b)
        c.rect(0, 0, w, h, stroke=0, fill=1)
        c.save()
        bg = PdfReader(io.BytesIO(buf.getvalue())).pages[0]
        bg.merge_page(page)
        writer.add_page(bg)
    writer.add_metadata({"/Title": reader.metadata.title if reader.metadata and reader.metadata.title else "", "/Author": "Abhinav Chaudhary"})
    with open(pdf_path, "wb") as f:
        writer.write(f)


def build_html(md_text, eyebrow, base_dir, landscape=False):
    lines = normalize_markdown(md_text).splitlines()
    title = "Untitled"
    for i, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            lines = lines[:i] + lines[i + 1:]
            break
    body = markdown.markdown("\n".join(lines), extensions=["tables", "fenced_code", "sane_lists", "attr_list", "nl2br"])
    body = post_process(embed_images(body, base_dir))
    swatches = "".join(f'<span style="background:{c}"></span>' for _, c in PALETTE if _ != "Lionsmane")
    meta = ("<div><b>Candidate</b>Abhinav Chaudhary</div><div><b>Role</b>Growth Product Manager</div>"
            "<div><b>Company</b>Bhanzu</div>")
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(title)}</title>
<style>{FONT_CSS}{CSS}@page{{size:A4 {"landscape" if landscape else "portrait"};}}</style></head><body>
<header class="band"><p class="eyebrow"><span>{html.escape(eyebrow)}</span><span>Bhanzu · Demo attendance</span></p>
<h1>{html.escape(title)}</h1><div class="meta">{meta}</div></header>
<div class="swatches">{swatches}</div>
<main>{body}</main></body></html>"""


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for src, out, eyebrow, label, landscape in DOCS:
            path = os.path.join(ROOT, src)
            with open(path, encoding="utf-8") as f:
                doc = build_html(f.read(), eyebrow, os.path.dirname(path), landscape)
            page.set_content(doc, wait_until="load")
            page.evaluate("document.fonts.ready")
            dest = os.path.join(OUT, out)
            page.pdf(path=dest, format="A4", landscape=landscape, print_background=True,
                     display_header_footer=True, header_template="<span></span>",
                     footer_template=FOOTER.replace("{label}", html.escape(label)),
                     margin={"top": "14mm", "bottom": "16mm", "left": "14mm", "right": "14mm"})
            paint_background(dest)
            made.append(dest)
            print("wrote", os.path.relpath(dest, ROOT))
        browser.close()
    return made


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
