/*
 * Module: top-bar-global-keys
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- top bar + global keys ----------
  $("#undoBtn").innerHTML = icon("undo", 19);
  $("#redoBtn").innerHTML = icon("redo", 19);
  $("#undoBtn").addEventListener("click", undo);
  $("#redoBtn").addEventListener("click", redo);
  $("#helpBtn").addEventListener("click", () => $("#helpDialog").showModal());
  document.querySelectorAll("dialog [data-close]").forEach((b) => { b.innerHTML = icon("x"); b.addEventListener("click", () => b.closest("dialog").close()); });
  document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => { if (e.target === d) d.close(); }));
  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const t = e.target;
    const editable = t && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && !["radio", "checkbox", "button"].includes(t.type)) || t.isContentEditable);
    if (mod && !editable && !document.querySelector("dialog[open]")) {
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    }
  });
