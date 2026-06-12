// 長寿祝い(賀寿)の計算
// 数えn歳の年 = 生年 + n - 1 / 満n歳になる年 = 生年 + n
const IWAI = [
  { name: "還暦(かんれき)", kazoe: 61, origin: "干支(六十干支)が一巡して生まれた年の暦に還ることから" },
  { name: "緑寿(ろくじゅ)", kazoe: 66, origin: "「緑々(ろくろく)寿」の語呂から。2002年に提唱された新しい祝い" },
  { name: "古希(こき)", kazoe: 70, origin: "杜甫の詩「人生七十古来稀なり」から" },
  { name: "喜寿(きじゅ)", kazoe: 77, origin: "「喜」の草書体が七十七に見えることから" },
  { name: "傘寿(さんじゅ)", kazoe: 80, origin: "「傘」の略字が八十に見えることから" },
  { name: "米寿(べいじゅ)", kazoe: 88, origin: "「米」の字を分解すると八十八になることから" },
  { name: "卒寿(そつじゅ)", kazoe: 90, origin: "「卒」の略字「卆」が九十に見えることから" },
  { name: "白寿(はくじゅ)", kazoe: 99, origin: "「百」から一を取ると「白」になることから" },
  { name: "百寿(ひゃくじゅ)", kazoe: 100, origin: "100歳。「紀寿(きじゅ)」とも" },
];

export function calc(inputs) {
  const by = inputs.birth_year;
  if (by == null || !Number.isFinite(by)) throw new Error("生まれ年(西暦)を入力してください。");
  const birthY = Math.round(by);
  const asofY = inputs.asof_year != null && Number.isFinite(inputs.asof_year)
    ? Math.round(inputs.asof_year)
    : new Date().getFullYear();
  if (birthY < 1900 || birthY > asofY) throw new Error(`生まれ年は1900年〜${asofY}年で入力してください。`);

  const kazoe = asofY - birthY + 1;

  const rows = [];
  let highlightRow = null;
  let current = null;
  let next = null;
  IWAI.forEach((iw, i) => {
    const kazoeYear = birthY + iw.kazoe - 1;
    const manYear = birthY + iw.kazoe;
    if (kazoeYear === asofY) {
      highlightRow = i;
      current = { ...iw, year: kazoeYear };
    }
    if (!next && kazoeYear > asofY) next = { ...iw, year: kazoeYear };
    rows.push([iw.name, `数え${iw.kazoe}歳`, `${kazoeYear}年`, iw.kazoe === 61 ? `${kazoeYear}年(満60歳)` : `${manYear}年`]);
  });

  let summary;
  if (current) {
    summary = `今年(${asofY}年)は「${current.name}」のお祝いの年です!(数え${current.kazoe}歳)`;
  } else if (next) {
    summary = `次の長寿祝いは「${next.name}」、${next.year}年です(数え${next.kazoe}歳)`;
  } else {
    summary = `長寿祝いの一覧表を表示しました(数え${kazoe}歳)`;
  }

  const details = [
    ["今年の数え年", `${kazoe}歳(${asofY}年)`],
    ["今年の満年齢", `${asofY - birthY - 1}歳→誕生日で${asofY - birthY}歳`],
  ];
  if (next) {
    details.push(["次の長寿祝い", `${next.name} … ${next.year}年(あと${next.year - asofY}年)`]);
  }

  return {
    summary,
    details,
    table: {
      headers: ["お祝い", "年齢", "数え年で祝う年", "満年齢で祝う年"],
      rows,
      highlightRow,
    },
    note: "長寿祝いは伝統的に数え年で行いますが、現代では満年齢で祝う家庭も増えています。還暦だけは「数え61歳=満60歳の年」で一致します。",
  };
}
