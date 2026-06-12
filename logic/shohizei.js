// 消費税計算(10%・8%、税込⇔税抜)
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const amount = inputs.amount;
  const rate = Number(inputs.rate);
  const mode = inputs.mode;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) throw new Error("金額を入力してください。");
  if (![10, 8].includes(rate)) throw new Error("税率を選択してください。");

  if (mode === "add") {
    const tax = amount * (rate / 100);
    const total = amount + tax;
    return {
      summary: `税込 ${yen(total)} です(${rate}%)`,
      details: [
        ["税抜価格", yen(amount)],
        ["消費税額", yen(tax)],
        ["税込価格", yen(total)],
      ],
      note: "1円未満は四捨五入で表示しています(事業者により切り捨て・切り上げの場合があります)。",
    };
  }
  if (mode === "remove") {
    const base = amount / (1 + rate / 100);
    const tax = amount - base;
    return {
      summary: `税抜 ${yen(base)} です(${rate}%)`,
      details: [
        ["税込価格", yen(amount)],
        ["消費税額", yen(tax)],
        ["税抜価格", yen(base)],
      ],
      note: "1円未満は四捨五入で表示しています。レシートと数円ずれる場合があります。",
    };
  }
  throw new Error("計算の種類を選択してください。");
}
