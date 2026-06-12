# -*- coding: utf-8 -*-
"""毎日の自動成長エンジン

優先順位:
1. queue/pending から1本公開(Geminiが解説文のみ生成。計算ロジックは人間実装+テスト済み)
2. キューが空ならエンリッチモード:
   a. コラム追加(各ツール1本まで・サイト全体で上限45本 → スパムポリシー回避)
   b. 180日経過したGemini生成解説のリフレッシュ
3. 同一項目5回失敗で queue/failed/ へ隔離(キュー詰まり防止)

Gemini API障害時は exit 0 でスキップ(翌日自動リトライ)。
このスクリプトは content/ と queue/ と state/ だけを書き換える。ビルドは build.py の仕事。
"""
import datetime
import glob
import json
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gemini_client  # noqa: E402

STATE_PATH = os.path.join(ROOT, "state", "runlog.json")
MAX_COLUMNS = 45
REFRESH_DAYS = 180
NG_WORDS = ["必ず儲", "絶対に当た", "100%安全", "完全に正確", "診断します", "治ります", "確実に痩せ"]


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_state():
    if os.path.exists(STATE_PATH):
        return load_json(STATE_PATH)
    return {"attempts": {}, "last_run": None, "last_success": None, "last_published_urls": []}


def today_str():
    return datetime.date.today().isoformat()


# ---------------- プロンプト ----------------

def tool_prompt(tool, logic_src, tests):
    test_lines = []
    for c in tests[:8]:
        if c.get("expect", {}).get("throws"):
            continue
        test_lines.append(f"- 入力 {json.dumps(c['input'], ensure_ascii=False)} → 期待される結果 {json.dumps(c['expect'], ensure_ascii=False)}")
    inputs_desc = "、".join(f"{i.get('label', i['name'])}({i['type']})" for i in tool["ui"]["inputs"])
    return f"""あなたは日本の生活情報サイト「くらしの計算室」の編集者です。
以下の計算ツールのページに載せる解説コンテンツを、指定のJSON形式で書いてください。

# ツール情報
- タイトル: {tool['title']}
- 概要: {tool['description']}
- 狙い検索キーワード: {', '.join(tool.get('keywords', []))}
- 入力項目: {inputs_desc}

# 計算ロジック(実際に動いているJavaScriptソースコード。この仕様に沿った説明をすること)
```
{logic_src}
```

# 機械検証済みの計算例(数値はすべて正確。説明・FAQの例にはこの数値だけを使い、自分で新しい計算をしないこと)
{chr(10).join(test_lines)}

# 執筆ルール
- 丁寧な「です・ます」調。専門用語は噛み砕いて説明する
- 数値の例はかならず上の検証済み計算例から引用する
- 健康・お金・法律・伝統行事に関わる内容は断定せず「目安」「一般的に」とし、必要に応じて公的情報・専門家への確認を促す
- 誇大表現(「絶対」「必ず」「100%」)は使わない
- intro: 80〜150字。このツールで何ができて、どんな場面で役立つかを伝える
- usage: 操作手順を3ステップで(各40字以内)
- explanation_sections: 2〜4セクション。各セクションは h2(見出し・20字以内)と paragraphs(段落の配列、各段落120〜200字)。合計800字以上。仕組み・背景知識・実用的なコツを書く
- faq: 4問。検索されそうな疑問に答える(qは30字以内、aは60〜150字)

# 出力JSON形式(このキーのみ)
{{"intro": "...", "usage": ["...", "...", "..."], "explanation_sections": [{{"h2": "...", "paragraphs": ["...", "..."]}}], "faq": [{{"q": "...", "a": "..."}}]}}"""


def column_prompt(tool, existing_titles):
    return f"""あなたは日本の生活情報サイト「くらしの計算室」の編集者です。
計算ツール「{tool['title']}」のページに関連する読み物コラムを1本、指定のJSON形式で書いてください。

# 条件
- ツールページの解説と重複しない「周辺知識・実践ノウハウ・よくある失敗」などの切り口を選ぶ
- 読者がツール(概要: {tool['description']})を使う前後に知りたくなる内容にする
- 既存コラムとタイトルが重複しないこと: {json.dumps(existing_titles, ensure_ascii=False)}
- 丁寧な「です・ます」調。誇大表現禁止。断定が必要な専門領域は「一般的に」とし公的情報への確認を促す
- title: 32字以内。検索されやすい具体的な疑問形や「〜の方法」型
- description: 80〜120字
- body_sections: 3〜5セクション。各セクションは h2 と paragraphs(各段落120〜200字)。合計1,200字以上

# 出力JSON形式(このキーのみ)
{{"title": "...", "description": "...", "body_sections": [{{"h2": "...", "paragraphs": ["..."]}}]}}"""


