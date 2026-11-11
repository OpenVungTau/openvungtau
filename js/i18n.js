"use strict";

/* Shared by every page: language (remembered), theme, header links.
   Pages mark text with data-i18n="key", data-i18n-placeholder="key" or data-i18n-label="key"
   (aria-label). The HTML keeps English text inside, so the page still reads if a file fails to load. */

// Change this one line when the repo moves.
const REPO_URL = "https://github.com/OpenVungTau/openvungtau";

const LANGS = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ru", name: "Русский" },
];
const LANG_KEY = "ovt-lang";
const THEME_KEY = "ovt-theme";

const OVT = (() => {
  const bundles = {}; // code -> { key: string }
  let lang = "en";

  const isLang = (c) => LANGS.some((l) => l.code === c);

  function readStored(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null; // storage can be blocked
    }
  }
  function writeStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* the choice still applies for this visit */
    }
  }

  function detectLang() {
    // A shared link like ?lang=ko wins, and becomes the remembered choice.
    const fromUrl = new URLSearchParams(location.search).get("lang");
    if (isLang(fromUrl)) {
      writeStored(LANG_KEY, fromUrl);
      return fromUrl;
    }
    const saved = readStored(LANG_KEY);
    if (isLang(saved)) return saved;
    for (const tag of navigator.languages || [navigator.language || "en"]) {
      const code = String(tag).toLowerCase().split("-")[0];
      if (isLang(code)) return code;
    }
    return "en";
  }

  async function loadBundle(code) {
    if (bundles[code]) return bundles[code];
    try {
      const res = await fetch(`i18n/${code}.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      bundles[code] = await res.json();
    } catch (err) {
      console.error(`Could not load i18n/${code}.json`, err);
      bundles[code] = {};
    }
    return bundles[code];
  }

  function t(key, vars) {
    let s = (bundles[lang] && bundles[lang][key]) ?? (bundles.en && bundles.en[key]);
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? vars[name] : m));
    return s;
  }
  const has = (key) => (bundles[lang] && key in bundles[lang]) || (bundles.en && key in bundles.en);

  // Pick the right text from a string or a { en, vi, ko, zh, ru } object, falling back to English.
  function pick(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    return value[lang] || value.en || Object.values(value)[0] || "";
  }

  function applyStatic() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const key = node.dataset.i18n;
      if (has(key)) node.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      const key = node.dataset.i18nPlaceholder;
      if (has(key)) node.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll("[data-i18n-label]").forEach((node) => {
      const key = node.dataset.i18nLabel;
      if (has(key)) node.setAttribute("aria-label", t(key));
    });
    const title = document.querySelector("title[data-i18n]");
    if (title && has(title.dataset.i18n)) document.title = t(title.dataset.i18n);
    const desc = document.querySelector('meta[name="description"][data-i18n-content]');
    if (desc && has(desc.dataset.i18nContent)) desc.setAttribute("content", t(desc.dataset.i18nContent));
    const select = document.getElementById("lang-select");
    if (select) select.value = lang;
    syncThemeButton();
  }

  async function setLang(code, remember = true) {
    if (!isLang(code)) code = "en";
    await Promise.all([loadBundle("en"), loadBundle(code)]);
    lang = code;
    if (remember) writeStored(LANG_KEY, code);
    applyStatic();
    document.dispatchEvent(new CustomEvent("ovt:lang", { detail: { lang } }));
  }

  /* ---------- Theme ---------- */

  function currentTheme() {
    const set = document.documentElement.dataset.theme;
    if (set === "light" || set === "dark") return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncThemeButton() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    const dark = currentTheme() === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", t(dark ? "theme.toLight" : "theme.toDark"));
  }

  function setupTheme() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      writeStored(THEME_KEY, next);
      syncThemeButton();
    });
  }

  /* ---------- Header ---------- */

  function setupHeader() {
    const select = document.getElementById("lang-select");
    if (select) {
      select.replaceChildren(
        ...LANGS.map((l) => {
          const o = document.createElement("option");
          o.value = l.code;
          o.textContent = l.name;
          o.lang = l.code;
          return o;
        })
      );
      select.addEventListener("change", () => setLang(select.value));
    }
    document.querySelectorAll("[data-repo-link]").forEach((a) => (a.href = REPO_URL));
    const suggest = `${REPO_URL}/issues/new?title=${encodeURIComponent("Suggest a place: ")}`;
    document.querySelectorAll("[data-suggest-link]").forEach((a) => (a.href = suggest));
  }

  const ready = (async () => {
    setupHeader();
    setupTheme();
    await setLang(detectLang(), false);
  })();

  return { ready, t, pick, setLang, get lang() { return lang; }, LANGS };
})();

window.OVT = OVT;
