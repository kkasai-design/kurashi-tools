// ウォーターサーバー vs ペットボトルのコスト比較
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const liters = inputs.liters_per_month;
  const server = inputs.server_monthly;
  const bottle = inputs.bottle_price;
  if (liters == null || !Number.isFinite(liters) || liters <= 0) throw new Error("月に飲む水の量を入力してください。");
  if (server == null || !Number.isFinite(server) || server < 0) throw new Error("ウォーターサーバーの月額を入力してください。");
  if (bottle == null || !Number.isFinite(bottle) || bottle <= 0) throw new Error("ペットボトルの単価を入力してください。");

  const bottleCount = liters * 2; // 500ml換算
  const bottleMonthly = bottleCount * bottle;
  const bottle2L = Math.ceil(liters / 2) * (bottle * 1.6); // 2Lボトルは500mlの1.6倍程度の単価が目安
  const diff = server - bottleMonthly;

  const details = [
    ["ウォーターサーバー(月)", yen(server)],
    [`ペットボトル500ml×${Math.round(bottleCount)}本(月)`, yen(bottleMonthly)],
    ["ペットボトル2Lで賄う場合(月)", `約${yen(bottle2L)}`],
    ["月の差額(サーバー − 500ml)", `${diff >= 0 ? "+" : "−"}${yen(Math.abs(diff))}`],
    ["年間の差額", `${diff >= 0 ? "+" : "−"}${yen(Math.abs(diff) * 12)}`],
  ];

  const summary = diff > 0
    ? `ウォーターサーバーの方が月 ${yen(diff)} 高い計算です(快適さ・お湯機能との比較で判断)`
    : `ウォーターサーバーの方が月 ${yen(-diff)} 安い計算です`;

  return {
    summary,
    details,
    note: "ペットボトル2L換算は500ml単価の1.6倍/本(2Lは割安なため)で概算しています。サーバーは電気代(月500〜1,000円程度)とノルマ本数がある場合も。お湯がすぐ出る・買い物・ゴミ出しの手間が減る、という金額以外の価値も含めて比較してください。",
  };
}
