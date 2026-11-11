"use strict";

/* openvungtau – places page. Needs js/i18n.js (window.OVT) loaded first.
   All text from data/places.json is inserted with textContent (never innerHTML),
   because that file is edited by contributors through pull requests. */

const AREA_NAMES = {
  // Vietnamese place names stay as they are in every language, so visitors can read signs and tell a driver.
  bai_truoc: "Bãi Trước",
  bai_sau: "Bãi Sau",
  bai_dau: "Bãi Dâu",
  phuong_1: "Phường 1",
  phuong_2: "Phường 2",
  phuong_thang_tam: "Phường Thắng Tam",
  other: null, // translated: area.other
};
const CATEGORIES = ["cafe", "restaurant", "street_food", "stay", "coworking", "activity"];
const PRICES = ["$", "$$", "$$$"];
const OUTLETS = ["plentiful", "few", "none"];
const NOISE = ["quiet", "moderate", "loud"];
const ENGLISH = ["none", "basic", "fluent"];

// Chips shown in the "Type" row. `cats` lists the schema categories each chip covers.
const CATEGORY_GROUPS = [
  { id: "all", labelKey: "group.all", cats: null },
  { id: "work", labelKey: "group.work", cats: ["cafe", "coworking"] },
  { id: "food", labelKey: "group.food", cats: ["restaurant", "street_food"] },
  { id: "stay", labelKey: "group.stay", cats: ["stay"] },
  { id: "activity", labelKey: "group.activity", cats: ["activity"] },
];

const TOGGLES = [
  { id: "work", labelKey: "toggle.work", test: (p) => p.nomad_features.good_for_work === true },
  { id: "cards", labelKey: "toggle.cards", test: (p) => p.expat_friendly.payment_methods.international_cards === true },
  { id: "verified", labelKey: "toggle.verified", test: (p) => p.verification.status === "verified_by_son" },
];

const state = {
  places: [],
  query: "",
  category: "all",
  area: "all",
  toggles: new Set(),
  failed: null, // "fetch" | Error message string
};

const $ = (id) => document.getElementById(id);
const t = (key, vars) => OVT.t(key, vars);

/* ---------- Small helpers ---------- */

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value === true ? "" : value);
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child);
  }
  return node;
}

const ICONS = {
  wifi: "M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01",
  plug: "M9 2v5M15 2v5M6 7h12v4a6 6 0 0 1-12 0V7ZM12 17v5",
  menu: "M4 5h16M4 10h16M4 15h10M4 20h7",
  card: "M2 6h20v12H2zM2 10h20M6 15h4",
};

function icon(name) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "14");
  svg.setAttribute("height", "14");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", ICONS[name]);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  svg.append(path);
  return svg;
}

// Lowercase and strip Vietnamese diacritics so "banh khot" finds "Bánh Khọt".
function normalize(text) {
  return String(text)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

function safeHttpsUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function safeImagePath(src) {
  // Photos live in this repo (images/…); refuse anything that is not a plain relative path.
  return typeof src === "string" && /^images\/[\w./-]+\.(?:jpe?g|png|webp|avif)$/i.test(src) && !src.includes("..")
    ? src
    : null;
}

function formatMonth(ym) {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym || "");
  if (!m) return ym || "—";
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString(OVT.lang, {
    month: "long",
    year: "numeric",
  });
}

const areaLabel = (id) => AREA_NAMES[id] || t("area.other");
const yesNo = (v) => t(v ? "yes" : "no");

// Search every language of every text, so a Korean reader finds a place by an English dish name too.
function buildSearchText(p) {
  const v = p.verification;
  const all = (x) => (typeof x === "string" ? x : Object.values(x || {}).join(" "));
  return normalize([p.name, p.address, all(v.must_try), all(v.local_tip), areaLabel(p.area)].join(" "));
}

/* ---------- Filtering ---------- */

function matches(p) {
  const group = CATEGORY_GROUPS.find((g) => g.id === state.category);
  if (group && group.cats && !group.cats.includes(p.category)) return false;
  if (state.area !== "all" && p.area !== state.area) return false;
  for (const tg of TOGGLES) {
    if (state.toggles.has(tg.id) && !tg.test(p)) return false;
  }
  const q = normalize(state.query.trim());
  if (q && !q.split(/\s+/).every((word) => p._search.includes(word))) return false;
  return true;
}

