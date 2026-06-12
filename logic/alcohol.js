// アルコール分解時間の目安計算
// 純アルコール量(g) = 量(ml) × 度数(%) ÷ 100 × 0.8(アルコール比重)
const DRINKS = {
  beer500: { name: "ビール中瓶・ロング缶(500ml・5%)", grams: 20 },
  beer350: { name: "ビール缶(350ml・5%)", grams: 14 },
  sake1go: { name: "日本酒1合(180ml・15%)", grams: 21.6 },
  wine: { name: "ワイングラス1杯(120ml・12%)", grams: 11.5 },
  shochu: { name: "焼酎水割り1杯(原酒60ml・25%)", grams: 12 },
  highball: { name: "ハイボール・チューハイ缶(350ml・7%)", grams: 19.6 },
  whisky: { name: "ウイスキーシングル(30ml・43%)", grams: 10.3 },
};

function fmtHour(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  if (mm === 0) return `${hh}時間`;
  if (mm === 60) return `${hh + 1}時間`;
  return `${hh}時間${mm}分`;
}

export function calc(inputs) {
  const drink = DRINKS[inputs.drink];
  const count = inputs.count;
  const weight = inputs.weight;
  if (!drink) throw new Error("お酒の種類を選択してください。");
  if (count == null || !Number.isFinite(count) || count <= 0 || count > 50) throw new Error("杯数(本数)を1〜50で入力してください。");
  if (weight == null || !Number.isFinite(weight) || weight < 30 || weight > 200) throw new Error("体重を30〜200kgで入力してください。");

  const totalGrams = drink.grams * count;
  // 分解速度の目安: 体重1kgあたり約0.1g/時(個人差大)
  const rate = weight * 0.1;
  const hours = totalGrams / rate;

  const drinkUnits = totalGrams / 20; // 厚労省の「基準飲酒量(ドリンク)」=純アルコール20g

  return {
    summary: `分解には 約${fmtHour(hours)} かかる計算です(純アルコール${Math.round(totalGrams * 10) / 10}g)`,
    details: [
      ["飲んだ量", `${drink.name} × ${count}`],
      ["純アルコール量", `約${Math.round(totalGrams * 10) / 10}g(基準飲酒量${Math.round(drinkUnits * 10) / 10}単位)`],
      ["分解の目安時間", `約${fmtHour(hours)}`],
      ["体重による分解速度", `約${Math.round(rate * 10) / 10}g/時(体重${weight}kg)`],
    ],
    note: "【重要】これは平均的な分解速度(体重×0.1g/時)による机上の目安で、体質・体調・性別により2倍以上の個人差があります。計算上分解が終わっていても、検査でアルコールが検出されることがあります。飲酒後に運転する予定がある場合は、この計算に関わらず絶対に運転しないでください。深夜まで飲んだ翌朝の運転も危険です。",
  };
}
