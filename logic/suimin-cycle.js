// 睡眠サイクル計算(90分サイクル+入眠15分)
const CYCLE_MIN = 90;
const FALL_ASLEEP_MIN = 15;

function parseTime(s) {
  if (typeof s !== "string") throw new Error("時刻を入力してください。");
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) throw new Error("時刻を入力してください。");
  const h = Number(m[1]), mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new Error("正しい時刻を入力してください。");
  return h * 60 + mi;
}

function fmtTime(totalMin) {
  const t = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(t / 60);
  const m = t % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function fmtDur(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function calc(inputs) {
  const mode = inputs.mode;
  const t = parseTime(inputs.time);

  const cycles = [6, 5, 4, 3];
  const rows = [];
  if (mode === "wake_from_bed") {
    // 寝る時刻 → 起きる時刻の候補
    for (const c of cycles) {
      const sleepMin = c * CYCLE_MIN;
      const wake = t + FALL_ASLEEP_MIN + sleepMin;
      rows.push([`${c}サイクル`, fmtDur(sleepMin), `${fmtTime(wake)} に起床`]);
    }
    return {
      summary: `${fmtTime(t)} に布団に入る場合のおすすめ起床時刻`,
      table: { headers: ["サイクル数", "睡眠時間", "起床時刻"], rows, highlightRow: 1 },
      note: "眠りの浅いタイミング(90分サイクルの切れ目)に起きると目覚めがスッキリしやすいといわれます。入眠までの時間を15分として計算。理想は5〜6サイクル(7.5〜9時間)です。サイクルの長さには個人差(80〜100分)があります。",
    };
  }
  // 起きる時刻 → 寝る時刻の候補
  for (const c of cycles) {
    const sleepMin = c * CYCLE_MIN;
    const bed = t - sleepMin - FALL_ASLEEP_MIN;
    rows.push([`${c}サイクル`, fmtDur(sleepMin), `${fmtTime(bed)} に布団へ`]);
  }
  return {
    summary: `${fmtTime(t)} に起きる場合のおすすめ就寝時刻`,
    table: { headers: ["サイクル数", "睡眠時間", "就寝時刻(布団に入る時刻)"], rows, highlightRow: 1 },
    note: "眠りの浅いタイミング(90分サイクルの切れ目)に起きると目覚めがスッキリしやすいといわれます。入眠までの時間を15分として計算。理想は5〜6サイクル(7.5〜9時間)です。サイクルの長さには個人差(80〜100分)があります。",
  };
}
