import { parseDate, toSerial, fromSerial, fmt as fmtDate } from "./_date.js";

export function calc(inputs) {
  const lmp = parseDate(inputs.lmp); // 最終月経開始日
  const asof = parseDate(inputs.asof);
  const lmpS = toSerial(lmp.y, lmp.m, lmp.d);
  const asofS = toSerial(asof.y, asof.m, asof.d);
  if (asofS < lmpS) throw new Error("基準日が最終月経開始日より前になっています。");

  const edd = fromSerial(lmpS + 280); // 出産予定日(40週0日)
  const days = asofS - lmpS;
  const weeks = Math.floor(days / 7);
  const remDays = days % 7;
  if (weeks > 45) throw new Error("最終月経開始日を確認してください(45週を超えています)。");

  const month = Math.floor(weeks / 4) + 1; // 妊娠月数(4週=1ヶ月)
  let stage;
  if (weeks < 16) stage = "妊娠初期(〜15週)";
  else if (weeks < 28) stage = "妊娠中期(16〜27週)・安定期と呼ばれる時期";
  else stage = "妊娠後期(28週〜)";

  const milestones = [
    ["妊娠判明の目安(5〜6週)", fmtDate(fromSerial(lmpS + 35))],
    ["安定期に入る(16週0日)", fmtDate(fromSerial(lmpS + 112))],
    ["正期産の開始(37週0日)", fmtDate(fromSerial(lmpS + 259))],
    ["出産予定日(40週0日)", fmtDate(edd)],
    ["正期産の終わり(41週6日)", fmtDate(fromSerial(lmpS + 293))],
  ];

  return {
    summary: `出産予定日は ${fmtDate(edd)}、現在 妊娠${weeks}週${remDays}日 です`,
    details: [
      ["出産予定日", fmtDate(edd)],
      ["現在の週数", `妊娠${weeks}週${remDays}日(妊娠${month}ヶ月)`],
      ["時期", stage],
      ["出産予定日まで", `あと${(280 - days).toLocaleString("ja-JP")}日`],
    ],
    table: { headers: ["節目", "日付"], rows: milestones },
    note: "最終月経開始日を0週0日として280日後(40週0日)を出産予定日とする標準的な計算(ネーゲレ概算)です。月経周期が28日以外の場合や排卵日がずれている場合、実際の予定日は医師の超音波検査で補正されます。必ず産婦人科で確認してください。",
  };
}
