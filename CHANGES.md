# Changes

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
