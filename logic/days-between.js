import { parseDate, toSerial, fromSerial, weekday, daysInMonth } from "./_date.js";

function addMonths(d, n) {
  let y = d.y;
  let m = d.m + n;
  y += Math.floor((m - 1) / 12);
  m = ((m - 1) % 12 + 12) % 12 + 1;
  const day = Math.min(d.d, daysInMonth(y, m));
  return { y, m, d: day };
}

export function calc(inputs) {
  let from = parseDate(inputs.from);
  let to = parseDate(inputs.to);
  let swapped = false;
  if (toSerial(from.y, from.m, from.d) > toSerial(to.y, to.m, to.d)) {
    [from, to] = [to, from];
    swapped = true;
  }
  const fs = toSerial(from.y, from.m, from.d);
  const ts = toSerial(to.y, to.m, to.d);
  const days = ts - fs;

  // 平日数(両端含む、土日除く。祝日は考慮しない)
  let weekdays = 0;
  for (let s = fs; s <= ts; s++) {
    const d = fromSerial(s);
    const w = weekday(d.y, d.m, d.d);
    if (w !== 0 && w !== 6) weekdays++;
  }

  // ○ヶ月と○日
  let months = (to.y - from.y) * 12 + (to.m - from.m);
  if (to.d < from.d) months--;
  const anchor = addMonths(from, months);
  const restDays = ts - toSerial(anchor.y, anchor.m, anchor.d);
  const monthsLabel = months >= 12
    ? `${Math.floor(months / 12)}年${months % 12}ヶ月と${restDays}日`
    : `${months}ヶ月と${restDays}日`;

  const weeks = Math.floor(days / 7);
  const remDays = days % 7;

  let note = "「日数」は初日を含まない数え方(翌日=1日)です。チケットの「○日間有効」のような両端を含む数え方は「両端を含む日数」をご覧ください。平日数は土日のみ除外し、祝日は考慮していません。";
  if (swapped) note = "※開始日と終了日が逆だったため、入れ替えて計算しました。" + note;

  return {
    summary: `${from.y}年${from.m}月${from.d}日から${to.y}年${to.m}月${to.d}日までは ${days.toLocaleString()}日 です`,
    details: [
      ["日数(初日を含まない)", `${days.toLocaleString()}日`],
      ["両端を含む日数", `${(days + 1).toLocaleString()}日`],
      ["週に換算", `${weeks.toLocaleString()}週間と${remDays}日`],
      ["月に換算(暦どおり)", monthsLabel],
      ["平日の日数(土日除く・両端含む)", `${weekdays.toLocaleString()}日`],
    ],
    note,
  };
}
