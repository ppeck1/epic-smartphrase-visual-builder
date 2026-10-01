/*
 * Module: checks
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- interface-level checks (presentation only; never changes output) ----------
  const PLACEHOLDER_ADD = /\[(?:ENTER_NAME|ADD(?:\s[^\]]*)?)\]/i;
  const PLACEHOLDER_INSERT = /\[\[INSERT\s[^\]]+\]\]/i;
  const PLACEHOLDER_PERSONAL = /\[(?:INSERT\s+YOUR|YOUR\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL)[^\]]*\]/i;

  // One scan over what actually copies, so a token is checked the same way whether it came
  // from the picker, was typed, or arrived inside a template. Repeats merge into one item.
  const SCAN_RE = /\[\[INSERT[^\]\n]*\]\]|\[(?:INSERT\s+YOUR|YOUR\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL|ENTER_NAME|ADD)[^\]\n]*\]|\*\*\*|@[A-Za-z0-9_().,:=-]+@|@@|\{[^{}\r\n:]{1,80}:\d{1,12}\}/g;
  function knownLinkLabel(token) {
    const hit = library.find((m) => m.kind === "smartlink" && m.token && m.token.toUpperCase() === token.toUpperCase() && m.category === "SmartLinks");
    if (hit) return hit.label;
    const seen = library.find((m) => m.token && m.token.toUpperCase() === token.toUpperCase());
    return seen ? "From your library" : "";
  }
  function uiChecks(ev) {
    const problems = [];
    const reg = new Map();
    const order = [];
    const put = (key, group, n, uid, make) => {
      let it = reg.get(key);
      if (!it) { it = {key, group, blocks: [], uids: [], count: 0, ...make()}; reg.set(key, it); order.push(it); }
      it.count++;
      if (!it.blocks.includes(n)) { it.blocks.push(n); it.uids.push(uid); }
      return it;
    };
    const supplied = state.phraseName.trim();
    const canonical = supplied.replace(/^\./, "").toUpperCase();
    const nameNote = supplied && ev.normalized && (canonical !== ev.normalized || /[^A-Za-z0-9_]/.test(canonical)) ? `Copies as ${ev.name} — spaces and symbols are dropped.` : "";
    if (!ev.pristine && !ev.normalized) problems.push({uid: null, field: "name", n: 0, msg: supplied ? "Use letters, numbers or underscores." : "Give your phrase a name."});
    const planNames = new Set(nodes.filter((nd) => nd.kind === "custom-smartlist").map((nd) => normalizeName(nd.listName) || "UNNAMED_LIST"));
    const sameText = new Map();
    nodes.forEach((node, i) => {
      const n = i + 1;
      const uid = node.uid;
      if (!ev.pristine && node.kind === "free-text" && !node.text.trim()) problems.push({uid, field: "text", n, msg: "This text block is empty. Type something or remove it.", revealOnCopyOnly: true});
      if (node.kind === "custom-smartlist") {
        const choices = choiceLines(node);
        const listName = normalizeName(node.listName) || "UNNAMED_LIST";
        if (!normalizeName(node.listName)) problems.push({uid, field: "listName", n, msg: "Name this SmartList."});
        if (!choices.length) problems.push({uid, field: "choices", n, msg: "Add at least one choice."});
        if (node.defaultChoice.trim() && !choices.includes(node.defaultChoice.trim())) problems.push({uid, field: "defaultChoice", n, msg: `“${node.defaultChoice.trim()}” isn’t one of the choices.`});
        const it = put(`PLAN:${listName}`, "setup", n, uid, () => ({html: `Create SmartList <code>${esc(listName)}</code>, then insert it in place of the plan.`, text: `SmartList ${listName} — create it in Epic, then replace [[INSERT SMARTLIST IN EPIC: ${listName}]] using Insert SmartList.`, plans: []}));
        it.plans.push(node);
      }
      if (node.kind === "template") put(`TPL:${node.label}`, "check", n, uid, () => ({html: `Template <b>${esc(node.label)}</b> — review it against your Epic setup.`, text: `Template ${node.label} — review it against your Epic setup.`}));
      const out = nodeOutput(node);
      if (node.kind !== "custom-smartlist") {
        let m;
        SCAN_RE.lastIndex = 0;
        while ((m = SCAN_RE.exec(out))) {
          const tok = m[0];
          const up = tok.toUpperCase();
          const ins = /^\[\[INSERT\s+(SMARTLINK|SMARTLIST)\s+IN\s+EPIC:\s*([^\]]*)\]\]$/i.exec(tok);
          if (tok === "***") put("WILD", "later", n, uid, () => ({html: "<code>***</code> wildcard", text: "*** wildcard — completed by whoever documents"}));
          else if (tok === "@@") put("@@", "check", n, uid, () => ({html: "<code>@@</code> nested SmartPhrase — add the phrase name in Epic", text: "@@ — nested SmartPhrase; add the target phrase name in Epic."}));
          else if (tok.startsWith("@")) { const label = knownLinkLabel(tok); put(up, "check", n, uid, () => ({html: `<code>${esc(tok)}</code> ${label ? esc(label) : "<span>not in the starter list — confirm it exists</span>"}`, text: label ? `${tok} — ${label}; confirm it pulls what you expect.` : `${tok} — not in the starter list; confirm it exists in your Epic.`})); }
          else if (tok.startsWith("{")) { const nm = tok.slice(1, -1).split(":")[0]; put(up, "check", n, uid, () => ({html: `<code>${esc(tok)}</code> SmartList ${esc(nm)}`, text: `${tok} — existing SmartList ${nm}; confirm its current choices.`})); }
          else if (ins && ins[1].toUpperCase() === "SMARTLIST" && planNames.has(normalizeName(ins[2]))) { const ln = normalizeName(ins[2]); put(`PLAN:${ln}`, "setup", n, uid, () => ({html: `Create SmartList <code>${esc(ln)}</code>, then insert it in place of the plan.`, text: `SmartList ${ln} — create it in Epic, then replace [[INSERT SMARTLIST IN EPIC: ${ln}]] using Insert SmartList.`, plans: []})); }
          else if (ins) { const what = ins[1].toUpperCase() === "SMARTLIST" ? "SmartList" : "SmartLink"; put(`INS:${up}`, "setup", n, uid, () => ({html: `Insert ${what} <b>${esc(ins[2].trim() || "(unnamed)")}</b> with Insert ${what}.`, text: `${tok} — replace with Epic's Insert ${what} tool.`})); }
          else if (/^\[\[/.test(tok)) put(`INS:${up}`, "setup", n, uid, () => ({html: `Replace <code>${esc(tok)}</code> using Epic’s insert tools.`, text: `${tok} — replace using Epic's insert tools.`}));
          else if (PLACEHOLDER_PERSONAL.test(tok)) put(`ME:${up}`, "setup", n, uid, () => ({html: `Replace <code>${esc(tok)}</code> with your approved staff details.`, text: `${tok} — replace with your approved staff details. Never patient information.`}));
          else if (PLACEHOLDER_ADD.test(tok) && !problems.some((p) => p.uid === uid && p.addPlaceholder)) problems.push({uid, field: "text", n, msg: `Replace ${tok} before using this phrase.`, addPlaceholder: true});
        }
      }
      const sig = nodeSignature(node);
      if (!sig.endsWith("|")) { if (sameText.has(sig)) put(`DUP:${sig}`, "note", n, uid, () => ({html: `Same text as block ${sameText.get(sig)}.`, text: ""})); else sameText.set(sig, n); }
    });
    if (!ev.pristine && !ev.body.trim() && nodes.length === 0) problems.push({uid: null, field: "body", n: 0, msg: "Add a block to give your phrase some content."});
    order.forEach((it) => { if (it.key.startsWith("PLAN:") && it.plans && it.plans.length > 1) it.html += ` <span>(planned ${it.plans.length} times)</span>`; });
    const items = order;
    return {problems, items, nameNote, notes: buildSetupNotes(ev, problems, items)};
  }
  const blockList = (b) => `${b.length > 1 ? "blocks" : "block"} ${b.join(", ")}`;
  function buildSetupNotes(ev, problems, items) {
    const L = [`Setup notes for ${ev.name}`, "Drafted offline. Not connected to Epic. Test in your approved training or test area before clinical use."];
    const section = (title, list, fmt) => { if (!list.length) return; L.push("", title); list.forEach((x) => L.push(fmt(x))); };
    section("UNFINISHED — fix in the builder", problems, (p) => `- ${p.n ? `Block ${p.n}: ` : ""}${p.msg}`);
    section("SET UP IN EPIC", items.filter((x) => x.group === "setup"), (x) => {
      let line = `- ${x.text} (${blockList(x.blocks)})`;
      if (x.plans) x.plans.forEach((node) => { const ch = choiceLines(node); line += `\n    Selection: ${node.multiple}\n    Default: ${node.defaultChoice.trim() || "None"}\n    Choices:${ch.length ? ch.map((c, k) => `\n      ${k + 1}. ${c}`).join("") : " [ADD CHOICES]"}`; });
      return line;
    });
    section("CHECK IN EPIC", items.filter((x) => x.group === "check"), (x) => `- ${x.text} (${blockList(x.blocks)})`);
    section("FILLED IN WHEN DOCUMENTING", items.filter((x) => x.group === "later"), (x) => `- ${x.text}${x.count > 1 ? `, ${x.count} times` : ""} (${blockList(x.blocks)})`);
    return L.join("\n");
  }
  function shortLabel(node) { return String(node.label || "").replace(/\s*\(@@\)$/, ""); }
