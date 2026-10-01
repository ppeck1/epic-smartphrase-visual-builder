/*
 * Module: shared-core
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- shared phrase rules ----------
  const {
    TOKEN_RE_SRC, EVIDENCE, DRAFT_SCHEMA, DRAFT_VERSION, DRAFT_STORAGE_KEY,
    normalizeName, extractObservedSmartListTokens, choiceLines, nodeOutput,
    nodeSignature, hasMeaningfulMaterial, renderListWorksheet,
    evaluateSmartPhraseDraft, validateDraftPayload, validateReferenceBankPayload
  } = globalThis.SmartPhraseCore;
