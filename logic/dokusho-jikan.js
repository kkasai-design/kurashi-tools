// 読書時間の見積もり
const SPEEDS = {
  slow: { name: "ゆっくり(じっくり読む)", ppm: 0.7 },
  normal: { name: "標準", ppm: 1.1 },
  fast: { name: "速い(読み慣れている)", ppm: 1.8 },
};

function fmtMin(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function calc(inputs) {
  const pages = inputs.pages;
  const sp = SPEEDS[inputs.speed];
  const daily = inputs.minutes_per_day;
  if (pages == null || !Number.isFinite(pages) || pages <= 0) throw new Error("ページ数を入力してください。");
  if (!sp) throw new Error("読む速さを選択してください。");

  const totalMin = pages / sp.ppm;
  const details = [
    ["読了までの時間", `約${fmtMin(totalMin)}`],
    ["読む速さの設定", `${sp.name}(1分あたり約${sp.ppm}ページ)`],
  ];

  if (daily != null && Number.isFinite(daily) && daily > 0) {
    const days = Math.ceil(totalMin / daily);
    details.push([`1日${daily}分読む場合`, `約${days}日で読了`]);
  }

  const rows = [
    ["文庫小説(約300ページ)", `約${fmtMin(300 / sp.ppm)}`],
    ["新書(約220ページ)", `約${fmtMin(220 / sp.ppm)}`],
    ["ビジネス書(約250ページ)", `約${fmtMin(250 / sp.ppm)}`],
    ["大作小説(約500ページ)", `約${fmtMin(500 / sp.ppm)}`],
  ];

  return {
    summary: `${pages.toLocaleString("ja-JP")}ページの本は 約${fmtMin(totalMin)} で読めます(${sp.name})`,
    details,
    table: { headers: ["本のタイプ", `読了時間の目安(${sp.name})`], rows },
    note: "日本語の書籍は1ページ600字前後、読書速度は分速400〜800字程度が一般的とされ、それを基にした目安です。図表の多さ・内容の難易度で大きく変わります。",
  };
}
