// 手取り額の簡易計算(年収の額面から)
// 独身・給与所得者・社会保険完備の一般的な手取り率カーブ(概算)
const RATE_TABLE = [
  [100, 0.85], [200, 0.83], [300, 0.81], [400, 0.80], [500, 0.79],
  [600, 0.77], [700, 0.75], [800, 0.74], [900, 0.72], [1000, 0.71],
  [1200, 0.68], [1500, 0.65], [2000, 0.62], [3000, 0.58],
];

function rateFor(income) {
  if (income <= RATE_TABLE[0][0]) return RATE_TABLE[0][1];
  if (income >= RATE_TABLE[RATE_TABLE.length - 1][0]) return RATE_TABLE[RATE_TABLE.length - 1][1];
  for (let i = 0; i < RATE_TABLE.length - 1; i++) {
    const [a, ra] = RATE_TABLE[i];
    const [b, rb] = RATE_TABLE[i + 1];
    if (income >= a && income <= b) {
      return ra + ((rb - ra) * (income - a)) / (b - a);
    }
  }
  return 0.75;
}

function man(n) {
  return (Math.round(n * 10) / 10).toLocaleString("ja-JP", { maximumFractionDigits: 1 }) + "万円";
}

export function calc(inputs) {
  const income = inputs.income;
  if (income == null || !Number.isFinite(income) || income < 50 || income > 5000) {
    throw new Error("年収を50〜5000(万円)で入力してください。");
  }

  const rate = rateFor(income);
  const tedori = income * rate;
  const deduction = income - tedori;
  const monthly = tedori / 12;
  const monthlyWithBonus = tedori / 14; // 賞与2ヶ月分(計14分割)とした場合の月手取り

  const rows = [300, 400, 500, 600, 700, 800].map((y) => [
    `年収${y}万円`,
    man(y * rateFor(y)),
    man((y * rateFor(y)) / 12),
  ]);

  return {
    summary: `手取りは年間 約${man(tedori)}(月あたり約${man(monthly)})です`,
    details: [
      ["年間の手取り", `約${man(tedori)}(手取り率 約${Math.round(rate * 100)}%)`],
      ["税金・社会保険料(概算)", `約${man(deduction)}`],
      ["月の手取り(12分割)", `約${man(monthly)}`],
      ["月の手取り(賞与2ヶ月分ありの場合)", `約${man(monthlyWithBonus)}`],
    ],
    table: { headers: ["年収(額面)", "手取り(年)", "手取り(月)"], rows },
    note: "独身・給与所得のみ・40歳未満(介護保険なし)の一般的な概算です。扶養家族・iDeCo・住宅ローン控除・自治体の保険料率などで実際の手取りは変わります(扶養ありなら数万〜十数万円多くなる傾向)。正確な金額は給与明細・源泉徴収票でご確認ください。",
  };
}
