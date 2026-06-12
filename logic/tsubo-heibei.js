// 坪・平米(㎡)・畳の相互換算
// 1坪 = 400/121 ㎡ ≈ 3.305785㎡ / 畳は不動産表示規約の1畳=1.62㎡を標準とする
const TSUBO_M2 = 400 / 121;
const JO_M2 = 1.62;
const JO_VARIANTS = [
  ["京間(本間)", 0.955 * 1.91],
  ["中京間", 0.91 * 1.82],
  ["江戸間(関東間)", 0.88 * 1.76],
  ["団地間", 0.85 * 1.70],
];

function fmt(n) {
  return (Math.round(n * 100) / 100).toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function calc(inputs) {
  const v = inputs.value;
  const unit = inputs.unit;
  if (v == null || !Number.isFinite(v) || v <= 0) throw new Error("数値を入力してください。");

  let m2;
  let unitLabel;
  if (unit === "tsubo") {
    m2 = v * TSUBO_M2;
    unitLabel = "坪";
  } else if (unit === "m2") {
    m2 = v;
    unitLabel = "㎡";
  } else if (unit === "jo") {
    m2 = v * JO_M2;
    unitLabel = "畳";
  } else {
    throw new Error("単位を選択してください。");
  }

  const tsubo = m2 / TSUBO_M2;
  const jo = m2 / JO_M2;

  const rows = JO_VARIANTS.map(([name, size]) => [name, `${fmt(size)}㎡`, `${fmt(m2 / size)}畳`]);

  return {
    summary: `${fmt(v)}${unitLabel} = ${fmt(tsubo)}坪 / ${fmt(m2)}㎡ / ${fmt(jo)}畳`,
    details: [
      ["坪", `${fmt(tsubo)}坪`],
      ["平米(㎡)", `${fmt(m2)}㎡`],
      ["畳(1.62㎡基準)", `${fmt(jo)}畳`],
    ],
    table: { headers: ["畳の規格", "1畳の広さ", "換算畳数"], rows },
    note: "畳のサイズは地域・物件で異なります。標準の換算は不動産の広告表示に使われる「1畳=1.62㎡」です。1坪=約3.31㎡=約2畳と覚えると概算できます。",
  };
}
