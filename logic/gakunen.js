import { parseDate, schoolYearBase, fullAge } from "./_date.js";

function gradeLabel(grade, base) {
  if (grade < 1) {
    const inYear = base + 7;
    return { label: "未就学", extra: `小学校入学は${inYear}年4月です` };
  }
  if (grade <= 6) return { label: `小学${grade}年生` };
  if (grade <= 9) return { label: `中学${grade - 6}年生` };
  if (grade <= 12) return { label: `高校${grade - 9}年生` };
  if (grade <= 16) return { label: `大学${grade - 12}年生(現役進学の場合)` };
  return { label: "学生年代を卒業しています(現役進学なら大学卒業済み)" };
}

export function calc(inputs) {
  const birth = parseDate(inputs.birth);
  const asof = parseDate(inputs.asof);
  if (birth.y < 1900 || birth.y > 2100) throw new Error("1900年〜2100年の生年月日を入力してください。");

  const nendo = asof.m >= 4 ? asof.y : asof.y - 1;
  const base = schoolYearBase(birth);
  const grade = nendo - base - 6;
  const g = gradeLabel(grade, base);
  const age = fullAge(birth, asof);
  const hayaumare = base !== birth.y;

  const details = [
    ["学年", g.label + (g.extra ? `(${g.extra})` : "")],
    ["年度", `${nendo}年度(${nendo}年4月〜${nendo + 1}年3月)`],
    ["満年齢", `${age}歳(${asof.y}年${asof.m}月${asof.d}日時点)`],
    ["早生まれ?", hayaumare ? "はい(学年は1つ上)" : "いいえ"],
  ];

  // 今年度の学年早見表(小1〜高3)
  const rows = [];
  let highlightRow = null;
  const names = ["小学1年生", "小学2年生", "小学3年生", "小学4年生", "小学5年生", "小学6年生", "中学1年生", "中学2年生", "中学3年生", "高校1年生", "高校2年生", "高校3年生"];
  names.forEach((nm, i) => {
    const gr = i + 1;
    const b = nendo - 6 - gr;
    if (gr === grade) highlightRow = i;
    rows.push([nm, `${b}年4月2日〜${b + 1}年4月1日生まれ`, `${gr + 5}〜${gr + 6}歳`]);
  });

  return {
    summary: grade >= 1 && grade <= 16 ? `${nendo}年度は「${g.label}」です` : g.label,
    details,
    table: { headers: [`${nendo}年度の学年`, "生まれた日", "年度内の満年齢"], rows, highlightRow },
    note: "学年は4月1日〜翌年3月31日の「年度」で区切られます。表は浪人・留年なしの場合です。",
  };
}
