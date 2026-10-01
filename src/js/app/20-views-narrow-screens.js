/*
 * Module: views-narrow-screens
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- views (narrow screens) ----------
  function setView(v) {
    app.dataset.view = v;
    $("#tabBuild").setAttribute("aria-selected", v === "build");
    $("#tabPreview").setAttribute("aria-selected", v === "preview");
    if (v === "preview" && selectedUid) { const s = pvBody.querySelector(`.seg[data-uid="${selectedUid}"]`); if (s) s.scrollIntoView({block: "center"}); }
  }
  document.querySelectorAll(".viewtabs [data-view]").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
