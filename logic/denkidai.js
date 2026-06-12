// 電気代計算(消費電力×時間×単価)
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}
function fmt(n, digits = 2) {
  const p = 10 ** digits;
  return (Math.round(n * p) / p).toLocaleString("ja-JP", { maximumFractionDigits: digits });
}

export function calc(inputs) {
  const w = inputs.watts;
  const h = inputs.hours_per_day;
  const price = inputs.unit_price;
  if (w == null || !Number.isFinite(w) || w <= 0) throw new Error("消費電力(W)を入力してください。");
  if (h == null || !Number.isFinite(h) || h <= 0 || h > 24) throw new Error("1日の使用時間を0〜24時間で入力してください。");
  if (price == null || !Number.isFinite(price) || price <= 0) throw new Error("電気料金の単価を入力してください。");

  const kwhDay = (w / 1000) * h;
  const dayCost = kwhDay * price;

  return {
    summary: `1日あたり約 ${yen(dayCost)}、1ヶ月あたり約 ${yen(dayCost * 30)} です`,
    details: [
      ["1日の電気代", `${yen(dayCost)}(${fmt(kwhDay)}kWh)`],
      ["1週間の電気代", yen(dayCost * 7)],
      ["1ヶ月の電気代(30日)", `${yen(dayCost * 30)}(${fmt(kwhDay * 30, 1)}kWh)`],
      ["1年の電気代(365日)", `${yen(dayCost * 365)}(${fmt(kwhDay * 365, 0)}kWh)`],
    ],
    note: "電気代=消費電力(kW)×使用時間×単価で計算しています。初期単価の31円/kWhは公的な目安単価です。実際の単価は契約プラン・燃料費調整・使用量で変わるため、検針票でご確認ください。",
  };
}
