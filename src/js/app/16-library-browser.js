/*
 * Module: library-browser
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- library browser ----------
  function buildBankRecords() {
    const local = ((phraseBank && phraseBank.entries) || []).map((entry) => ({collection: "SmartPhrases", title: entry.displayIdentifier || entry.identifier, subtitle: `${entry.entryType || "Template"} · check before use`, searchText: entry.searchText || `${entry.displayIdentifier || ""} ${entry.body || ""}`.toLowerCase(), recordType: "phrase", entry}));
    const objects = ((objectBank && objectBank.entries) || []).map((entry) => ({collection: entry.objectType, title: entry.name, subtitle: `${entry.originEvidence || ""} · ID ${entry.objectId || "not printed"}`, searchText: entry.searchText || `${entry.name || ""}`.toLowerCase(), recordType: "object", entry}));
    return [...local, ...objects];
  }
  let libRecords = [];
  function openLibrary() {
    libRecords = buildBankRecords();
    const cols = [...new Set(libRecords.map((r) => r.collection).filter(Boolean))].sort();
    $("#libCollection").innerHTML = `<option value="">All collections</option>${cols.map((c) => `<option>${esc(c)}</option>`).join("")}`;
    $("#libStatus").textContent = `From ${bankFileName}. Kept in this browser only.`;
    $("#libQuery").value = "";
    renderLibResults();
    $("#libraryDialog").showModal();
  }
  function renderLibResults() {
    const q = $("#libQuery").value.trim().toLowerCase();
    const col = $("#libCollection").value;
    const matches = libRecords.filter((r) => (!q || r.searchText.includes(q)) && (!col || r.collection === col));
    const shown = matches.slice(0, 150);
    $("#libSummary").textContent = `${formatCount(matches.length)} of ${formatCount(libRecords.length)} records${matches.length > shown.length ? " — showing the first 150" : ""}.`;
    $("#libResults").innerHTML = shown.map((r, k) => `<details class="lib-row"><summary><b>${esc(r.title)}</b><small>${esc(r.collection)} · ${esc(r.subtitle)}</small></summary>${r.recordType === "phrase" ? `<pre>${esc(r.entry.body || "")}</pre><button type="button" class="btn-link" data-libcopy="${k}">${icon("copy", 16)}Copy phrase text</button>` : `<pre>${esc([`Type: ${r.entry.objectType || ""}`, `Source pages: ${r.entry.sourcePages || "Not printed"}`, `Occurrences: ${formatCount(r.entry.occurrenceCount)}`, r.entry.smartLinkCode ? `Code: ${r.entry.smartLinkCode}` : ""].filter(Boolean).join("\n"))}</pre>`}</details>`).join("");
    $("#libResults")._shown = shown;
  }
  $("#libQuery").addEventListener("input", renderLibResults);
  $("#libCollection").addEventListener("change", renderLibResults);
  $("#libResults").addEventListener("click", async (e) => { const b = e.target.closest("[data-libcopy]"); if (!b) return; const r = $("#libResults")._shown[Number(b.dataset.libcopy)]; const res = await doCopy(r.entry.body || ""); if (res.ok && !res.superseded) toast("Phrase text copied from your library.", {tone: "success"}); });
