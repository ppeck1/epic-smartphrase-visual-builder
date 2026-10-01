/*
 * Module: toast
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- toast ----------
  const toastsEl = $("#toasts");
  let toastTimer = 0;
  function toast(message, opts) {
    const o = opts || {};
    const tone = o.tone || "neutral";
    clearTimeout(toastTimer);
    const lead = tone === "error" ? icon("stop", 18) : tone === "check" ? icon("alert", 18) : tone === "success" ? icon("check", 18) : "";
    toastsEl.innerHTML = `<div class="toast" data-tone="${tone}" role="${tone === "error" ? "alert" : "status"}">${lead ? lead.replace('class="ic"', 'class="ic lead"') : ""}<span class="msg">${o.html ? message : esc(message)}</span>${o.action ? `<button type="button" class="toast-act">${esc(o.action)}</button>` : ""}<button type="button" class="toast-x" aria-label="Dismiss">${icon("x", 16)}</button></div>`;
    const t = toastsEl.firstElementChild;
    if (o.copy) t.dataset.copy = "1";
    if (o.action) t.querySelector(".toast-act").addEventListener("click", () => { clearToast(); o.onAction(); });
    t.querySelector(".toast-x").addEventListener("click", clearToast);
    const timeout = o.timeout === 0 ? 0 : (o.timeout || (o.action ? 7000 : 4500));
    const arm = () => { clearTimeout(toastTimer); if (timeout) toastTimer = setTimeout(clearToast, timeout); };
    t.addEventListener("mouseenter", () => clearTimeout(toastTimer));
    t.addEventListener("mouseleave", arm);
    t.addEventListener("focusin", () => clearTimeout(toastTimer));
    arm();
  }
  function clearToast() { clearTimeout(toastTimer); toastsEl.innerHTML = ""; }
  let announcer;
  function announce(msg) {
    if (!announcer) { announcer = document.createElement("div"); announcer.className = "sr-only"; announcer.setAttribute("aria-live", "polite"); document.body.appendChild(announcer); }
    announcer.textContent = ""; setTimeout(() => { announcer.textContent = msg; }, 30);
  }
