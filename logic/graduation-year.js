import { parseDate, schoolYearBase, eraOf } from "./_date.js";

function ym(y, m) {
  const era = eraOf(y, m, 1);
  return `${y}年${m}月(${era ? era.label : "—"})`;
}

export function calc(inputs) {
  const birth = parseDate(inputs.birth);
  if (birth.y < 1900 || birth.y > 2100) throw new Error("1900年〜2100年の生年月日を入力してください。");

  const base = schoolYearBase(birth);
  const hayaumare = base !== birth.y;

  const elemIn = base + 7;     // 小学校入学(4月)
  const elemOut = elemIn + 6;  // 小学校卒業(3月)
  const jhsIn = elemOut;       // 中学校入学(4月)
  const jhsOut = jhsIn + 3;    // 中学校卒業(3月)
  const hsIn = jhsOut;         // 高校入学(4月)
  const hsOut = hsIn + 3;      // 高校卒業(3月)
  const uniIn = hsOut;         // 大学入学(4月)
  const uniOut = uniIn + 4;    // 大学卒業(3月)
  const tandaiOut = uniIn + 2; // 短大・専門(2年制)卒業(3月)

  const rows = [
    ["小学校 入学", ym(elemIn, 4)],
    ["小学校 卒業", ym(elemOut, 3)],
    ["中学校 入学", ym(jhsIn, 4)],
    ["中学校 卒業", ym(jhsOut, 3)],
    ["高校 入学", ym(hsIn, 4)],
    ["高校 卒業", ym(hsOut, 3)],
    ["大学(4年制) 入学", ym(uniIn, 4)],
    ["大学(4年制) 卒業", ym(uniOut, 3)],
    ["短大・専門(2年制) 卒業", ym(tandaiOut, 3)],
  ];

  return {
    summary: `${birth.y}年${birth.m}月${birth.d}日生まれの入学・卒業年早見表`,
    details: [
      ["早生まれ?", hayaumare ? "はい(1月1日〜4月1日生まれ。学年は1つ上)" : "いいえ(4月2日〜12月31日生まれ)"],
    ],
    table: { headers: ["学歴", "年月(和暦)"], rows },
    note: "浪人・留年・休学なしのストレート進学の場合です。和暦は入学・卒業月時点の元号で表記しています。",
  };
}
