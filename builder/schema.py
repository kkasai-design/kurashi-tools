# -*- coding: utf-8 -*-
"""ツール定義JSONのスキーマ検証(標準ライブラリのみ)"""
import re

ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")

INPUT_TYPES = {"date", "time", "number", "select", "radio", "text", "textarea"}


def validate_tool(tool, categories, published=True):
    """ツール定義を検証し、エラーメッセージのリストを返す(空なら合格)"""
    errs = []
    tid = tool.get("id", "<no-id>")

    def err(msg):
        errs.append(f"[{tid}] {msg}")

    for key in ("id", "title", "h1", "category", "description", "ui", "logic_file", "related", "priority", "content"):
        if key not in tool:
            err(f"必須キーがありません: {key}")
    if errs:
        return errs

    if not ID_RE.match(tool["id"]):
        err("idは英小文字・数字・ハイフンのみ使用できます")
    if tool["category"] not in categories:
        err(f"未知のカテゴリ: {tool['category']}")
    if not tool["logic_file"].startswith("logic/") or not tool["logic_file"].endswith(".js"):
        err(f"logic_fileの形式が不正: {tool['logic_file']}")
    if not isinstance(tool["priority"], int):
        err("priorityは整数で指定してください")
    if len(tool.get("description", "")) < 30:
        err("descriptionが短すぎます(30文字以上)")

    ui = tool["ui"]
    if not isinstance(ui.get("inputs"), list) or not ui["inputs"]:
        err("ui.inputsが空です")
    else:
        for inp in ui["inputs"]:
            if inp.get("type") not in INPUT_TYPES:
                err(f"未知のinput type: {inp.get('type')}")
            if not inp.get("name"):
                err("inputにnameがありません")
            if inp.get("type") in ("select", "radio") and not inp.get("options"):
                err(f"input '{inp.get('name')}' にoptionsがありません")

    content = tool["content"]
    if published:
        if not content.get("intro"):
            err("content.introがありません(公開ツールには必須)")
        if not content.get("faq") or not isinstance(content["faq"], list) or len(content["faq"]) < 3:
            err("content.faqは3問以上必要です")
        else:
            for qa in content["faq"]:
                if not qa.get("q") or not qa.get("a"):
                    err("faqにqまたはaが欠けています")
        if not content.get("explanation_html") and not content.get("explanation_sections"):
            err("explanation_html か explanation_sections のどちらかが必要です")
        if not content.get("usage") and not content.get("usage_html"):
            err("usage か usage_html のどちらかが必要です")
        if not content.get("published_at"):
            err("content.published_atがありません")
    return errs


def validate_column(col):
    errs = []
    cid = col.get("slug", "<no-slug>")

    def err(msg):
        errs.append(f"[column:{cid}] {msg}")

    for key in ("slug", "title", "description", "published_at"):
        if not col.get(key):
            err(f"必須キーがありません: {key}")
    if col.get("slug") and not ID_RE.match(col["slug"]):
        err("slugは英小文字・数字・ハイフンのみ")
    if not col.get("body_html") and not col.get("body_sections"):
        err("body_html か body_sections が必要です")
    return errs
