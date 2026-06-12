import { parseDate, fullAge, kazoeAge } from "./_date.js";

export function calc(inputs) {
  const birth = parseDate(inputs.birth);
  const asof = parseDate(inputs.asof);
  if (birth.y > asof.y) throw new Error("生まれ年が基準日より後になっています。");
  if (asof.y - birth.y > 130) throw new Error("生年月日を確認してください(130歳を超えています)。");

  const kazoe = kazoeAge(birth.y, asof.y);
  const man = fullAge(birth, asof);

  // 七五三(数え・満)
  const shichigosan = [
    ["3歳(髪置き・男女)", birth.y + 2, birth.y + 3],
    ["5歳(袴着・主に男の子)", birth.y + 4, birth.y + 5],
    ["7歳(帯解き・主に女の子)", birth.y + 6, birth.y + 7],
  ];
  const rows = shichigosan.map(([label, kazoeY, manY]) => [label, `${kazoeY}年`, `${manY}年`]);
  let this753 = null;
  let highlightRow = null;
  shichigosan.forEach(([label, kazoeY, manY], i) => {
    if (asof.y === kazoeY || asof.y === manY) {
      this753 = { label, how: asof.y === kazoeY ? "数え年" : "満年齢" };
      if (highlightRow === null) highlightRow = i;
    }
  });

  const details = [
    ["数え年", `${kazoe}歳`],
    ["満年齢", `${man}歳(${asof.y}年${asof.m}月${asof.d}日時点)`],
    ["数え年の覚え方", asof.y === birth.y ? "生まれた年は1歳" : "満年齢+1歳(誕生日後)または+2歳(誕生日前)"],
  ];
  if (this753) {
    details.push(["七五三", `今年は${this753.how}で「${this753.label}」のお祝い年です`]);
  }

  return {
    summary: `数え年は ${kazoe}歳 です(満年齢: ${man}歳)`,
    details,
    table: { headers: ["七五三のお祝い", "数え年で行う年", "満年齢で行う年"], rows, highlightRow },
    note: "数え年は「生まれた年を1歳とし、元日(1月1日)に1歳増える」数え方です。七五三は11月15日前後にお参りするのが一般的で、数え年・満年齢のどちらで行っても問題ありません。",
  };
}