def refresh_prompt(tool, logic_src, tests):
    base = tool_prompt(tool, logic_src, tests)
    return base + "\n\n# 追記\nこれは既存解説のリフレッシュ(書き直し)です。内容の正確性を保ちつつ、構成や言い回しを改善してください。"


# ---------------- 検証 ----------------

def text_of(data):
    return json.dumps(data, ensure_ascii=False)


def validate_tool_content(data):
    errs = []
    if not isinstance(data.get("intro"), str) or not (40 <= len(data["intro"]) <= 250):
        errs.append("introの長さが不正")
    if not isinstance(data.get("usage"), list) or not (2 <= len(data["usage"]) <= 5):
        errs.append("usageの項目数が不正")
    secs = data.get("explanation_sections")
    if not isinstance(secs, list) or not (1 <= len(secs) <= 6):
        errs.append("explanation_sectionsの形が不正")
    else:
        total = sum(len(p) for s in secs for p in s.get("paragraphs", []))
        if total < 500:
            errs.append(f"解説が短すぎる({total}字)")
        for s in secs:
            if not s.get("h2") or not s.get("paragraphs"):
                errs.append("セクションにh2/paragraphsがない")
                break
    faq = data.get("faq")
    if not isinstance(faq, list) or not (3 <= len(faq) <= 6):
        errs.append("faqの問数が不正")
    else:
        for qa in faq:
            if not qa.get("q") or not qa.get("a"):
                errs.append("faqにq/aが欠落")
                break
    blob = text_of(data)
    for ng in NG_WORDS:
        if ng in blob:
            errs.append(f"NGワード: {ng}")
    if "<script" in blob.lower() or "<a " in blob.lower():
        errs.append("HTMLタグの混入")
    return errs


def validate_column_content(data):
    errs = []
    if not isinstance(data.get("title"), str) or not (8 <= len(data["title"]) <= 40):
        errs.append("titleの長さが不正")
    if not isinstance(data.get("description"), str) or not (40 <= len(data["description"]) <= 160):
        errs.append("descriptionの長さが不正")
    secs = data.get("body_sections")
    if not isinstance(secs, list) or not (2 <= len(secs) <= 6):
        errs.append("body_sectionsの形が不正")
    else:
        total = sum(len(p) for s in secs for p in s.get("paragraphs", []))
        if total < 800:
            errs.append(f"本文が短すぎる({total}字)")
    blob = text_of(data)
    for ng in NG_WORDS:
        if ng in blob:
            errs.append(f"NGワード: {ng}")
    return errs


# ---------------- 公開処理 ----------------

def generate_with_retry(prompt, validator):
    """生成→検証を最大2回。

    戻り値: (data, model, api_error)
    - 成功: (dict, モデル名, False)
    - API障害: (None, 理由, True)  ← attemptsに数えない(翌日リトライで自然回復)
    - 検証NG: (None, 理由, False) ← attemptsに数える(5回で隔離)
    """
    last = "不明"
    for i in range(2):
        try:
            data, model = gemini_client.generate_json(prompt)
        except RuntimeError as e:
            return None, str(e), True
        errs = validator(data)
        if not errs:
            return data, model, False
        last = " / ".join(errs)
        print(f"  生成物の検証NG(再生成 {i + 1}/2): {last}")
    return None, f"検証NG: {last}", False


def publish_from_queue(item_path, site, state):
    tool = load_json(item_path)
    tid = tool["id"]
    print(f"キューから公開: {tid}({tool['title']})")

    logic_src = open(os.path.join(ROOT, tool["logic_file"]), encoding="utf-8").read()
    tests = load_json(os.path.join(ROOT, "tests", f"{tid}.test.json"))

    data, result, api_error = generate_with_retry(tool_prompt(tool, logic_src, tests), validate_tool_content)
    if data is None:
        if api_error:
            print(f"  Gemini API障害のため本日はスキップ(翌日自動リトライ): {result}")
            return False
        attempts = state["attempts"].get(tid, 0) + 1
        state["attempts"][tid] = attempts
        print(f"  本日はスキップ(検証NG 累計{attempts}回): {result}")
        if attempts >= 5:
            dest = os.path.join(ROOT, "queue", "failed", os.path.basename(item_path))
            shutil.move(item_path, dest)
            print(f"  5回失敗 → queue/failed/ へ隔離しました(要人間確認)")
        return False

    model = result
    tool["content"].update(
        intro=data["intro"],
        usage=data["usage"],
        explanation_sections=data["explanation_sections"],
        faq=data["faq"],
        published_at=today_str(),
        updated_at=today_str(),
        model=model,
    )
    save_json(os.path.join(ROOT, "content", "tools", f"{tid}.json"), tool)
    os.remove(item_path)
    state["attempts"].pop(tid, None)
    state["last_published_urls"] = [f"{site['base_url']}/{tid}/"]
    print(f"  公開しました: /{tid}/(モデル: {model})")
    return True


