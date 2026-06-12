// 用紙サイズ(A判・B判)の寸法
const SIZES = {
  A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148],
  B0: [1030, 1456], B1: [728, 1030], B2: [515, 728], B3: [364, 515], B4: [257, 364], B5: [182, 257], B6: [128, 182],
};
const NOTES = {
  A4: "コピー用紙・ビジネス文書の標準",
  A3: "A4の2倍。図面・ポスター・メニュー",
  A5: "A4の半分。手帳・ノート",
  A6: "文庫本・はがきに近いサイズ",
  B5: "大学ノート・週刊誌",
  B4: "新聞の折込チラシ",
  B6: "単行本(四六判に近い)",
  A0: "学会ポスター",
  B0: "駅貼りポスター",
};

export function calc(inputs) {
  const size = String(inputs.size || "").toUpperCase();
  const dim = SIZES[size];
  if (!dim) throw new Error("用紙サイズを選択してください。");
  const [w, h] = dim;

  const rows = Object.entries(SIZES).map(([name, [ww, hh]]) => [
    name,
    `${ww} × ${hh}mm`,
    `${(ww / 10).toFixed(1)} × ${(hh / 10).toFixed(1)}cm`,
    NOTES[name] || "",
  ]);
  const highlightRow = Object.keys(SIZES).indexOf(size);

  const nextNum = Number(size[1]) + 1;
  const half = nextNum <= 6 ? `${size[0]}${nextNum}サイズ` : "—";

  return {
    summary: `${size}サイズは ${w}×${h}mm(${(w / 10).toFixed(1)}×${(h / 10).toFixed(1)}cm)です`,
    details: [
      ["寸法(mm)", `${w} × ${h}mm`],
      ["寸法(cm)", `${(w / 10).toFixed(1)} × ${(h / 10).toFixed(1)}cm`],
      ["インチ換算", `${(w / 25.4).toFixed(2)} × ${(h / 25.4).toFixed(2)}インチ`],
      ["用途", NOTES[size] || "—"],
      ["半分に折ると", half],
    ],
    table: { headers: ["サイズ", "mm", "cm", "主な用途"], rows, highlightRow },
    note: "A判・B判とも「長辺を半分に折ると1つ小さいサイズ」になる規格です(A4を半分に折る→A5)。日本のB判はISOのB判とは寸法が異なる日本独自規格(JIS B判)です。",
  };
}
