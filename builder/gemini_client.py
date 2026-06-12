# -*- coding: utf-8 -*-
"""Gemini API クライアント(標準ライブラリのみ・REST直叩き)

- モデルは利用可能なflash系から自動選択(モデル廃止に自動追従)
- 429/5xx は指数バックオフでリトライ
- JSONモードで構造化出力を受け取る
"""
import json
import os
import time
import urllib.error
import urllib.request

API_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _key():
    # BOM・ゼロ幅文字の混入(Secrets設定時の事故)に耐える
    k = os.environ.get("GEMINI_API_KEY", "").strip().strip("﻿​\r\n ").strip()
    if not k:
        raise RuntimeError("環境変数 GEMINI_API_KEY が設定されていません")
    return k


def pick_model():
    """flash系の安定モデルを自動選択。GEMINI_MODEL環境変数で上書き可"""
    preferred = os.environ.get("GEMINI_MODEL", "").strip()
    if preferred:
        return preferred
    try:
        req = urllib.request.Request(f"{API_BASE}/models?key={_key()}&pageSize=200")
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
        names = []
        for m in data.get("models", []):
            name = m.get("name", "").replace("models/", "")
            if "flash" not in name:
                continue
            if "generateContent" not in m.get("supportedGenerationMethods", []):
                continue
            # 実験版・特殊用途版を避ける
            if any(x in name for x in ("8b", "lite", "exp", "preview", "thinking", "image", "tts", "live", "audio", "latest")):
                continue
            names.append(name)
        names.sort(reverse=True)  # バージョン文字列の降順 = 新しい安定版が先頭
        if names:
            return names[0]
    except Exception as e:
        print(f"  モデル一覧の取得に失敗(フォールバックを使用): {e}")
    return "gemini-2.0-flash"


def generate_json(prompt, max_retries=3):
    """プロンプトを投げてJSONレスポンスを返す。戻り値: (parsed_dict, model_name)"""
    model = pick_model()
    url = f"{API_BASE}/models/{model}:generateContent?key={_key()}"
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            },
        }
    ).encode("utf-8")

    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text), model
        except urllib.error.HTTPError as e:
            last_err = f"HTTP {e.code}: {e.read().decode('utf-8', 'replace')[:300]}"
            if e.code in (429, 500, 502, 503, 504) and attempt < max_retries:
                wait = 30 * attempt
                print(f"  Gemini API {e.code} → {wait}秒待ってリトライ({attempt}/{max_retries})")
                time.sleep(wait)
                continue
            raise RuntimeError(f"Gemini APIエラー: {last_err}")
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            last_err = f"レスポンス解析失敗: {e}"
            if attempt < max_retries:
                time.sleep(10)
                continue
            raise RuntimeError(last_err)
        except Exception as e:
            last_err = str(e)
            if attempt < max_retries:
                time.sleep(15)
                continue
            raise RuntimeError(f"Gemini API呼び出し失敗: {last_err}")
    raise RuntimeError(f"Gemini API呼び出し失敗: {last_err}")
