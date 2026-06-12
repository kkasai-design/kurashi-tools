import { erasOfYear, warekiToSeireki, junishiOf, ETO_JUNISHI, ETO_ANIMALS } from "./_date.js";

const ERA_KEY = { reiwa: "令和", heisei: "平成", showa: "昭和", taisho: "大正", meiji: "明治" };
const ERA_MAX = { 明治: 45, 大正: 15, 昭和: 64, 平成: 31 };

function warekiLabel(y) {
  const es = erasOfYear(y);
  if (!es.length) return "—";
  return es.slice().reverse().map((e) => e.label).join("/");
}

function junishiWithYomi(y) {
  const idx = ETO_JUNISHI.indexOf(junishiOf(y));
  return `${ETO_JUNISHI[idx]}(${ETO_ANIMALS[idx]})`;
}

export function calc(inputs) {
  const mode = inputs.era;
  const n = inputs.year;
  if (n == null || !Number.isFinite(n)) throw new Error("年を入力してください。");
  const num = Math.round(n);

  let y;
  let note = "干支は十二支で表示しています。年齢は誕生日を迎えた後の満年齢です。";
  if (mode === "seireki") {
    y = num;
    if (y < 1868 || y > 2100) throw new Error("西暦は1868年〜2100年の範囲で入力してください。");
  } else {
    const eraName = ERA_KEY[mode];
    if (!eraName) throw new Error("元号を選択してください。");
    if (num < 1) throw new Error("和暦の年は1以上で入力してください。");
    y = warekiToSeireki(eraName, num);
    if (y > 2100) throw new Error("変換結果が2100年を超えています。");
    const max = ERA_MAX[eraName];
    if (max && num > max) {
      note = `※${eraName}は${max}年までです。${eraName}${num}年は実在しませんが、換算すると西暦${y}年に相当します。`;
    }
  }

  const wareki = warekiLabel(y);
  const summary = mode === "seireki" ? `西暦${y}年は ${wareki} です` : `${ERA_KEY[mode]}${num}年は 西暦${y}年 です`;

  const thisYear = new Date().getFullYear();
  const age = thisYear - y;
  const details = [
    ["西暦", `${y}年`],
    ["和暦", wareki],
    ["十二支", junishiWithYomi(y)],
  ];
  if (age >= 0 && age <= 130) {
    details.push([`${y}年生まれの人`, `今年(${thisYear}年)の誕生日で満${age}歳`]);
  }

  const rows = [];
  let highlightRow = null;
  let i = 0;
  for (let yy = y - 5; yy <= y + 5; yy++) {
    if (yy < 1868 || yy > 2100) continue;
    if (yy === y) highlightRow = i;
    rows.push([`${yy}年`, warekiLabel(yy), junishiOf(yy)]);
    i++;
  }

  return {
    summary,
    details,
    table: { headers: ["西暦", "和暦", "十二支"], rows, highlightRow },
    note,
  };
}
