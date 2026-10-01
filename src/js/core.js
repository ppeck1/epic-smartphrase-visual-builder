/*
 * Shared phrase rules and draft validation.
 *
 * This file is intentionally independent from the page. The browser and the
 * Node test suite both use it, so output rules cannot silently drift.
 *
 * Future work: add a schema migration table here before DRAFT_VERSION changes.
 */
(function exposeSmartPhraseCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SmartPhraseCore = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function createSmartPhraseCore() {
  "use strict";

  const TOKEN_RE_SRC = "\\[\\[INSERT[^\\]\\n]*\\]\\]|\\[(?:INSERT\\s+YOUR|YOUR\\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL|ENTER_NAME|ADD)[^\\]\\n]*\\]|\\*\\*\\*|@[A-Za-z0-9_().,:=-]+@|@@|\\{[^{}\\r\\n:]{1,80}:\\d{1,12}\\}";
  const EVIDENCE = Object.freeze({
    exact: {label: "Ready", note: "This block is copied as written."},
    observed: {label: "Check in Epic", note: "Make sure this works in your Epic setup."},
    catalog: {label: "Check in Epic", note: "Find and add this item with Epic's insert tools."},
    creation: {label: "Check in Epic", note: "Create or add this item in Epic before use."}
  });
  const DRAFT_SCHEMA = "epic-smartobject-builder";
  const DRAFT_VERSION = 1;
  const DRAFT_STORAGE_KEY = "epic-smartobject-builder.v1";
  const KNOWN_NODE_KINDS = new Set([
    "free-text", "wildcard", "smartlink", "catalog-smartlink",
    "existing-smartlist", "catalog-smartlist", "custom-smartlist", "template"
  ]);

  function normalizeName(value) {
    return String(value || "").trim().replace(/^\./, "").replace(/[^A-Za-z0-9_]/g, "").toUpperCase();
  }

  function extractObservedSmartListTokens(value) {
    return String(value || "").match(/\{[^{}\r\n:]{1,80}:\d{1,12}\}/g) || [];
  }

  function choiceLines(node) {
    return String(node.choices || "").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
  }

  function nodeOutput(node) {
    if (["free-text", "template"].includes(node.kind)) return String(node.text || "").trimEnd();
    if (node.kind === "custom-smartlist") return `[[INSERT SMARTLIST IN EPIC: ${normalizeName(node.listName) || "UNNAMED_LIST"}]]`;
    return String(node.token || "");
  }

  function nodeSignature(node) {
    return `${node.kind}|${nodeOutput(node).trim()}`;
  }

  function hasMeaningfulMaterial(nodes) {
    return nodes.some((node) => node.kind !== "free-text" || String(node.text || "").trim());
  }

  function renderListWorksheet(node) {
    const name = normalizeName(node.listName) || "UNNAMED_LIST";
    const choices = choiceLines(node);
    return `SmartList ${name}\nSelection: ${node.multiple}\nDefault: ${String(node.defaultChoice || "").trim() || "None specified"}\nChoices:\n${choices.length ? choices.map((choice, index) => `${index + 1}. ${choice}`).join("\n") : "[ADD CHOICES]"}\nAfter creation, use Insert SmartList in Epic to replace the planning placeholder.`;
  }

  function buildNotes(nodes, body, issues) {
    const lines = [];
    nodes.forEach((node) => {
      const state = EVIDENCE[node.evidence] || EVIDENCE.observed;
      if (node.evidence === "catalog") lines.push(`[${state.label}] ${node.label} — use ${node.kind.includes("smartlist") ? "Insert SmartList" : "Insert SmartLink"} in Epic; pasteable syntax and local availability are not confirmed.`);
      if (node.evidence === "observed") lines.push(`[${state.label}] ${node.label} — ${node.source || "verify in Epic"}; confirm locally.`);
      if (node.kind === "custom-smartlist") lines.push(`[${state.label}] ${renderListWorksheet(node)}`);
      if (node.kind === "wildcard") lines.push(`[${state.label}] Wildcard *** remains for completion during documentation.`);
      else if (node.evidence === "exact") lines.push(`[${state.label}] ${node.label} — inserted exactly as supplied or authored.`);
    });
    if (/\[(?:INSERT\s+YOUR|YOUR\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL)[^\]]*\]/i.test(body)) lines.push("[Check in Epic] Replace the staff-information placeholder. Never use patient information here.");
    issues.filter((issue) => issue.severity === "error").forEach((issue) => lines.push(`[Check] ${issue.label} ${issue.message}`));
    lines.push("[Safety] This tool does not validate or publish in Epic. Test the result in your approved training area.");
    return lines.join("\n\n");
  }

  function evaluateSmartPhraseDraft(opts) {
    const {phraseName = "", nodes = []} = opts || {};
    const normalized = normalizeName(phraseName);
    const suppliedName = String(phraseName || "").trim();
    const canonicalInput = suppliedName.replace(/^\./, "").toUpperCase();
    const body = nodes.map(nodeOutput).filter((value) => value !== "").join("\n");
    const pristine = !suppliedName && !hasMeaningfulMaterial(nodes);
    const issues = [];
    const add = (severity, label, message) => issues.push({severity, label, message});
    if (!pristine && !normalized) add("error", "Add a name.", "Every phrase needs a name.");
    if (suppliedName && (canonicalInput !== normalized || /[^A-Za-z0-9_]/.test(canonicalInput))) add("error", "Check the name.", `Some characters were removed. Review .${normalized || "YOURPHRASE"}.`);
    const firstBlockBySignature = new Map();
    nodes.forEach((node, index) => {
      if (!pristine && node.kind === "free-text" && !String(node.text || "").trim()) add("error", "Empty text block.", `Add text to block ${index + 1}, or remove it.`);
      if (node.kind === "custom-smartlist") {
        const choices = choiceLines(node);
        if (!normalizeName(node.listName)) add("error", "Name the SmartList.", `Block ${index + 1} needs a name.`);
        if (!choices.length) add("error", "Add SmartList choices.", `Block ${index + 1} needs at least one choice.`);
        if (String(node.defaultChoice || "").trim() && !choices.includes(String(node.defaultChoice).trim())) add("error", "Check the default choice.", `“${String(node.defaultChoice).trim()}” is not in block ${index + 1}.`);
      }
      if (node.evidence === "catalog") add("warning", "Find this in Epic.", `Add ${node.label} with Epic's insert tools.`);
      if (node.evidence === "observed") add("warning", "Check this in Epic.", `Make sure ${node.label} works in your Epic setup.`);
      if (node.evidence === "creation") add("warning", "Finish this in Epic.", `Create or add ${node.label} before use.`);
      if (node.kind === "wildcard") add("warning", "A wildcard remains.", `Complete *** in block ${index + 1}.`);
      const signature = nodeSignature(node);
      if (signature.endsWith("|") && pristine) return;
      if (firstBlockBySignature.has(signature)) add("warning", "Two blocks match.", `Blocks ${firstBlockBySignature.get(signature) + 1} and ${index + 1} make the same text.`);
      else firstBlockBySignature.set(signature, index);
    });
    if (!pristine && !body.trim()) add("error", "Add some content.", "Your Epic body is empty.");
    if (/\[(?:ENTER_NAME|ADD(?:\s[^\]]*)?)\]/i.test(body)) add("error", "Finish the placeholders.", "Replace each [ADD …] placeholder.");
    if (/\[\[INSERT\s[^\]]+\]\]/i.test(body)) add("warning", "Finish this in Epic.", "Replace each insert note with Epic's SmartLink or SmartList tool.");
    if (/\[(?:INSERT\s+YOUR|YOUR\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL)[^\]]*\]/i.test(body)) add("warning", "Replace your placeholder.", "Use approved staff information. Never enter patient information here.");
    const notes = buildNotes(nodes, body, issues);
    return {name: `.${normalized || "YOURPHRASE"}`, normalized, body, buildNotes: notes, issues, pristine};
  }

  function checkedString(value, field, max, fallback = "") {
    if (value == null) return fallback;
    if (typeof value !== "string") throw new Error(`${field} must be text`);
    if (value.length > max) throw new Error(`${field} is too long`);
    return value;
  }

  function validateDraftPayload(payload) {
    if (!payload || payload.schema !== DRAFT_SCHEMA) throw new Error("this isn’t a SmartPhrase Builder draft");
    if (payload.version !== DRAFT_VERSION) throw new Error(`unsupported draft version ${payload.version == null ? "missing" : payload.version}`);
    const draft = payload.draft;
    if (!draft || typeof draft.phraseName !== "string" || !Array.isArray(draft.nodes)) throw new Error("the draft data is malformed");
    if (draft.phraseName.length > 64) throw new Error("the phrase name is too long");
    if (draft.nodes.length > 500) throw new Error("the draft has too many blocks");

    const nodes = draft.nodes.map((node, index) => {
      if (!node || typeof node !== "object") throw new Error(`block ${index + 1} is malformed`);
      if (!KNOWN_NODE_KINDS.has(node.kind)) throw new Error(`block ${index + 1} has an unsupported type`);
      if (!EVIDENCE[node.evidence]) throw new Error(`block ${index + 1} has an unsupported check state`);
      const pages = node.sourcePages == null ? [] : node.sourcePages;
      if (!Array.isArray(pages) || pages.length > 200) throw new Error(`block ${index + 1} has invalid source pages`);
      const sourcePages = pages.map((page) => {
        const text = String(page == null ? "" : page);
        if (text.length > 80) throw new Error(`block ${index + 1} source page is too long`);
        return text;
      });

      return {
        uid: `tool-node-${index + 1}`,
        moduleId: checkedString(node.moduleId, `block ${index + 1} module ID`, 160, node.kind),
        kind: node.kind,
        evidence: node.evidence,
        label: checkedString(node.label, `block ${index + 1} label`, 500),
        token: checkedString(node.token, `block ${index + 1} token`, 1000),
        description: checkedString(node.description, `block ${index + 1} description`, 4000),
        source: checkedString(node.source, `block ${index + 1} source`, 2000),
        text: checkedString(node.text, `block ${index + 1} text`, 300000),
        listName: checkedString(node.listName, `block ${index + 1} list name`, 256),
        choices: checkedString(node.choices, `block ${index + 1} choices`, 100000),
        defaultChoice: checkedString(node.defaultChoice, `block ${index + 1} default choice`, 1000),
        multiple: ["Single selection", "Multiple selections", "Confirm in Epic"].includes(node.multiple) ? node.multiple : "Single selection",
        sourcePages,
        specialty: checkedString(node.specialty, `block ${index + 1} specialty`, 500),
        privacyNotice: checkedString(node.privacyNotice, `block ${index + 1} privacy notice`, 2000),
        requirementStatus: checkedString(node.requirementStatus, `block ${index + 1} requirement status`, 500),
        collapsed: Boolean(node.collapsed)
      };
    });

    return {
      serial: Math.max(nodes.length, Math.min(Number(draft.serial) || 0, 10000000)),
      phraseName: draft.phraseName,
      nodes
    };
  }

  function bankText(value, field, max, fallback = "") {
    if (value == null) return fallback;
    const text = String(value);
    if (text.length > max) throw new Error(`${field} is too long`);
    return text;
  }

  function bankPages(value, field) {
    if (value == null) return [];
    if (!Array.isArray(value) || value.length > 500) throw new Error(`${field} has invalid source pages`);
    return value.map((page) => bankText(page, `${field} source page`, 80));
  }

  function validateReferenceBankPayload(payload) {
    const p = payload && typeof payload === "object" ? payload : {};
    const phrase = p.smartPhraseBank || p.phraseBank || (Array.isArray(p.entries) && !p.counts ? p : null);
    const object = p.smartObjectBank || p.objectBank || (Array.isArray(p.entries) && p.counts ? p : null);
    if (!phrase && !object) throw new Error("no smartPhraseBank or smartObjectBank was found in it");
    if (phrase && !Array.isArray(phrase.entries)) throw new Error("the SmartPhrase bank has no entries list");
    if (object && !Array.isArray(object.entries)) throw new Error("the SmartObject bank has no entries list");
    const phraseEntries = phrase ? phrase.entries : [];
    const objectEntries = object ? object.entries : [];
    if (phraseEntries.length + objectEntries.length > 10000) throw new Error("the library has more than 10,000 entries");

    const phraseSafe = {
      guidance: {},
      entries: phraseEntries.map((entry, index) => {
        if (!entry || typeof entry !== "object") throw new Error(`SmartPhrase entry ${index + 1} is malformed`);
        return {
          id: bankText(entry.id, `SmartPhrase entry ${index + 1} ID`, 500),
          identifier: bankText(entry.identifier, `SmartPhrase entry ${index + 1} identifier`, 500),
          displayIdentifier: bankText(entry.displayIdentifier, `SmartPhrase entry ${index + 1} display identifier`, 500),
          body: bankText(entry.body, `SmartPhrase entry ${index + 1} body`, 300000),
          entryType: bankText(entry.entryType, `SmartPhrase entry ${index + 1} type`, 500),
          requirementStatus: bankText(entry.requirementStatus, `SmartPhrase entry ${index + 1} requirement`, 500),
          practice: bankText(entry.practice, `SmartPhrase entry ${index + 1} practice`, 500),
          sourcePages: bankPages(entry.sourcePages, `SmartPhrase entry ${index + 1}`),
          privacyNotice: bankText(entry.privacyNotice, `SmartPhrase entry ${index + 1} privacy notice`, 2000),
          searchText: bankText(entry.searchText, `SmartPhrase entry ${index + 1} search text`, 300000)
        };
      })
    };
    const objectSafe = {
      guidance: {},
      counts: object && object.counts && typeof object.counts === "object" ? object.counts : {},
      entries: objectEntries.map((entry, index) => {
        if (!entry || typeof entry !== "object") throw new Error(`SmartObject entry ${index + 1} is malformed`);
        return {
          id: bankText(entry.id, `SmartObject entry ${index + 1} ID`, 500),
          objectType: bankText(entry.objectType, `SmartObject entry ${index + 1} type`, 500),
          name: bankText(entry.name, `SmartObject entry ${index + 1} name`, 1000),
          objectId: bankText(entry.objectId, `SmartObject entry ${index + 1} object ID`, 500),
          originEvidence: bankText(entry.originEvidence, `SmartObject entry ${index + 1} origin`, 1000),
          alphabetGroup: bankText(entry.alphabetGroup, `SmartObject entry ${index + 1} group`, 500),
          sourcePages: bankPages(entry.sourcePages, `SmartObject entry ${index + 1}`),
          occurrenceCount: Number.isFinite(Number(entry.occurrenceCount)) ? Number(entry.occurrenceCount) : 0,
          smartLinkCode: bankText(entry.smartLinkCode, `SmartObject entry ${index + 1} SmartLink code`, 1000),
          searchText: bankText(entry.searchText, `SmartObject entry ${index + 1} search text`, 300000)
        };
      })
    };
    return {phraseSafe, objectSafe, hadPhrase: Boolean(phrase), hadObject: Boolean(object)};
  }

  return Object.freeze({
    TOKEN_RE_SRC,
    EVIDENCE,
    DRAFT_SCHEMA,
    DRAFT_VERSION,
    DRAFT_STORAGE_KEY,
    KNOWN_NODE_KINDS,
    normalizeName,
    extractObservedSmartListTokens,
    choiceLines,
    nodeOutput,
    nodeSignature,
    hasMeaningfulMaterial,
    renderListWorksheet,
    buildNotes,
    evaluateSmartPhraseDraft,
    validateDraftPayload,
    validateReferenceBankPayload
  });
}));
