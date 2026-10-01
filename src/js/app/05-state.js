/*
 * Module: state
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- state ----------
  let library = buildModuleLibrary();
  let libraryById = new Map(library.map((item) => [item.id, item]));
  const state = {phraseName: ""};
  let serial = 0;
  let nodes = [];
  let undoStack = [];
  let redoStack = [];
  let selectedUid = null;
  let revealAll = false;
  const touched = new Set();
  let current = null;
  let typing = {key: "", t: 0};

  const createNode = (module) => ({
    uid: `tool-node-${++serial}`, moduleId: module.id, kind: module.kind, evidence: module.evidence,
    label: module.label, token: module.token || "", description: module.description || "", source: module.source || "",
    text: module.kind === "template" ? module.body : "", listName: "", choices: "", defaultChoice: "", multiple: "Single selection",
    sourcePages: module.sourcePages || [], specialty: module.specialty || "", privacyNotice: module.privacyNotice || "", requirementStatus: module.requirementStatus || ""
  });
  const refreshNodeMetadata = (node) => {
    const base = {text: "", listName: "", choices: "", defaultChoice: "", multiple: "Single selection", token: "", label: "", ...node};
    const currentModule = libraryById.get(base.moduleId);
    if (!currentModule) return base;
    return {...base, evidence: currentModule.evidence, label: currentModule.label, token: currentModule.token || base.token || "", description: currentModule.description || base.description || "", source: currentModule.source || base.source || ""};
  };
  const snapshot = () => ({serial, phraseName: state.phraseName, nodes: nodes.map((node) => ({...node}))});
  function restore(draft) {
    serial = Number(draft.serial) || 0;
    state.phraseName = draft.phraseName || "";
    nodes = draft.nodes.map(refreshNodeMetadata);
    nameInput.value = state.phraseName;
    if (selectedUid && !nodes.some((n) => n.uid === selectedUid)) selectedUid = null;
    renderBlocks();
    update();
  }
  // History entries carry the cursor/selection as it was before the change (not persisted).
  function currentSel() {
    const a = document.activeElement;
    if (a === nameInput) return {uid: null, field: "name", start: a.selectionStart, end: a.selectionEnd};
    if (a && a.dataset && a.dataset.field && blocksEl.contains(a) && typeof a.selectionStart === "number") return {uid: a.closest(".block").dataset.uid, field: a.dataset.field, start: a.selectionStart, end: a.selectionEnd};
    return null;
  }
  function recordHistory(sel) { undoStack.push({...snapshot(), sel: sel === undefined ? currentSel() : sel}); if (undoStack.length > 100) undoStack.shift(); redoStack = []; typing = {key: "", t: 0}; }
  function applySel(sel) {
    if (!sel) return;
    let f = null;
    if (sel.field === "name") f = nameInput;
    else { const el = blockEls.get(sel.uid); f = el && el.querySelector(`[data-field="${sel.field}"]`); }
    if (!f || typeof f.setSelectionRange !== "function") return;
    f.focus({preventScroll: true});
    try { f.setSelectionRange(sel.start, sel.end); } catch {}
    const el = f.closest(".block"); if (el) el.scrollIntoView({block: "nearest"});
  }
  function undo() { if (!undoStack.length) return; const prev = undoStack.pop(); redoStack.push({...snapshot(), sel: prev.after || currentSel()}); restore(prev); applySel(prev.sel); typing = {key: "", t: 0}; announce("Undone."); }
  function redo() { if (!redoStack.length) return; const next = redoStack.pop(); undoStack.push({...snapshot(), sel: currentSel(), after: next.sel}); restore(next); applySel(next.sel); typing = {key: "", t: 0}; announce("Redone."); }

  function loadStoredDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      return {draft: validateDraftPayload(JSON.parse(raw))};
    } catch (error) { return {error: `Your saved draft couldn’t be loaded (${error.message}). Starting fresh.`}; }
  }
  let saveFlashTimer = 0;
  function persistDraft() {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({schema: DRAFT_SCHEMA, version: DRAFT_VERSION, draft: snapshot()}));
      setSaveState("ok");
    } catch { setSaveState("fail"); }
  }
  function setSaveState(kind) {
    const el = $("#saveState");
    if (kind === "fail") { el.dataset.tone = "warn"; el.innerHTML = `${icon("alert", 16)}<span class="label">Not saved — use More › Save file</span>`; el.title = "This browser blocked local saving."; return; }
    el.innerHTML = `${icon("check", 16)}<span class="label">Saved on this device</span>`;
    el.title = "Your draft is saved in this browser only.";
    el.dataset.tone = "flash";
    clearTimeout(saveFlashTimer);
    saveFlashTimer = setTimeout(() => { el.dataset.tone = ""; }, 900);
  }
