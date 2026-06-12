# -*- coding: utf-8 -*-
"""dist検証ゲート: 壊れたサイトを公開しないための最終チェック(標準ライブラリのみ)

検出対象:
- 未置換のテンプレートプレースホルダ {{...}}
- 内部リンク切れ(href/src)
- JSON-LDの構文エラー
- titleタグの欠落
- APIキー等の秘密情報の混入
"""
import glob
import json
import os
import re
import urllib.parse

PLACEHOLDER_RE = re.compile(r"\{\{\w+\}\}")
LINK_RE = re.compile(r'(?:href|src)="([^"]+)"')
JSONLD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.DOTALL)
TITLE_RE = re.compile(r"<title>([^<]*)</title>")
SECRET_PATTERNS = [
    (re.compile(r"AQ\.[A-Za-z0-9_-]{20,}"), "Gemini APIキー形式"),
    (re.compile(r"AIza[0-9A-Za-z_-]{30,}"), "Google APIキー形式"),
    (re.compile(r"gh[pos]_[A-Za-z0-9]{30,}"), "GitHubトークン形式"),
    (re.compile(r"sk-[A-Za-z0-9]{30,}"), "APIシークレット形式"),
]


def validate_dist(dist, site):
    problems = []
    base_path = site["base_path"]
    html_files = glob.glob(os.path.join(dist, "**", "*.html"), recursive=True)
    if len(html_files) < 3:
        problems.append(f"HTMLページが少なすぎます({len(html_files)}ページ)")

    for path in html_files:
        rel = os.path.relpath(path, dist).replace(os.sep, "/")
        with open(path, encoding="utf-8") as f:
            text = f.read()

        for m in PLACEHOLDER_RE.finditer(text):
            problems.append(f"{rel}: 未置換プレースホルダ {m.group(0)}")

        tm = TITLE_RE.search(text)
        if not tm or not tm.group(1).strip():
            problems.append(f"{rel}: titleが空です")

        for m in JSONLD_RE.finditer(text):
            try:
                json.loads(m.group(1))
            except json.JSONDecodeError as e:
                problems.append(f"{rel}: JSON-LD構文エラー: {e}")

        for pat, label in SECRET_PATTERNS:
            if pat.search(text):
                problems.append(f"{rel}: 秘密情報の混入の疑い({label})")

        # 内部リンク検証
        for m in LINK_RE.finditer(text):
            url = m.group(1)
            if url.startswith(("http://", "https://", "mailto:", "#", "data:")):
                continue
            target = url
            if base_path and target.startswith(base_path + "/"):
                target = target[len(base_path):]
            elif base_path and target == base_path:
                target = "/"
            target = urllib.parse.unquote(target.split("#")[0].split("?")[0])
            if not target.startswith("/"):
                # 相対リンクは使わない方針
                problems.append(f"{rel}: 相対リンクは禁止です: {url}")
                continue
            fs = target.lstrip("/")
            candidates = [
                os.path.join(dist, fs.replace("/", os.sep)),
                os.path.join(dist, fs.replace("/", os.sep), "index.html"),
            ]
            if not any(os.path.isfile(c) for c in candidates):
                problems.append(f"{rel}: リンク切れ: {url}")

    # sitemapのURLが実在するか
    sitemap = os.path.join(dist, "sitemap.xml")
    if os.path.exists(sitemap):
        with open(sitemap, encoding="utf-8") as f:
            sm = f.read()
        for m in re.finditer(r"<loc>([^<]+)</loc>", sm):
            loc = m.group(1)
            path_part = loc.replace(site["base_url"], "").lstrip("/")
            fs = os.path.join(dist, path_part.replace("/", os.sep), "index.html")
            fs2 = os.path.join(dist, path_part.replace("/", os.sep))
            if not (os.path.isfile(fs) or os.path.isfile(fs2)):
                problems.append(f"sitemap.xml: 存在しないURL: {loc}")
    else:
        problems.append("sitemap.xmlがありません")

    return problems
