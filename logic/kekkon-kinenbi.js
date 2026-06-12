import { parseDate, toSerial, fullAge } from "./_date.js";

const ANNIVERSARIES = [
  [1, "紙婚式"], [2, "綿婚式"], [3, "革婚式"], [4, "花婚式"], [5, "木婚式"],
  [6, "鉄婚式"], [7, "銅婚式"], [8, "ゴム婚式"], [9, "陶器婚式"], [10, "錫婚式(アルミ婚式)"],
  [11, "鋼鉄婚式"], [12, "絹婚式"], [13, "レース婚式"], [14, "象牙婚式"], [15, "水晶婚式"],
  [20, "磁器婚式"], [25, "銀婚式"], [30, "真珠婚式"], [35, "珊瑚婚式"], [40, "ルビー婚式"],
  [45, "サファイア婚式"], [50, "金婚式"], [55, "エメラルド婚式"], [60, "ダイヤモンド婚式"],
];

export function calc(inputs) {
  const wed = parseDate(inputs.wedding);
  const asof = parseDate(inputs.asof);
  if (toSerial(wed.y, wed.m, wed.d) > toSerial(asof.y, asof.m, asof.d)) {
    throw new Error("結婚記念日が基準日より後になっています。");
  }

  const years = fullAge(wed, asof); // 「結婚n周年を迎えた」回数と同じ計算
  const days = toSerial(asof.y, asof.m, asof.d) - toSerial(wed.y, wed.m, wed.d);

  const rows = [];
  let highlightRow = null;
  let current = null;
  let next = null;
  ANNIVERSARIES.forEach(([n, name], i) => {
    const y = wed.y + n;
    if (n === years) {
      highlightRow = i;
      current = { n, name, y };
    }
    if (!next && n > years) next = { n, name, y };
    rows.push([`${n}周年`, name, `${y}年${wed.m}月${wed.d}日`]);
  });

  let summary;
  if (current) {
    summary = `今年は結婚${current.n}周年「${current.name}」の年です!`;
  } else if (next) {
    summary = `結婚${years}年目。次の節目は ${next.y}年の「${next.name}」(${next.n}周年)です`;
  } else {
    summary = `結婚${years}周年、おめでとうございます`;
  }

  const details = [
    ["結婚してから", `${years}年(${days.toLocaleString("ja-JP")}日)`],
  ];
  if (next) {
    details.push(["次の記念式", `${next.n}周年「${next.name}」… ${next.y}年${wed.m}月${wed.d}日`]);
  }

  return {
    summary,
    details,
    table: { headers: ["周年", "名称", "記念日"], rows, highlightRow },
    note: "周年は記念日当日を迎えた時点で数えています(結婚式の「満」の数え方)。名称は一般的な英国式の呼び方で、流派により異なる場合があります。",
  };
}
