import subprocess, json, sys
pdf, heads = sys.argv[1], json.load(open(sys.argv[2]))
n = int([l for l in subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.splitlines() if l.startswith('Pages')][0].split()[1])
texts = [subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), '-layout', pdf, '-'], capture_output=True, text=True).stdout for i in range(1, n + 1)]
norm = lambda s: ' '.join(s.split()).upper()
res = {}
for h in heads:
    for i in range(2, n):  # skip cover and TOC pages
        lines = [norm(l) for l in texts[i].splitlines() if l.strip()]
        if any(l == norm(h) for l in lines):
            res[h] = i + 1; break
    else:
        res[h] = None
json.dump(res, open('pages.json', 'w'), indent=1, ensure_ascii=False); print(res)
