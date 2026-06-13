# -*- coding: utf-8 -*-
"""くらしの計算室 静的サイトジェネレーター(標準ライブラリのみ・pip不要)

content/ + templates/ + config/ から dist/ を生成する。
最後に validate.py の検証ゲートを通し、1件でも問題があれば exit 1(デプロイ阻止)。
"""
import datetime
import glob
import html
import json
import os
import re
import shutil
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import schema  # noqa: E402
import validate  # noqa: E402

PLACEHOLDER = re.compile(r"\{\{(\w+)\}\}")


def esc(s):
    return html.escape(str(s), quote=True)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def read_text(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write_text(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def render(tpl, ctx):
    """{{key}} を ctx で置換。未知キーは残す(validateが検出してビルドを落とす)"""
    return PLACEHOLDER.sub(lambda m: str(ctx[m.group(1)]) if m.group(1) in ctx else m.group(0), tpl)


# ---------------- フォーム生成 ----------------

def build_form(ui):
    parts = []
    for inp in ui["inputs"]:
        t = inp["type"]
        name = inp["name"]
        label = inp.get("label", "")
        note = f'<p class="field-note">{esc(inp["note"])}</p>' if inp.get("note") else ""
        if t == "date":
            default_attr = ' data-default="today"' if inp.get("default") == "today" else ""
            value_attr = f' value="{esc(inp["default"])}"' if inp.get("default") and inp.get("default") != "today" else ""
            field = f'<input type="date" id="f-{name}" name="{name}"{default_attr}{value_attr}>'
        elif t == "time":
            value_attr = f' value="{esc(inp["default"])}"' if inp.get("default") else ""
            field = f'<input type="time" id="f-{name}" name="{name}"{value_attr}>'
        elif t == "number":
            attrs = ""
            for a in ("min", "max", "step"):
                if a in inp:
                    attrs += f' {a}="{inp[a]}"'
            if inp.get("placeholder"):
                attrs += f' placeholder="{esc(inp["placeholder"])}"'
            if inp.get("default") is not None:
                attrs += f' value="{inp["default"]}"'
            attrs += ' inputmode="decimal"'
            unit = f'<span class="unit">{esc(inp["unit"])}</span>' if inp.get("unit") else ""
            field = f'<input type="number" id="f-{name}" name="{name}"{attrs}>{unit}'
        elif t == "select":
            opts = []
            for o in inp["options"]:
                sel = " selected" if o.get("value") == inp.get("default") else ""
                opts.append(f'<option value="{esc(o["value"])}"{sel}>{esc(o["label"])}</option>')
            field = f'<select id="f-{name}" name="{name}">{"".join(opts)}</select>'
        elif t == "radio":
            radios = []
            for i, o in enumerate(inp["options"]):
                checked = " checked" if o.get("value") == inp.get("default") or (inp.get("default") is None and i == 0) else ""
                radios.append(
                    f'<label><input type="radio" name="{name}" value="{esc(o["value"])}"{checked}>{esc(o["label"])}</label>'
                )
            field = f'<div class="radio-group">{"".join(radios)}</div>'
        elif t == "textarea":
            ph = f' placeholder="{esc(inp["placeholder"])}"' if inp.get("placeholder") else ""
            field = f'<textarea id="f-{name}" name="{name}"{ph}></textarea>'
        else:  # text
            ph = f' placeholder="{esc(inp["placeholder"])}"' if inp.get("placeholder") else ""
            field = f'<input type="text" id="f-{name}" name="{name}"{ph}>'
        label_html = f'<label for="f-{name}">{esc(label)}</label>' if t != "radio" else f'<span class="field-label" style="display:block;font-weight:600;font-size:.9rem;margin-bottom:5px">{esc(label)}</span>'
        parts.append(f'<div class="field">{label_html}{field}{note}</div>')
    submit = ui.get("submit_label", "計算する")
    parts.append(f'<button type="submit" class="btn-calc">{esc(submit)}</button>')
    return "\n".join(parts)


# ---------------- コンテンツ部品 ----------------

def usage_html(content):
    if content.get("usage_html"):
        return content["usage_html"]
    items = "".join(f"<li>{esc(s)}</li>" for s in content.get("usage", []))
    return f"<ol>{items}</ol>"


def explanation_html(content):
    if content.get("explanation_html"):
        return content["explanation_html"]
    parts = []
    for sec in content.get("explanation_sections", []):
        if sec.get("h2"):
            parts.append(f"<h2>{esc(sec['h2'])}</h2>")
        if sec.get("h3"):
            parts.append(f"<h3>{esc(sec['h3'])}</h3>")
        for p in sec.get("paragraphs", []):
            parts.append(f"<p>{esc(p)}</p>")
    return "\n".join(parts)


def faq_html(faq):
    parts = []
    for qa in faq:
        parts.append(
            f'<details><summary>{esc(qa["q"])}</summary><div class="faq-a"><p>{esc(qa["a"])}</p></div></details>'
        )
    return "\n".join(parts)


def related_html(tool, tools_by_id, base_path):
    cards = []
    for rid in tool.get("related", []):
        rt = tools_by_id.get(rid)
        if not rt:
            continue
        cards.append(
            f'<a class="tool-card" href="{base_path}/{rt["id"]}/">'
            f'<span class="tc-title">{esc(rt["title"])}</span>'
            f'<span class="tc-desc">{esc(rt["description"][:60])}…</span></a>'
        )
    return f'<div class="tool-cards">{"".join(cards)}</div>' if cards else "<p>準備中です。</p>"


def breadcrumb(items, base_path):
    """items: [(label, url or None)] 最後は現在ページ"""
    lis = []
    for label, url in items:
        if url:
            lis.append(f'<li><a href="{url}">{esc(label)}</a></li>')
        else:
            lis.append(f"<li>{esc(label)}</li>")
    return f'<nav class="breadcrumb" aria-label="現在地"><ol>{"".join(lis)}</ol></nav>'


def breadcrumb_jsonld(items, base_url):
    elements = []
    for i, (label, url) in enumerate(items, 1):
        el = {"@type": "ListItem", "position": i, "name": label}
        if url:
            el["item"] = base_url + url.replace(SITE["base_path"], "", 1) if url.startswith(SITE["base_path"]) else url
        elements.append(el)
    return {"@type": "BreadcrumbList", "itemListElement": elements}


# ---------------- 収益スロット ----------------

def rakuten_button(keyword, mon):
    aid = mon.get("rakuten", {}).get("affiliate_id", "")
    if not aid or not keyword:
        return ""
    target = "https://search.rakuten.co.jp/search/mall/" + urllib.parse.quote(keyword) + "/"
    q = urllib.parse.quote(target, safe="")
    url = f"https://hb.afl.rakuten.co.jp/hgc/{aid}/?pc={q}&m={q}"
    label = mon["rakuten"].get("label", "楽天市場で探す")
    return (
        f'<a class="rakuten-btn" href="{esc(url)}" target="_blank" rel="noopener sponsored">'
        f"{esc(label)}:「{esc(keyword)}」</a>"
    )


def cta_box(cta):
    if not cta or not cta.get("url"):
        return ""
    text = f'<p class="cta-text">{esc(cta["text"])}</p>' if cta.get("text") else ""
    return (
        f'<div class="cta-box">{text}'
        f'<a class="cta-btn" href="{esc(cta["url"])}" target="_blank" rel="noopener sponsored">{esc(cta.get("button", "詳しく見る"))}</a></div>'
    )


def slot_html(slot_name, tool, mon):
    parts = []
    for item in mon.get("slots", {}).get(slot_name, []):
        if item == "cta":
            h = cta_box((tool or {}).get("monetize", {}).get("cta"))
            if h:
                parts.append(h)
        elif item == "rakuten":
            h = rakuten_button((tool or {}).get("monetize", {}).get("rakuten_keyword"), mon)
            if h:
                parts.append(h)
        elif item.startswith("html:"):
            block = mon.get("html_blocks", {}).get(item[5:], "")
            if block and block.strip():
                parts.append(block)
    if not parts:
        return ""
    return '<div class="monetize-slot">' + "\n".join(parts) + "</div>"


# ---------------- ページレンダリング ----------------

def base_ctx(site, mon):
    nav = "".join(
        f'<a href="{site["base_path"]}/category/{cid}/">{esc(c["name"])}</a>'
        for cid, c in site["categories"].items()
    )
    gsc = ""
    if site.get("gsc_meta_content"):
        gsc = f'<meta name="google-site-verification" content="{esc(site["gsc_meta_content"])}">\n'
    return {
        "site_name": site["site_name"],
        "base_path": site["base_path"],
        "year": datetime.date.today().year,
        "header_nav": nav,
        "gsc_meta": gsc,
        "og_image": site["base_url"] + "/assets/img/ogp.png",
        "adsense_head": mon.get("adsense_head_tag", "") or "",
        "analytics": site.get("analytics_head_html", "") or "",
    }


def render_page(site, mon, *, path, title, description, content_html, jsonld_objs, og_type="article"):
    """path: '' or 'age/' のような相対パス(末尾スラッシュ)"""
    canonical = site["base_url"] + "/" + path
    ctx = dict(base_ctx(site, mon))
    graph = {"@context": "https://schema.org", "@graph": jsonld_objs}
    ctx.update(
        title=esc(title),
        og_title=esc(title),
        description=esc(description),
        canonical=canonical,
        og_type=og_type,
        jsonld='<script type="application/ld+json">' + json.dumps(graph, ensure_ascii=False) + "</script>\n",
        content=content_html,
    )
    page = render(TEMPLATES["base"], ctx)
    out = os.path.join(DIST, path.replace("/", os.sep), "index.html")
    write_text(out, page)


def render_tool_page(tool, site, mon, tools_by_id):
    cat = site["categories"][tool["category"]]
    bp = site["base_path"]
    bc_items = [
        ("ホーム", f"{bp}/"),
        (cat["name"], f"{bp}/category/{tool['category']}/"),
        (tool["title"], None),
    ]
    content = tool["content"]
    page_url = f"{site['base_url']}/{tool['id']}/"
    ctx = {
        "breadcrumb": breadcrumb(bc_items, bp),
        "h1": esc(tool["h1"]),
        "intro": esc(content["intro"]),
        "form_html": build_form(tool["ui"]),
        "slot_below_result": slot_html("below_result", tool, mon),
        "slot_before_faq": slot_html("before_faq", tool, mon),
        "slot_article_bottom": slot_html("article_bottom", tool, mon),
        "share_url": urllib.parse.quote(page_url, safe=""),
        "share_text": urllib.parse.quote(tool["title"] + " | " + site["site_name"], safe=""),
        "page_url": page_url,
        "usage_html": usage_html(content),
        "explanation_html": explanation_html(content),
        "faq_html": faq_html(content.get("faq", [])),
        "related_html": related_html(tool, tools_by_id, bp),
        "updated_date": content.get("updated_at") or content.get("published_at"),
        "base_path": bp,
        "tool_id": tool["id"],
        "realtime": "true" if tool["ui"].get("realtime") else "false",
    }
    body = render(TEMPLATES["tool"], ctx)

    jsonld = [
        {
            "@type": "WebApplication",
            "name": tool["title"],
            "url": page_url,
            "description": tool["description"],
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "Any",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "JPY"},
            "inLanguage": "ja",
        },
        breadcrumb_jsonld(bc_items, site["base_url"]),
    ]
    if content.get("faq"):
        jsonld.append(
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": qa["q"],
                        "acceptedAnswer": {"@type": "Answer", "text": qa["a"]},
                    }
                    for qa in content["faq"]
                ],
            }
        )
    render_page(
        site, mon,
        path=f"{tool['id']}/",
        title=f"{tool['title']}|{site['site_name']}",
        description=tool["description"],
        content_html=body,
        jsonld_objs=jsonld,
    )


