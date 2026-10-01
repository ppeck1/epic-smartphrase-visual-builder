const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const core = require("../src/js/core.js");

function node(overrides = {}) {
  return {
    uid: "tool-node-1",
    moduleId: "free-text",
    kind: "free-text",
    evidence: "exact",
    label: "Text",
    token: "",
    description: "",
    source: "",
    text: "",
    listName: "",
    choices: "",
    defaultChoice: "",
    multiple: "Single selection",
    sourcePages: [],
    specialty: "",
    privacyNotice: "",
    requirementStatus: "",
    ...overrides
  };
}

function payload(nodes, overrides = {}) {
  return {
    schema: core.DRAFT_SCHEMA,
    version: core.DRAFT_VERSION,
    draft: {serial: nodes.length, phraseName: "FOLLOWUP", nodes, ...overrides}
  };
}

test("normalizes phrase names into Epic's copied form", () => {
  assert.equal(core.normalizeName(" .my follow-up! "), "MYFOLLOWUP");
});

test("keeps the established plain-text output contract", () => {
  const result = core.evaluateSmartPhraseDraft({
    phraseName: "followup",
    nodes: [
      node({text: "Hello"}),
      node({uid: "tool-node-2", moduleId: "builtin-link-name", kind: "smartlink", evidence: "observed", label: "Patient full name", token: "@NAME@"})
    ]
  });
  assert.equal(result.name, ".FOLLOWUP");
  assert.equal(result.body, "Hello\n@NAME@");
  assert.equal(result.issues.filter((issue) => issue.severity === "error").length, 0);
});

test("creates a plain SmartList planning placeholder and notes", () => {
  const list = node({
    kind: "custom-smartlist",
    moduleId: "custom-smartlist",
    evidence: "creation",
    label: "New SmartList",
    listName: "follow up choices",
    choices: "Better\nSame\nWorse",
    defaultChoice: "Same"
  });
  const result = core.evaluateSmartPhraseDraft({phraseName: "visit", nodes: [list]});
  assert.equal(result.body, "[[INSERT SMARTLIST IN EPIC: FOLLOWUPCHOICES]]");
  assert.match(result.buildNotes, /SmartList FOLLOWUPCHOICES/);
  assert.match(result.buildNotes, /2\. Same/);
});

test("finds unfinished typed placeholders", () => {
  const result = core.evaluateSmartPhraseDraft({phraseName: "test", nodes: [node({text: "Call [ADD PHONE]"})]});
  assert.ok(result.issues.some((issue) => issue.severity === "error" && issue.label === "Finish the placeholders."));
});

test("regenerates imported IDs instead of trusting markup from a file", () => {
  const draft = core.validateDraftPayload(payload([
    node({uid: '\"><img src=x onerror=alert(1)>', text: "Safe text", sourcePages: [7]})
  ], {serial: 99}));
  assert.equal(draft.nodes[0].uid, "tool-node-1");
  assert.deepEqual(draft.nodes[0].sourcePages, ["7"]);
  assert.equal(draft.serial, 99);
});

test("rejects unsupported block types and oversized fields", () => {
  assert.throws(() => core.validateDraftPayload(payload([node({kind: "script"})])), /unsupported type/);
  assert.throws(() => core.validateDraftPayload(payload([node({text: "x".repeat(300001)})])), /text is too long/);
});

test("normalizes a local reference library", () => {
  const bank = core.validateReferenceBankPayload({
    smartPhraseBank: {entries: [{id: 7, displayIdentifier: ".EXAMPLE", body: "Hello @NAME@", sourcePages: [1]}]},
    smartObjectBank: {counts: {}, entries: [{objectType: "SmartLink", name: "Patient name", objectId: 42}]}
  });
  assert.equal(bank.phraseSafe.entries[0].id, "7");
  assert.deepEqual(bank.phraseSafe.entries[0].sourcePages, ["1"]);
  assert.equal(bank.objectSafe.entries[0].objectId, "42");
});

test("rejects unbounded reference libraries", () => {
  const entries = Array.from({length: 10001}, (_, index) => ({id: index, body: "x"}));
  assert.throws(() => core.validateReferenceBankPayload({smartPhraseBank: {entries}}), /more than 10,000/);
});

test("public example drafts pass the production validator", () => {
  const examples = ["follow-up-draft.json", "smartlist-plan-draft.json"];
  for (const filename of examples) {
    const value = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "examples", filename), "utf8"));
    const draft = core.validateDraftPayload(value);
    assert.ok(draft.nodes.length > 0, `${filename} should contain at least one block`);
  }
});
