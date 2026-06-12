// 定期券の損益分岐計算
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const fare = inputs.fare;
  const teiki = inputs.teiki_monthly;
  const days = inputs.days_per_month;
  if (fare == null || !Number.isFinite(fare) || fare <= 0) throw new Error("片道運賃を入力してください。");
  if (teiki == null || !Number.isFinite(teiki) || teiki <= 0) throw new Error("1ヶ月定期の金額を入力してください。");
  if (days == null || !Number.isFinite(days) || days < 0 || days > 31) throw new Error("月の利用日数を0〜31日で入力してください。");

  const daily = fare * 2;
  const payg = daily * days; // 都度払い(往復×日数)
  const breakEvenDays = Math.ceil(teiki / daily);
  const diff = payg - teiki;

  const summary = diff > 0
    ? `定期券の方が月 ${yen(diff)} お得です(月${days}日利用)`
    : diff < 0
      ? `都度払いの方が月 ${yen(-diff)} お得です(月${days}日利用)`
      : "定期券と都度払いがちょうど同額です";

  return {
    summary,
    details: [
      ["都度払いの月額", `${yen(payg)}(往復${yen(daily)} × ${days}日)`],
      ["1ヶ月定期", yen(teiki)],
      ["差額", diff >= 0 ? `定期が${yen(diff)}安い` : `都度払いが${yen(-diff)}安い`],
      ["損益分岐", `月${breakEvenDays}日以上使うなら定期がお得`],
      ["定期の1日あたり(20日利用時)", yen(teiki / 20)],
    ],
    note: "比較は運賃のみの単純計算です。定期券には「区間内の途中下車が自由」「経路上ならいつでも乗れる」という金額以外のメリットも。3ヶ月・6ヶ月定期はさらに5〜10%程度割安です。",
  };
}
