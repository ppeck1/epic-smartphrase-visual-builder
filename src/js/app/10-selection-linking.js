/*
 * Module: selection-linking
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- selection + linking ----------
  function setSelected(uid, opts) {
    selectedUid = uid;
    blockEls.forEach((el, k) => el.classList.toggle("is-selected", k === uid));
    let linked = null;
    pvBody.querySelectorAll(".seg").forEach((s) => { const on = s.dataset.uid === uid; s.classList.toggle("is-linked", on); if (on) linked = s; });
    if (linked && !(opts && opts.noScroll) && !isNarrow()) {
      const box = $("#pvScroll").getBoundingClientRect();
      const r = linked.getBoundingClientRect();
      if (r.top < box.top + 8 || r.top > box.bottom - 40) linked.scrollIntoView({block: "center", behavior: reducedMotion() ? "auto" : "smooth"});
    }
  }
  function revealBlock(uid, field) {
    const el = blockEls.get(uid);
    if (!el) return;
    if (isNarrow() && app.dataset.view !== "build") setView("build");
    const node = nodes.find((n) => n.uid === uid);
    if (node && node.collapsed && field) { node.collapsed = false; renderBlocks(); }
    const target = blockEls.get(uid);
    setSelected(uid, {noScroll: true});
    target.scrollIntoView({block: "center", behavior: reducedMotion() ? "auto" : "smooth"});
    target.classList.remove("flash"); void target.offsetWidth; target.classList.add("flash");
    const f = field ? target.querySelector(`[data-field="${field}"]`) : null;
    (f || target).focus({preventScroll: true});
    const pos = nodes.findIndex((n) => n.uid === uid) + 1;
    announce(`Block ${pos} selected.`);
  }
  function focusUseful(uid) {
    const el = blockEls.get(uid);
    if (!el) return;
    const f = el.querySelector('[data-field="text"], [data-field="listName"]');
    (f || el).focus({preventScroll: true});
    el.scrollIntoView({block: "nearest", behavior: reducedMotion() ? "auto" : "smooth"});
  }
