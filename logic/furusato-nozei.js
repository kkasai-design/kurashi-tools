// ふるさと納税の控除上限額の簡易目安(総務省公表の目安表に基づく線形補間)
// 列: [独身or共働き, 夫婦(配偶者控除あり), 共働き+子1(高校生), 夫婦+子1(高校生), 共働き+子2(大学生と高校生), 夫婦+子2]
const TABLE = [
  [300, 28000, 19000, 19000, 11000, 7000, 0],
  [350, 34000, 26000, 26000, 18000, 13000, 5000],
  [400, 42000, 33000, 33000, 25000, 21000, 12000],
  [450, 52000, 41000, 41000, 33000, 28000, 20000],
  [500, 61000, 49000, 49000, 40000, 36000, 28000],
  [550, 69000, 60000, 60000, 48000, 44000, 35000],
  [600, 77000, 69000, 69000, 60000, 57000, 43000],
  [650, 97000, 77000, 77000, 68000, 65000, 53000],
  [700, 108000, 86000, 86000, 78000, 75000, 66000],
  [750, 118000, 109000, 109000, 87000, 84000, 76000],
  [800, 129000, 120000, 120000, 110000, 107000, 85000],
  [850, 140000, 131000, 131000, 121000, 118000, 108000],
  [900, 152000, 143000, 141000, 132000, 128000, 119000],
  [950, 166000, 157000, 154000, 144000, 141000, 131000],
  [1000, 180000, 171000, 166000, 157000, 153000, 144000],
  [1100, 218000, 202000, 194000, 185000, 181000, 172000],
  [1200, 247000, 247000, 232000, 222000, 219000, 206000],
];
const FAMILY = {
  single: { name: "独身または共働き", col: 1 },
  couple: { name: "夫婦(配偶者に収入がない)", col: 2 },
  dual_child1: { name: "共働き+子1人(高校生)", col: 3 },
  couple_child1: { name: "夫婦+子1人(高校生)", col: 4 },
  dual_child2: { name: "共働き+子2人(大学生と高校生)", col: 5 },
  couple_child2: { name: "夫婦+子2人(大学生と高校生)", col: 6 },
};

function yen(n) {
  return Math.round(n / 1000) * 1000;
}

export function calc(inputs) {
  const fam = FAMILY[inputs.family];
  const income = inputs.income;
  if (!fam) throw new Error("家族構成を選択してください。");
  if (income == null || !Number.isFinite(income) || income < 100 || income > 3000) {
    throw new Error("年収を100〜3000(万円)で入力してください。");
  }

  let limit;
  if (income <= TABLE[0][0]) {
    limit = TABLE[0][fam.col] * (income / TABLE[0][0]);
  } else if (income >= TABLE[TABLE.length - 1][0]) {
    const last = TABLE[TABLE.length - 1];
    limit = last[fam.col] * (income / last[0]); // 表外は比例の粗い概算
  } else {
    for (let i = 0; i < TABLE.length - 1; i++) {
      const [a, ...av] = TABLE[i];
      const [b, ...bv] = TABLE[i + 1];
      if (income >= a && income <= b) {
        const t = (income - a) / (b - a);
        limit = av[fam.col - 1] + (bv[fam.col - 1] - av[fam.col - 1]) * t;
        break;
      }
    }
  }

  const rounded = yen(limit);
  const safe = yen(limit * 0.9);

  const nearestRows = TABLE.filter(([y]) => Math.abs(y - income) <= 100).map((row) => [
    `年収${row[0]}万円`,
    `${(row[fam.col] / 10000).toLocaleString("ja-JP")}万円`,
  ]);

  return {
    summary: `控除上限の目安は 約${(rounded / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}万円 です(${fam.name})`,
    details: [
      ["上限の目安", `約${rounded.toLocaleString("ja-JP")}円`],
      ["安全圏(目安の9割)", `約${safe.toLocaleString("ja-JP")}円`],
      ["自己負担", "2,000円(上限内で寄附した場合)"],
    ],
    table: nearestRows.length ? { headers: ["年収", `上限目安(${fam.name})`], rows: nearestRows } : undefined,
    note: "総務省公表の目安表に基づく簡易計算です(給与収入のみ・住宅ローン控除や医療費控除なしの前提)。各種控除がある方は上限が下がります。正確な金額は、お住まいの自治体や各ふるさと納税サイトの詳細シミュレーター、税理士にご確認ください。",
  };
}