def tool_card(tool, bp):
    return (
        f'<a class="tool-card" href="{bp}/{tool["id"]}/">'
        f'<span class="tc-title">{esc(tool["title"])}</span>'
        f'<span class="tc-desc">{esc(tool["description"][:64])}…</span></a>'
    )


def render_category_pages(tools, site, mon):
    bp = site["base_path"]
    for cid, cat in site["categories"].items():
        cat_tools = [t for t in tools if t["category"] == cid]
        cards = "".join(tool_card(t, bp) for t in cat_tools)
        body_cards = f'<div class="tool-cards">{cards}</div>' if cat_tools else "<p>このカテゴリのツールは準備中です。</p>"
        bc_items = [("ホーム", f"{bp}/"), (cat["name"], None)]
        body = (
            breadcrumb(bc_items, bp)
            + f'<article class="static-page"><h1>{esc(cat["name"])}の計算ツール</h1>'
            + f'<p class="intro">{esc(cat["description"])}</p>'
            + body_cards
            + "</article>"
        )
        render_page(
            site, mon,
            path=f"category/{cid}/",
            title=f"{cat['name']}の計算ツール一覧|{site['site_name']}",
            description=cat["description"] + f"。{site['site_name']}の{cat['name']}カテゴリのツール一覧です。",
            content_html=body,
            jsonld_objs=[breadcrumb_jsonld(bc_items, site["base_url"])],
        )


