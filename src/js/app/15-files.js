/*
 * Module: files
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- files ----------
  function downloadJson(payload, filename) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportDraft() {
    const filename = `${(normalizeName(state.phraseName) || "smartphrase").toLowerCase()}-draft.json`;
    downloadJson({schema: DRAFT_SCHEMA, version: DRAFT_VERSION, exportedAt: new Date().toISOString(), warning: "No patient information belongs in this draft.", draft: snapshot()}, filename);
    toast(`Saved ${filename} to your downloads.`, {tone: "success"});
  }
  $("#draftFile").addEventListener("change", async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("the file is larger than 2 MB");
      let payload;
      try { payload = JSON.parse(await file.text()); } catch { throw new Error("it isn’t valid JSON"); }
      const draft = validateDraftPayload(payload);
      recordHistory();
      selectedUid = null; revealAll = false; touched.clear();
      restore(draft);
      toast(`Opened ${file.name} — ${plural(draft.nodes.length, "block")}. Review it before use.`, {tone: "success", action: "Undo", onAction: undo});
    } catch (error) {
      toast(`<strong>Couldn’t open ${esc(file.name)}.</strong> ${esc(cap(error.message))}. Your current phrase hasn’t changed.`, {tone: "error", html: true, timeout: 0});
    }
  });
  const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
  function rebuildLibrary() {
    library = buildModuleLibrary();
    libraryById = new Map(library.map((item) => [item.id, item]));
    nodes = nodes.map(refreshNodeMetadata);
    renderBlocks(); update({noPersist: false});
  }
  $("#bankFile").addEventListener("change", async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("the file is larger than 5 MB");
      let parsed;
      try { parsed = JSON.parse(await file.text()); } catch { throw new Error("it isn’t valid JSON"); }
      const {phraseSafe, objectSafe, hadPhrase, hadObject} = validateReferenceBankPayload(parsed);
      phraseBank = phraseSafe; objectBank = objectSafe; bankFileName = file.name;
      rebuildLibrary();
      const bits = [];
      if (hadPhrase) bits.push(plural(phraseBank.entries.length, "SmartPhrase"));
      if (hadObject) bits.push(plural(objectBank.entries.length, "object"));
      toast(`Library added: ${bits.join(" + ")}. It stays in this browser.`, {tone: "success"});
    } catch (error) {
      toast(`<strong>Couldn’t add ${esc(file.name)}.</strong> ${esc(cap(error.message))}.`, {tone: "error", html: true, timeout: 0});
    }
  });
