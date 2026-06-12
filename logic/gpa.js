// GPA計算(日本の標準的な4.0スケール: 秀4・優3・良2・可1・不可0)
function fmt(n) {
  return (Math.round(n * 100) / 100).toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function calc(inputs) {
  const grades = [
    { label: "秀・S(90点〜)", gp: 4, count: inputs.s },
    { label: "優・A(80点〜)", gp: 3, count: inputs.a },
    { label: "良・B(70点〜)", gp: 2, count: inputs.b },
    { label: "可・C(60点〜)", gp: 1, count: inputs.c },
    { label: "不可・F(〜59点)", gp: 0, count: inputs.f },
  ];

  let totalUnits = 0;
  let totalPoints = 0;
  for (const g of grades) {
    const n = g.count == null || !Number.isFinite(g.count) ? 0 : Math.round(g.count);
    if (n < 0) throw new Error("単位数は0以上で入力してください。");
    totalUnits += n;
    totalPoints += n * g.gp;
  }
  if (totalUnits === 0) throw new Error("単位数を1つ以上入力してください。");

  const gpa = totalPoints / totalUnits;

  let evalLabel;
  if (gpa >= 3.5) evalLabel = "極めて優秀(成績優秀者・奨学金レベル)";
  else if (gpa >= 3.0) evalLabel = "優秀(大学院推薦・交換留学で有利な水準)";
  else if (gpa >= 2.5) evalLabel = "良好";
  else if (gpa >= 2.0) evalLabel = "平均的";
  else evalLabel = "要注意(卒業要件・進級基準を確認しましょう)";

  return {
    summary: `GPAは ${fmt(gpa)} です(${totalUnits}単位)`,
    details: [
      ["GPA", fmt(gpa)],
      ["総単位数", `${totalUnits}単位`],
      ["総グレードポイント", `${totalPoints}ポイント`],
      ["目安", evalLabel],
    ],
    note: "GPA=(評価ポイント×単位数)の合計÷総単位数。秀4・優3・良2・可1・不可0の標準方式で計算しています(大学により秀がない4段階や、S=4.5等の独自方式もあります)。単位数換算でなく科目数で入れても概算できます。",
  };
}