def render_index(tools, columns, site, mon):
    bp = site["base_path"]
    sections = []
    sections.append(
        f'<div class="hero"><h1>{esc(site["site_name"])}</h1><p>{esc(site["tagline"])}。'
        f"会員登録なし・無料・スマホ対応の計算ツール集です。</p></div>"
    )
    for cid, cat in site["categories"].items():
        cat_tools = [t for t in tools if t["category"] == cid]
        if not cat_tools:
            continue
        cards = "".join(tool_card(t, bp) for t in cat_tools)
        sections.append(
            f'<section class="category-section"><h2>{esc(cat["name"])}</h2>'
            f'<div class="tool-cards">{cards}</div>'
            f'<p class="category-link"><a href="{bp}/category/{cid}/">{esc(cat["name"])}のツールをすべて見る →</a></p></section>'
        )
    if columns:
        items = "".join(
            f'<a class="tool-card" href="{bp}/column/{c["slug"]}/">'
            f'<span class="tc-title">{esc(c["title"])}</span>'
            f'<span class="tc-desc">{esc(c["description"][:64])}…</span></a>'
            for c in sorted(columns, key=lambda c: c["published_at"], reverse=True)[:6]
        )
        sections.append(f'<section class="category-section"><h2>コラム</h2><div class="tool-cards">{items}</div></section>')

    jsonld = [
        {
            "@type": "WebSite",
            "name": site["site_name"],
            "url": site["base_url"] + "/",
            "description": site["tagline"],
            "inLanguage": "ja",
        }
    ]
    render_page(
        site, mon,
        path="",
        title=f"{site['site_name']}|無料で使える生活系計算ツール集",
        description="年齢計算・卒業年早見・厄年・和暦変換・割り勘など、暮らしの「ちょっと計算したい」を3秒で解決する無料ツール集。登録不要・スマホ対応。",
        content_html="\n".join(sections),
        jsonld_objs=jsonld,
        og_type="website",
    )


