# Roadmap

Planned releases of the Angelkarte, set up on 2026-11-15.

This file says *when* something ships. *What* an item is and its current status stay in [backlog.md](backlog.md), referenced by ID. Decisions and their reasoning stay in [concept.md](concept.md).

Dates are rough targets for a hobby project, not deadlines. A release ships when its goal is met, not when the date is reached. Items can move between releases, update this file when they do.

## Overview

| Release | Theme | Target | Status |
|---------|-------|--------|--------|
| 0.7 | Ready for friends | week of 2026-11-16 | planned |
| 0.8 | Austria | end of November 2026 | in progress (data and region switch done) |
| 0.9 | Core region complete | mid December 2026 | planned |
| 0.10 | More waters | end of December 2026 | planned |
| 1.0 | Season 2027 | mid January 2027 | planned |
| later | Ideas without a date | | |

Already released: 0.1.0 to 0.6.0, see [CHANGELOG.md](../CHANGELOG.md).

## 0.7 Ready for friends

Goal: the link can be passed on to friends without worries.

- C4 Clean up the release tags (test tags `v0.6.1` and `v0.7.0` from trying out the release script)
- F1 "Karte heute noch" filter (done, not committed yet)
- C3 Run `npm test` in the deploy workflow
- T4 Decide between password and unlisted link

Done when the deploy runs the tests and a friend can open and use the map without explanation. F5 (share button) and F8 (report an error) were moved to "Later" on 2026-11-15.

## 0.8 Austria

Goal: the holiday regions Fernpass and Wilder Kaiser are on the map.

- D13 Research clubs and ticket offers, then waters with OSM outlines
- D15 Four more lakes around Kufstein and Kitzbühel (done), D16 the remaining lakes and the first rivers
- T6 Region switch Augsburg, Fernpass and Wilder Kaiser instead of one box from Augsburg to Tyrol (done)
- Waters with restricted or prohibited access shown correctly (already supported in the schema)

Done when the researched Austrian waters are in the data and the map stays usable around Augsburg.

## 0.9 Core region complete

Goal: for Augsburg, Landkreis Augsburg and Aichach-Friedberg the information is correct and complete.

- D2 Friedberg guest rules for Paar and Friedberger Ach
- D3 The 7 waters with `guestAccess: unknown`
- D4 Bobingen prices
- D5 Wehringen sales points
- D6 Real extent of the placeholder stretches
- D14 Remaining opening hours (Osetskiy, Fischerheim FV Friedberg, Holland Blumen) and new coordinates for Angel-Zoo-Ernst and Zum Isarfischer
- D7 Fish species, starting with FVA and LFV
- F3 Fish species filter (after D7)

Done when the acceptance criteria below hold for the core region.

## 0.10 More waters

Goal: the map covers the waters around the core region that friends actually drive to.

- D8 Missing LFV waters: Paar 3, Paar 4, Schmutter, Zusam
- D10 Third research pass west of Augsburg
- D9 Waters outside the core region: Kirnach, 1. AAC waters

## 1.0 Season 2027

Goal: a stable version with the new prices at the turn of the year.

- D11 Check the 2027 prices of all clubs in January, switch Hintersee to guests with a member
- T3 Decide and document how the data is maintained
- Final pass over the acceptance criteria

### Acceptance criteria for 1.0

- No water in the core region with `guestAccess: unknown`
- No placeholder geometry left
- `npm run validate` shows no warning for stale `lastChecked` dates
- Every water open to guests has a guest price and at least one sales point or online purchase
- Tests run in the deploy workflow

## Later

Ideas without a release yet. Pick from here when planning the next release after 1.0.

- F2 Plan for a date
- F5 Share button (moved out of 0.7 on 2026-11-15)
- F8 Report an error (moved out of 0.7 on 2026-11-15)
- F6 Water level and temperature
- F7 Offline use
- F9 Parking and access points
- D12 Maximum depth for the remaining lakes

## How releases are made

`npm run release:minor` bumps the version, regenerates the changelog, commits, tags and pushes (see `scripts/release.mjs`). The tree has to be clean. Every push to `main` deploys, so a release is mainly a version mark for the changelog and the version shown in the app.
