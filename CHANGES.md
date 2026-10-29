# Changes

## Morning summary (overnight runs 1 to 3)
What is live now:
- Run 1: fixes from four simulated golfers. "Next hole" saves the par if you did not touch + or −, Details scrolls into view on small phones, every tap target is 48px, green buttons are darker for sunlight, the wind dial arrow points the right way.
- Run 2: European Portuguese. Settings has English / Português; the phone language picks the default. Your saved data still loads.
- Run 3: Caddy can now be installed on the phone (Add to Home Screen) and opens with no signal. It saves the app and the map library; map pictures and live weather still need signal. With no GPS you can still tap "Set my position on the map". When you are online the app always loads the newest version, so it can't get stuck on an old one. Also a full regression test at 390x800 and 360x640 passed (first-run, target, recommendation, landing oval, picker, Conditions, Hit then "I'm at my ball", 9-hole round, history, Range log and apply, Bag, Settings, Portuguese, yards, no errors, no small tap targets), and the maths was re-read with no bugs found.

Note: the first time you open the app online after this update, it saves itself; after that it works offline. The home-screen icon on iPhone may show a plain green circle until a proper PNG icon is added.

3 best next ideas:
1. Warn when a club needs more than a full swing (e.g. 80 m picks Sand Wedge at over 100% swing) and make temperature follow the units.
2. Let Range misses feed the landing oval, and add an undo for the Bag ✕ delete.
3. Add a proper PNG home-screen icon and a small "Saved for offline" hint after first load.

## 2026-10-29 (run 3) – install, offline, QA, maths
Added manifest.webmanifest, sw.js (cache name caddy-v1, network-first for index.html, cache-first for Leaflet from unpkg, tiles and weather untouched), icon.svg, and in index.html: manifest and icon links, theme colour #15803d, and a separate script that registers the service worker (https or localhost only). Bump the cache name in sw.js if the cached files ever change.
Tested: service worker registers, caches the app files, and the app opens offline (Playwright on localhost). Full smoke test passed at both phone sizes. Pushed index.html is byte-identical to the tested file.
Maths re-read: headwind +1%/mph, tailwind −0.5%/mph, crosswind sign (wind from the right pushes left, aim right), temperature 0.2%/°C below 20°C, slope (uphill adds), altitude, GIR (score − putts ≤ par − 2), per-18 stats, learned landing zone. No real bugs found, nothing changed.

## 2026-10-29 (overnight) – Português (pt-PT)
Added European Portuguese as a language.

Changed:
- New language choice in Settings (English / Português), the only new visible UI. Defaults from the phone language (pt* = Portuguese) and is saved in the state as `lang`.
- Every visible string is translated through a small table and a `tr()` helper: sheet, wind and conditions phrases, picker, Details, Conditions, menu tabs (Volta, Treino, Saco, Definições), scorecard, hole dialog, Range, Bag, Settings, first-run dialog, hints, buttons and error notes.
- Natural golf words: taco, bandeira, green, fairway, buraco, pancadas, vento, alvo, tacada, lay-up. Default clubs show as Driver, Madeira 3, Madeira 5, Híbrido 4, Ferro 5–9, Pitching Wedge, Sand Wedge (stored names stay English, so saved data still works). Wind compass uses N, E, S, O.
- Dates use the Portuguese format in Portuguese mode.
- Data key 'caddy.v1' unchanged; old saves load and pick the language from the phone.

Tested (Playwright, English and Português, 390x800 and 360x640, mocked GPS): first-run dialog, tap target, recommendation, landing oval, picker, Conditions, Details, Hit then "I'm at my ball", 9-hole round with three holes scored, finish round, past round view, Range log 3 shots and apply, Bag, Settings language switch, no page errors, no cut-off text, tap targets >= 48px. Screenshots checked in Portuguese. Only golf terms stay in English on purpose (Lay-up, Total, Putts, fairways, greens).

Not done (ideas for next run): the earlier list still stands (over-swing warning, Range misses not feeding the oval, Calibrate ignoring wind/slope, temperature in °C in yards mode, Settings explainer paragraphs and picker "±N largura" jargon could go, Bag ✕ has no undo). Also: "1 buracos" wording when one hole is left (EN has the same "1 more holes").

## 2026-10-29 – golfer feedback round 2
Four simulated golfers (12-handicap student, beginner, low-handicap maths checker, older player in sun) tested the app. Scores: 7.5, 6.5, 7.5 (trust), 7.

Changed:
- "Next hole" now saves the shown par if you did not touch + or −. Before, the hole stayed blank and the total was wrong.
- Details now scrolls into view when opened (at 360x640 it opened below the fold and looked broken).
- Tap targets raised to 48px: menu tabs, GPS pill, hole pill, ☰ and ◎, option buttons (par 3/4/5), Bag ✕ column.
- Main green buttons darkened (#15803d) for sunlight contrast; grey "par" number in the score dialog darkened.
- Wind dial: arrowhead was floating on the wrong side; it now sits on the shaft and points where the wind blows.
- Removed the sentence "The green oval is where it should finish." from the main card.

Tested (Playwright, 390x800 and 360x640, mocked GPS): first-run setup, tap target, recommendation, landing oval, Details, picker, Conditions (dial, wind and temperature steppers), Hit then "I'm at my ball", 9-hole round with two holes scored (one via Next-saves-par), finish round, Range log 3 shots and apply, Bag, Settings, tap targets >= 48px, no page errors. Data key 'caddy.v1' unchanged.

Not done (ideas for next run): over-swing warning (e.g. 80 m picks Sand Wedge at 111% swing), Range misses not feeding the landing oval, "80%" oval is really about 56%, Calibrate ignores wind/slope, temperature stays °C in yards mode, Settings explainer paragraphs and picker "±N wide" jargon could go, Bag ✕ has no undo.