def contact_block_html(site):
    url = site.get("contact_form_url", "")
    if url:
        return f'<a href="{esc(url)}" target="_blank" rel="noopener">お問い合わせフォーム</a>よりご連絡ください(Googleフォームが開きます)。'
    return "お問い合わせフォームは現在準備中です。今しばらくお待ちください。"


def render_static_pages(pages, site, mon):
    bp = site["base_path"]
    for pg in pages:
        bc_items = [("ホーム", f"{bp}/"), (pg["title"], None)]
        body_html = (
            pg["body_html"]
            .replace("{{contact_block}}", contact_block_html(site))
            .replace("{{base_path}}", bp)
        )
        body = (
            breadcrumb(bc_items, bp)
            + f'<article class="static-page"><h1>{esc(pg["title"])}</h1>{body_html}</article>'
        )
        render_page(
            site, mon,
            path=f"{pg['slug']}/",
            title=f"{pg['title']}|{site['site_name']}",
            description=pg["description"],
            content_html=body,
            jsonld_objs=[breadcrumb_jsonld(bc_items, site["base_url"])],
        )


def render_columns(columns, tools_by_id, site, mon):
    bp = site["base_path"]
    for col in columns:
        bc_items = [("ホーム", f"{bp}/"), ("コラム", None), (col["title"], None)]
        body_parts = [breadcrumb([("ホーム", f"{bp}/"), (col["title"], None)], bp)]
        body_parts.append(f'<article class="static-page"><h1>{esc(col["title"])}</h1>')
        if col.get("body_html"):
            body_parts.append(col["body_html"])
        else:
            for sec in col.get("body_sections", []):
                if sec.get("h2"):
                    body_parts.append(f"<h2>{esc(sec['h2'])}</h2>")
                for p in sec.get("paragraphs", []):
                    body_parts.append(f"<p>{esc(p)}</p>")
        rel = col.get("related_tool")
        if rel and rel in tools_by_id:
            rt = tools_by_id[rel]
            body_parts.append(
                f'<h2>関連ツール</h2><div class="tool-cards">{tool_card(rt, bp)}</div>'
            )
        body_parts.append(f'<p class="page-meta">公開日: {esc(col["published_at"])}</p></article>')
        render_page(
            site, mon,
            path=f"column/{col['slug']}/",
            title=f"{col['title']}|{site['site_name']}",
            description=col["description"],
            content_html="\n".join(body_parts),
            jsonld_objs=[breadcrumb_jsonld([("ホーム", f"{bp}/"), (col["title"], None)], site["base_url"])],
        )