function hasActiveFilters() {
  return state.query.trim() !== "" || state.category !== "all" || state.area !== "all" || state.toggles.size > 0;
}

/* ---------- Rendering ---------- */

function renderChips(container, items, isPressed, onClick) {
  container.replaceChildren(
    ...items.map((item) => {
      const btn = el("button", {
        class: "chip",
        type: "button",
        text: item.label,
        "aria-pressed": String(isPressed(item.id)),
      });
      btn.addEventListener("click", () => onClick(item.id));
      return btn;
    })
  );
}

function renderControls() {
  renderChips(
    $("category-chips"),
    CATEGORY_GROUPS.map((g) => ({ id: g.id, label: t(g.labelKey) })),
    (id) => state.category === id,
    (id) => {
      state.category = id;
      update();
    }
  );

  const areaIds = Object.keys(AREA_NAMES).filter((a) => state.places.some((p) => p.area === a));
  renderChips(
    $("area-chips"),
    [{ id: "all", label: t("area.all") }, ...areaIds.map((id) => ({ id, label: areaLabel(id) }))],
    (id) => state.area === id,
    (id) => {
      state.area = id;
      update();
    }
  );

  renderChips(
    $("toggle-chips"),
    TOGGLES.map((tg) => ({ id: tg.id, label: t(tg.labelKey) })),
    (id) => state.toggles.has(id),
    (id) => {
      state.toggles.has(id) ? state.toggles.delete(id) : state.toggles.add(id);
      update();
    }
  );
}

function pill(iconName, text, off = false) {
  return el("span", { class: off ? "pill pill-off" : "pill" }, [icon(iconName), text]);
}

function stamp(p) {
  return p.verification.status === "verified_by_son"
    ? el("span", { class: "stamp stamp-ok", text: t("status.verified") })
    : el("span", { class: "stamp stamp-community", text: t("status.community") });
}

function renderEntry(p) {
  const nf = p.nomad_features;
  const ef = p.expat_friendly;
  const mustTry = OVT.pick(p.verification.must_try);

  const pills = [];
  if (typeof nf.wifi_speed_mbps === "number") pills.push(pill("wifi", t("pill.wifi", { n: nf.wifi_speed_mbps })));
  pills.push(
    nf.power_outlets === "none"
      ? pill("plug", t("pill.outletsNone"), true)
      : pill("plug", t(nf.power_outlets === "plentiful" ? "pill.outletsPlenty" : "pill.outletsFew"), nf.power_outlets === "few")
  );
  pills.push(ef.english_menu ? pill("menu", t("pill.engMenu")) : pill("menu", t("pill.noEngMenu"), true));
  pills.push(
    ef.payment_methods.international_cards ? pill("card", t("pill.cards")) : pill("card", t("pill.noCards"), true)
  );

  const title = el("h3", { class: "entry-title" }, [
    el("button", { type: "button", text: p.name, "aria-haspopup": "dialog" }),
  ]);

  const entry = el("article", { class: "entry" }, [
    el("div", { class: "entry-top" }, [el("span", { class: "entry-cat", text: t(`cat.${p.category}`) }), stamp(p)]),
    title,
    el("p", { class: "entry-meta", text: `${areaLabel(p.area)} · ${p.price_range}` }),
    mustTry ? el("p", { class: "entry-note", text: t("card.try", { text: mustTry }) }) : null,
    el("div", { class: "pills" }, pills),
  ]);

  title.firstChild.addEventListener("click", (e) => openDetail(p, e.currentTarget));
  return entry;
}

