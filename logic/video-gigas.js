// 動画視聴のデータ通信量計算
// 1時間あたりの目安(YouTube等の一般的なストリーミング)
const QUALITY = {
  q360: { name: "360p(低画質)", gbPerHour: 0.35 },
  q480: { name: "480p(SD)", gbPerHour: 0.7 },
  q720: { name: "720p(HD)", gbPerHour: 1.3 },
  q1080: { name: "1080p(フルHD)", gbPerHour: 2.5 },
  q4k: { name: "4K", gbPerHour: 7.0 },
};

function fmt(n, digits = 1) {
  const p = 10 ** digits;
  return (Math.round(n * p) / p).toLocaleString("ja-JP", { maximumFractionDigits: digits });
}

export function calc(inputs) {
  const q = QUALITY[inputs.quality];
  const min = inputs.minutes_per_day;
  if (!q) throw new Error("画質を選択してください。");
  if (min == null || !Number.isFinite(min) || min <= 0 || min > 1440) throw new Error("1日の視聴時間を分で入力してください。");

  const gbDay = (q.gbPerHour * min) / 60;
  const gbMonth = gbDay * 30;

  const plans = [3, 7, 20, 50];
  const rows = plans.map((gb) => {
    const days = gb / gbDay;
    return [`${gb}GBプラン`, days >= 30 ? "1ヶ月もつ" : `約${fmt(days, 1)}日で上限`];
  });

  return {
    summary: `1ヶ月で 約${fmt(gbMonth)}GB 使います(${q.name}を1日${min}分)`,
    details: [
      ["1日あたり", `約${fmt(gbDay, 2)}GB`],
      ["1週間あたり", `約${fmt(gbDay * 7)}GB`],
      ["1ヶ月あたり(30日)", `約${fmt(gbMonth)}GB`],
    ],
    table: { headers: ["スマホのプラン", `${q.name}を1日${min}分見た場合`], rows },
    note: "通信量はYouTube等の一般的なストリーミング動画の目安です。アプリ・ビットレート設定により前後します。毎月ギガが足りない場合は、Wi-Fi環境(光回線・ホームルーター)の利用が確実です。",
  };
}