def render_404(tools, site, mon):
    bp = site["base_path"]
    popular = "".join(tool_card(t, bp) for t in tools[:6])
    body = (
        '<article class="static-page"><h1>ページが見つかりません</h1>'
        "<p>お探しのページは移動または削除された可能性があります。</p>"
        f'<p><a href="{bp}/">トップページへ戻る</a></p>'
        f'<h2>よく使われているツール</h2><div class="tool-cards">{popular}</div></article>'
    )
    ctx = dict(base_ctx(site, mon))
    ctx.update(
        title=f"ページが見つかりません|{site['site_name']}",
        og_title=f"ページが見つかりません|{site['site_name']}",
        description="お探しのページは見つかりませんでした。",
        canonical=site["base_url"] + "/404.html",
        og_type="website",
        jsonld="",
        content=body,
    )
    write_text(os.path.join(DIST, "404.html"), render(TEMPLATES["base"], ctx))


# ---------------- サイトマップ・フィード ----------------

def build_sitemap(urls, site):
    today = datetime.date.today().isoformat()
    items = []
    for path, lastmod in urls:
        items.append(
            f"<url><loc>{site['base_url']}/{path}</loc><lastmod>{lastmod or today}</lastmod></url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(items)
        + "\n</urlset>\n"
    )
    write_text(os.path.join(DIST, "sitemap.xml"), xml)


def build_rss(tools, columns, site):
    entries = []
    for t in tools:
        entries.append(
            {
                "title": t["title"],
                "url": f"{site['base_url']}/{t['id']}/",
                "description": t["description"],
                "date": t["content"].get("published_at", "2026-01-01"),
            }
        )
    for c in columns:
        entries.append(
            {
                "title": c["title"],
                "url": f"{site['base_url']}/column/{c['slug']}/",
                "description": c["description"],
                "date": c["published_at"],
            }
        )
    entries.sort(key=lambda e: e["date"], reverse=True)
    items = []
    for e in entries[:20]:
        pub = datetime.datetime.strptime(e["date"], "%Y-%m-%d").strftime("%a, %d %b %Y 06:00:00 +0900")
        items.append(
            f"<item><title>{esc(e['title'])}</title><link>{e['url']}</link>"
            f"<guid>{e['url']}</guid><pubDate>{pub}</pubDate>"
            f"<description>{esc(e['description'])}</description></item>"
        )
    rss = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"><channel>'
        f"<title>{esc(site['site_name'])}</title>"
        f"<link>{site['base_url']}/</link>"
        f"<description>{esc(site['tagline'])}</description>"
        f"<language>ja</language>"
        + "".join(items)
        + "</channel></rss>\n"
    )
    write_text(os.path.join(DIST, "rss.xml"), rss)


# ---------------- メイン ----------------

SITE = None
TEMPLATES = {}


