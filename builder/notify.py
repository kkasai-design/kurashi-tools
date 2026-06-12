# -*- coding: utf-8 -*-
"""IndexNow通知: 新規公開URLをBing等の検索エンジンへ即時通知(ベストエフォート)"""
import json
import os
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def main():
    site = json.load(open(os.path.join(ROOT, "config", "site.json"), encoding="utf-8"))
    state_path = os.path.join(ROOT, "state", "runlog.json")
    if not os.path.exists(state_path):
        print("stateなし。スキップ")
        return
    state = json.load(open(state_path, encoding="utf-8"))
    urls = state.get("last_published_urls") or []
    key = site.get("indexnow_key", "")
    if not urls or not key:
        print("通知するURLがありません。スキップ")
        return

    host = urllib.parse.urlparse(site["base_url"]).netloc
    body = json.dumps(
        {
            "host": host,
            "key": key,
            "keyLocation": f"{site['base_url']}/{key}.txt",
            "urlList": urls,
        }
    ).encode("utf-8")
    try:
        req = urllib.request.Request(
            "https://api.indexnow.org/indexnow",
            data=body,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow通知: HTTP {r.status} / {len(urls)}件 {urls}")
    except Exception as e:
        print(f"IndexNow通知失敗(無視して続行): {e}")


if __name__ == "__main__":
    main()
