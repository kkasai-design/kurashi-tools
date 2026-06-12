// 割り勘計算(端数の丸め単位と幹事調整に対応)
function ceilTo(n, unit) {
  return Math.ceil(n / unit) * unit;
}
function floorTo(n, unit) {
  return Math.floor(n / unit) * unit;
}
function yen(n) {
  return n.toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const total = inputs.total;
  const people = inputs.people;
  const unit = Number(inputs.unit);
  const mode = inputs.mode;
  if (total == null || !Number.isFinite(total) || total <= 0) throw new Error("合計金額を入力してください。");
  if (people == null || !Number.isFinite(people) || people < 1) throw new Error("人数を1人以上で入力してください。");
  if (![1, 10, 100, 500, 1000].includes(unit)) throw new Error("端数の単位を選択してください。");
  const t = Math.round(total);
  const p = Math.round(people);
  if (p === 1) {
    return { summary: `1人なので全額 ${yen(t)} です`, details: [["支払額", yen(t)]], note: "" };
  }

  const exact = t / p;
  let details;
  let summary;
  let note = "";

  if (mode === "kanji_more") {
    const per = floorTo(exact, unit);
    const kanji = t - per * (p - 1);
    summary = `参加者は一人 ${yen(per)}、幹事は ${yen(kanji)} です`;
    details = [
      ["参加者一人あたり(幹事以外)", yen(per)],
      ["幹事の支払い", yen(kanji)],
      ["内訳", `${yen(per)} × ${p - 1}人 + 幹事${yen(kanji)} = ${yen(t)}`],
    ];
    note = "参加者の金額をきりの良い額に切り下げ、端数を幹事がまとめて負担する方式です。";
    if (kanji < 0) throw new Error("端数単位が大きすぎます。小さい単位を選んでください。");
  } else if (mode === "kanji_less") {
    const per = ceilTo(exact, unit);
    const kanji = t - per * (p - 1);
    if (kanji < 0) throw new Error("端数単位が大きすぎて幹事の支払いがマイナスになります。小さい単位を選んでください。");
    summary = `参加者は一人 ${yen(per)}、幹事は ${yen(kanji)} です`;
    details = [
      ["参加者一人あたり(幹事以外)", yen(per)],
      ["幹事の支払い", yen(kanji)],
      ["内訳", `${yen(per)} × ${p - 1}人 + 幹事${yen(kanji)} = ${yen(t)}`],
    ];
    note = "参加者の金額をきりの良い額に切り上げ、幹事の支払いを少なくする方式です(集金の手間への御礼などに)。";
  } else {
    const per = ceilTo(exact, unit);
    const collected = per * p;
    const change = collected - t;
    summary = `一人 ${yen(per)} です`;
    details = [
      ["一人あたり", yen(per)],
      ["集まる金額", `${yen(collected)}(${yen(per)} × ${p}人)`],
      ["余り(お釣り)", yen(change)],
    ];
    note = "全員同額で端数を切り上げる方式です。余りは幹事のお釣りや次回の足しにどうぞ。";
  }

  return { summary, details, note };
}
