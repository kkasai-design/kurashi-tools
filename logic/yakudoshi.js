// 厄年判定(数え年基準)
// 男性: 25・42・61歳 / 女性: 19・33・37・61歳(本厄)。大厄は男42・女33。
const HONYAKU = { male: [25, 42, 61], female: [19, 33, 37, 61] };
const TAIYAKU = { male: 42, female: 33 };

export function calc(inputs) {
  const sex = inputs.sex;
  const by = inputs.birth_year;
  if (!HONYAKU[sex]) throw new Error("性別を選択してください。");
  if (by == null || !Number.isFinite(by)) throw new Error("生まれ年(西暦)を入力してください。");
  const birthY = Math.round(by);
  const asofY = inputs.asof_year != null && Number.isFinite(inputs.asof_year)
    ? Math.round(inputs.asof_year)
    : new Date().getFullYear();
  if (birthY < 1900 || birthY > asofY) throw new Error(`生まれ年は1900年〜${asofY}年で入力してください。`);

  const kazoe = asofY - birthY + 1;
  const list = HONYAKU[sex];
  const taiyaku = TAIYAKU[sex];

  let status;
  if (list.includes(kazoe)) {
    status = kazoe === taiyaku ? `本厄(大厄)` : "本厄";
  } else if (list.includes(kazoe + 1)) {
    status = "前厄";
  } else if (list.includes(kazoe - 1)) {
    status = "後厄";
  } else {
    status = "厄年ではありません";
  }

  const nextHon = list.find((h) => h >= kazoe);
  const nextLabel = nextHon
    ? `${birthY + nextHon - 1}年(数え${nextHon}歳${nextHon === taiyaku ? "・大厄" : ""})`
    : "ありません(61歳の厄年を過ぎています)";

  const rows = [];
  let highlightRow = null;
  let i = 0;
  for (const h of list) {
    for (const [label, k] of [["前厄", h - 1], [h === taiyaku ? "本厄(大厄)" : "本厄", h], ["後厄", h + 1]]) {
      const y = asofY - k + 1; // asofYに数えk歳になる生まれ年
      if (k === kazoe) highlightRow = i;
      rows.push([label, `数え${k}歳`, `${y}年生まれ`]);
      i++;
    }
  }

  const isYaku = status !== "厄年ではありません";
  return {
    summary: isYaku
      ? `${asofY}年のあなたは「${status}」です(数え${kazoe}歳)`
      : `${asofY}年は厄年ではありません(数え${kazoe}歳)`,
    details: [
      ["数え年", `${kazoe}歳(${asofY}年)`],
      [`${asofY}年の状態`, status],
      ["次の本厄", nextLabel],
    ],
    table: { headers: ["厄", "数え年", `${asofY}年に該当する生まれ年`], rows, highlightRow },
    note: "厄年は数え年(生まれた年を1歳とし元日に加齢)で数えるのが一般的です。神社・お寺によっては満年齢で見る場合もあります。",
  };
}
