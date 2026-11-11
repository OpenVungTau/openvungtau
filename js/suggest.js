"use strict";

/* "Suggest a place" widget. Any element with data-suggest opens it.
   Needs js/i18n.js loaded first (OVT, REPO_URL). */

// The one place to change how people reach Son. Every url must be https.
const SUGGEST_CHANNELS = [
  { id: "zalo", name: "Zalo", url: "https://zalo.me/0396161954", noteKey: "suggest.zalo", icon: "chat" },
  { id: "whatsapp", name: "WhatsApp", url: "https://wa.me/84396161954", noteKey: "suggest.whatsapp", icon: "chat" },
  { id: "telegram", name: "Telegram", url: "https://t.me/techwizson", noteKey: "suggest.telegram", icon: "chat" },
  {
    id: "github",
    name: "GitHub",
    // GitHub's web editor forks the repo and opens a pull request for people without write access.
    url: `${REPO_URL}/edit/main/data/places.json`,
    noteKey: "suggest.github",
    icon: "pr",
  },
];

const SUGGEST_ICONS = {
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  pr: "M6 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M6 9v6M18 15V9a3 3 0 0 0-3-3h-3",
};

(() => {
  let dialog = null;
  let opener = null;

  function svg(d, size) {
    const NS = "http://www.w3.org/2000/svg";
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 24 24");
    s.setAttribute("width", size);
    s.setAttribute("height", size);
    s.setAttribute("aria-hidden", "true");
    s.setAttribute("focusable", "false");
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "currentColor");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linecap", "round");
    p.setAttribute("stroke-linejoin", "round");
    s.append(p);
    return s;
  }

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function fill() {
    const t = OVT.t;
    const close = el("button", "icon-btn detail-close");
    close.type = "button";
    close.setAttribute("aria-label", t("suggest.close"));
    close.append(svg("M6 6l12 12M18 6L6 18", 20));
    close.addEventListener("click", () => dialog.close());

    const title = el("h2", "detail-title hand", t("suggest.title"));
    title.id = "suggest-title";

    const list = el("ul", "channels");
    for (const c of SUGGEST_CHANNELS) {
      const a = el("a", "channel");
      a.href = c.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.append(svg(SUGGEST_ICONS[c.icon], 22), el("span", "channel-name", c.name), el("span", "channel-note", t(c.noteKey)));
      const li = el("li");
      li.append(a);
      list.append(li);
    }

    const body = el("article", "detail-body");
    body.append(close, title, el("p", "detail-sub", t("suggest.lead")), list, el("p", "sticky suggest-hint", t("suggest.hint")));
    dialog.replaceChildren(body);
  }

  function build() {
    dialog = document.createElement("dialog");
    dialog.id = "suggest-dialog";
    dialog.setAttribute("aria-labelledby", "suggest-title");
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      if (opener && document.contains(opener)) opener.focus();
    });
    document.body.append(dialog);
    document.addEventListener("ovt:lang", () => dialog.open && fill());
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-suggest]");
    if (!trigger) return;
    e.preventDefault();
    if (!dialog) build();
    opener = trigger;
    fill();
    dialog.showModal();
    dialog.scrollTop = 0;
  });
})();
