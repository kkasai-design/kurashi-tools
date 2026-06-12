// データ容量の換算(KB/MB/GB/TB)+身近な目安
const UNITS = { KB: 1, MB: 1024, GB: 1024 ** 2, TB: 1024 ** 3 }; // KB基準

function fmt(n) {
  if (n >= 100) return Math.round(n).toLocaleString("ja-JP");
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

export function calc(inputs) {
  const v = inputs.value;
  const unit = inputs.unit;
  if (v == null || !Number.isFinite(v) || v <= 0) throw new Error("数値を入力してください。");
  if (!UNITS[unit]) throw new Error("単位を選択してください。");

  const kb = v * UNITS[unit];
  const mb = kb / 1024;
  const gb = mb / 1024;
  const tb = gb / 1024;

  // 身近な目安(概算): 写真4MB、音楽1曲8MB、動画(スマホ1分)100MB、映画(2時間HD)4GB
  const photos = Math.floor(mb / 4);
  const songs = Math.floor(mb / 8);
  const movieHours = gb / 2;

  const details = [
    ["KB(キロバイト)", `${fmt(kb)} KB`],
    ["MB(メガバイト)", `${fmt(mb)} MB`],
    ["GB(ギガバイト)", `${fmt(gb)} GB`],
    ["TB(テラバイト)", `${fmt(tb)} TB`],
  ];

  const rows = [];
  if (photos >= 1) rows.push(["スマホ写真(1枚4MB)", `約${photos.toLocaleString("ja-JP")}枚`]);
  if (songs >= 1) rows.push(["音楽(1曲8MB)", `約${songs.toLocaleString("ja-JP")}曲`]);
  if (movieHours >= 0.5) rows.push(["HD動画の視聴(2GB/時)", `約${fmt(movieHours)}時間`]);

  return {
    summary: `${fmt(v)}${unit} = ${fmt(gb)}GB(${fmt(mb)}MB)です`,
    details,
    table: rows.length ? { headers: ["身近なデータの目安", "換算"], rows } : undefined,
    note: "1024換算(1GB=1024MB)で計算しています。ストレージ製品の表記は1000換算(1GB=1000MB)の場合があり、その分「買った容量より少なく見える」現象が起きます。目安の数字は撮影画質・ビットレートで大きく変わります。",
  };
}
