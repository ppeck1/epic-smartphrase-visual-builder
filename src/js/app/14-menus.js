/*
 * Module: menus
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- menus ----------
  const moreBtn = $("#moreBtn");
  const moreMenu = $("#moreMenu");
  moreBtn.insertAdjacentHTML("beforeend", "");
  function renderMoreMenu() {
    const hasBank = Boolean(phraseBank || objectBank);
    moreMenu.innerHTML = `
      <button role="menuitem" type="button" data-cmd="open">${icon("open")}Open file…</button>
      <button role="menuitem" type="button" data-cmd="save">${icon("save")}Save file</button>
      <hr>
      ${hasBank ? `<p class="menu-note">Library: ${esc(bankFileName)}</p><button role="menuitem" type="button" data-cmd="browse">${icon("browse")}Browse your library</button><button role="menuitem" type="button" data-cmd="unbank">${icon("x")}Remove library</button>` : `<button role="menuitem" type="button" data-cmd="bank">${icon("library")}Add your library…<span class="meta">JSON</span></button>`}
      <hr>
      <button role="menuitem" type="button" class="danger" data-cmd="reset">${icon("restart")}Start over</button>`;
  }
  function closeMenus() { if (!moreMenu.hidden) { moreMenu.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); } }
  function openMore() { renderMoreMenu(); moreMenu.hidden = false; moreBtn.setAttribute("aria-expanded", "true"); moreMenu.querySelector("[role=menuitem]").focus(); }
  moreBtn.addEventListener("click", () => { if (moreMenu.hidden) openMore(); else closeMenus(); });
  moreMenu.addEventListener("keydown", (e) => {
    const items = [...moreMenu.querySelectorAll("[role=menuitem]")];
    const k = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(k + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(k - 1 + items.length) % items.length].focus(); }
    else if (e.key === "Escape" || e.key === "Tab") { closeMenus(); if (e.key === "Escape") { e.preventDefault(); moreBtn.focus(); } }
  });
  moreMenu.addEventListener("click", (e) => {
    const b = e.target.closest("[data-cmd]");
    if (!b) return;
    closeMenus();
    const cmd = b.dataset.cmd;
    if (cmd === "open") $("#draftFile").click();
    if (cmd === "save") exportDraft();
    if (cmd === "bank") $("#bankFile").click();
    if (cmd === "browse") openLibrary();
    if (cmd === "unbank") { phraseBank = null; objectBank = null; bankFileName = ""; rebuildLibrary(); toast("Library removed. Blocks you already added stay in your phrase."); }
    if (cmd === "reset") startOver();
  });
  document.addEventListener("pointerdown", (e) => { if (!moreMenu.hidden && !moreMenu.contains(e.target) && !moreBtn.contains(e.target)) closeMenus(); });
