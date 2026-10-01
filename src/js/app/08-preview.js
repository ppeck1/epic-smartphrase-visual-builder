/*
 * Module: preview
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- preview ----------
  const TOKEN_RE = /(\[\[INSERT[^\]\n]*\]\]|\[(?:INSERT\s+YOUR|YOUR\s+(?:NAME|CALLBACK|PHONE|CREDENTIAL)|PERSONAL|ENTER_NAME|ADD)[^\]\n]*\]|\*\*\*|@[A-Za-z0-9_().,:=-]+@|@@|\{[^{}\r\n:]{1,80}:\d{1,12}\})/g;
  function tokenize(text, present) {
    let out = "";
    let last = 0;
    text.replace(TOKEN_RE, (m, _g, offset) => {
      out += esc(text.slice(last, offset));
      const cls = tokenClass(m);
      present.add(cls);
      const title = cls === "tok-wild" ? "Wildcard — filled in when documenting" : cls === "tok-plan" ? "Placeholder — set up in Epic before use" : "SmartLink or SmartList — check in Epic";
      out += `<span class="tok ${cls}" title="${title}">${esc(m)}</span>`;
      last = offset + m.length;
      return m;
    });
    out += esc(text.slice(last));
    if (/\S/.test(text.replace(TOKEN_RE, ""))) present.add("text");
    return out;
  }
  function renderPreview(ev) {
    const pvName = $("#pvName");
    pvName.textContent = ev.name;
    pvName.classList.toggle("is-placeholder", !ev.normalized);
    const segments = [];
    nodes.forEach((node, i) => { const text = nodeOutput(node); if (text !== "") segments.push({uid: node.uid, n: i + 1, text}); });
    const legend = $("#pvLegend");
    if (!segments.length) {
      pvBody.innerHTML = `<p class="pv-empty">Your phrase appears here as you type.</p>`;
      legend.hidden = true;
      return;
    }
    const present = new Set();
    pvBody.innerHTML = segments.map((s) => `<span class="seg${s.uid === selectedUid ? " is-linked" : ""}" data-uid="${esc(s.uid)}" tabindex="0" role="button" title="Show block ${s.n} in the editor">${tokenize(s.text, present)}</span>`).join("\n");
    const parts = [];
    if (present.has("tok-link")) parts.push(`<span><span class="tok tok-link">@…@</span>SmartLink · check in Epic</span>`);
    if (present.has("tok-wild")) parts.push(`<span><span class="tok tok-wild">***</span>Wildcard · fill in later</span>`);
    if (present.has("tok-plan")) parts.push(`<span><span class="tok tok-plan">[[ ]]</span>Placeholder · set up in Epic</span>`);
    legend.hidden = !parts.length;
    legend.innerHTML = parts.join("") + `<p>Highlights are for reading only. The copied text is plain.</p>`;
  }
