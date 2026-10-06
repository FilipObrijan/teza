"""Checks the rendered PDF: no table or figure may start or end a page, and none may be split across pages."""
import sys, subprocess, re, docx
from docx.oxml.ns import qn
pdf, docpath = sys.argv[1], sys.argv[2]
n = int(re.search(r'Pages:\s+(\d+)', subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout).group(1))
pages = [re.sub(r'\s+', '', subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True).stdout) for i in range(1, n + 1)]
squash = lambda s: re.sub(r'\s+', '', s)
def page_of(snip, start=0):
    snip = squash(snip)
    for i in range(start, n):
        if snip and snip in pages[i]:
            return i
    return None
d = docx.Document(docpath)
body = list(d.element.body.iterchildren())
text = lambda el: ''.join(t.text or '' for t in el.iter(qn('w:t')))
def nonempty(i, step):
    j = i + step
    while 0 <= j < len(body) and body[j].tag == qn('w:p') and not text(body[j]).strip():
        j += step
    return j
problems, checked = [], 0
started = False
for i, el in enumerate(body):
    if el.tag == qn('w:p') and text(el).strip() == 'INTRODUCTION':
        started = True
    if not started:
        continue
    if el.tag == qn('w:tbl'):
        cap = body[i - 1]; label = text(cap)[:40] or 'table'
        rows = el.findall(qn('w:tr'))
        last = max((text(tc) for tc in rows[-1].findall(qn('w:tc'))), key=len)
        first_cell = max((text(tc) for tc in rows[0].findall(qn('w:tc'))), key=len)
        pc = page_of(text(cap)[:30]) if text(cap).strip() else page_of(first_cell[:20])
        pl = page_of(last[:25], pc or 0)
        prv, nxt = body[nonempty(i - 1, -1)], body[nonempty(i, 1)]
        pp = page_of(text(prv)[-30:], max((pc or 1) - 1, 0))
        pn = page_of(text(nxt)[:30], pl or 0)
    elif el.tag == qn('w:p') and el.find('.//' + qn('w:drawing')) is not None:
        cap = body[i + 1]; label = text(cap)[:40]
        pc = pl = page_of(text(cap)[:30])
        prv, nxt = body[nonempty(i, -1)], body[nonempty(i + 1, 1)]
        pp = page_of(text(prv)[-30:], max(pc - 1, 0))
        pn = page_of(text(nxt)[:30], pc)
    else:
        continue
    checked += 1
    if pc != pl: problems.append(f'{label}: split across pages {pc+1}-{pl+1}')
    if pp != pc: problems.append(f'{label}: starts page {pc+1} (previous text on page {pp+1 if pp is not None else "?"})')
    if pn != pl: problems.append(f'{label}: ends page {pl+1} (next text on page {pn+1 if pn is not None else "?"})')
print(f'checked {checked} tables/figures')
print('\n'.join(problems) if problems else 'OK: no violations')
