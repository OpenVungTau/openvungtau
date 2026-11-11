# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static site: plain HTML5, CSS and vanilla ES6+ JavaScript. No build tools, no npm, no frameworks, no database. Hosted on GitHub Pages. Chosen by the user.

## Users

Two audiences of equal weight:

- Expats and digital nomads living in Vũng Tàu for weeks or months: they need work-friendly cafes, everyday food, and places to stay.
- Tourists visiting for a few days: they need food, cafe, hotel and guesthouse recommendations.

Readers speak English, Vietnamese, Korean, Chinese or Russian, and many do not read Vietnamese. They open the site on a phone, often already in Vũng Tàu, deciding where to go next.

## Product Purpose

A personal reference blog by Son, who has lived in Vũng Tàu for almost a year. It collects Son's own experience of restaurants, street food, cafes, hotels, guesthouses and relaxing spots, so visitors can travel, live and get through daily life in Vũng Tàu comfortably. Success is a reader finding a place they trust and going there.

## Positioning

Every entry comes from a person who actually went there and says when. The site separates places Son verified from places the community suggested. A directory or review aggregator cannot claim that first-hand record.

## Operating Context

- Content is data in `data/places.json`. Changes go through git and pull requests, so the history is the record.
- There is no backend: nothing secret or private can live in the site or repo.
- Language choice is remembered per visitor (browser storage) and used on the next visit.

## Capabilities and Constraints

- Search, filters (type, area, quick toggles), place cards and detail view, light and dark theme: already built.
- Place fields cover work suitability (wifi, outlets, noise), expat friendliness (English staff and menu, payment methods) and verification (status, visit month, must-try, local tip).
- Languages: English, Vietnamese, Korean, Chinese, Russian. Japanese is out for now and can be added later.
- Planned: an About page introducing Son and the purpose of the site; translated UI strings; translated `must_try` and `local_tip` per place (`{en, vi, ko, zh, ru}` objects in `places.json`), falling back to English. Place names and addresses stay in Vietnamese so visitors can show or say them locally.
- Not decided: final repository URL (`REPO_URL` in `js/app.js` is a placeholder).

## Brand Commitments

Name: openvungtau. Voice: first person, Son's own ("I've lived in Vũng Tàu for almost a year…"), friendly and honest, including about a place's weak points.

## Evidence on Hand

- Two placeholder places in `data/places.json`; their addresses, hours, wifi speeds and tips are illustrative, not real.
- Son will provide real photos (places, food, the sea). None are in the repo yet, so no stock or invented imagery.
- No testimonials, visitor counts or press. Do not fabricate any.

## Product Principles

1. First-hand or flagged: every claim comes from a visit, and unverified entries say so.
2. Readable by someone who does not speak Vietnamese, with local names kept so they can still ask for directions.
3. Useful on a phone in the street before it is pretty on a desktop.
4. Nothing hidden: all content and logic is public in git.
5. Comfort over optimisation: the site helps people settle in and relax, not rush through a checklist.

## Accessibility & Inclusion

Must read well in five scripts (Latin with Vietnamese diacritics, Hangul, Chinese, Cyrillic). Keyboard operable, visible focus, light and dark themes, respects reduced motion.
