// 偏差値の計算
function fmt(n) {
  return (Math.round(n * 10) / 10).toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

export function calc(inputs) {
  const score = inputs.score;
  const avg = inputs.average;
  const sd = inputs.sd;
  if (score == null || !Number.isFinite(score)) throw new Error("自分の点数を入力してください。");
  if (avg == null || !Number.isFinite(avg)) throw new Error("平均点を入力してください。");
  if (sd == null || !Number.isFinite(sd) || sd <= 0) throw new Error("標準偏差を入力してください(わからない場合は15〜18が目安)。");

  const hensachi = 50 + (10 * (score - avg)) / sd;

  // 上位何%か(正規分布近似)
  const z = (score - avg) / sd;
  const pct = (1 - normCdf(z)) * 100;

  const rows = [
    ["偏差値70", `${fmt(avg + 2 * sd)}点`, "上位約2.3%"],
    ["偏差値65", `${fmt(avg + 1.5 * sd)}点`, "上位約6.7%"],
    ["偏差値60", `${fmt(avg + sd)}点`, "上位約15.9%"],
    ["偏差値55", `${fmt(avg + 0.5 * sd)}点`, "上位約30.9%"],
    ["偏差値50", `${fmt(avg)}点`, "ちょうど真ん中"],
    ["偏差値45", `${fmt(avg - 0.5 * sd)}点`, "上位約69.1%"],
    ["偏差値40", `${fmt(avg - sd)}点`, "上位約84.1%"],
  ];

  return {
    summary: `偏差値は ${fmt(hensachi)} です(上位約${fmt(Math.min(99.9, Math.max(0.1, pct)))}%)`,
    details: [
      ["偏差値", fmt(hensachi)],
      ["平均との差", `${score >= avg ? "+" : ""}${fmt(score - avg)}点`],
      ["位置の目安", `上位約${fmt(Math.min(99.9, Math.max(0.1, pct)))}%(正規分布近似)`],
    ],
    table: { headers: ["偏差値", "このテストでの点数", "位置"], rows },
    note: "偏差値=50+10×(点数−平均点)÷標準偏差。標準偏差はテストにより異なります(学校の定期テストで15前後、模試で18〜20程度が目安)。受験者集団が違えば偏差値も変わるため、異なる模試の偏差値は単純比較できません。",
  };
}

// 標準正規分布の累積分布関数(近似)
function normCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return p;
}
