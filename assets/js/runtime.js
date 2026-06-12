// くらしの計算室 - ツール共通ランタイム
// ビルド時に焼き込んだフォームと、各ツールの calc(inputs) 純粋関数を配線する。

export function initTool(calc, realtime = false) {
  const form = document.getElementById("tool-form");
  const resultEl = document.getElementById("result");
  if (!form || !resultEl) return;

  // data-default="today" の date 入力へ今日をセット(静的HTMLに日付を焼き込まない)
  for (const el of form.querySelectorAll('input[type="date"][data-default="today"]')) {
    if (!el.value) el.value = localToday();
  }

  const run = () => {
    const inputs = collectInputs(form);
    try {
      const out = calc(inputs);
      renderResult(resultEl, out);
    } catch (err) {
      renderError(resultEl, err && err.message ? err.message : "入力内容を確認してください。");
    }
  };

  if (realtime) {
    form.addEventListener("input", run);
    const btn = form.querySelector(".btn-calc");
    if (btn) btn.style.display = "none";
    run();
  }
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run();
    if (!realtime) resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // URLコピー
  const copyBtn = document.querySelector(".share-copy");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.url);
        copyBtn.textContent = "コピーしました";
        setTimeout(() => (copyBtn.textContent = "URLをコピー"), 1500);
      } catch { /* clipboard未対応環境は無視 */ }
    });
  }
}

export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function collectInputs(form) {
  const inputs = {};
  for (const el of form.querySelectorAll("input, select, textarea")) {
    if (!el.name) continue;
    if (el.type === "radio") {
      if (el.checked) inputs[el.name] = el.value;
      continue;
    }
    if (el.type === "checkbox") {
      inputs[el.name] = el.checked;
      continue;
    }
    if (el.type === "number") {
      inputs[el.name] = el.value === "" ? null : Number(el.value);
      continue;
    }
    inputs[el.name] = el.value;
  }
  return inputs;
}

function renderResult(el, out) {
  el.innerHTML = "";
  if (!out) { el.hidden = true; return; }
  if (out.summary) {
    const p = document.createElement("p");
    p.className = "result-summary";
    p.textContent = out.summary;
    el.appendChild(p);
  }
  if (out.details && out.details.length) {
    el.appendChild(buildTable(null, out.details.map(([k, v]) => [k, v]), true));
  }
  if (out.table) {
    el.appendChild(buildTable(out.table.headers, out.table.rows, false, out.table.highlightRow));
  }
  if (out.note) {
    const p = document.createElement("p");
    p.className = "result-note";
    p.textContent = out.note;
    el.appendChild(p);
  }
  el.hidden = false;
}

function buildTable(headers, rows, firstColTh, highlightRow) {
  const table = document.createElement("table");
  if (headers) {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    for (const h of headers) {
      const th = document.createElement("th");
      th.textContent = h;
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tbody = document.createElement("tbody");
  rows.forEach((row, i) => {
    const tr = document.createElement("tr");
    if (highlightRow === i) tr.className = "result-highlight";
    row.forEach((cell, j) => {
      const tag = firstColTh && j === 0 ? "th" : "td";
      const td = document.createElement(tag);
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function renderError(el, msg) {
  el.innerHTML = "";
  const p = document.createElement("p");
  p.className = "result-error";
  p.textContent = msg;
  el.appendChild(p);
  el.hidden = false;
}