function render() {
  const grid = $("results");
  if (state.failed) {
    grid.replaceChildren();
    grid.hidden = true;
    $("empty-state").hidden = true;
    $("reset-filters").hidden = true;
    $("result-count").textContent = "";
    const known = state.failed === "fetch";
    if (known) $("error-text").textContent = t("error.fetch");
    else $("error-text").textContent = state.failed;
    $("error-state").hidden = false;
    return;
  }

  const list = state.places.filter(matches);
  grid.replaceChildren(...list.map(renderEntry));
  grid.hidden = list.length === 0;
  $("empty-state").hidden = list.length > 0;
  $("error-state").hidden = true;
  $("reset-filters").hidden = !hasActiveFilters();

  const total = state.places.length;
  $("result-count").textContent =
    list.length === total
      ? t(total === 1 ? "count.one" : "count.many", { n: total })
      : t("count.filtered", { a: list.length, b: total });
}

function update() {
  renderControls();
  render();
}

function resetFilters() {
  state.query = "";
  state.category = "all";
  state.area = "all";
  state.toggles.clear();
  $("search").value = "";
  update();
}

/* ---------- Detail dialog ---------- */

let openPlace = null; // re-rendered when the language changes while open

function fact(label, value) {
  return el("div", {}, [el("dt", { text: label }), el("dd", { text: value })]);
}

function buildDetail(p) {
  const nf = p.nomad_features;
  const ef = p.expat_friendly;
  const pay = ef.payment_methods;
  const mapsUrl = safeHttpsUrl(p.google_maps_url);
  const photo = safeImagePath(p.photo);
  const mustTry = OVT.pick(p.verification.must_try);
  const localTip = OVT.pick(p.verification.local_tip);

  const payments = [
    pay.cash && t("pay.cash"),
    pay.vietnam_qr && t("pay.qr"),
    pay.international_cards && t("pay.cards"),
  ].filter(Boolean);

  const verifiedDate = formatMonth(p.verification.visited_date);

  return [
    el("div", { class: "detail-top" }, [el("span", { class: "entry-cat", text: t(`cat.${p.category}`) }), stamp(p)]),
    el("h2", { class: "detail-title hand", id: "detail-title", text: p.name }),
    el("p", { class: "detail-sub", text: `${areaLabel(p.area)} · ${p.address}` }),
    photo ? el("img", { class: "detail-photo", src: photo, alt: p.name, loading: "lazy" }) : null,

    mustTry || localTip
      ? el("div", { class: "detail-section" }, [
          el("h3", { text: t("detail.tips") }),
          mustTry
            ? el("blockquote", { class: "sticky", style: null }, [
                el("span", { class: "sticky-label", text: t("detail.mustTry") }),
                mustTry,
              ])
            : null,
          localTip
            ? el("blockquote", { class: "sticky" }, [
                el("span", { class: "sticky-label", text: t("detail.localTip") }),
                localTip,
              ])
            : null,
        ])
      : null,

    el("div", { class: "detail-section" }, [
      el("h3", { text: t("detail.basics") }),
      el("dl", { class: "facts" }, [
        fact(t("detail.hours"), OVT.pick(p.opening_hours)),
        fact(t("detail.price"), t(`price.${p.price_range}`)),
        fact(
          t("detail.verified"),
          p.verification.status === "verified_by_son"
            ? t("detail.verifiedBy", { date: verifiedDate })
            : t("detail.verifiedCommunity", { date: verifiedDate })
        ),
      ]),
    ]),

    el("div", { class: "detail-section" }, [
      el("h3", { text: t("detail.work") }),
      el("dl", { class: "facts" }, [
        fact(t("detail.goodForWork"), yesNo(nf.good_for_work)),
        fact(t("detail.wifi"), typeof nf.wifi_speed_mbps === "number" ? t("pill.wifi", { n: nf.wifi_speed_mbps }) : t("notTested")),
        fact(t("detail.outlets"), t(`outlets.${nf.power_outlets}`)),
        fact(t("detail.noise"), t(`noise.${nf.noise_level}`)),
        fact(t("detail.ac"), yesNo(nf.air_conditioned)),
        fact(t("detail.outdoor"), yesNo(nf.has_outdoor)),
      ]),
    ]),

    el("div", { class: "detail-section" }, [
      el("h3", { text: t("detail.visitors") }),
      el("dl", { class: "facts" }, [
        fact(t("detail.staffEnglish"), t(`english.${ef.staff_english}`)),
        fact(t("detail.engMenu"), yesNo(ef.english_menu)),
        fact(t("detail.payment"), payments.length ? payments.join(", ") : t("notListed")),
      ]),
    ]),

    el("div", { class: "detail-actions" }, [
      mapsUrl
        ? el(
            "a",
            { class: "btn btn-primary", href: mapsUrl, target: "_blank", rel: "noopener noreferrer" },
            [t("detail.maps")]
          )
        : null,
      el("button", { class: "btn", type: "button", id: "detail-done", text: t("detail.close") }),
    ]),
  ];
}

