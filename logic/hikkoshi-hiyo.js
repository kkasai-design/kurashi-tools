// 引越し費用の目安計算(相場表ベース)
// 相場は大手引越しサイトの公表レンジに基づく一般的な目安(通常期の平均値)
const BASE = {
  single_light: { name: "単身(荷物少なめ)", prices: [35000, 40000, 50000, 65000] },
  single_heavy: { name: "単身(荷物多め)", prices: [45000, 55000, 70000, 90000] },
  couple: { name: "2人家族", prices: [65000, 80000, 100000, 130000] },
  family: { name: "3〜4人家族", prices: [85000, 105000, 140000, 190000] },
};
const DIST_LABELS = ["同市区町村内(〜15km)", "同都道府県内(〜50km)", "同地方内(〜200km)", "遠距離(500km前後)"];
const BUSY_FACTOR = 1.45; // 3月下旬〜4月上旬の繁忙期係数

function man(n) {
  return (Math.round(n / 1000) / 10).toLocaleString("ja-JP") + "万円";
}

export function calc(inputs) {
  const hh = BASE[inputs.household];
  const di = Number(inputs.distance);
  const busy = inputs.season === "busy";
  if (!hh) throw new Error("世帯の人数を選択してください。");
  if (!(di >= 0 && di <= 3)) throw new Error("移動距離を選択してください。");

  const base = hh.prices[di] * (busy ? BUSY_FACTOR : 1);
  const low = base * 0.8;
  const high = base * 1.25;

  const rows = DIST_LABELS.map((label, i) => {
    const p = hh.prices[i] * (busy ? BUSY_FACTOR : 1);
    return [label, `${man(p * 0.8)}〜${man(p * 1.25)}`];
  });

  return {
    summary: `引越し費用の目安は ${man(low)}〜${man(high)} です(${hh.name}・${busy ? "繁忙期" : "通常期"})`,
    details: [
      ["条件", `${hh.name} / ${DIST_LABELS[di]} / ${busy ? "繁忙期(3月中旬〜4月上旬)" : "通常期(5月〜2月)"}`],
      ["費用の目安", `${man(low)}〜${man(high)}(中心値 ${man(base)})`],
      ["繁忙期に運ぶ場合", busy ? "この金額が繁忙期価格です" : `約${man(base * BUSY_FACTOR * 0.8)}〜${man(base * BUSY_FACTOR * 1.25)} に上がる見込み`],
    ],
    table: { headers: [`${hh.name}の距離別目安(${busy ? "繁忙期" : "通常期"})`, "費用レンジ"], rows, highlightRow: di },
    note: "大手引越し情報サイトの公表相場に基づく一般的な目安です。実際の料金は荷物量・建物条件(エレベーター有無等)・日時で大きく変わります。複数社の見積もりを取ると平均2〜5万円安くなるといわれています。",
  };
}