def main():
    global SITE, TEMPLATES
    site = load_json(os.path.join(ROOT, "config", "site.json"))
    mon = load_json(os.path.join(ROOT, "config", "monetize.json"))
    SITE = site
    TEMPLATES = {
        "base": read_text(os.path.join(ROOT, "templates", "base.html")),
        "tool": read_text(os.path.join(ROOT, "templates", "tool.html")),
    }

    # コンテンツのロード
    tools = [load_json(p) for p in sorted(glob.glob(os.path.join(ROOT, "content", "tools", "*.json")))]
    columns = [load_json(p) for p in sorted(glob.glob(os.path.join(ROOT, "content", "columns", "*.json")))]
    pages = [load_json(p) for p in sorted(glob.glob(os.path.join(ROOT, "content", "pages", "*.json")))]

    # スキーマ検証(公開コンテンツ)
    errors = []
    seen_ids = set()
    for t in tools:
        errors.extend(schema.validate_tool(t, site["categories"], published=True))
        if t.get("id") in seen_ids:
            errors.append(f"[{t['id']}] idが重複しています")
        seen_ids.add(t.get("id"))
    for c in columns:
        errors.extend(schema.validate_column(c))
    tools_by_id = {t["id"]: t for t in tools}
    for t in tools:
        for rid in t.get("related", []):
            if rid not in tools_by_id:
                # キュー内ツールへの先行リンクは未公開の間スキップ表示されるだけなので警告に留める
                print(f"  注意: [{t['id']}] related先が未公開: {rid}(表示はスキップされます)")
        lf = os.path.join(ROOT, t["logic_file"])
        if not os.path.exists(lf):
            errors.append(f"[{t['id']}] logicファイルがありません: {t['logic_file']}")
        tf = os.path.join(ROOT, "tests", t["id"] + ".test.json")
        if not os.path.exists(tf):
            errors.append(f"[{t['id']}] テストファイルがありません: tests/{t['id']}.test.json")
    if errors:
        print("スキーマ検証エラー:", file=sys.stderr)
        for e in errors:
            print("  ✗ " + e, file=sys.stderr)
        sys.exit(1)

    # 表示順: priority昇順 → id
    tools.sort(key=lambda t: (t.get("priority", 99), t["id"]))

    # dist初期化
    if os.path.exists(DIST):
        shutil.rmtree(DIST)
    os.makedirs(DIST)
    shutil.copytree(os.path.join(ROOT, "assets"), os.path.join(DIST, "assets"))
    os.makedirs(os.path.join(DIST, "logic"))
    for t in tools:
        shutil.copy2(os.path.join(ROOT, t["logic_file"]), os.path.join(DIST, "logic"))
    shutil.copy2(os.path.join(ROOT, "logic", "_date.js"), os.path.join(DIST, "logic"))

    # ページ生成
    for t in tools:
        render_tool_page(t, site, mon, tools_by_id)
    render_category_pages(tools, site, mon)
    render_index(tools, columns, site, mon)
    render_static_pages(pages, site, mon)
    render_columns(columns, tools_by_id, site, mon)
    render_404(tools, site, mon)

    # sitemap / robots / rss / IndexNow / ads.txt
    urls = [("", None)]
    urls += [(f"{t['id']}/", t["content"].get("updated_at") or t["content"].get("published_at")) for t in tools]
    urls += [(f"category/{cid}/", None) for cid in site["categories"]]
    urls += [(f"{p['slug']}/", None) for p in pages]
    urls += [(f"column/{c['slug']}/", c["published_at"]) for c in columns]
    build_sitemap(urls, site)
    build_rss(tools, columns, site)
    write_text(
        os.path.join(DIST, "robots.txt"),
        f"User-agent: *\nAllow: /\n\nSitemap: {site['base_url']}/sitemap.xml\n",
    )
    if site.get("indexnow_key"):
        write_text(os.path.join(DIST, site["indexnow_key"] + ".txt"), site["indexnow_key"])
    if mon.get("ads_txt", "").strip():
        write_text(os.path.join(DIST, "ads.txt"), mon["ads_txt"].strip() + "\n")
    if site.get("custom_domain", "").strip():
        write_text(os.path.join(DIST, "CNAME"), site["custom_domain"].strip() + "\n")
    write_text(os.path.join(DIST, ".nojekyll"), "")

    # 検証ゲート
    problems = validate.validate_dist(DIST, site)
    if problems:
        print("dist検証エラー:", file=sys.stderr)
        for p in problems:
            print("  ✗ " + p, file=sys.stderr)
        sys.exit(1)

    page_count = sum(1 for _ in glob.iglob(os.path.join(DIST, "**", "*.html"), recursive=True))
    print(f"ビルド成功: ツール{len(tools)}本 / コラム{len(columns)}本 / 全{page_count}ページ → dist/")


if __name__ == "__main__":
    main()
