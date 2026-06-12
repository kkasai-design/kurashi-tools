// 車の年間維持費計算(税金・車検・保険・燃料・駐車場)
// 自動車税は2019年10月以降に新規登録した自家用乗用車の税額
const CAR = {
  kei: { name: "軽自動車", tax: 10800, shaken: 35000, defNenpi: 20 },
  compact: { name: "コンパクトカー(〜1.5L)", tax: 30500, shaken: 45000, defNenpi: 17 },
  middle: { name: "ミドルクラス(〜2.0L)", tax: 36000, shaken: 50000, defNenpi: 14 },
  large: { name: "大型・ミニバン(〜2.5L)", tax: 43500, shaken: 55000, defNenpi: 11 },
};

function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const car = CAR[inputs.car_type];
  if (!car) throw new Error("車のタイプを選択してください。");
  const km = inputs.annual_km;
  const nenpi = inputs.nenpi == null || !Number.isFinite(inputs.nenpi) || inputs.nenpi <= 0 ? car.defNenpi : inputs.nenpi;
  const gas = inputs.gas_price == null || !Number.isFinite(inputs.gas_price) || inputs.gas_price <= 0 ? 170 : inputs.gas_price;
  const parking = inputs.parking == null || !Number.isFinite(inputs.parking) || inputs.parking < 0 ? 0 : inputs.parking;
  const insurance = inputs.insurance == null || !Number.isFinite(inputs.insurance) || inputs.insurance < 0 ? 60000 : inputs.insurance;
  if (km == null || !Number.isFinite(km) || km < 0 || km > 100000) throw new Error("年間走行距離を入力してください。");

  const fuel = (km / nenpi) * gas;
  const jibaiseki = 17650 / 2; // 自賠責24ヶ月の年割(2023年改定額の目安)
  const parkingYear = parking * 12;
  const total = car.tax + car.shaken + jibaiseki + insurance + fuel + parkingYear;

  return {
    summary: `年間の維持費は 約${yen(total)}(月あたり約${yen(total / 12)})です`,
    details: [
      ["自動車税(年)", yen(car.tax)],
      ["車検・点検(年割)", yen(car.shaken)],
      ["自賠責保険(年割)", yen(jibaiseki)],
      ["任意保険(年)", yen(insurance)],
      ["ガソリン代(年)", `${yen(fuel)}(${km.toLocaleString("ja-JP")}km ÷ ${nenpi}km/L × ${gas}円)`],
      ["駐車場代(年)", yen(parkingYear)],
      ["合計(年)", yen(total)],
      ["月あたり", yen(total / 12)],
    ],
    note: "一般的な目安です。タイヤ・オイル等の消耗品、ローン返済、高速料金は含みません。自動車税は2019年10月以降登録の自家用乗用車の税額(13年超の旧車は重課で15〜20%高くなります)。",
  };
}
