# くらしの計算室(kurashi-tools)

毎日自動で成長する生活系計算ツールサイト。
**サイト**: https://kkasai-design.github.io/kurashi-tools/

## 仕組み(全自動)

```
毎朝6:23(JST) GitHub Actionsが起動
  ↓
queue/pending/ から1ツール取り出し → Gemini APIが解説文を生成
(計算ロジックは人間が実装・テスト済み。AIは文章だけ書く)
  ↓
全ツールのユニットテスト → サイトビルド → 検証ゲート6種
(1つでも失敗したら公開されず、前日のサイトが残る)
  ↓
GitHub Pagesへデプロイ + IndexNowで検索エンジンに通知
```

- キュー(29本)が尽きたら自動で「コラム追加 → 古い解説のリフレッシュ」モードに移行し、成長が止まらない
- 失敗時はGitHubからメール通知+Issueが自動で立つ。**通知が来ない限り何もしなくてOK**

## 📌 葛西さんがやること(一度きり・合計30分)

### 1. 独自ドメイン取得(約10分・年1,500円前後)※収益最大化に必須

AdSense審査には独自ドメインがほぼ必須です。

1. [Cloudflare Registrar](https://dash.cloudflare.com/)(原価・約$10/年)か [Xserverドメイン](https://www.xdomain.ne.jp/)(キャンペーンで1円〜)で好きなドメインを取得
   - 候補: `kurashi-keisan.com` / `kurashicalc.com` / `keisan-shitsu.com` など
2. 取得したら**Claudeに「ドメイン取ったよ: ○○.com」と伝える**
   → DNS設定値の案内・CNAME設定・Search Console登録・サイト設定の書き換えまで全部やります

### 2. 広告・アフィリエイトの登録(約15分)

収益の発生源です。おすすめ順:

| 順 | サービス | 審査 | 登録先 |
|---|---|---|---|
| 1 | [A8.net](https://www.a8.net/) | なし(即日) | 高単価案件(引越し見積もり・光回線・車査定など)の本命 |
| 2 | [楽天アフィリエイト](https://affiliate.rakuten.co.jp/) | 楽天会員なら即 | 物販ボタン用。**登録後、管理画面の「アフィリエイトID」をClaudeに伝えるだけ** |
| 3 | [忍者AdMax](https://www.ninja.co.jp/admax/) | なし | クリック広告。0日目から表示可(単価は低い) |
| 4 | Google AdSense | あり(独自ドメイン後) | クリック広告の本命。ドメイン設定後に申請 |

発行された広告タグ/IDを **Claudeに渡すか、`config/monetize.json` に直接貼る**と、翌朝の自動ビルドで全ページに反映されます(スマホのGitHubアプリからでも編集可)。

### 3. それ以外 → 完全放置でOK

- 毎日のページ追加・デプロイ・検索エンジン通知は全自動
- GitHubからエラーメール/Issueが来たときだけClaudeに見せてください
- 年1回(1月)、厄年早見表など年次コンテンツの更新をClaudeに頼むと丁寧(自動リフレッシュも180日周期で走ります)

## 収益スロットの設定(config/monetize.json)

```jsonc
{
  "rakuten": { "affiliate_id": "ここに楽天アフィリエイトID" },
  "html_blocks": {
    "admax_rect": "ここに忍者AdMaxの広告タグ(レクタングル)",
    "free_bottom": "ここに自由広告枠のタグ"
  },
  "adsense_head_tag": "ここにAdSenseの審査コード/自動広告タグ",
  "ads_txt": "ここにAdSenseのads.txt行"
}
```

- 空欄のスロットは**何も表示されない**(レイアウトは崩れない)
- ツールごとの高単価CTA(引越し見積もり等)は `queue/pending/*.json` と `content/tools/*.json` の `monetize.cta.url` にアフィリエイトリンクを入れると表示される

## 開発メモ(Claude用)

```bash
# ローカルビルド
python builder/build.py        # → dist/ に出力(検証ゲート込み)
node tests/run.mjs             # 全ツールのユニットテスト

# 生成エンジンの手動実行
GEMINI_API_KEY=xxx python builder/generate.py

# 手動デプロイ(通常は不要。cronが毎朝走る)
gh workflow run daily.yml -R kkasai-design/kurashi-tools
```

- ツール追加: `queue/pending/{id}.json`(定義)+ `logic/{id}.js`(計算)+ `tests/{id}.test.json`(テスト)の3点セット
- 独自ドメイン移行: `config/site.json` の `base_url`/`base_path` を変更 + `dist` に CNAME を出すよう build.py に1行追加 + Pages設定でカスタムドメイン設定
- ライセンス: コードはMIT、記事・解説文の無断転載は禁止

## 構成

| パス | 役割 |
|---|---|
| `content/tools/` | 公開済みツール(解説込み) |
| `queue/pending/` | 未公開キュー(毎日1本ずつ自動公開) |
| `logic/` `tests/` | 計算ロジックとテスト(全て人間実装・機械検証) |
| `builder/` | SSG・生成エンジン・検証(Python標準ライブラリのみ) |
| `config/monetize.json` | 収益設定(ここだけ触ればOK) |
| `.github/workflows/` | 毎日の自動実行+週次の死活監視 |
