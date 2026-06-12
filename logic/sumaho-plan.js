// スマホ乗り換えの損益分岐計算
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const cur = inputs.current_monthly;
  const next = inputs.new_monthly;
  const cost = inputs.switch_cost == null || !Number.isFinite(inputs.switch_cost) ? 0 : inputs.switch_cost;
  const cb = inputs.cashback == null || !Number.isFinite(inputs.cashback) ? 0 : inputs.cashback;
  if (cur == null || !Number.isFinite(cur) || cur <= 0) throw new Error("現在の月額料金を入力してください。");
  if (next == null || !Number.isFinite(next) || next < 0) throw new Error("乗り換え先の月額料金を入力してください。");

  const monthlySave = cur - next;
  const netCost = cost - cb;

  if (monthlySave <= 0) {
    return {
      summary: `月額は ${yen(-monthlySave)} 高くなります(節約にはなりません)`,
      details: [
        ["月額の差", `+${yen(-monthlySave)}(値上がり)`],
        ["2年間の差額", `+${yen(-monthlySave * 24 + netCost)}`],
      ],
      note: "料金面のメリットはありませんが、通信品質・データ容量などの価値があれば乗り換える判断もあります。",
    };
  }

  const breakEven = netCost > 0 ? Math.ceil(netCost / monthlySave) : 0;
  const save1y = monthlySave * 12 - netCost;
  const save2y = monthlySave * 24 - netCost;
  const save3y = monthlySave * 36 - netCost;

  return {
    summary: `月 ${yen(monthlySave)} の節約。初期費用は ${breakEven === 0 ? "即" : `${breakEven}ヶ月`} で回収できます`,
    details: [
      ["月額の節約", `${yen(monthlySave)}(${yen(cur)} → ${yen(next)})`],
      ["実質の初期費用", `${yen(netCost)}(事務手数料等 − キャッシュバック)`],
      ["元が取れるまで", breakEven === 0 ? "初月から得" : `${breakEven}ヶ月`],
      ["1年間の節約額", yen(save1y)],
      ["2年間の節約額", yen(save2y)],
      ["3年間の節約額", yen(save3y)],
    ],
    note: "節約額=月額差×期間−実質初期費用。端末の残債・解約違約金がある場合は「乗り換え初期費用」に足してください。通話料・オプションは含みません。",
  };
}