def add_column(site, state):
    tools = [load_json(p) for p in sorted(glob.glob(os.path.join(ROOT, "content", "tools", "*.json")))]
    columns = [load_json(p) for p in sorted(glob.glob(os.path.join(ROOT, "content", "columns", "*.json")))]
    if len(columns) >= MAX_COLUMNS:
        return None
    covered = {c.get("related_tool") for c in columns}
    candidates = [t for t in tools if t["id"] not in covered]
    if not candidates:
        return None
    candidates.sort(key=lambda t: (t.get("priority", 99), t["id"]))
    tool = candidates[0]
    slug = f"guide-{tool['id']}"
    key = f"column:{slug}"
    print(f"コラム追加: {slug}(関連ツール: {tool['id']})")

    existing_titles = [c["title"] for c in columns]
    data, result, api_error = generate_with_retry(column_prompt(tool, existing_titles), validate_column_content)
    if data is None:
        if api_error:
            print(f"  Gemini API障害のため本日はスキップ(翌日自動リトライ): {result}")
            return False
        attempts = state["attempts"].get(key, 0) + 1
        state["attempts"][key] = attempts
        print(f"  本日はスキップ(検証NG 累計{attempts}回): {result}")
        return False

    model = result
    col = {
        "slug": slug,
        "title": data["title"],
        "description": data["description"],
        "body_sections": data["body_sections"],
        "related_tool": tool["id"],
        "published_at": today_str(),
        "model": model,
    }
    save_json(os.path.join(ROOT, "content", "columns", f"{slug}.json"), col)
    state["attempts"].pop(key, None)
    state["last_published_urls"] = [f"{site['base_url']}/column/{slug}/"]
    print(f"  公開しました: /column/{slug}/(モデル: {model})")
    return True


def refresh_old_content(site, state):
    tools = []
    for p in sorted(glob.glob(os.path.join(ROOT, "content", "tools", "*.json"))):
        t = load_json(p)
        c = t.get("content", {})
        if c.get("model") and c["model"] != "human" and c.get("updated_at"):
            age = (datetime.date.today() - datetime.date.fromisoformat(c["updated_at"])).days
            if age >= REFRESH_DAYS:
                tools.append((age, p, t))
    if not tools:
        return None
    tools.sort(reverse=True)
    age, path, tool = tools[0]
    tid = tool["id"]
    print(f"解説リフレッシュ: {tid}({age}日経過)")

    logic_src = open(os.path.join(ROOT, tool["logic_file"]), encoding="utf-8").read()
    tests = load_json(os.path.join(ROOT, "tests", f"{tid}.test.json"))
    data, result, _api_error = generate_with_retry(refresh_prompt(tool, logic_src, tests), validate_tool_content)
    if data is None:
        print(f"  本日はスキップ: {result}")
        return False

    model = result
    tool["content"].update(
        intro=data["intro"],
        usage=data["usage"],
        explanation_sections=data["explanation_sections"],
        faq=data["faq"],
        updated_at=today_str(),
        model=model,
    )
    save_json(path, tool)
    state["last_published_urls"] = [f"{site['base_url']}/{tid}/"]
    print(f"  更新しました: /{tid}/")
    return True


def main():
    site = load_json(os.path.join(ROOT, "config", "site.json"))
    state = load_state()
    state["last_run"] = today_str()
    state["last_published_urls"] = []

    if not os.environ.get("GEMINI_API_KEY", "").strip():
        print("GEMINI_API_KEY未設定のため生成をスキップします(ビルドのみ実行されます)")
        save_json(STATE_PATH, state)
        return

    try:
        # 1. キュー消化
        pending = sorted(
            glob.glob(os.path.join(ROOT, "queue", "pending", "*.json")),
            key=lambda p: (load_json(p).get("priority", 99), p),
        )
        eligible = [p for p in pending if (load_json(p).get("publish_after") or "") <= today_str()]

        done = False
        if eligible:
            done = publish_from_queue(eligible[0], site, state)
        else:
            # 2. エンリッチモード
            print("キューが空(または公開予定日前)→ エンリッチモード")
            r = add_column(site, state)
            if r is None:
                r = refresh_old_content(site, state)
            if r is None:
                print("すべてのコンテンツが最新です。今日は追加なし(サイトは再ビルドされます)")
            done = bool(r)

        if done:
            state["last_success"] = today_str()
    except Exception as e:
        # 生成の失敗でワークフロー全体を落とさない(翌日リトライ)
        print(f"生成処理でエラー(本日はスキップ): {e}")

    save_json(STATE_PATH, state)


if __name__ == "__main__":
    main()
