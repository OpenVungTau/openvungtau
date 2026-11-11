# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OpenVungTau is Son's notebook of Vũng Tàu, Vietnam: verified cafes, restaurants, stays and coworking spots for expats, digital nomads and travellers. Static site in plain HTML, CSS and vanilla JS. Product context is in `PRODUCT.md`; the visual direction and its contract are in `.impeccable/surfaces/index-html.md` ("Sổ tay người ở lại": notebook paper, taped photos, stamps, sticky notes).

## Commands

No build, lint or test tooling. Run the site through a local server (pages `fetch` JSON, so `file://` does not work):

```bash
python3 -m http.server 8000     # http://localhost:8000, add ?lang=ko to force a language
```

Design check on changed UI files: `.claude/skills/impeccable/scripts/impeccable detect --json index.html about.html css js`.

## Core constraint: git is the only data store

- All content lives in git: `data/places.json` for places, `i18n/*.json` for text. No database, no backend, no CMS. Do not introduce one without the user's approval.
- The repo is public: no secrets, tokens, private endpoints or private business logic anywhere, including history.

## Architecture

- `js/i18n.js` is shared by every page and exposes `window.OVT` (`t`, `pick`, `setLang`, `lang`, `ready`). It picks the language (URL `?lang=`, then the remembered `ovt-lang` in localStorage, then the browser language, then `en`), loads `i18n/<lang>.json` plus `en.json` as fallback, and fills elements marked `data-i18n`, `data-i18n-placeholder`, `data-i18n-label`. It also owns theme toggle and header links; `REPO_URL` (OpenVungTau/openvungtau) lives at its top.
- `js/suggest.js` builds the "Suggest a place" dialog on first click of any `[data-suggest]` element. The channel list (Zalo, WhatsApp, Telegram, GitHub web editor) is the `SUGGEST_CHANNELS` constant at its top; those contact details are public by design.
- `js/app.js` is the places page only. It validates `places.json`, renders chips, entries and the detail `<dialog>`, and re-renders on the `ovt:lang` event. All data is inserted with `textContent`, never `innerHTML`, because contributors edit the JSON by pull request.
- Languages: `en`, `vi`, `ko`, `zh`, `ru` (Japanese deliberately excluded). A new UI string must be added to all five `i18n/*.json` files with the same key. Place fields `must_try`, `local_tip`, `opening_hours` take a string or `{en, vi, ko, zh, ru}` (`en` required). Place names, addresses and area names stay Vietnamese in every language. Chinese text uses full-width punctuation; the name is "Sơn" in Vietnamese and "Son" in every other language (in Korean and Russian its transliteration means "hand" / "sleep").
- Both HTML pages share the header, footer and the head script that sets the saved theme before paint. Keep that script wrapped in an IIFE: a global `t` there collides with `const t` in `app.js`.
- Logo: `images/logo-horizontal.png` (light) and `logo-horizontal-dark.png` (dark, ink recoloured light) are cut out from Son's original logo and swapped by CSS with the theme; `images/icon.png` is the favicon. The original 2048px file is not in the repo.
- Photos: places may set `"photo": "images/<file>"`; `app.js` only accepts plain relative paths under `images/`. The taped sea pictures on the home and About pages are drawn SVG placeholders pending Son's real photos. Do not add stock or invented imagery.

## Design rules for this repo

- Reading text stays calm: the notebook world owns the frame (headings, tape, stamps, sticky notes), not the body copy.
- Small clay-coloured text uses `--clay-ink`; `--clay` is for large display text and fills only.
- Avoid the design hook's tells (colored side borders above 1px, hard offset shadows, gradient text). Placeholder data in `places.json` is illustrative and must be replaced with real visited places.
