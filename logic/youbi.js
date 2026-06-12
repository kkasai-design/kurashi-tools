import { parseDate, weekday, WEEKDAYS_JA, eraOf, toSerial } from "./_date.js";

export function calc(inputs) {
  const d = parseDate(inputs.date);
  if (d.y < 1868 || d.y > 2200) throw new Error("1868年〜2200年の日付を入力してください。");
  const w = weekday(d.y, d.m, d.d);
  const era = eraOf(d.y, d.m, d.d);

  const today = inputs.asof ? parseDate(inputs.asof) : null;
  const details = [
    ["曜日", `${WEEKDAYS_JA[w]}曜日`],
    ["和暦", era ? `${era.label}${d.m}月${d.d}日` : "—"],
  ];
  if (today) {
    const diff = toSerial(d.y, d.m, d.d) - toSerial(today.y, today.m, today.d);
    if (diff === 0) details.push(["今日との関係", "今日です"]);
    else if (diff > 0) details.push(["今日との関係", `${diff.toLocaleString("ja-JP")}日後`]);
    else details.push(["今日との関係", `${(-diff).toLocaleString("ja-JP")}日前`]);
  }

  return {
    summary: `${d.y}年${d.m}月${d.d}日は ${WEEKDAYS_JA[w]}曜日 です`,
    details,
    note: "グレゴリオ暦(現在の暦)に基づいて計算しています。",
  };
}
