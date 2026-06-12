// 世界主要都市との時差計算(UTCオフセット基準)
// DST(夏時間)は通年の代表値ではなく「夏時間あり」を注記で案内
const CITIES = {
  honolulu: { name: "ホノルル(ハワイ)", utc: -10, dst: false },
  la: { name: "ロサンゼルス", utc: -8, dst: true },
  ny: { name: "ニューヨーク", utc: -5, dst: true },
  london: { name: "ロンドン", utc: 0, dst: true },
  paris: { name: "パリ・ローマ", utc: 1, dst: true },
  cairo: { name: "カイロ", utc: 2, dst: false },
  dubai: { name: "ドバイ", utc: 4, dst: false },
  delhi: { name: "デリー(インド)", utc: 5.5, dst: false },
  bangkok: { name: "バンコク", utc: 7, dst: false },
  singapore: { name: "シンガポール・北京", utc: 8, dst: false },
  sydney: { name: "シドニー", utc: 10, dst: true },
  auckland: { name: "オークランド(NZ)", utc: 12, dst: true },
};
const JST = 9;

function parseTime(s) {
  const m = String(s || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error("日本の時刻を入力してください。");
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new Error("正しい時刻を入力してください。");
  return h * 60 + mi;
}

function fmtTime(totalMin) {
  const t = ((totalMin % 1440) + 1440) % 1440;
  return `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, "0")}`;
}

export function calc(inputs) {
  const city = CITIES[inputs.city];
  if (!city) throw new Error("都市を選択してください。");
  const jstMin = parseTime(inputs.time);

  const diff = city.utc - JST; // 日本との時差(時間)
  const localMin = jstMin + diff * 60;
  const dayShift = Math.floor(localMin / 1440) - (localMin < 0 ? 1 : 0);
  const dayLabel = localMin < 0 ? "(前日)" : localMin >= 1440 ? "(翌日)" : "";

  const diffLabel = diff === 0 ? "時差なし" : diff > 0 ? `日本より${diff}時間進んでいる` : `日本より${-diff}時間遅れている`;

  const rows = Object.values(CITIES).map((c) => {
    const d = c.utc - JST;
    const lm = jstMin + d * 60;
    const dl = lm < 0 ? "(前日)" : lm >= 1440 ? "(翌日)" : "";
    return [c.name, d === 0 ? "±0" : d > 0 ? `+${d}h` : `${d}h`, `${fmtTime(lm)}${dl}${c.dst ? " ※" : ""}`];
  });

  return {
    summary: `日本が${fmtTime(jstMin)}のとき、${city.name}は ${fmtTime(localMin)}${dayLabel} です`,
    details: [
      ["時差", diffLabel],
      [`${city.name}の現地時刻`, `${fmtTime(localMin)}${dayLabel}`],
      ["夏時間(サマータイム)", city.dst ? "あり(3〜11月頃は表示より1時間進みます)" : "なし(年間を通して同じ時差)"],
    ],
    table: { headers: ["都市", "日本との時差", `日本${fmtTime(jstMin)}のときの現地時刻`], rows },
    note: "※印の都市は夏時間(サマータイム)を実施しており、実施期間中(おおむね3〜11月、南半球は10〜4月)は表示より1時間進みます。時差は標準時で計算しています。",
  };
}
