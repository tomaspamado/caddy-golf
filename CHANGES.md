# Changes

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
