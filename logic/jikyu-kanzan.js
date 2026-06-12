// 時給⇔月給⇔年収の換算(残業・賞与なしの単純換算)
function yen(n) {
  return Math.round(n).toLocaleString("ja-JP") + "円";
}

export function calc(inputs) {
  const mode = inputs.mode;
  const amount = inputs.amount;
  const h = inputs.hours_per_day;
  const d = inputs.days_per_week;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) throw new Error("金額を入力してください。");
  if (h == null || !Number.isFinite(h) || h <= 0 || h > 24) throw new Error("1日の労働時間を1〜24時間で入力してください。");
  if (d == null || !Number.isFinite(d) || d <= 0 || d > 7) throw new Error("週の勤務日数を1〜7日で入力してください。");

  const yearHours = h * d * 52; // 年52週で概算
  let hourly;
  if (mode === "from_annual") {
    hourly = (amount * 10000) / yearHours; // 年収は万円で入力
  } else if (mode === "from_monthly") {
    hourly = (amount * 10000 * 12) / yearHours; // 月給も万円で入力
  } else if (mode === "from_hourly") {
    hourly = amount; // 時給は円で入力
  } else {
    throw new Error("換算の種類を選択してください。");
  }

  const daily = hourly * h;
  const weekly = daily * d;
  const monthly = (hourly * yearHours) / 12;
  const annual = hourly * yearHours;

  let summaryVal;
  if (mode === "from_hourly") {
    summaryVal = `年収換算 約${Math.round(annual / 10000).toLocaleString("ja-JP")}万円`;
  } else {
    summaryVal = `時給換算 約${yen(hourly)}`;
  }

  return {
    summary: summaryVal,
    details: [
      ["時給", yen(hourly)],
      ["日給", `${yen(daily)}(${h}時間/日)`],
      ["週給", `${yen(weekly)}(週${d}日勤務)`],
      ["月収換算", yen(monthly)],
      ["年収換算", `${yen(annual)}(年${yearHours.toLocaleString("ja-JP")}時間)`],
    ],
    note: "年間52週・残業なし・賞与なしの単純換算です(額面ベース)。賞与がある場合は年収に含めて「年収から換算」を使うと実態に近い時給が出ます。",
  };
}
