/*
 * Module: editor-events
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- editor events ----------
  function onFieldInput(f) {
    const el = f.closest(".block");
    if (!el) return;
    const uid = el.dataset.uid;
    const node = nodes.find((n) => n.uid === uid);
    const key = f.dataset.field;
    const value = f.value;
    if (!node || node[key] === value) return;
    const now = Date.now();
    const tkey = `${uid}:${key}`;
    // Undo steps: a run of typing, a run of deleting, or one whole-selection change (e.g. a token).
    const sel = pendingSel && pendingSel.uid === uid && pendingSel.field === key ? pendingSel : null;
    const ranged = Boolean(sel && sel.start !== sel.end);
    const kind = ranged ? "ranged" : /^delete/.test(lastInputType) ? "del" : "ins";
    if (typing.key !== tkey || typing.kind !== kind || ranged || now - typing.t > 1500 || f.type === "radio" || f.tagName === "SELECT") recordHistory(sel || undefined);
    pendingSel = null;
    typing = {key: tkey, t: now, kind};
    node[key] = value;
    if (key === "text") {
      autogrow(f);
      renderInk(f);
      const btn = el.querySelector('[data-act="collapse"]');
      if (btn && node.kind === "free-text") btn.hidden = !textIsLong(value);
    }
    if (key === "choices") { syncDefaultOptions(el, node); autogrow(f); }
    update();
  }
  let pendingSel = null;
  let lastInputType = "";
  let forcedSel = null;
  const selMem = new Map();
  blocksEl.addEventListener("beforeinput", () => { pendingSel = forcedSel || currentSel(); forcedSel = null; });
  blocksEl.addEventListener("input", (e) => {
    const f = e.target;
    if (!f.dataset.field) return;
    lastInputType = e.inputType || "";
    onFieldInput(f);
    if (typedMode() && typedTa() === f) { updateTyped(); return; }
    // "@" typed at a word start opens the picker at the cursor. "a@b" (emails, hand-typed tokens) does not.
    if (f.classList.contains("doc-text") && e.inputType === "insertText" && e.data === "@" && !e.isComposing && f.selectionStart === f.selectionEnd) {
      const pos = f.selectionStart;
      const prev = f.value.charAt(pos - 2);
      if (pos === 1 || /[\s([{"'“‘]/.test(prev)) openInlinePicker(f, {start: pos - 1, end: pos, typed: true});
    }
  });
  blocksEl.addEventListener("change", (e) => { const f = e.target; if (f.dataset.field && (f.type === "radio" || f.tagName === "SELECT")) onFieldInput(f); });
  blocksEl.addEventListener("focusin", (e) => {
    const el = e.target.closest(".block");
    if (el && el.dataset.uid !== selectedUid) setSelected(el.dataset.uid);
  });
  blocksEl.addEventListener("focusout", (e) => {
    const f = e.target;
    const el = f.closest(".block");
    if (!el || !f.dataset.field) return;
    if (f.classList.contains("doc-text")) selMem.set(el.dataset.uid, {start: f.selectionStart, end: f.selectionEnd});
    if (["listName", "choices", "defaultChoice"].includes(f.dataset.field)) { touched.add(`${el.dataset.uid}:${f.dataset.field}`); if (current) updateProblems(current.ui); }
  });
  blocksEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    const el = e.target.closest(".block");
    if (!el) return;
    if (btn && el.contains(btn)) { blockAction(btn.dataset.act, el.dataset.uid); return; }
    if (!e.target.closest("input, textarea, select, label, button")) {
      setSelected(el.dataset.uid);
      const f = el.querySelector('[data-field="text"]');
      if (f && e.target.closest(".bbody")) f.focus();
      else if (document.activeElement === document.body || !el.contains(document.activeElement)) el.focus({preventScroll: true});
    }
  });
  blocksEl.addEventListener("keydown", (e) => {
    const el = e.target.closest(".block");
    if (!el) return;
    const uid = el.dataset.uid;
    if (typedMode() && e.target === typedTa()) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setActive(picker.active + (e.key === "ArrowDown" ? 1 : -1)); return; }
      if ((e.key === "Enter" || e.key === "Tab") && !e.shiftKey && picker.options.length) { e.preventDefault(); choose(picker.active); return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePicker(false); return; }
    }
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); blockAction(e.key === "ArrowUp" ? "up" : "down", uid); return; }
    if (e.key === "Escape") {
      if (e.target !== el) { e.preventDefault(); el.focus({preventScroll: true}); return; }
      setSelected(null); el.blur(); return;
    }
    if (e.target === el && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); blockAction("remove", uid); return; }
    const t = e.target;
    if (t.classList && t.classList.contains("doc-text") && (e.key === "Backspace" || e.key === "Delete") && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && t.selectionStart === t.selectionEnd) {
      const tok = tokenAround(t.value, t.selectionStart, e.key === "Backspace" ? "before" : "after");
      if (tok) {
        e.preventDefault();
        t.setSelectionRange(tok.start, tok.end, e.key === "Backspace" ? "backward" : "forward");
        announce(`${tok.text} selected. Press ${e.key} again to remove it.`);
        return;
      }
    }
    if (e.target === el && e.key === "Enter") { e.preventDefault(); const f = el.querySelector("[data-field], .summary-btn"); if (f) f.focus(); return; }
    // roving toolbar
    if (e.target.classList.contains("tool") && (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End")) {
      const tools = [...el.querySelectorAll(".tool")].filter((b) => !b.disabled && !b.hidden);
      let k = tools.indexOf(e.target);
      k = e.key === "Home" ? 0 : e.key === "End" ? tools.length - 1 : (k + (e.key === "ArrowRight" ? 1 : -1) + tools.length) % tools.length;
      tools.forEach((b) => { b.tabIndex = -1; });
      tools[k].tabIndex = 0; tools[k].focus(); e.preventDefault();
    }
  });
  blocksEl.addEventListener("keyup", (e) => { if (typedMode() && e.target === typedTa() && ["ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown"].includes(e.key)) updateTyped(); });
  blocksEl.addEventListener("mouseup", (e) => { if (typedMode() && e.target === typedTa()) setTimeout(updateTyped, 0); });
  blocksEl.addEventListener("focusout", (e) => { if (typedMode() && e.target === typedTa() && !(e.relatedTarget && picker.el.contains(e.relatedTarget))) setTimeout(() => { if (typedMode() && document.activeElement !== typedTa()) closePicker(false); }, 0); });
  blocksEl.addEventListener("mouseover", (e) => {
    const el = e.target.closest(".block");
    const uid = el ? el.dataset.uid : null;
    pvBody.querySelectorAll(".seg").forEach((s) => s.classList.toggle("is-hover", s.dataset.uid === uid));
  });
  blocksEl.addEventListener("mouseleave", () => pvBody.querySelectorAll(".seg.is-hover").forEach((s) => s.classList.remove("is-hover")));

  // drag (optional shortcut)
  let dragUid = null;
  const dropLine = document.createElement("div");
  dropLine.className = "drop-line";
  blocksEl.addEventListener("dragstart", (e) => {
    const h = e.target.closest && e.target.closest(".handle");
    if (!h) return;
    const el = h.closest(".block");
    dragUid = el.dataset.uid;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `node:${dragUid}`);
    try { e.dataTransfer.setDragImage(el, 20, 20); } catch {}
    requestAnimationFrame(() => el.classList.add("is-dragging"));
  });
  function dropIndex(y) {
    let idx = nodes.length;
    for (let i = 0; i < nodes.length; i++) { const r = blockEls.get(nodes[i].uid).getBoundingClientRect(); if (y < r.top + r.height / 2) { idx = i; break; } }
    return idx;
  }
  blocksEl.addEventListener("dragover", (e) => {
    if (!dragUid) return;
    e.preventDefault();
    const idx = dropIndex(e.clientY);
    const host = blocksEl.getBoundingClientRect();
    let y;
    if (idx < nodes.length) y = blockEls.get(nodes[idx].uid).getBoundingClientRect().top - 5;
    else { const last = blockEls.get(nodes[nodes.length - 1].uid).getBoundingClientRect(); y = last.bottom + 4; }
    dropLine.style.top = `${y - host.top}px`;
    if (!dropLine.isConnected) blocksEl.appendChild(dropLine);
  });
  function endDrag() { if (dragUid && blockEls.get(dragUid)) blockEls.get(dragUid).classList.remove("is-dragging"); dragUid = null; dropLine.remove(); }
  blocksEl.addEventListener("drop", (e) => { if (!dragUid) return; e.preventDefault(); const uid = dragUid; const idx = dropIndex(e.clientY); endDrag(); moveTo(uid, idx); });
  blocksEl.addEventListener("dragend", endDrag);

  // name
  nameInput.addEventListener("input", () => {
    const value = nameInput.value;
    const now = Date.now();
    if (typing.key !== "name" || now - typing.t > 1500) recordHistory();
    typing = {key: "name", t: now};
    state.phraseName = value;
    update();
  });
  nameInput.addEventListener("blur", () => { if (hasMeaningfulMaterial(nodes) || state.phraseName.trim()) { touched.add("doc:name"); if (current) updateProblems(current.ui); } });
  nameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); const first = nodes[0] && blockEls.get(nodes[0].uid); if (first) focusUseful(nodes[0].uid); } });

  // quick add
  document.querySelectorAll("[data-quick]").forEach((b) => b.addEventListener("click", () => {
    const q = b.dataset.quick;
    if (q === "smartlink") openPicker({at: nodes.length, anchor: b, scope: "smartlink", where: "at the end"});
    else insertModule(q, nodes.length);
  }));
  document.querySelector('[data-glyph="text"]').innerHTML = icon("text", 16);
  document.querySelector('[data-glyph="list"]').innerHTML = icon("list", 16);

  // preview → editor
  pvBody.addEventListener("click", (e) => { const s = e.target.closest(".seg"); if (s) revealBlock(s.dataset.uid); });
  pvBody.addEventListener("keydown", (e) => { const s = e.target.closest(".seg"); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); revealBlock(s.dataset.uid); } });
  pvBody.addEventListener("mouseover", (e) => { const s = e.target.closest(".seg"); const uid = s ? s.dataset.uid : null; blockEls.forEach((el, k) => el.classList.toggle("is-hover-linked", k === uid)); });
  pvBody.addEventListener("mouseleave", () => blockEls.forEach((el) => el.classList.remove("is-hover-linked")));
  $("#checksBody").addEventListener("click", (e) => {
    const b = e.target.closest("[data-goto], [data-goto-name]");
    if (!b) return;
    if (b.dataset.gotoName) { if (isNarrow()) setView("build"); nameInput.focus(); nameInput.scrollIntoView({block: "center"}); return; }
    revealBlock(b.dataset.goto, b.dataset.field);
  });
  $("#editorPane").addEventListener("mousedown", (e) => { if (!e.target.closest(".block, .add-area, .name-field, .tools")) setSelected(null, {noScroll: true}); });
