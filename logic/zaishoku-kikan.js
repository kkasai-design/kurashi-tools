import { parseDate, toSerial, fromSerial, daysInMonth, eraOf } from "./_date.js";

function addMonths(d, n) {
  let y = d.y;
  let m = d.m + n;
  y += Math.floor((m - 1) / 12);
  m = ((m - 1) % 12 + 12) % 12 + 1;
  return { y, m, d: Math.min(d.d, daysInMonth(y, m)) };
}

export function calc(inputs) {
  const start = parseDate(inputs.start);
  const end = parseDate(inputs.end);
  if (toSerial(start.y, start.m, start.d) > toSerial(end.y, end.m, end.d)) {
    throw new Error("入社日が退職日より後になっています。");
  }

  // 在職期間は両端を含む(4/1入社・3/31退職=1年)ため、終点+1日で月計算
  const endNext = fromSerial(toSerial(end.y, end.m, end.d) + 1);
  let months = (endNext.y - start.y) * 12 + (endNext.m - start.m);
  if (endNext.d < start.d) months--;
  const anchor = addMonths(start, months);
  const restDays = toSerial(endNext.y, endNext.m, endNext.d) - toSerial(anchor.y, anchor.m, anchor.d);

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const totalDays = toSerial(end.y, end.m, end.d) - toSerial(start.y, start.m, start.d) + 1;

  const periodLabel = `${years}年${remMonths}ヶ月${restDays > 0 ? restDays + "日" : ""}`;

  const sEra = eraOf(start.y, start.m, start.d);
  const eEra = eraOf(end.y, end.m, end.d);

  return {
    summary: `在職期間は ${periodLabel} です(両端を含む)`,
    details: [
      ["在職期間", periodLabel],
      ["在職日数(両端含む)", `${totalDays.toLocaleString("ja-JP")}日`],
      ["入社", `${start.y}年${start.m}月${start.d}日(${sEra ? sEra.label : "—"})`],
      ["退職", `${end.y}年${end.m}月${end.d}日(${eEra ? eEra.label : "—"})`],
      ["満年数(雇用保険などの通算目安)", `満${years}年`],
    ],
    note: "在職期間は入社日・退職日の両方を含めて数えるのが一般的です(4月1日入社・翌年3月31日退職=1年)。履歴書には「入社年月」「退職年月」を和暦か西暦で統一して書きます。",
  };
}
