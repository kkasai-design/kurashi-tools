// パーセント計算(3モード)
function fmt(n) {
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function calc(inputs) {
  const mode = inputs.mode;
  const a = inputs.a;
  const b = inputs.b;
  if (a == null || !Number.isFinite(a)) throw new Error("数値Aを入力してください。");
  if (b == null || !Number.isFinite(b)) throw new Error("数値Bを入力してください。");

  if (mode === "of") {
    // AのB%は?
    const v = (a * b) / 100;
    return {
      summary: `${fmt(a)} の ${fmt(b)}% は ${fmt(v)} です`,
      details: [
        ["計算式", `${fmt(a)} × ${fmt(b)} ÷ 100 = ${fmt(v)}`],
        ["結果", fmt(v)],
      ],
      note: "金額なら「1500円の20%=300円」のように読み替えてください。",
    };
  }
  if (mode === "ratio") {
    // AはBの何%?
    if (b === 0) throw new Error("Bが0のときは割合を計算できません。");
    const v = (a / b) * 100;
    return {
      summary: `${fmt(a)} は ${fmt(b)} の ${fmt(v)}% です`,
      details: [
        ["計算式", `${fmt(a)} ÷ ${fmt(b)} × 100 = ${fmt(v)}%`],
        ["結果", `${fmt(v)}%`],
      ],
      note: "達成率や構成比の計算に使えます(例: 売上30万円は目標150万円の20%)。",
    };
  }
  if (mode === "discount") {
    // A円のB%引き / B%増し
    const off = a * (1 - b / 100);
    const up = a * (1 + b / 100);
    const offAmount = a - off;
    return {
      summary: `${fmt(a)} の ${fmt(b)}%引きは ${fmt(off)} です`,
      details: [
        [`${fmt(b)}%引き(割引後)`, fmt(off)],
        ["割引額", fmt(offAmount)],
        [`${fmt(b)}%増し(上乗せ後)`, fmt(up)],
      ],
      note: "セール価格の計算や、値上げ後の金額確認にどうぞ。",
    };
  }
  throw new Error("計算の種類を選択してください。");
}
