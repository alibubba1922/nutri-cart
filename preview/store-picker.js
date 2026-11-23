/* Nutri-Cart store logo picker (BE-3, 2026-11-23).
   Progressive enhancement over the native <select id="store">: the select stays in the DOM as the
   single source of truth (all app logic, saved store, QA scripts keep working). If this file or a logo
   fails to load, the user still gets a working store choice (native select / the store's name as text). */
(function () {
  "use strict";
  var sel = document.getElementById("store");
  if (!sel || typeof STORES !== "object" || typeof pickStore !== "function" || typeof storeSel !== "function") return;
  var ALT = { superstore: "Real Canadian Superstore", saveon: "Save-On-Foods", voila: "Voilà by Sobeys (online)" };
  var K = Object.keys(STORES), f = 0;
  function alt(k) { return ALT[k] || STORES[k].n; }
  function img(k) {
    var i = document.createElement("img");
    i.className = "stl"; i.src = "logos/" + k + ".svg"; i.alt = alt(k); i.decoding = "async";
    i.onerror = function () { var b = document.createElement("b"); b.textContent = alt(k); i.replaceWith(b); };
    return i;
  }
  var css = document.createElement("style");
  css.textContent =
    // hidden native select sits exactly under the button (same box) so layout/tap-size audits still see a 48px target
    "#store.vh{position:absolute;left:0;top:0;width:100%;height:48px;opacity:0;pointer-events:none;z-index:0}" +
    "#stBtn{position:relative;z-index:1}" +
    "#stW{position:relative}" +
    "#stBtn{width:100%;margin:0;min-height:48px;display:flex;align-items:center;gap:8px;background:#fff;color:#000;border:2px solid #000;border-left:8px solid #000;padding:6px 10px}" +
    "#stBtn:after{content:'\\25BE';margin-left:auto;font-size:18px}" +
    "#stList{position:absolute;z-index:60;left:0;right:0;top:100%;margin:2px 0 0;padding:4px;list-style:none;background:#fff;border:2px solid #000;border-radius:8px;max-height:65vh;overflow:auto;box-shadow:0 6px 18px rgba(0,0,0,.33)}" +
    "#stList[hidden]{display:none}" +
    "#stList li{display:flex;align-items:center;min-height:48px;padding:4px 10px;margin:2px 0;border-left:6px solid;border-radius:6px;cursor:pointer}" +
    "#stList li.f{outline:3px solid #c8102e;outline-offset:-3px}" +
    "#stList li[aria-selected=true]{background:#eee}" +
    ".stl{display:block;height:30px;width:150px;max-width:100%;object-fit:contain;object-position:left center}";
  document.head.appendChild(css);

  var wrap = document.createElement("div"); wrap.id = "stW";
  sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
  sel.classList.add("vh"); sel.setAttribute("aria-hidden", "true"); sel.tabIndex = -1; sel.removeAttribute("aria-label");
  var lbl = document.querySelector('label[for="store"]'); if (lbl) { lbl.id = lbl.id || "storeL"; }
  var b = document.createElement("button");
  b.type = "button"; b.id = "stBtn";
  b.setAttribute("aria-haspopup", "listbox"); b.setAttribute("aria-expanded", "false");
  b.setAttribute("aria-labelledby", (lbl ? lbl.id + " " : "") + "stBtn");
  var L = document.createElement("ul");
  L.id = "stList"; L.setAttribute("role", "listbox"); L.tabIndex = -1; L.hidden = true;
  if (lbl) L.setAttribute("aria-labelledby", lbl.id); else L.setAttribute("aria-label", "Choose your store");
  K.forEach(function (k) {
    var li = document.createElement("li");
    li.setAttribute("role", "option"); li.id = "sto_" + k; li.dataset.k = k;
    li.style.borderLeftColor = STORES[k].c; li.appendChild(img(k)); L.appendChild(li);
  });
  wrap.appendChild(b); wrap.appendChild(L);

  function sync() {
    var k = storeSel();
    b.textContent = ""; if (k) b.appendChild(img(k)); else b.textContent = "Choose your store\u2026";
    b.style.borderLeftColor = k ? STORES[k].c : "#000";
    [].forEach.call(L.children, function (li) { li.setAttribute("aria-selected", String(li.dataset.k === k)); });
  }
  function mv(i) {
    var a = L.children; f = (i + a.length) % a.length;
    [].forEach.call(a, function (li, j) { li.classList.toggle("f", j === f); });
    L.setAttribute("aria-activedescendant", a[f].id);
    if (a[f].scrollIntoView) a[f].scrollIntoView({ block: "nearest" });
  }
  // Keep the open list between the sticky top nav and the fixed bottom total bar (small phones, 320px).
  function fit() {
    var nav = document.querySelector("nav"), bar = document.getElementById("bar");
    var top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    var bot = bar && getComputedStyle(bar).position === "fixed" ? bar.getBoundingClientRect().top : innerHeight;
    L.style.maxHeight = "";
    for (var n = 0; n < 2; n++) { // twice: the sticky nav moves as the page scrolls
      if (nav) top = Math.max(0, nav.getBoundingClientRect().bottom);
      var bt = b.getBoundingClientRect(), need = L.getBoundingClientRect().bottom - bot + 8;
      if (need > 0) window.scrollBy(0, Math.min(need, bt.top - top - 8));
      else if (bt.top < top + 8) window.scrollBy(0, bt.top - top - 8);
    }
    var room = bot - L.getBoundingClientRect().top - 8;
    if (room < L.scrollHeight) L.style.maxHeight = Math.max(144, room) + "px";
  }
  function open() { L.hidden = false; b.setAttribute("aria-expanded", "true"); fit(); L.focus({ preventScroll: true }); mv(Math.max(0, K.indexOf(storeSel()))); }
  function close(refocus) { L.hidden = true; b.setAttribute("aria-expanded", "false"); if (refocus) b.focus(); }
  function pick(k) { close(true); if (k !== storeSel()) pickStore(k); else sync(); }

  b.addEventListener("click", function () { if (L.hidden) open(); else close(true); });
  b.addEventListener("keydown", function (e) { if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); } });
  L.addEventListener("click", function (e) { var li = e.target.closest && e.target.closest("li"); if (li) pick(li.dataset.k); });
  L.addEventListener("keydown", function (e) {
    var x = { ArrowDown: f + 1, ArrowUp: f - 1, Home: 0, End: -1, PageDown: -1, PageUp: 0 }[e.key];
    if (x != null) { e.preventDefault(); mv(x); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(K[f]); }
    else if (e.key === "Escape") { e.preventDefault(); close(true); }
    else if (e.key === "Tab") close(false);
  });
  // Close when focus leaves (tap/click elsewhere). Delayed so a tap on an option is handled first (iOS).
  L.addEventListener("focusout", function () { setTimeout(function () { if (!L.hidden && !L.contains(document.activeElement)) close(false); }, 250); });
  document.addEventListener("pointerdown", function (e) { if (!L.hidden && !wrap.contains(e.target)) close(false); });
  if (lbl) lbl.addEventListener("click", function (e) { e.preventDefault(); b.focus(); });

  // Every store change in the app goes through sel.onchange() (pickStore, __test.setStore, user change).
  var orig = sel.onchange;
  sel.onchange = function () { var r = orig && orig.apply(this, arguments); sync(); return r; };
  sel.addEventListener("change", sync);
  sync();
  window.__storePicker = { sync: sync, open: open, close: close, keys: K.slice() };
})();
