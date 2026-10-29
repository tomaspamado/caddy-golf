# Changes

## Morning summary (overnight runs 1 to 3)
What is live now:
- Run 1: fixes from four simulated golfers. "Next hole" saves the par if you did not touch + or −, Details scrolls into view on small phones, every tap target is 48px, green buttons are darker for sunlight, the wind dial arrow points the right way.
- Run 2: European Portuguese. Settings has English / Português; the phone language picks the default. Your saved data still loads.
- Run 3 (this run): full regression test at 390x800 and 360x640 passed (first-run, target, recommendation, landing oval, picker, Conditions, Hit then "I'm at my ball", 9-hole round, history, Range log and apply, Bag, Settings, Portuguese, yards, no errors, no small tap targets). The maths was re-read and no bugs were found.

One thing is NOT finished: making the app installable and usable with no signal. The three supporting files (manifest.webmanifest, sw.js, icon.svg) are in the repo, but index.html could not be updated to use them. The tool I have can only send a whole file in one go, and index.html (76 KB) is too large for it to send safely; a half-sent or mistyped file could break the live app, so I did not push it. The files in the repo do nothing until index.html links them, so the live app is exactly as it was.

To finish it (two tiny edits to index.html) paste these:
1. In `<head>`, replace the theme-color line with `<meta name="theme-color" content="#15803d">` and add under it:
`<link rel="manifest" href="manifest.webmanifest">`
`<link rel="icon" href="icon.svg" type="image/svg+xml">`
`<link rel="apple-touch-icon" href="icon.svg">`
2. Just before `</body>` add:
`<script>if("serviceWorker" in navigator&&location.protocol==="https:")navigator.serviceWorker.register("sw.js").catch(()=>{});</script>`
(Keep it in its own script tag, after the main one.) The service worker is tested: it caches the app and Leaflet, loads index.html from the network first (never stale when online) and falls back to the saved copy offline. Map tiles stay online-only; with no GPS the existing "set my position on the map" button still works.

3 best next ideas:
1. Finish the install/offline wiring above (next run, with a way to send the file in pieces, or you paste the 2 edits).
2. Warn when a club needs more than a full swing (e.g. 80 m picks Sand Wedge at over 100% swing), and show yards temperature as °F-free simple text.
3. Let Range misses feed the landing oval, and add an undo for the Bag ✕ delete.

## 2026-10-29 (run 3) – install and offline files, QA, maths
Added (not yet used by index.html, see above): manifest.webmanifest, sw.js (cache name caddy-v1, network-first for index.html, cache-first for Leaflet from unpkg, tiles and weather untouched), icon.svg.
Tested: service worker registers, caches the app files, and the app opens offline (Playwright on localhost). Full smoke test passed at both phone sizes (see summary).
Maths re-read: headwind +1%/mph, tailwind −0.5%/mph, crosswind sign (wind from the right pushes left, aim right), temperature 0.2%/°C below 20°C, slope (uphill adds), altitude, GIR (score − putts ≤ par − 2), per-18 stats, learned landing zone. No real bugs found, nothing changed.

