// ガソリン代計算(距離÷燃費×単価)
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}
function fmt(n, digits = 1) {
  const p = 10 ** digits;
  return (Math.round(n * p) / p).toLocaleString("ja-JP", { maximumFractionDigits: digits });
}

export function calc(inputs) {
  const dist = inputs.distance;
  const nenpi = inputs.nenpi;
  const price = inputs.price;
  const trip = inputs.trip;
  if (dist == null || !Number.isFinite(dist) || dist <= 0) throw new Error("距離を入力してください。");
  if (nenpi == null || !Number.isFinite(nenpi) || nenpi <= 0) throw new Error("燃費を入力してください。");
  if (price == null || !Number.isFinite(price) || price <= 0) throw new Error("ガソリン単価を入力してください。");

  const factor = trip === "round" ? 2 : 1;
  const totalDist = dist * factor;
  const liters = totalDist / nenpi;
  const cost = liters * price;

  const details = [
    [trip === "round" ? "走行距離(往復)" : "走行距離(片道)", `${fmt(totalDist)}km`],
    ["必要なガソリン", `約${fmt(liters)}L`],
    ["ガソリン代", yen(cost)],
    ["1kmあたり", `${fmt(price / nenpi)}円`],
  ];
  if (trip === "round") {
    details.splice(2, 0, ["片道あたり", yen(cost / 2)]);
  }

  return {
    summary: `ガソリン代は 約${yen(cost)} です(${trip === "round" ? "往復" : "片道"}${fmt(totalDist)}km)`,
    details,
    note: "計算式: 距離(km)÷燃費(km/L)×単価(円/L)。実際の燃費は渋滞・エアコン・荷物量で1〜2割変動します。高速道路の料金は含みません。",
  };
}
