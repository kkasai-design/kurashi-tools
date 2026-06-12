// 文字数カウント(リアルタイム)
export function calc(inputs) {
  const text = typeof inputs.text === "string" ? inputs.text : "";

  const chars = [...text];
  const total = chars.length;
  const noSpace = [...text.replace(/\s/g, "")].length;
  const lines = text === "" ? 0 : text.split("\n").length;
  const paragraphs = text.trim() === "" ? 0 : text.split(/\n{2,}/).filter((p) => p.trim() !== "").length;
  const bytes = new TextEncoder().encode(text).length;
  const genkoyoshi = Math.ceil(noSpace / 400);

  return {
    summary: `${total.toLocaleString()}文字(スペース・改行込み)`,
    details: [
      ["文字数(スペース・改行込み)", `${total.toLocaleString()}文字`],
      ["文字数(スペース・改行除く)", `${noSpace.toLocaleString()}文字`],
      ["行数", `${lines.toLocaleString()}行`],
      ["段落数", `${paragraphs.toLocaleString()}段落`],
      ["原稿用紙換算(400字詰め)", `約${genkoyoshi.toLocaleString()}枚`],
      ["データ量(UTF-8)", `${bytes.toLocaleString()}バイト`],
    ],
    note: "絵文字や「𠮷」などの特殊な漢字も1文字として数えます。原稿用紙換算はスペース・改行を除いた文字数÷400の概算です。",
  };
}
