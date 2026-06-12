// 犬・猫の年齢を人間に換算(一般的な目安式)
// 猫・小型犬: 1年=15歳, 2年=24歳, 以降+4歳/年
// 中型犬: 1年=15歳, 2年=24歳, 以降+5歳/年
// 大型犬: 1年=12歳, 2年=19歳, 以降+7歳/年
const SPECIES = {
  cat: { name: "猫", y1: 15, y2: 24, rate: 4, senior: 7 },
  dog_small: { name: "小型犬(〜10kg)", y1: 15, y2: 24, rate: 4, senior: 7 },
  dog_medium: { name: "中型犬(10〜25kg)", y1: 15, y2: 24, rate: 5, senior: 7 },
  dog_large: { name: "大型犬(25kg〜)", y1: 12, y2: 19, rate: 7, senior: 6 },
};

function humanAge(sp, age) {
  if (age <= 1) return sp.y1 * age;
  if (age <= 2) return sp.y1 + (sp.y2 - sp.y1) * (age - 1);
  return sp.y2 + sp.rate * (age - 2);
}

function fmt(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

export function calc(inputs) {
  const sp = SPECIES[inputs.species];
  if (!sp) throw new Error("動物の種類を選択してください。");
  const years = inputs.years;
  const months = inputs.months == null || inputs.months === "" || !Number.isFinite(inputs.months) ? 0 : inputs.months;
  if (years == null || !Number.isFinite(years) || years < 0) throw new Error("年齢(年)を入力してください。");
  if (months < 0 || months > 11) throw new Error("月齢は0〜11ヶ月で入力してください。");
  const age = years + months / 12;
  if (age <= 0) throw new Error("年齢を入力してください(例: 0年6ヶ月)。");
  if (age > 40) throw new Error("年齢を確認してください(40歳を超えています)。");

  const human = humanAge(sp, age);
  let stage;
  if (age < 1) stage = "子猫・子犬期(成長期)";
  else if (age < sp.senior) stage = "成猫・成犬期";
  else if (age < sp.senior + 4) stage = "シニア期(7歳頃〜は健康診断を年2回が目安)";
  else stage = "ハイシニア期(老齢期)";

  const rows = [];
  let highlightRow = null;
  for (let y = 1; y <= 18; y++) {
    if (y === Math.round(age)) highlightRow = rows.length;
    rows.push([`${y}年`, `${fmt(humanAge(sp, y))}歳`]);
  }

  return {
    summary: `人間に換算すると 約${fmt(human)}歳 です(${sp.name}・${fmt(age)}歳)`,
    details: [
      ["人間換算", `約${fmt(human)}歳`],
      ["ライフステージ", stage],
      ["実年齢", `${years}年${months ? months + "ヶ月" : ""}(${sp.name})`],
    ],
    table: { headers: [`${sp.name}の年齢`, "人間換算"], rows, highlightRow },
    note: "換算は一般的な目安式(1年で15歳、2年で24歳、以降は体格により+4〜7歳/年。大型犬は1年12歳、2年19歳、以降+7歳/年)です。個体差・犬種差があるため、健康管理は獣医師にご相談ください。",
  };
}
