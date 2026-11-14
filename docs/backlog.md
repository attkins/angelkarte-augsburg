# Backlog

Open tasks and feature ideas for the Angelkarte, collected on 2026-11-14.
This file is the shared work list for parallel chats and agents.

## How to use this file

- Every item has a fixed ID (e.g. `D3`). Refer to it in chats and commit messages.
- Before starting an item, set its status to `in progress` and add a short note who works on it (e.g. "chat opening hours"). Save the file right away so other chats see the claim.
- Check `git status` and `git diff` before editing data files. Several chats may change `public/data/*.json|geojson` at the same time. Edit only the features you need and never rewrite a whole file from an old copy.
- When an item is done, set its status to `done` with the date and move on. Keep done items here until the next cleanup so others can see what changed.
- New findings go to the matching section with the next free ID.
- Larger decisions and the reasoning behind them still belong in `concept.md`, research results in `research-clubs.md`.

Status values: `open`, `in progress`, `done`, `blocked`.

## Cleanup

| ID | Task | Status |
|----|------|--------|
| C1 | Remove stale "Lage nur ungefähr" and "Grenzen noch nicht geprüft" from the `accessNote` of waters that are now traced: Lechauensee 1 and 2, FVA-See, Paintensee, Rollweiher, Hurlacher See, Baggerseen Sand, Günz, Lochbach Haunstetten | open |
| C2 | Update step 6 in `concept.md`: Paintensee, Rollweiher and Hurlacher See are traced by now | open |
| C3 | Run `npm test` in the GitHub Actions workflow before the build. `.github/` can only be edited by Thomas | open |

## Data

| ID | Task | Status |
|----|------|--------|
| D1 | Opening hours of the sales points (20 of 27 have none) and holidays, see step 11 in `concept.md` | in progress (other chat) |
| D2 | Friedberg: can guests fish the Paar and Friedberger Ach stretches without a member? | open |
| D3 | Clarify the 7 waters with `guestAccess: unknown` | open |
| D4 | Singold Bobingen is open for guests but has no guest price. Bobingen prices are not online at all | open |
| D5 | Singold Wehringen has no sales point and no online purchase. Wehringen sales points are unknown | open |
| D6 | Real extent of the placeholder stretches: Lech (LFV), Wertach Großaitingen, Wehringen, Siebnach, Göggingen. Club water maps help most | open |
| D7 | Fish species: only 5 of 62 waters have species. Start with FVA and LFV | open |
| D8 | Missing LFV waters: Paar 3, Paar 4, Schmutter, Zusam | open |
| D9 | Missing waters outside the core region: Kirnach (FVA), 1. AAC waters (Mindel, Günz, Höchstädt and others) | open |
| D10 | Third research pass west of Augsburg: Staudenfischereiverein, hejfish Neufnach and Weiher H5, clubs in Diedorf, Dinkelscherben, Fischach, Welden and others | open |
| D11 | FVA prices change on 2027-01-01 (`prices.validFrom`). Check all other clubs for 2027 prices in January | open |

## Technical

| ID | Task | Status |
|----|------|--------|
| T1 | Validator warning when `lastChecked` is older than about 6 months | open |
| T2 | Show prices with `validFrom` automatically once the date is reached, keep the old prices until then | open |
| T3 | Decide how data is maintained later: hand-edited GeoJSON with docs, or a small editor | open |
| T4 | Decide whether the site needs a password or an unlisted link is enough | open |

## Feature ideas

| ID | Idea | Notes | Status |
|----|------|-------|--------|
| F1 | Filter "Karte heute noch bekommen" | Waters where a sales point is open right now or online purchase exists. Needs D1 | open |
| F2 | Plan for a date | Date picker instead of only "today": seasons, guest periods and opening hours on that day. `availability()` and `openingStatus()` already take a date | open |
| F3 | Fish species filter | Chip or selector, needs D7 | open |
| F4 | Sort by distance | Distance from the own location or a fixed start (e.g. Friedberg), optionally rough driving time | open |
| F5 | Share button | Web Share API with the existing hash routes, fallback copy link | open |
| F6 | Water level and temperature | Open data of the Hochwassernachrichtendienst Bayern for Lech, Wertach, Schmutter, Paar. First check which gauges fit which stretches | open |
| F7 | Offline use | Service worker caching the data files and recently viewed tiles | open |
| F8 | Report an error | Mail link in the water detail with the water ID prefilled | open |
| F9 | Parking and access points | A few points per water, drawn with the aerial images. Needs a schema extension | open |
| F10 | Depth maps for lakes | See the assessment in `concept.md`. Probably only links to club maps | open |
