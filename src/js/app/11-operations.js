/*
 * Module: operations
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- operations ----------
  const indexOfUid = (uid) => nodes.findIndex((n) => n.uid === uid);
  function insertModule(moduleId, at) {
    const module = libraryById.get(moduleId);
    if (!module) return null;
    recordHistory();
    const node = createNode(module);
    const idx = at == null || at < 0 || at > nodes.length ? nodes.length : at;
    nodes.splice(idx, 0, node);
    selectedUid = node.uid;
    renderBlocks({animate: true});
    update();
    setSelected(node.uid);
    focusUseful(node.uid);
    return node;
  }
  function startFromTemplate(moduleId) {
    const module = libraryById.get(moduleId);
    if (!module) return;
    recordHistory();
    nodes = [createNode(module)];
    state.phraseName = normalizeName(module.label);
    nameInput.value = state.phraseName;
    selectedUid = nodes[0].uid;
    renderBlocks(); update();
    toast(`Started a new phrase from ${module.label}. Check it in Epic.`, {action: "Undo", onAction: undo});
  }
  function blockAction(act, uid) {
    const i = indexOfUid(uid);
    if (i < 0) return;
    const node = nodes[i];
    if (act === "remove") {
      recordHistory();
      nodes.splice(i, 1);
      const next = nodes[i] || nodes[i - 1];
      selectedUid = next ? next.uid : null;
      renderBlocks({animate: true}); update();
      if (next) { setSelected(next.uid, {noScroll: true}); blockEls.get(next.uid).focus({preventScroll: true}); }
      else document.querySelector('.add-btn').focus();
      toast(`Block ${i + 1} removed.`, {action: "Undo", onAction: undo});
    } else if (act === "duplicate") {
      recordHistory();
      const copy = {...node, uid: `tool-node-${++serial}`};
      nodes.splice(i + 1, 0, copy);
      renderBlocks({animate: true}); update();
      setSelected(copy.uid); blockEls.get(copy.uid).focus({preventScroll: true});
      announce(`Block ${i + 1} duplicated as block ${i + 2}.`);
    } else if (act === "up" || act === "down") {
      const j = act === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= nodes.length) return;
      recordHistory();
      [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
      renderBlocks({animate: true}); update();
      setSelected(uid, {noScroll: true});
      announce(`Moved to position ${j + 1}.`);
    } else if (act === "collapse" || act === "expand") {
      node.collapsed = act === "expand" ? false : !node.collapsed;
      renderBlocks(); update();
      const el = blockEls.get(uid);
      if (!node.collapsed) { const f = el.querySelector("[data-field]"); (f || el).focus({preventScroll: true}); }
      else el.querySelector('[data-act="collapse"]').focus({preventScroll: true});
    } else if (act === "inline") {
      const ta = blockEls.get(uid).querySelector('[data-field="text"]');
      if (!ta) return;
      const sel = selMem.get(uid) || {start: ta.value.length, end: ta.value.length};
      openInlinePicker(ta, {start: sel.start, end: sel.end, typed: false, anchor: blockEls.get(uid).querySelector('[data-act="inline"]')});
    } else if (act === "join") {
      joinUp(uid);
    } else if (act === "add") {
      openPicker({at: i + 1, anchor: blockEls.get(uid).querySelector('[data-act="add"]'), where: `after block ${i + 1}`});
    } else if (act === "insert-before") {
      openPicker({at: i, anchor: blockEls.get(uid).querySelector(".insert-here"), where: i === 0 ? "at the start" : `before block ${i + 1}`});
    }
  }
  // Explicit, undoable: appends this block's output to the end of the text block above.
  // This removes one line break from the copied output, which is the point of joining.
  function joinUp(uid) {
    const i = indexOfUid(uid);
    if (!canJoin(i)) return;
    const prev = nodes[i - 1];
    const cur = nodes[i];
    recordHistory();
    const a = (prev.text || "").replace(/\s+$/, "");
    const b = nodeOutput(cur).replace(/^[ \t]+/, "");
    const sep = !a || /^[.,;:!?)\]}]/.test(b) ? "" : " ";
    prev.text = a + sep + b;
    nodes.splice(i, 1);
    selectedUid = prev.uid;
    renderBlocks({animate: true}); update();
    const ta = blockEls.get(prev.uid).querySelector('[data-field="text"]');
    if (ta) { ta.focus({preventScroll: true}); const pos = a.length + sep.length + b.length; ta.setSelectionRange(pos, pos); }
    setSelected(prev.uid, {noScroll: true});
    toast(`Joined block ${i + 1} onto block ${i}.`, {action: "Undo", onAction: undo});
  }
  // Inserts plain token text at the saved cursor. Uses the browser's own editing command so the
  // field's native undo (Ctrl+Z while typing) also works; the app's Undo restores the cursor too.
  function insertInline(uid, token, range) {
    const el = blockEls.get(uid);
    const ta = el && el.querySelector('[data-field="text"]');
    if (!ta) return;
    const v = ta.value;
    const start = Math.min(range.start, v.length), end = Math.min(range.end, v.length);
    const before = v.slice(0, start), after = v.slice(end);
    let ins = token;
    let lead = 0;
    if (/[A-Za-z0-9]$/.test(before)) { ins = ` ${ins}`; lead = 1; }
    const trail = /^[A-Za-z0-9@[{*]/.test(after);
    if (trail) ins = `${ins} `;
    ta.focus({preventScroll: true});
    ta.setSelectionRange(start, end);
    typing = {key: "", t: 0};
    forcedSel = {uid, field: "text", start: range.restore ? range.restore.start : start, end: range.restore ? range.restore.end : end};
    pendingSel = forcedSel;
    let ok = false;
    try { ok = document.execCommand("insertText", false, ins); } catch {}
    if (!ok || ta.value === v) { ta.setRangeText(ins, start, end, "end"); ta.dispatchEvent(new Event("input", {bubbles: true})); }
    forcedSel = null;
    const caret = start + lead + token.length;
    ta.setSelectionRange(caret, caret);
    announce(`${token} inserted.`);
  }
  function moveTo(uid, idx) {
    const from = indexOfUid(uid);
    if (from < 0) return;
    let to = idx > from ? idx - 1 : idx;
    if (to === from) return;
    recordHistory();
    const [node] = nodes.splice(from, 1);
    nodes.splice(to, 0, node);
    renderBlocks({animate: true}); update();
    setSelected(uid, {noScroll: true});
    announce(`Moved to position ${to + 1}.`);
  }
  function startOver() {
    recordHistory();
    state.phraseName = ""; nameInput.value = "";
    nodes = [createNode(libraryById.get("free-text"))];
    selectedUid = null; revealAll = false; touched.clear();
    renderBlocks(); update();
    nameInput.focus();
    toast("Started a new phrase.", {action: "Undo", onAction: undo});
  }
