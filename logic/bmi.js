// BMIと適正体重の計算
function fmt(n, digits = 1) {
  const p = 10 ** digits;
  return (Math.round(n * p) / p).toLocaleString("ja-JP", { maximumFractionDigits: digits });
}

export function calc(inputs) {
  const h = inputs.height;
  const w = inputs.weight;
  if (h == null || !Number.isFinite(h) || h < 50 || h > 250) throw new Error("身長を50〜250cmで入力してください。");
  if (w == null || !Number.isFinite(w) || w < 10 || w > 300) throw new Error("体重を10〜300kgで入力してください。");

  const hm = h / 100;
  // 表示と判定を一致させるため、判定も表示と同じ小数1桁丸めの値で行う
  const bmi = Math.round((w / (hm * hm)) * 10) / 10;
  const standard = 22 * hm * hm; // 標準体重(BMI22)
  const beauty = 20 * hm * hm;   // 美容体重(BMI20)
  const lower = 18.5 * hm * hm;
  const upper = 25 * hm * hm;

  let category;
  if (bmi < 18.5) category = "低体重(やせ)";
  else if (bmi < 25) category = "普通体重";
  else if (bmi < 30) category = "肥満(1度)";
  else if (bmi < 35) category = "肥満(2度)";
  else if (bmi < 40) category = "肥満(3度)";
  else category = "肥満(4度)";

  const diff = w - standard;

  return {
    summary: `BMIは ${fmt(bmi)} (${category})です`,
    details: [
      ["BMI", fmt(bmi)],
      ["判定(日本肥満学会基準)", category],
      ["標準体重(BMI22)", `${fmt(standard)}kg(${diff >= 0 ? "+" : ""}${fmt(diff)}kg)`],
      ["美容体重(BMI20)", `${fmt(beauty)}kg`],
      ["普通体重の範囲(BMI18.5〜25)", `${fmt(lower)}kg 〜 ${fmt(upper)}kg`],
    ],
    note: "BMI=体重(kg)÷身長(m)の2乗。標準体重(BMI22)は統計上最も病気になりにくいとされる体重です。筋肉量は考慮されないため、アスリートは高めに出ます。健康上の判断は医師にご相談ください。",
  };
}
