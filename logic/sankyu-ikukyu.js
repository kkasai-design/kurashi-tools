import { parseDate, toSerial, fromSerial, fmt as fmtDate } from "./_date.js";

export function calc(inputs) {
  const edd = parseDate(inputs.edd); // 出産予定日
  const twins = inputs.twins === "yes";
  const s = toSerial(edd.y, edd.m, edd.d);

  // 産前休業: 出産予定日を含めて6週間(42日)前から。多胎は14週間(98日)
  const prenatalDays = twins ? 98 : 42;
  const prenatalStart = fromSerial(s - prenatalDays + 1);
  // 産後休業: 出産日の翌日から8週間(56日)
  const postnatalEnd = fromSerial(s + 56);
  // 育児休業: 産後休業明けから子が1歳の誕生日の前日まで
  const ikukyuStart = fromSerial(s + 57);
  const age1 = { y: edd.y + 1, m: edd.m, d: edd.d };
  const age1eve = fromSerial(toSerial(age1.y, age1.m, age1.d) - 1);
  const age1half = fromSerial(toSerial(edd.y + 1, edd.m, edd.d) - 1 + 183);
  const age2eve = fromSerial(toSerial(edd.y + 2, edd.m, edd.d) - 1);

  return {
    summary: `産休は ${fmtDate(prenatalStart)} から、育休は最長で子が1歳になる前日(${fmtDate(age1eve)})まで取れます`,
    details: [
      ["出産予定日", fmtDate(edd) + (twins ? "(多胎)" : "")],
      [`産前休業の開始(${twins ? "14週間" : "6週間"}前)`, `${fmtDate(prenatalStart)} から取得可能`],
      ["産後休業(8週間・必須)", `出産翌日 〜 ${fmtDate(postnatalEnd)}`],
      ["育児休業の開始", `${fmtDate(ikukyuStart)} から(産後休業明け)`],
      ["育休の原則の期限(1歳の前日)", fmtDate(age1eve)],
      ["保育園に入れない場合の延長", `1歳6ヶ月まで(${fmtDate(age1half)}頃)、さらに2歳まで(${fmtDate(age2eve)})延長可`],
    ],
    note: "労働基準法・育児介護休業法に基づく一般的な計算です(産前6週は本人の請求、産後8週は就業禁止※産後6週経過後は本人請求+医師の認めで就業可)。実際の出産日がずれた場合、産後の日程は実出産日から数え直します。パパ育休(産後パパ育休)など最新制度の詳細は勤務先・ハローワークでご確認ください。",
  };
}
