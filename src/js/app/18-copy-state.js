/*
 * Module: copy-state
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- copy state: one source for the summary, both buttons and the toast ----------
  const copyBtns = [$("#copyBodyBtn"), $("#copyBodyBtnM")];
  let lastCopy = null;
  function copyStatus(ev, ui) {
    const u = ui.problems.length;
    const epic = ui.items.filter((x) => x.group === "setup" || x.group === "check").length;
    const copied = lastCopy && lastCopy.sig === draftSig();
    const epicSide = epic ? `· then ${epic} to do in Epic` : "";
    if (ev.pristine) return {key: "empty", tone: "neutral", icon: "info", main: "Name it, build it, copy it.", side: "", btn: "Copy for Epic", btnIcon: "copy", btnTone: ""};
    if (u && copied) return {key: "draft-copied", tone: "draft", icon: "alert", main: "Draft copied", side: `· ${plural(u, "unfinished item")} remain${u === 1 ? "s" : ""}`, btn: "Draft copied", btnIcon: "alert", btnTone: "is-draft"};
    if (u) return {key: "draft", tone: revealAll ? "draft" : "neutral", icon: revealAll ? "alert" : "dot", main: `Draft · ${u} unfinished`, side: epic ? `· ${epic} to do in Epic` : "", btn: "Copy draft", btnIcon: "copy", btnTone: ""};
    if (copied) return {key: "copied", tone: "done", icon: "check", main: "Copied", side: epicSide, btn: "Copied", btnIcon: "check", btnTone: "is-done"};
    return {key: "ready", tone: "ready", icon: "check", main: "Ready to copy", side: epicSide, btn: "Copy for Epic", btnIcon: "copy", btnTone: ""};
  }
  function renderCopyButtons(st) {
    copyBtns.forEach((b) => {
      const html = `${icon(st.btnIcon, 19)}<span>${st.btn}</span>`;
      if (b._html !== html) { b.innerHTML = html; b._html = html; }
      b.classList.toggle("is-done", st.btnTone === "is-done");
      b.classList.toggle("is-draft", st.btnTone === "is-draft");
      b.setAttribute("aria-label", st.key === "copied" || st.key === "draft-copied" ? `${st.btn}. Copy again` : st.btn);
    });
  }
  async function copyBody() {
    const {ev, ui} = current;
    revealAll = true;
    updateProblems(ui);
    if (!ev.body.trim()) {
      renderChecks(ev, ui);
      toast("Nothing to copy yet. Type in the first block, or add one.", {tone: "check"});
      if (nodes[0]) { if (isNarrow()) setView("build"); focusUseful(nodes[0].uid); }
      return;
    }
    const r = await doCopy(ev.body, () => current.ev.body);
    if (!r.ok || r.superseded) { renderChecks(current.ev, current.ui); return; }
    if (r.stale) { lastCopy = null; renderChecks(current.ev, current.ui); staleCopyNotice("the phrase"); return; }
    lastCopy = {sig: r.sig};
    renderChecks(current.ev, current.ui);
    const u = ui.problems.length;
    const epic = ui.items.filter((x) => x.group === "setup" || x.group === "check").length;
    if (u) {
      $("#checks").open = true;
      toast(`Draft copied — ${plural(u, "unfinished item")} remain${u === 1 ? "s" : ""}.`, {copy: true, tone: "check", action: "Show", onAction: () => { if (isNarrow()) setView("preview"); $("#checks").open = true; const f = $("#checksBody .citem"); if (f) f.focus(); }});
    } else if (epic) toast(`Copied. After pasting, ${plural(epic, "item")} need${epic === 1 ? "s" : ""} work in Epic.`, {copy: true, tone: "success", action: "Copy setup notes", onAction: () => copySecondary("notes")});
    else toast("Copied. Paste it into SmartPhrase Manager.", {copy: true, tone: "success"});
  }
  async function copySecondary(kind) {
    const {ev, ui} = current;
    if (kind === "name") {
      if (!ev.normalized) { touched.add("doc:name"); revealAll = true; updateProblems(ui); toast("Name your phrase first.", {tone: "check"}); if (isNarrow()) setView("build"); nameInput.focus(); return; }
      const r = await doCopy(ev.name, () => current.ev.name);
      if (!r.ok || r.superseded) return;
      if (r.stale) { staleCopyNotice("the name"); return; }
      toast(`Copied ${ev.name}.`, {copy: true, tone: "success"});
    } else if (kind === "notes") {
      const r = await doCopy(ui.notes, () => current.ui.notes);
      if (!r.ok || r.superseded) return;
      if (r.stale) { staleCopyNotice("the setup notes"); return; }
      toast(ui.problems.length ? `Setup notes copied — they list ${plural(ui.problems.length, "unfinished item")} too.` : "Setup notes copied.", {copy: true, tone: ui.problems.length ? "check" : "success"});
    }
  }
  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.copy; if (k === "body") copyBody(); else copySecondary(k); }));
