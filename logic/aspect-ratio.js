// アスペクト比の計算とリサイズ
function gcd(a, b) {
  while (b) [a, b] = [b, a % b];
  return a;
}

const COMMON = [
  [16, 9, "テレビ・YouTube・フルHD/4K"],
  [4, 3, "昔のテレビ・iPad"],
  [3, 2, "一眼レフ写真・はがき近似"],
  [1, 1, "Instagram正方形"],
  [9, 16, "スマホ縦動画(Shorts/TikTok/Reels)"],
  [21, 9, "シネマワイド"],
  [16, 10, "PCモニター(WUXGA等)"],
];

export function calc(inputs) {
  const w = inputs.width;
  const h = inputs.height;
  if (w == null || !Number.isFinite(w) || w <= 0) throw new Error("幅を入力してください。");
  if (h == null || !Number.isFinite(h) || h <= 0) throw new Error("高さを入力してください。");
  const W = Math.round(w), H = Math.round(h);

  const g = gcd(W, H);
  const rw = W / g, rh = H / g;
  const match = COMMON.find(([a, b]) => a === rw && b === rh);
  const ratioLabel = `${rw}:${rh}`;

  const details = [
    ["アスペクト比(約分)", ratioLabel + (match ? `(${match[2]})` : "")],
    ["比率の値", (W / H).toFixed(3)],
  ];

  const newW = inputs.new_width;
  if (newW != null && Number.isFinite(newW) && newW > 0) {
    const newH = (newW * H) / W;
    details.push([`幅${Math.round(newW).toLocaleString("ja-JP")}pxにリサイズすると`, `高さ ${Math.round(newH).toLocaleString("ja-JP")}px`]);
  }

  const rows = COMMON.map(([a, b, label]) => {
    const hh = Math.round((W * b) / a);
    return [`${a}:${b}`, label, `${W}×${hh}`];
  });

  return {
    summary: `${W}×${H} のアスペクト比は ${ratioLabel} です${match ? `(${match[2]})` : ""}`,
    details,
    table: { headers: ["比率", "主な用途", `幅${W}pxの場合のサイズ`], rows },
    note: "リサイズの計算式: 新しい高さ = 新しい幅 × 元の高さ ÷ 元の幅。1px未満は四捨五入しています。",
  };
}
