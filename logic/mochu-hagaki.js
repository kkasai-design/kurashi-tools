import { parseDate } from "./_date.js";

const RELATIONS = {
  spouse: { name: "配偶者(夫・妻)", degree: 0, mochu: true },
  parent: { name: "父母", degree: 1, mochu: true },
  parent_in_law: { name: "配偶者の父母", degree: 1, mochu: true },
  child: { name: "子ども", degree: 1, mochu: true },
  grandparent: { name: "祖父母", degree: 2, mochu: true },
  sibling: { name: "兄弟姉妹", degree: 2, mochu: true },
  grandchild: { name: "孫", degree: 2, mochu: true },
  uncle: { name: "おじ・おば", degree: 3, mochu: false },
  other: { name: "その他の親族", degree: 3, mochu: false },
};

export function calc(inputs) {
  const rel = RELATIONS[inputs.relation];
  if (!rel) throw new Error("亡くなった方との関係を選択してください。");
  const death = parseDate(inputs.death_date);

  // 年賀欠礼するのは「亡くなった年の年末」の年賀状(=翌年の年賀状)
  const nengaYear = death.y + 1;

  const details = [
    ["続柄", `${rel.name}(${rel.degree === 0 ? "0親等" : rel.degree + "親等"})`],
    ["喪中の一般的な扱い", rel.mochu ? "喪中とする(年賀欠礼する)のが一般的" : "喪中としないことが多い(同居していた場合などは喪中にしても良い)"],
  ];

  if (rel.mochu) {
    details.push(
      [`出せない年賀状`, `${nengaYear}年の年賀状(${nengaYear}年の正月)`],
      ["喪中はがきを出す時期", `${death.y}年11月中旬〜12月初旬(相手が年賀状を準備する前に)`],
      ["年賀状の代わり(受け取った場合)", `寒中見舞い: ${nengaYear}年1月8日〜2月3日頃に出す`],
      ["翌年の年賀状", `${nengaYear + 1}年の正月からは通常どおり出せます`]
    );
  } else {
    details.push(["年賀状", "通常どおり出して問題ありません(気持ちに応じて喪中にしても構いません)"]);
  }

  return {
    summary: rel.mochu
      ? `${nengaYear}年の年賀状を欠礼します。喪中はがきは ${death.y}年11月中旬〜12月初旬 に出しましょう`
      : `${rel.name}は喪中としないことが一般的です(年賀状は通常どおりでOK)`,
    details,
    note: "喪中の範囲は一般に2親等まで(配偶者・父母・子・祖父母・兄弟姉妹・孫)とされますが、明確な決まりはなく、同居の有無や気持ちで判断して構いません。12月に亡くなった場合など喪中はがきが間に合わないときは、松の内が明けてから寒中見舞いで欠礼をお詫びします。",
  };
}
