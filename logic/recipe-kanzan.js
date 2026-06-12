// レシピの分量換算(人数変更)
function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

// 大さじ・小さじの実用的な言い換え
function spoonHint(ratio) {
  const hints = [];
  if (Math.abs(ratio - 0.5) < 0.001) hints.push("大さじ1 → 大さじ1/2");
  if (Math.abs(ratio - 1.5) < 0.001) hints.push("大さじ1 → 大さじ1と1/2");
  if (Math.abs(ratio - 2) < 0.001) hints.push("大さじ1 → 大さじ2");
  if (Math.abs(ratio - 0.75) < 0.001) hints.push("大さじ1 → 大さじ3/4(小さじ2と1/4)");
  return hints.join(" / ");
}

export function calc(inputs) {
  const from = inputs.from_servings;
  const to = inputs.to_servings;
  if (from == null || !Number.isFinite(from) || from <= 0) throw new Error("元のレシピの人数を入力してください。");
  if (to == null || !Number.isFinite(to) || to <= 0) throw new Error("作りたい人数を入力してください。");

  const ratio = to / from;
  const details = [
    ["倍率", `${fmt(ratio)}倍`],
  ];

  const amount = inputs.amount;
  if (amount != null && Number.isFinite(amount) && amount > 0) {
    details.push([`材料 ${fmt(amount)} の場合`, `${fmt(amount * ratio)} に換算`]);
  }

  const commonAmounts = [
    ["50g(肉・野菜など)", 50], ["100g", 100], ["200g", 200], ["300g", 300],
    ["大さじ1(15ml)", 15], ["小さじ1(5ml)", 5], ["1カップ(200ml)", 200],
  ];
  const rows = commonAmounts.map(([label, v]) => {
    const unit = label.includes("ml") || label.includes("カップ") ? "ml" : "g";
    return [label, `${fmt(v * ratio)}${unit}`];
  });

  const hint = spoonHint(ratio);

  return {
    summary: `${fmt(from)}人分 → ${fmt(to)}人分は、材料をすべて ${fmt(ratio)}倍 にします`,
    details,
    table: { headers: ["元の分量", `${fmt(to)}人分に換算`], rows },
    note: (hint ? `目安: ${hint}。` : "") + "調味料(塩・しょうゆ等)は単純な倍率より少し控えめにして味見で調整すると失敗しにくいです。煮込み時間は人数を増やしても2倍にはなりません(1.2〜1.5倍目安)。",
  };
}
