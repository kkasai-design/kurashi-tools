import { junishiOf, jikkanOf, ETO_JUNISHI, ETO_ANIMALS, JIKKAN, yearWithWareki } from "./_date.js";

const JIKKAN_YOMI = ["きのえ", "きのと", "ひのえ", "ひのと", "つちのえ", "つちのと", "かのえ", "かのと", "みずのえ", "みずのと"];
const JUNISHI_YOMI = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];

function kanshiOf(y) {
  const jk = jikkanOf(y);
  const js = junishiOf(y);
  const jkYomi = JIKKAN_YOMI[JIKKAN.indexOf(jk)];
  const jsYomi = JUNISHI_YOMI[ETO_JUNISHI.indexOf(js)];
  return { kanshi: jk + js, yomi: jkYomi + jsYomi };
}

export function calc(inputs) {
  const n = inputs.year;
  if (n == null || !Number.isFinite(n)) throw new Error("年(西暦)を入力してください。");
  const y = Math.round(n);
  if (y < 1868 || y > 2100) throw new Error("1868年〜2100年の範囲で入力してください。");

  const js = junishiOf(y);
  const idx = ETO_JUNISHI.indexOf(js);
  const k = kanshiOf(y);

  const thisYear = new Date().getFullYear();
  const age = thisYear - y;

  const details = [
    ["十二支", `${js}年(${ETO_ANIMALS[idx]}どし)`],
    ["十干", jikkanOf(y)],
    ["干支(六十干支)", `${k.kanshi}(${k.yomi})`],
    ["和暦", yearWithWareki(y)],
  ];
  if (age >= 0 && age <= 130) {
    details.push([`${y}年生まれの人`, `今年(${thisYear}年)の誕生日で満${age}歳`]);
  }
  // 同じ十二支の前後の年
  const sameRows = [];
  let highlightRow = null;
  let i = 0;
  for (let yy = y - 24; yy <= y + 24; yy += 12) {
    if (yy < 1868 || yy > 2100) continue;
    if (yy === y) highlightRow = i;
    sameRows.push([`${yy}年`, yearWithWareki(yy).replace(/^\d+年/, "").replace(/[()]/g, ""), kanshiOf(yy).kanshi]);
    i++;
  }

  return {
    summary: `${y}年の干支は「${js}(${ETO_ANIMALS[idx]})」、六十干支では「${k.kanshi}(${k.yomi})」です`,
    details,
    table: { headers: [`同じ${js}年の年`, "和暦", "六十干支"], rows: sameRows, highlightRow },
    note: "干支は本来、十干(甲乙丙…)と十二支(子丑寅…)を組み合わせた60通り(六十干支)を指します。一般に「干支=動物」と言う場合は十二支のことです。",
  };
}
