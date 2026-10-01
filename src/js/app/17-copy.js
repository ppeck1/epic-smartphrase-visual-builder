/*
 * Module: copy
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- copy ----------
  async function writeClipboard(text) {
    try { if (navigator.clipboard && window.isSecureContext !== false) { await navigator.clipboard.writeText(text); return true; } } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0"; ta.style.top = "0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch { return false; }
  }
  function showFallback(text) {
    const dlg = $("#copyDialog");
    const ta = $("#fallbackText");
    ta.value = text;
    dlg.showModal();
    ta.focus(); ta.select();
  }
  // Fingerprint of everything that copies or feeds setup notes. View-only state (collapsed,
  // selection) is excluded, so expanding a block never resets copy feedback.
  const draftSig = () => JSON.stringify([state.phraseName, nodes.map((n) => [n.kind, n.moduleId, n.token, n.text, n.listName, n.choices, n.defaultChoice, n.multiple])]);
  let copySeq = 0;
  // Copies text, then reports "current" only if the draft is unchanged and no newer copy started.
  async function doCopy(text, latest) {
    const seq = ++copySeq;
    const sig = draftSig();
    const ok = await writeClipboard(text);
    const superseded = seq !== copySeq;
    const changed = draftSig() !== sig;
    if (!ok) { if (!superseded) showFallback(changed && latest ? latest() : text); return {ok: false}; }
    return {ok: true, stale: superseded || changed, superseded, sig};
  }
  function staleCopyNotice(what) {
    toast(`Your draft changed while copying ${what}. Copy again to include the latest edits.`, {tone: "check", action: "Copy again", onAction: () => (what === "the phrase" ? copyBody() : copySecondary(what === "the name" ? "name" : "notes"))});
  }
