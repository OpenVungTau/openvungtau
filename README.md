# openvungtau

Son's notebook of Vũng Tàu, Vietnam: verified cafes, restaurants, street food, stays, coworking spots and activities for expats, digital nomads and travellers. Available in English, Vietnamese, Korean, Chinese and Russian. The site remembers each visitor's last language.

It is a static site: plain HTML, CSS and JavaScript. No build step, no npm, no database. Every place is an entry in [`data/places.json`](data/places.json) and every piece of text is in [`i18n/`](i18n), so the git history is the full record of what changed and why.

## Run locally

The pages load JSON with `fetch`, so use a local web server rather than double-clicking `index.html`:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Add `?lang=ko` (or `en`, `vi`, `zh`, `ru`) to a link to open it in that language; it also becomes the visitor's remembered language.

## Structure

```
index.html        places page (search, filters, entries, detail dialog)
about.html        Son's welcome page
css/style.css     notebook look (light/dark, mobile-first)
js/i18n.js        language (remembered), theme, header links, shared by both pages
js/app.js         places page logic
js/suggest.js     "Suggest a place" widget (Zalo, WhatsApp, Telegram, GitHub)
js/livecam.js     live cam section (YouTube channel, loaded only on click)
i18n/<lang>.json  every UI string and the About text, one file per language
data/places.json  all place data
images/           logo files (logo-horizontal*.png, icon.png) and photos used by places
```

`REPO_URL` at the top of `js/i18n.js` is the GitHub repository. The contact channels in the "Suggest a place" widget are listed at the top of `js/suggest.js`; every URL there must be `https`.

## Live cam

The live cam section (home and About pages) embeds the YouTube channel's current live stream. The channel ID and links are at the top of `js/livecam.js`. The player loads only after a visitor presses play, through `youtube-nocookie.com`, so nobody talks to YouTube before they choose to.

## Deploy on GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source "Deploy from a branch", branch `main`, folder `/ (root)`.

## Languages

Supported: `en`, `vi`, `ko`, `zh`, `ru`. English is the fallback for anything missing.

- **Interface and About text:** edit `i18n/<lang>.json`. Every file must have the same keys as `en.json`.
- **Place texts:** `must_try`, `local_tip` and `opening_hours` take either a plain string or an object with one entry per language, for example `{ "en": "…", "vi": "…", "ko": "…", "zh": "…", "ru": "…" }`. `en` is required. Search looks through all languages.
- **Names and addresses** stay in Vietnamese in every language, so visitors can read signs and tell a driver.
- **Adding a language:** add `i18n/<code>.json`, add the code and its own name to `LANGS` in `js/i18n.js`, and add the translations to the place entries.

## Photos

Put photos in `images/` and add `"photo": "images/<file>.jpg"` (jpg, png, webp or avif) to a place. It shows in that place's detail view. The taped sea pictures on the home and About pages are drawn placeholders; swap them for Son's own photos in `index.html` and `about.html`.

## Contribute a place

You do not need to write any code. Edit `data/places.json` and open a pull request.

1. Fork this repo and open `data/places.json`.
2. Copy an existing entry, paste it at the end of the list (mind the comma between entries), and change the values.
3. Open a pull request. Say when you visited and, if you can, add a photo of the menu or the wifi speed test to the PR description.

Only add places you have been to. Do not include phone numbers, personal data or anything that is not public.

### Entry format

```json
{
  "id": "slug-string",
  "name": "string",
  "category": "cafe | restaurant | street_food | stay | coworking | activity",
  "area": "bai_truoc | bai_sau | bai_dau | phuong_1 | phuong_2 | phuong_thang_tam | other",
  "address": "string",
  "google_maps_url": "https://...",
  "price_range": "$ | $$ | $$$",
  "opening_hours": "string or { en, vi, ko, zh, ru }",
  "photo": "images/file.jpg (optional)",
  "nomad_features": {
    "good_for_work": true,
    "wifi_speed_mbps": 50,
    "power_outlets": "plentiful | few | none",
    "noise_level": "quiet | moderate | loud",
    "air_conditioned": true,
    "has_outdoor": false
  },
  "expat_friendly": {
    "staff_english": "none | basic | fluent",
    "english_menu": true,
    "payment_methods": {
      "cash": true,
      "vietnam_qr": true,
      "international_cards": false
    }
  },
  "verification": {
    "status": "verified_by_son | community_suggested",
    "visited_date": "YYYY-MM",
    "must_try": "string or { en, vi, ko, zh, ru }",
    "local_tip": "string or { en, vi, ko, zh, ru }"
  }
}
```

Rules of thumb:

- `id` is unique, lowercase, words joined by hyphens (`bien-xanh-work-cafe`).
- `wifi_speed_mbps` is a number you measured, or `null` if you did not test it.
- `google_maps_url` must start with `https://`.
- New entries from the community use `"status": "community_suggested"`. The maintainer changes it to `verified_by_son` after visiting.
- If the JSON is invalid or a value is not one of the allowed options, the site shows an error naming the entry instead of loading.

## Sample data

The two entries currently in `data/places.json` are placeholders to show the format (addresses, hours, wifi speed, tips and Maps links are illustrative). Replace them with real, visited places before launch.
