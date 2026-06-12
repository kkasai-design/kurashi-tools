import {
  parseDate, toSerial, fromSerial, isLeap, weekday, WEEKDAYS_JA,
  eraOf, fullAge, kazoeAge, junishiOf, ETO_JUNISHI, ETO_ANIMALS,
} from "./_date.js";

export function calc(inputs) {
  const birth = parseDate(inputs.birth);
  const asof = parseDate(inputs.asof);
  const bs = toSerial(birth.y, birth.m, birth.d);
  const as = toSerial(asof.y, asof.m, asof.d);
  if (bs > as) throw new Error("生年月日が基準日より後になっています。");
  if (asof.y - birth.y > 130) throw new Error("生年月日を確認してください(130歳を超えています)。");

  const age = fullAge(birth, asof);
  const kazoe = kazoeAge(birth.y, asof.y);
  const livedDays = as - bs;

  // 次の誕生日(2/29生まれは平年3/1扱い)
  let nextY = asof.y;
  let bm = birth.m, bd = birth.d;
  const bday = (y) => {
    if (bm === 2 && bd === 29 && !isLeap(y)) return { y, m: 3, d: 1 };
    return { y, m: bm, d: bd };
  };
  let nb = bday(nextY);
  if (toSerial(nb.y, nb.m, nb.d) <= as) nb = bday(nextY + 1);
  const daysToNext = toSerial(nb.y, nb.m, nb.d) - as;

  const era = eraOf(birth.y, birth.m, birth.d);
  const idx = ETO_JUNISHI.indexOf(junishiOf(birth.y));

  const details = [
    ["満年齢", `${age}歳`],
    ["数え年", `${kazoe}歳`],
    ["生まれてからの日数", `${livedDays.toLocaleString()}日`],
    ["生まれた曜日", `${WEEKDAYS_JA[weekday(birth.y, birth.m, birth.d)]}曜日`],
    ["和暦の生年月日", `${era ? era.label : "—"}${birth.m}月${birth.d}日`],
    ["干支(十二支)", `${ETO_JUNISHI[idx]}(${ETO_ANIMALS[idx]})`],
    ["次の誕生日", `${nb.y}年${nb.m}月${nb.d}日(あと${daysToNext}日)`],
  ];

  return {
    summary: `満${age}歳です(${asof.y}年${asof.m}月${asof.d}日時点)`,
    details,
    note: "数え年は「生まれた年を1歳とし、元日(1月1日)に1歳ずつ増える」数え方です。2月29日生まれの方は、平年は3月1日に加齢する扱いで計算しています。",
  };
}
