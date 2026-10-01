/*
 * Module: checks-problems
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- checks + problems ----------
  const problemKey = (p) => `${p.uid || "doc"}:${p.field}`;
  const problemVisible = (p) => revealAll || (!p.revealOnCopyOnly && touched.has(problemKey(p)));

  function renderChecks(ev, ui) {
    const summary = $("#checksSummary");
    const body = $("#checksBody");
    const errors = ui.problems;
    const setup = ui.items.filter((x) => x.group === "setup");
    const check = ui.items.filter((x) => x.group === "check");
    const later = ui.items.filter((x) => x.group === "later");
    const note = ui.items.filter((x) => x.group === "note");
    const st = copyStatus(ev, ui);
    summary.className = `tone-${st.tone}`;
    summary.innerHTML = `<span class="sum-icon">${icon(st.icon, 18)}</span><span class="sum-main">${st.main}</span>${st.side ? `<span class="sum-side">${st.side}</span>` : ""}<span class="chev">${icon("chev", 16)}</span>`;
    renderCopyButtons(st);
    const anything = errors.length + ui.items.length;
    const group = (cls, title, iconName2, hint, list, mapper) => list.length ? `<section class="cgroup ${cls}"><h3>${icon(iconName2, 15)}${title}</h3>${hint ? `<p class="hint">${hint}</p>` : ""}${list.map(mapper).join("")}</section>` : "";
    const itemBtn = (x) => `<button type="button" class="citem" data-goto="${x.uids[0]}"><span class="n">${x.blocks.join(", ")}</span><span>${x.html}${x.count > 1 && x.group === "later" ? ` ×${x.count}` : ""}</span></button>`;
    body.innerHTML = ev.pristine
      ? `<p class="checks-foot">Type a name, add blocks, then copy. Items that need work in Epic will be listed here.</p>`
      : (group("error", "Unfinished", "stop", "", errors, (p) => p.uid ? `<button type="button" class="citem" data-goto="${p.uid}" data-field="${p.field}"><span class="n">${p.n}</span><span>${esc(p.msg)}</span></button>` : `<button type="button" class="citem" data-goto-name="1"><span class="n">—</span><span>${esc(p.msg)}</span></button>`)
        + group("setup", "Set up in Epic", "alert", "Create or insert these in Epic after pasting.", setup, itemBtn)
        + group("check", "Check in Epic", "alert", "SmartLinks vary by organization. Confirm each one pulls what you expect.", check, itemBtn)
        + group("later", "Filled in when documenting", "dot", "", later, itemBtn)
        + group("note", "Worth a look", "info", "", note, itemBtn)
        + (anything ? "" : `<p class="checks-foot">Nothing left to fix here.</p>`)
        + `<p class="checks-foot">Test every phrase in your Epic training or test area before clinical use.</p>`);
  }

  function updateProblems(ui) {
    const byBlock = new Map();
    ui.problems.filter((p) => p.uid && problemVisible(p)).forEach((p) => { if (!byBlock.has(p.uid)) byBlock.set(p.uid, []); byBlock.get(p.uid).push(p); });
    blockEls.forEach((el, uid) => {
      const list = byBlock.get(uid) || [];
      const ul = el.querySelector(".block-problems");
      const html = list.map((p) => `<li>${icon("stop", 15)}<span>${esc(p.msg)}</span></li>`).join("");
      if (ul && ul._html !== html) { ul.innerHTML = html; ul._html = html; ul.id = `pb-${uid}`; }
      const bad = new Set(list.map((p) => p.field));
      el.querySelectorAll("[data-field]").forEach((f) => {
        if (f.type === "radio") return;
        if (bad.has(f.dataset.field)) { f.setAttribute("aria-invalid", "true"); f.setAttribute("aria-describedby", `pb-${uid}`); }
        else if (f.hasAttribute("aria-invalid")) { f.removeAttribute("aria-invalid"); f.removeAttribute("aria-describedby"); }
      });
    });
    const note = $("#nameNote");
    const nameProblem = ui.problems.find((p) => p.field === "name" && problemVisible(p));
    if (nameProblem) { note.className = "field-note error"; note.innerHTML = `${icon("stop", 16)}<span>${esc(nameProblem.msg)}</span>`; note.hidden = false; nameInput.setAttribute("aria-invalid", "true"); }
    else if (ui.nameNote) { note.className = "field-note check"; note.innerHTML = `${icon("alert", 16)}<span>${esc(ui.nameNote)}</span>`; note.hidden = false; nameInput.removeAttribute("aria-invalid"); }
    else { note.hidden = true; nameInput.removeAttribute("aria-invalid"); }
  }

  function update(opts) {
    const ev = evaluateSmartPhraseDraft({phraseName: state.phraseName, nodes});
    const ui = uiChecks(ev);
    current = {ev, ui};
    if (lastCopy && lastCopy.sig !== draftSig()) { lastCopy = null; const t = toastsEl.firstElementChild; if (t && t.dataset.copy) clearToast(); }
    renderPreview(ev);
    renderChecks(ev, ui);
    updateProblems(ui);
    if (!(opts && opts.noPersist)) persistDraft();
    $("#undoBtn").disabled = !undoStack.length;
    $("#redoBtn").disabled = !redoStack.length;
  }
