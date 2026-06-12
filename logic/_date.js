// 日付・和暦の共有ヘルパー(タイムゾーン非依存)
// すべての日付は "YYYY-MM-DD" 文字列または {y, m, d} で扱い、ローカルTZの影響を受けない。

export function parseDate(s) {
  if (typeof s !== "string") throw new Error("日付を入力してください。");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error("日付を入力してください。");
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > daysInMonth(y, mo)) throw new Error("正しい日付を入力してください。");
  return { y, m: mo, d };
}

export function isLeap(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y, m) {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

// 1970-01-01 = 0 とする通算日(Date.UTCはTZ非依存)
export function toSerial(y, m, d) {
  return Date.UTC(y, m - 1, d) / 86400000;
}

export function fromSerial(n) {
  const dt = new Date(n * 86400000);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function addDays(y, m, d, n) {
  return fromSerial(toSerial(y, m, d) + n);
}

// 0=日曜
export function weekday(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"];

export function fmt(o) {
  return `${o.y}年${o.m}月${o.d}日`;
}

// ---- 和暦 ----
export const ERAS = [
  { name: "令和", start: { y: 2019, m: 5, d: 1 } },
  { name: "平成", start: { y: 1989, m: 1, d: 8 } },
  { name: "昭和", start: { y: 1926, m: 12, d: 25 } },
  { name: "大正", start: { y: 1912, m: 7, d: 30 } },
  { name: "明治", start: { y: 1868, m: 1, d: 25 } },
];

// 月日まで分かる場合の確定変換
export function eraOf(y, m, d) {
  const s = toSerial(y, m, d);
  for (const era of ERAS) {
    if (s >= toSerial(era.start.y, era.start.m, era.start.d)) {
      const n = y - era.start.y + 1;
      return { era: era.name, year: n, label: `${era.name}${n === 1 ? "元" : n}年` };
    }
  }
  return null;
}

// 年だけ分かる場合の変換(改元年は2候補を返す)
export function erasOfYear(y) {
  const out = [];
  for (let i = 0; i < ERAS.length; i++) {
    const era = ERAS[i];
    const endY = i === 0 ? 9999 : ERAS[i - 1].start.y;
    if (y >= era.start.y && y <= endY) {
      const n = y - era.start.y + 1;
      out.push({ era: era.name, year: n, label: `${era.name}${n === 1 ? "元" : n}年` });
    }
  }
  return out; // 新しい元号順
}

// "1989年(昭和64年/平成元年)" 形式
export function yearWithWareki(y) {
  const es = erasOfYear(y);
  if (!es.length) return `${y}年`;
  return `${y}年(${es.slice().reverse().map((e) => e.label).join("/")})`;
}

// 和暦 → 西暦(年単位)
export function warekiToSeireki(eraName, n) {
  const era = ERAS.find((e) => e.name === eraName);
  if (!era || n < 1) throw new Error("正しい和暦を入力してください。");
  return era.start.y + n - 1;
}

// ---- 干支 ----
export const ETO_JUNISHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const ETO_YOMI = ["ね", "うし", "とら", "う", "たつ", "み", "うま", "ひつじ", "さる", "とり", "いぬ", "い"];
export const ETO_ANIMALS = ["ねずみ", "うし", "とら", "うさぎ", "たつ", "へび", "うま", "ひつじ", "さる", "とり", "いぬ", "いのしし"];
export const JIKKAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];

export function junishiOf(y) {
  return ETO_JUNISHI[(((y - 4) % 12) + 12) % 12];
}

export function jikkanOf(y) {
  return JIKKAN[(((y - 4) % 10) + 10) % 10];
}

export function etoOf(y) {
  return jikkanOf(y) + junishiOf(y);
}

// ---- 年齢 ----
// 基準日時点の満年齢(誕生日前日の24時に加齢する民法の扱いは実用慣行に合わせ誕生日当日加齢とする)
export function fullAge(birth, asof) {
  let age = asof.y - birth.y;
  if (asof.m < birth.m || (asof.m === birth.m && asof.d < birth.d)) age--;
  return age;
}

// 数え年: 生まれた年を1歳とし、1月1日に加齢
export function kazoeAge(birthY, asofY) {
  return asofY - birthY + 1;
}

// 学年基準年度: 4/2生まれ〜翌4/1生まれが同学年。早生まれ(1/1〜4/1)は前年度扱い
export function schoolYearBase(birth) {
  return birth.m < 4 || (birth.m === 4 && birth.d === 1) ? birth.y - 1 : birth.y;
}
