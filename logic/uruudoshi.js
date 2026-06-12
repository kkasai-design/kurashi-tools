import { isLeap, weekday, WEEKDAYS_JA } from "./_date.js";

export function calc(inputs) {
  const n = inputs.year;
  if (n == null || !Number.isFinite(n)) throw new Error("年(西暦)を入力してください。");
  const y = Math.round(n);
  if (y < 1 || y > 9999) throw new Error("1〜9999年の範囲で入力してください。");

  const leap = isLeap(y);
  let reason;
  if (y % 400 === 0) reason = "400で割り切れる年なのでうるう年です(100で割り切れても例外的にうるう年)";
  else if (y % 100 === 0) reason = "100で割り切れる年は、4で割り切れてもうるう年にはなりません(例外ルール)";
  else if (y % 4 === 0) reason = "4で割り切れる年なのでうるう年です";
  else reason = "4で割り切れない年なので平年です";

  const nexts = [];
  for (let yy = y + (leap ? 1 : 0); nexts.length < 5 && yy < 10000; yy++) {
    if (isLeap(yy)) nexts.push(yy);
  }

  const details = [
    ["判定", leap ? "うるう年(366日)" : "平年(365日)"],
    ["理由", reason],
    ["2月の日数", leap ? "29日まで" : "28日まで"],
  ];
  if (leap) {
    details.push(["2月29日の曜日", `${WEEKDAYS_JA[weekday(y, 2, 29)]}曜日`]);
  }
  details.push(["この後のうるう年", nexts.map((v) => `${v}年`).join("、")]);

  return {
    summary: `${y}年は ${leap ? "うるう年(366日)" : "平年(365日)"} です`,
    details,
    note: "うるう年のルール: ①4で割り切れる年はうるう年 ②ただし100で割り切れる年は平年 ③ただし400で割り切れる年はうるう年(例: 2000年はうるう年、1900年・2100年は平年)。",
  };
}
