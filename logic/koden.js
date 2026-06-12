// 香典・ご祝儀の相場(一般的な目安額)
const KODEN = {
  parent: { name: "自分の親", amounts: { "20s": "3〜10万円", "30s": "5〜10万円", "40s+": "5〜10万円" } },
  sibling: { name: "兄弟姉妹", amounts: { "20s": "3〜5万円", "30s": "5万円", "40s+": "5万円" } },
  grandparent: { name: "祖父母", amounts: { "20s": "1万円", "30s": "1〜3万円", "40s+": "3〜5万円" } },
  uncle: { name: "おじ・おば", amounts: { "20s": "1万円", "30s": "1〜2万円", "40s+": "1〜3万円" } },
  relative: { name: "その他の親戚", amounts: { "20s": "5千〜1万円", "30s": "1万円", "40s+": "1〜3万円" } },
  boss: { name: "勤務先の上司", amounts: { "20s": "5千円", "30s": "5千〜1万円", "40s+": "1万円" } },
  coworker: { name: "勤務先の同僚・部下", amounts: { "20s": "5千円", "30s": "5千〜1万円", "40s+": "1万円" } },
  friend: { name: "友人・知人", amounts: { "20s": "5千円", "30s": "5千〜1万円", "40s+": "5千〜1万円" } },
  neighbor: { name: "ご近所", amounts: { "20s": "3千〜5千円", "30s": "3千〜1万円", "40s+": "3千〜1万円" } },
};

const GOSHUGI = {
  sibling: { name: "兄弟姉妹", amounts: { "20s": "5万円", "30s": "5万円", "40s+": "5〜10万円" } },
  relative: { name: "親戚(いとこ・甥姪など)", amounts: { "20s": "3〜5万円", "30s": "3〜5万円", "40s+": "5万円" } },
  boss: { name: "部下・後輩の結婚式", amounts: { "20s": "3万円", "30s": "3万円", "40s+": "3〜5万円" } },
  coworker: { name: "同僚", amounts: { "20s": "3万円", "30s": "3万円", "40s+": "3万円" } },
  friend: { name: "友人", amounts: { "20s": "2〜3万円", "30s": "3万円", "40s+": "3万円" } },
};

const AGE_LABEL = { "20s": "20代", "30s": "30代", "40s+": "40代以上" };

export function calc(inputs) {
  const type = inputs.type;
  const age = inputs.age;
  const table = type === "goshugi" ? GOSHUGI : KODEN;
  const rel = table[inputs.relation];
  if (!rel) throw new Error(type === "goshugi" ? "結婚式に出るお相手との関係を選択してください。" : "故人との関係を選択してください。");
  if (!AGE_LABEL[age]) throw new Error("あなたの年代を選択してください。");

  const amount = rel.amounts[age];
  const label = type === "goshugi" ? "ご祝儀" : "香典";

  const rows = Object.entries(rel.amounts).map(([a, v]) => [AGE_LABEL[a], v]);

  const noteKoden = "香典は「4」「9」のつく額と偶数額(2万円を除く)を避けるのが慣習です。新札は折り目をつけて入れます。表書きは仏式四十九日前なら「御霊前」、四十九日後は「御仏前」(浄土真宗は常に御仏前)。地域・宗派・家の慣習で異なるため、迷ったら親族に確認を。";
  const noteGoshugi = "ご祝儀は割り切れない奇数額(3万・5万)が基本です。「4」「9」は避けます。夫婦で出席する場合は2人分で5万円が一般的。新札を用意し、ふくさに包んで持参します。";

  return {
    summary: `${rel.name}への${label}の相場は ${amount} です(${AGE_LABEL[age]})`,
    details: [
      ["関係", rel.name],
      ["あなたの年代", AGE_LABEL[age]],
      [`${label}の相場`, amount],
    ],
    table: { headers: ["年代", `${rel.name}への${label}相場`], rows },
    note: type === "goshugi" ? noteGoshugi : noteKoden,
  };
}
