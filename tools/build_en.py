"""Build /en/ pages from the Russian ones by translating text nodes and attributes."""
import html, json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(__file__))
from en import T
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NORM = lambda s: re.sub(r'\s+', ' ', s.replace('\xa0', ' ')).strip()
TT = {NORM(k): v for k, v in T.items()}
CYR = re.compile('[А-Яа-яЁё]')
missing = set()

def tr(text):
    key = NORM(html.unescape(text))
    if not CYR.search(key): return None
    if key in TT: return TT[key]
    missing.add(key); return None

def translate_html(src):
    out, pos = [], 0
    skip = None
    for m in re.finditer(r'<(/?)([a-zA-Z0-9]+)([^>]*)>', src):
        text = src[pos:m.start()]
        if skip is None and text.strip():
            v = tr(text)
            if v is not None:
                lead = re.match(r'\s*', text).group(0); trail = re.search(r'\s*$', text).group(0)
                text = lead + html.escape(v, quote=False) + trail
        out.append(text)
        closing, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if not closing and tag in ('script', 'style'): skip = tag
        elif closing and tag == skip: skip = None
        def fix_attr(a):
            v = tr(a.group(3))
            return a.group(0) if v is None else f'{a.group(1)}={a.group(2)}{html.escape(v, quote=True)}{a.group(2)}'
        attrs = re.sub(r'\b(alt|aria-label|content|title|data-title)=(["\'])(.*?)\2', fix_attr, attrs)
        out.append(f'<{closing}{m.group(2)}{attrs}>')
        pos = m.end()
    out.append(src[pos:])
    return ''.join(out)

def portfolio_json(src):
    def fix(m):
        data = json.loads(m.group(1))
        for w in data:
            for k in ('title', 'detail'):
                w[k] = tr(w[k]) or w[k]
            for s in w['slides']:
                s['alt'] = tr(s['alt']) or s['alt']
        return m.group(0).replace(m.group(1), json.dumps(data, ensure_ascii=False))
    return re.sub(r'<script id="portfolio-data" type="application/json">(.*?)</script>', fix, src, flags=re.S)

def paths(src, page):
    # every local asset and script goes one level up; page links stay inside /en/
    src = re.sub(r'(\b(?:src|href|srcset|imagesrcset)=")(?!https?:|mailto:|tel:|#|data:|index\.html|resume\.html|\.\./)', r'\1../', src)
    src = re.sub(r'(srcset="[^"]*")', lambda m: re.sub(r',\s*(?!\.\./)(assets/)', r', ../\1', m.group(1)), src)
    src = src.replace('<html lang="ru">', '<html lang="en">')
    # language switch: on English pages RU is the link, EN is current
    src = re.sub(r'<span class="(lang-switch[^"]*)" aria-label="[^"]*"><span aria-current="true">RU</span><a href="\.\./en/([a-z]+\.html)" hreflang="en" lang="en">EN</a></span>',
                 r'<span class="\1" aria-label="Site language"><a href="../\2" hreflang="ru" lang="ru">RU</a><span aria-current="true">EN</span></span>', src)
    src = src.replace('href="../https:', 'href="https:')
    src = src.replace('og:locale" content="ru_RU"', 'og:locale" content="en_US"')
    url = 'https://denisberzh.github.io/en/' + ('' if page == 'index.html' else page)
    src = re.sub(r'(<link rel="canonical" href=")[^"]*', r'\1' + url, src)
    src = re.sub(r'(<meta property="og:url" content=")[^"]*', r'\1' + url, src)
    return src

for page in ('index.html', 'resume.html'):
    src = open(os.path.join(SITE, page), encoding='utf-8').read()
    out = paths(portfolio_json(translate_html(src)), page)
    os.makedirs(os.path.join(SITE, 'en'), exist_ok=True)
    open(os.path.join(SITE, 'en', page), 'w', encoding='utf-8', newline='').write(out)
    left = [m for m in re.findall(r'>([^<]*[А-Яа-яЁё][^<]*)<', out) if not re.fullmatch(r'\s*Я\s*', m)]
    print(page, 'остаток кириллицы в тексте:', left[:10])
print('нет перевода:', sorted(missing))