function fillDetail(p) {
  const dialog = $("detail");
  $("detail-content").replaceChildren(...buildDetail(p).filter(Boolean));
  $("detail-done").addEventListener("click", () => dialog.close());
  $("detail-close").setAttribute("aria-label", t("detail.close"));
}

function openDetail(p, opener) {
  const dialog = $("detail");
  openPlace = p;
  fillDetail(p);
  dialog._opener = opener;
  dialog.showModal();
  dialog.scrollTop = 0;
}

function setupDialog() {
  const dialog = $("detail");
  $("detail-close").addEventListener("click", () => dialog.close());
  // Click on the backdrop (the dialog element itself, outside its content box) closes it.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    openPlace = null;
    if (dialog._opener && document.contains(dialog._opener)) dialog._opener.focus();
  });
}

/* ---------- Data ---------- */

// Cheap guard so one malformed PR entry shows a clear message instead of a blank page.
function validate(places) {
  if (!Array.isArray(places)) throw new Error("places.json must be a JSON array.");
  const seen = new Set();
  places.forEach((p, i) => {
    const where = `places.json entry #${i + 1}${p && p.id ? ` (${p.id})` : ""}`;
    const need = (cond, what) => {
      if (!cond) throw new Error(`${where}: ${what}`);
    };
    need(p && typeof p.id === "string" && p.id, "missing id");
    need(!seen.has(p.id), "duplicate id");
    seen.add(p.id);
    need(typeof p.name === "string" && p.name, "missing name");
    need(CATEGORIES.includes(p.category), `unknown category "${p.category}"`);
    need(p.area in AREA_NAMES, `unknown area "${p.area}"`);
    need(PRICES.includes(p.price_range), `unknown price_range "${p.price_range}"`);
    need(p.nomad_features && p.expat_friendly && p.verification, "missing nomad_features, expat_friendly or verification");
    need(p.expat_friendly.payment_methods, "missing expat_friendly.payment_methods");
    need(OUTLETS.includes(p.nomad_features.power_outlets), "bad power_outlets");
    need(NOISE.includes(p.nomad_features.noise_level), "bad noise_level");
    need(ENGLISH.includes(p.expat_friendly.staff_english), "bad staff_english");
    for (const field of ["must_try", "local_tip"]) {
      const v = p.verification[field];
      need(v == null || typeof v === "string" || (typeof v === "object" && typeof v.en === "string"), `${field} must be text or an object with at least an "en" entry`);
    }
  });
}

async function load() {
  const res = await fetch("data/places.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Request failed (${res.status}).`);
  const places = await res.json();
  validate(places);
  places.forEach((p) => (p._search = buildSearchText(p)));
  // Verified first, then alphabetical, so the best-checked spots lead.
  places.sort(
    (a, b) =>
      (b.verification.status === "verified_by_son") - (a.verification.status === "verified_by_son") ||
      a.name.localeCompare(b.name, "vi")
  );
  return places;
}

/* ---------- Init ---------- */

async function init() {
  setupDialog();
  $("search").addEventListener("input", (e) => {
    state.query = e.target.value;
    render();
  });
  $("reset-filters").addEventListener("click", resetFilters);
  $("empty-reset").addEventListener("click", resetFilters);

  await OVT.ready;

  // Language change: redraw everything that was built from strings.
  document.addEventListener("ovt:lang", () => {
    state.places.forEach((p) => (p._search = buildSearchText(p)));
    update();
    if (openPlace) fillDetail(openPlace);
  });

  try {
    state.places = await load();
  } catch (err) {
    console.error(err);
    state.failed = err instanceof TypeError ? "fetch" : err.message;
  }
  update();
}

init();
