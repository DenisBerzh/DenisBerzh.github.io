"""Checks every page for broken local links and images, duplicate ids and missing alt text.
Run from the repo root: python tools/check_site.py (exits 1 on problems)."""
import json, os, re, sys
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['index.html', 'resume.html', '404.html', 'en/index.html', 'en/resume.html']
problems = []

def local(base, url):
    if not url or url.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:', '#')): return None
    path = url.split('#')[0].split('?')[0]
    return os.path.normpath(os.path.join(SITE, path.lstrip('/')) if path.startswith('/') else os.path.join(SITE, base, path))

for page in PAGES:
    src = open(os.path.join(SITE, page), encoding='utf-8').read()
    base = os.path.dirname(page)
    ids = re.findall(r'\bid="([^"]+)"', src)
    for i in sorted({i for i in ids if ids.count(i) > 1}): problems.append(f'{page}: duplicate id "{i}"')
    urls = re.findall(r'\b(?:src|href)="([^"]+)"', src)
    for srcset in re.findall(r'\bsrcset="([^"]+)"', src): urls += [p.split()[0] for p in srcset.split(',') if p.strip()]
    data = re.search(r'<script id="portfolio-data" type="application/json">(.*?)</script>', src, re.S)
    if data:
        for work in json.loads(data.group(1)):
            for slide in work['slides']: urls += [slide[k] for k in ('src', 'view', 'original') if k in slide]
    for url in urls:
        if url.startswith('#') and len(url) > 1 and url[1:] not in ids: problems.append(f'{page}: link to missing #{url[1:]}')
        path = local(base, url)
        if path and not os.path.exists(path): problems.append(f'{page}: missing file {url}')
    for img in re.findall(r'<img\b[^>]*>', src):
        if ' alt=' not in img: problems.append(f'{page}: image without alt: {img[:80]}')
    if src.count('<h1') != 1: problems.append(f'{page}: expected one h1, found {src.count("<h1")}')

print('\n'.join(problems) or f'OK: {len(PAGES)} pages checked')
sys.exit(1 if problems else 0)
