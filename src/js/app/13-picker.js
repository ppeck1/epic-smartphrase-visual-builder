/*
 * Module: picker
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- picker ----------
  const picker = {el: $("#picker"), input: $("#pickerInput"), list: $("#pickerList"), at: null, scope: "all", anchor: null, options: [], active: 0};
  $("#pickerClose").innerHTML = icon("x");
  $("#pickerSearchIcon").outerHTML = icon("search", 17);
  const BASIC_ORDER = ["free-text", "wildcard", "custom-smartlist", "personal-placeholder", "nested-smartphrase"];
  const BASIC_TEXT = {
    "free-text": ["Text", "Your own words", "text"],
    wildcard: ["Wildcard", "Fill in later · <code>***</code>", "***"],
    "custom-smartlist": ["SmartList plan", "Plan selectable choices to build in Epic", "list"],
    "personal-placeholder": ["Your-name placeholder", "<code>[INSERT YOUR NAME]</code> · replace in Epic", "[ ]"],
    "nested-smartphrase": ["Another SmartPhrase", "<code>@@</code> · nest an existing phrase", "@@"]
  };
  function scopesFor() {
    const s = [["all", "All"], ["smartlink", "SmartLinks"], ["smartlist", "SmartLists"]];
    if (library.some((m) => m.kind === "template")) s.push(["template", "Templates"]);
    return s;
  }
  function inScope(m, scope) {
    if (scope === "all") return true;
    if (scope === "smartlink") return (m.kind === "smartlink" && /SmartLink/.test(m.category)) || m.kind === "catalog-smartlink";
    if (scope === "smartlist") return ["custom-smartlist", "existing-smartlist", "catalog-smartlist"].includes(m.kind);
    if (scope === "template") return m.kind === "template";
    return true;
  }
  function groupName(m) {
    if (m.kind === "plan-ref") return "SmartList plans in this phrase";
    if (m.category === "Basics") return "Basics";
    if (m.category === "SmartLinks") return `SmartLinks · ${m.subCategory}`;
    if (m.category === "Your library · SmartLinks") return "Your library · SmartLinks";
    if (m.category === "Your library · SmartLists") return "Your library · SmartLists";
    if (m.kind === "template") return `Templates · ${m.subCategory}`;
    return `Your library · ${m.kind === "catalog-smartlink" ? "SmartLinks" : "SmartLists"}`;
  }
  function inlineOptions() {
    const plans = [...new Set(nodes.filter((n) => n.kind === "custom-smartlist").map((n) => normalizeName(n.listName)).filter(Boolean))];
    return [
      ...plans.map((nm) => ({id: `plan:${nm}`, kind: "plan-ref", label: `SmartList plan ${nm}`, token: `[[INSERT SMARTLIST IN EPIC: ${nm}]]`, category: "Plans", searchText: `smartlist plan ${nm}`.toLowerCase()})),
      ...library.filter((m) => ["wildcard", "smartlink", "existing-smartlist", "catalog-smartlink", "catalog-smartlist"].includes(m.kind) && m.token)
    ];
  }
  const typedMode = () => !picker.el.hidden && picker.mode === "inline" && picker.range && picker.range.typed;
  function pickerQuery() {
    if (picker.mode === "inline" && picker.range && picker.range.typed) {
      const ta = typedTa();
      return ta ? ta.value.slice(picker.range.start + 1, picker.range.end).trim().toLowerCase() : "";
    }
    return picker.input.value.trim().toLowerCase();
  }
  function typedTa() { const el = blockEls.get(picker.uid); return el && el.querySelector('[data-field="text"]'); }
  function renderPickerList() {
    const q = pickerQuery();
    const inline = picker.mode === "inline";
    $("#pickerScopes").innerHTML = (inline ? scopesFor().filter(([k]) => k !== "template") : scopesFor()).map(([k, l]) => `<button type="button" class="scope" data-scope="${k}" aria-pressed="${picker.scope === k}">${l}</button>`).join("");
    let matches = (inline ? inlineOptions() : library).filter((m) => (inScope(m, picker.scope) || (m.kind === "plan-ref" && picker.scope !== "smartlink")) && (!q || m.searchText.includes(q) || (BASIC_TEXT[m.id] && BASIC_TEXT[m.id][0].toLowerCase().includes(q))));
    matches = matches.filter((m) => m.evidence !== "catalog" || q.length >= 2 || picker.scope !== "all");
    // With a query, rank by token, then name, then description; without one, keep the curated order.
    const rank = (m) => {
      if (!q) { const i = BASIC_ORDER.indexOf(m.id); return i < 0 ? 99 : i; }
      const tok = String(m.token || "").toLowerCase().replace(/^@|@$/g, "");
      const label = String((BASIC_TEXT[m.id] && BASIC_TEXT[m.id][0]) || m.label || "").toLowerCase();
      if (tok === q) return 0;
      if (tok.startsWith(q)) return 1;
      if (label.startsWith(q)) return 2;
      if (label.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) return 3;
      if (tok.includes(q) || label.includes(q)) return 4;
      return 5;
    };
    matches = matches.map((m, i) => ({m, i, r: rank(m)})).sort((x, y) => x.r - y.r || x.i - y.i).map((x) => x.m);
    const total = matches.length;
    matches = matches.slice(0, 200);
    picker.options = matches;
    picker.active = Math.min(picker.active, Math.max(0, matches.length - 1));
    if (!matches.length && inline) { picker.list.innerHTML = `<p class="pempty">Nothing matches “${esc(q)}”. Keep typing — your text stays as typed.</p>`; picker.input.removeAttribute("aria-activedescendant"); return; }
    if (!matches.length) { picker.list.innerHTML = `<p class="pempty">No blocks match “${esc(picker.input.value)}”. Try a shorter word, or add a <b>Text</b> block and type the token yourself.</p>`; picker.input.removeAttribute("aria-activedescendant"); return; }
    let html = ""; let lastGroup = "";
    matches.forEach((m, k) => {
      const g = groupName(m);
      if (g !== lastGroup) { html += `<div class="pgroup" role="presentation">${esc(g)}</div>`; lastGroup = g; }
      const basic = BASIC_TEXT[m.id];
      const title = basic ? basic[0] : m.label;
      const sub = basic ? basic[1] : m.kind === "template" ? `Template · <kbd>Shift</kbd>+<kbd>Enter</kbd> starts a new phrase from it` : `<code>${esc(m.token)}</code>`;
      const glyphTxt = m.kind === "plan-ref" ? "list" : basic ? basic[2] : m.kind === "template" ? "." : (m.kind || "").includes("smartlist") ? "{}" : "@";
      const glyph = glyphTxt === "text" ? icon("text", 16) : glyphTxt === "list" ? icon("list", 16) : esc(glyphTxt);
      html += `<div class="popt${k === picker.active ? " is-active" : ""}" role="option" id="popt-${k}" data-k="${k}" aria-selected="${k === picker.active}"><span class="glyph">${glyph}</span><span class="ptext"><b>${esc(title)}</b><small>${sub}</small></span></div>`;
    });
    if (total > matches.length) html += `<p class="pempty">${formatCount(total - matches.length)} more — keep typing to narrow.</p>`;
    picker.list.innerHTML = html;
    picker.input.setAttribute("aria-activedescendant", `popt-${picker.active}`);
  }
  function setActive(k) {
    if (!picker.options.length) return;
    picker.active = (k + picker.options.length) % picker.options.length;
    picker.list.querySelectorAll(".popt").forEach((o) => { const on = Number(o.dataset.k) === picker.active; o.classList.toggle("is-active", on); o.setAttribute("aria-selected", on); });
    picker.input.setAttribute("aria-activedescendant", `popt-${picker.active}`);
    const a = picker.list.querySelector(`#popt-${picker.active}`);
    if (a) a.scrollIntoView({block: "nearest"});
    if (typedMode()) syncTypedActive();
  }
  function positionPicker() {
    const el = picker.el;
    const anchored = picker.mode === "inline" && picker.range && picker.range.typed;
    el.classList.toggle("is-anchored", anchored);
    el.classList.toggle("is-typed", anchored);
    if (isNarrow() && !anchored) { el.style.left = ""; el.style.top = ""; $("#scrim").hidden = false; return; }
    $("#scrim").hidden = true;
    const r = picker.anchorRect || (picker.anchor && picker.anchor.isConnected ? picker.anchor : blocksEl).getBoundingClientRect();
    const w = el.offsetWidth, h = el.offsetHeight;
    let left = Math.min(Math.max(16, r.left), window.innerWidth - w - 16);
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 16) top = Math.max(16, r.top - h - 6);
    el.style.left = `${left}px`; el.style.top = `${top}px`;
  }
  const PICKER_FOOT = $(".picker-foot").innerHTML;
  function openInlinePicker(ta, range) {
    const uid = ta.closest(".block").dataset.uid;
    const n = indexOfUid(uid) + 1;
    const rect = caretRect(ta, range.start);
    openPicker({mode: "inline", uid, range, anchor: range.anchor || ta, anchorRect: rect, where: `block ${n}`, title: "Insert at cursor"});
  }
  function openPicker({at, anchor, scope, where, mode, uid, range, anchorRect, title}) {
    closeMenus();
    picker.mode = mode || "block"; picker.uid = uid || null; picker.range = range || null; picker.anchorRect = anchorRect || null;
    $("#pickerTitle").textContent = title || "Add a block";
    $(".picker-foot").innerHTML = picker.mode === "inline" ? `<kbd>↑</kbd> <kbd>↓</kbd> choose · <kbd>Enter</kbd> insert · <kbd>Esc</kbd> ${range && range.typed ? "keep the @" : "close"}` : PICKER_FOOT;
    picker.at = at; picker.anchor = anchor || null; picker.scope = scope || "all"; picker.active = 0;
    picker.returnFocus = anchor || document.activeElement;
    $("#pickerWhere").textContent = where || "";
    picker.input.value = "";
    picker.el.hidden = false;
    if (anchor && anchor.setAttribute) anchor.setAttribute("aria-expanded", "true");
    renderPickerList();
    positionPicker();
    if (picker.mode === "inline" && range && range.typed) {
      const ta = typedTa();
      if (ta) { ta.setAttribute("aria-controls", "pickerList"); ta.setAttribute("aria-expanded", "true"); ta.setAttribute("aria-autocomplete", "list"); syncTypedActive(); }
      announce("Suggestions open. Arrow keys to choose, Enter to insert, Escape to dismiss.");
    } else picker.input.focus({preventScroll: true});
  }
  function syncTypedActive() { const ta = typedTa(); if (ta && picker.options.length) ta.setAttribute("aria-activedescendant", `popt-${picker.active}`); else if (ta) ta.removeAttribute("aria-activedescendant"); }
  // While suggestions are open from a typed @, the text field keeps focus; this keeps the list in step.
  function updateTyped() {
    if (!typedMode()) return;
    const ta = typedTa();
    if (!ta || document.activeElement !== ta) { closePicker(false); return; }
    const pos = ta.selectionStart;
    const at = picker.range.start;
    const q = ta.value.slice(at + 1, pos);
    if (ta.selectionStart !== ta.selectionEnd || pos <= at || ta.value.charAt(at) !== "@" || /\s/.test(q) || q.endsWith("@") || q.length > 40) { closePicker(false); return; }
    picker.range.end = pos;
    picker.active = 0;
    renderPickerList();
    syncTypedActive();
    picker.anchorRect = caretRect(ta, at);
    positionPicker();
  }
  function closePicker(restore) {
    if (picker.el.hidden) return;
    picker.el.hidden = true;
    $("#scrim").hidden = true;
    if (picker.anchor && picker.anchor.setAttribute) picker.anchor.setAttribute("aria-expanded", "false");
    const ta = picker.mode === "inline" && typedTa();
    if (ta) { ta.removeAttribute("aria-controls"); ta.removeAttribute("aria-activedescendant"); ta.removeAttribute("aria-expanded"); ta.removeAttribute("aria-autocomplete"); }
    picker.el.classList.remove("is-anchored", "is-typed");
    if (restore === false) return;
    if (picker.mode === "inline") {
      // Back to the text, cursor where it was (after the typed @, or the original selection).
      const el = blockEls.get(picker.uid);
      const ta = el && el.querySelector('[data-field="text"]');
      if (ta) { ta.focus({preventScroll: true}); const r = picker.range; try { ta.setSelectionRange(r.typed ? r.end : r.start, r.end); } catch {} }
      return;
    }
    if (picker.returnFocus && picker.returnFocus.isConnected) picker.returnFocus.focus({preventScroll: true});
  }
  function choose(k, startNew) {
    const m = picker.options[k];
    if (!m) return;
    const at = picker.at;
    if (picker.mode === "inline") {
      const {uid, range} = picker;
      closePicker(false);
      const end = range.typed && typedTa() ? typedTa().selectionStart : range.end;
      insertInline(uid, m.token, {start: range.start, end, restore: range.typed ? {start: end, end} : {start: range.start, end: range.end}});
      return;
    }
    closePicker(false);
    if (m.kind === "template" && startNew) { startFromTemplate(m.id); return; }
    const hadContent = hasMeaningfulMaterial(nodes);
    insertModule(m.id, at);
    if (m.kind === "template") toast(hadContent ? "Template inserted. Your phrase now combines more than one source — review it." : "Template inserted.", {action: "Use as new phrase", onAction: () => { undo(); startFromTemplate(m.id); }});
  }
  picker.input.addEventListener("input", () => { picker.active = 0; renderPickerList(); });
  picker.input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(picker.active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(picker.active - 1); }
    else if (e.key === "Enter") { e.preventDefault(); choose(picker.active, e.shiftKey); }
  });
  picker.el.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePicker(); } });
  picker.el.addEventListener("mousedown", (e) => { if (typedMode() && e.target.closest(".popt, .scope")) e.preventDefault(); });
  picker.list.addEventListener("click", (e) => { const o = e.target.closest(".popt"); if (o) choose(Number(o.dataset.k), e.shiftKey); });
  picker.list.addEventListener("mousemove", (e) => { const o = e.target.closest(".popt"); if (o && Number(o.dataset.k) !== picker.active) setActive(Number(o.dataset.k)); });
  $("#pickerScopes").addEventListener("click", (e) => { const b = e.target.closest("[data-scope]"); if (!b) return; picker.scope = b.dataset.scope; picker.active = 0; renderPickerList(); if (typedMode()) syncTypedActive(); else picker.input.focus(); });
  $("#pickerClose").addEventListener("click", () => closePicker());
  $("#scrim").addEventListener("click", () => closePicker());
  document.addEventListener("pointerdown", (e) => { if (!picker.el.hidden && !picker.el.contains(e.target) && !(picker.anchor && picker.anchor.contains(e.target)) && e.target.id !== "scrim") closePicker(false); }, true);
  window.addEventListener("resize", () => { if (!picker.el.hidden) positionPicker(); });
