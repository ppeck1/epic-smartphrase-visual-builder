/*
 * Module: init
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- init ----------
  const stored = loadStoredDraft();
  if (stored && stored.draft) {
    serial = stored.draft.serial || 0;
    state.phraseName = stored.draft.phraseName || "";
    nodes = stored.draft.nodes.map(refreshNodeMetadata);
  } else {
    nodes = [createNode(libraryById.get("free-text"))];
  }
  nameInput.value = state.phraseName;
  renderBlocks();
  update({noPersist: !(stored && stored.draft)});
  if (!(stored && stored.draft)) setSaveState("ok");
  if (stored && stored.error) toast(stored.error, {tone: "error", timeout: 0});
  if (!state.phraseName && !hasMeaningfulMaterial(nodes) && window.matchMedia("(pointer: fine)").matches) nameInput.focus();
