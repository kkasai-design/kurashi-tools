// 全ツールロジックのユニットテストランナー(Node標準機能のみ)
// tests/<id>.test.json を読み、logic/<id>.js の calc() を機械検証する。
// 1件でも失敗すれば exit 1 → デプロイが止まる(フェイルクローズ)。
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const TESTS_DIR = path.join(ROOT, "tests");
const LOGIC_DIR = path.join(ROOT, "logic");

let pass = 0;
let fail = 0;
const failures = [];

function detailsToMap(details) {
  const m = {};
  for (const [k, v] of details || []) m[k] = String(v);
  return m;
}

function checkCase(out, expect, label) {
  const problems = [];
  if (expect.summary !== undefined && out.summary !== expect.summary) {
    problems.push(`summary: 期待 "${expect.summary}" / 実際 "${out.summary}"`);
  }
  if (expect.summary_contains !== undefined && !String(out.summary || "").includes(expect.summary_contains)) {
    problems.push(`summaryに "${expect.summary_contains}" が含まれない (実際: "${out.summary}")`);
  }
  if (expect.details !== undefined) {
    const map = detailsToMap(out.details);
    for (const [k, v] of Object.entries(expect.details)) {
      if (map[k] !== String(v)) {
        problems.push(`details["${k}"]: 期待 "${v}" / 実際 "${map[k]}"`);
      }
    }
  }
  if (expect.note_contains !== undefined && !String(out.note || "").includes(expect.note_contains)) {
    problems.push(`noteに "${expect.note_contains}" が含まれない`);
  }
  if (expect.table_includes !== undefined) {
    const blob = JSON.stringify(out.table || {});
    const needles = Array.isArray(expect.table_includes) ? expect.table_includes : [expect.table_includes];
    for (const needle of needles) {
      if (!blob.includes(needle)) problems.push(`tableに "${needle}" が含まれない`);
    }
  }
  return problems;
}

const files = (await readdir(TESTS_DIR)).filter((f) => f.endsWith(".test.json")).sort();
if (files.length === 0) {
  console.error("テストファイルが1つもありません");
  process.exit(1);
}

for (const file of files) {
  const id = file.replace(".test.json", "");
  const logicPath = path.join(LOGIC_DIR, `${id}.js`);
  let calc;
  try {
    ({ calc } = await import(pathToFileURL(logicPath).href));
  } catch (e) {
    fail++;
    failures.push(`${id}: logicファイルをロードできない: ${e.message}`);
    continue;
  }
  const cases = JSON.parse(await readFile(path.join(TESTS_DIR, file), "utf8"));
  for (const c of cases) {
    const label = `${id} :: ${c.name}`;
    try {
      const out = calc(c.input);
      if (c.expect.throws) {
        fail++;
        failures.push(`${label}: エラーになるべき入力で正常終了した`);
        continue;
      }
      const problems = checkCase(out, c.expect, label);
      if (problems.length) {
        fail++;
        failures.push(`${label}:\n    ${problems.join("\n    ")}`);
      } else {
        pass++;
      }
    } catch (e) {
      if (c.expect.throws) {
        pass++;
      } else {
        fail++;
        failures.push(`${label}: 予期しないエラー: ${e.message}`);
      }
    }
  }
}

console.log(`テスト結果: ${pass} PASS / ${fail} FAIL (${files.length} ツール)`);
if (failures.length) {
  console.error("\n--- 失敗詳細 ---");
  for (const f of failures) console.error("✗ " + f);
  process.exit(1);
}
