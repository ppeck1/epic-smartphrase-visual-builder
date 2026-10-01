/*
 * Module: utilities
 * Keep this file focused on one job.
 * Future work: comments beginning with "* Future" are searchable handoff notes.
 */
// ---------- utilities ----------
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[ch]));
  }
  const esc = escapeHtml;
  function groupBy(items, keyFn) { const groups = new Map(); items.forEach((item) => { const key = keyFn(item); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(item); }); return groups; }
  function formatCount(value) { return Number(value || 0).toLocaleString("en-US"); }
  function slug(value) { return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); }
  const $ = (sel, root) => (root || document).querySelector(sel);
  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isNarrow = () => window.matchMedia("(max-width: 820px)").matches;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + "s")}`;

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    dup: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    collapse: '<path d="M7 4l5 5 5-5M7 20l5-5 5 5"/>',
    expand: '<path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    alert: '<path d="M12 3.8L21.5 20H2.5z"/><path d="M12 10v4.5M12 17.2v.1"/>',
    stop: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.2v.1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
    dot: '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    open: '<path d="M4 19V6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v2"/><path d="M4 19l3-8h14l-3 8z"/>',
    save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    library: '<path d="M5 4v16M10 4v16M15 5.2l4 14.6"/>',
    browse: '<path d="M4 6h16M4 12h10M4 18h7"/><circle cx="17.5" cy="16.5" r="2.8"/><path d="M19.6 18.6L22 21"/>',
    restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.6-5.7"/><path d="M4 4v4.5h4.5"/>',
    text: '<path d="M5 6h14M12 6v13M9 19h6"/>',
    list: '<path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20"/><circle cx="5" cy="6.5" r=".9"/><circle cx="5" cy="12" r=".9"/><circle cx="5" cy="17.5" r=".9"/>',
    join: '<path d="M18 19v-6a3 3 0 0 0-3-3H6"/><path d="M10 6l-4 4 4 4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>'
  };
  function icon(name, size) { const s = size || 18; return `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`; }
