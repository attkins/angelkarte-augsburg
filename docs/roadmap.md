# Roadmap

Planned releases of the Angelkarte, set up on 2026-11-15.

This file says *when* something ships. *What* an item is and its current status stay in [backlog.md](backlog.md), referenced by ID. Decisions and their reasoning stay in [concept.md](concept.md).

Dates are rough targets for a hobby project, not deadlines. A release ships when its goal is met, not when the date is reached. Items can move between releases, update this file when they do.

## Overview

| Release | Theme | Target | Status |
|---------|-------|--------|--------|
| 0.7 | Ready for friends | week of 2026-11-16 | released 2026-11-16 |
| 0.8 | Austria | end of November 2026 | released 2026-11-16 |
| 0.9 | Core region, more waters and planning | November 2026 | released 2026-11-16 |
| 0.10 | More waters and depths (D22, D12) | | released 2026-11-17 |
| 0.11 | At the water | November 2026 | ready to release |
| 0.12 | Answers from the clubs | end of December 2026 | planned |
| 1.0 | Season 2027 | mid January 2027 | planned |
| later | Ideas without a date | | |

Already released: 0.1.0 to 0.10.0, see [CHANGELOG.md](../CHANGELOG.md).

Replanned on 2026-11-16: the old 0.9 (core region) and 0.10 (more waters) were done except for items that need a phone call or an answer from a club. Everything finished goes out as 0.9, together with F2, F5, F7 and F8 from "Later". The new 0.10 collects the open questions to the clubs.

Renumbered on 2026-11-19: 0.10.0 went out on 2026-11-17 with the D22 waters and the Tyrolean depths, not with the answers from the clubs. Those move to 0.12. 0.11 collects the features of 2026-11-18 and 2026-11-19.

## 0.7 Ready for friends

Goal: the link can be passed on to friends without worries.

- C4 Clean up the release tags (test tags `v0.6.1` and `v0.7.0` from trying out the release script) (done locally, check GitHub once)
- F1 "Karte heute noch" filter (done)
- C3 Run `npm test` in the deploy workflow (done)
- T4 Decide between password and unlisted link (decided: no password for now, unlisted link)

Done when the deploy runs the tests and a friend can open and use the map without explanation. F5 (share button) and F8 (report an error) were moved to "Later" on 2026-11-15.

## 0.8 Austria

Goal: the holiday regions Fernpass and Wilder Kaiser are on the map.

- D13 Research clubs and ticket offers, then waters with OSM outlines
- D15 Four more lakes around Kufstein and Kitzbühel (done), D16 the remaining lakes and the first rivers
- T6 Region switch Augsburg, Fernpass and Wilder Kaiser instead of one box from Augsburg to Tyrol (done)
- Waters with restricted or prohibited access shown correctly (done, e.g. Fernsteinsee as `restricted`)
- Austrian public holidays for the opening hours of sales points in Tyrol (done)

Done when the researched Austrian waters are in the data and the map stays usable around Augsburg.

## 0.9 Core region, more waters and planning

Goal: the core region is as complete as research without phone calls allows, the waters friends drive to are on the map, and the map helps to plan a trip.

Core region (Augsburg, Landkreis Augsburg, Aichach-Friedberg):

- D2 Friedberg guest rules for Paar and Friedberger Ach (done)
- D3 The 7 waters with `guestAccess: unknown` (done, no water left with `unknown`)
- D4 Bobingen prices (done)
- D5 Wehringen sales points (done)
- D6 Real extent of the placeholder stretches (done)
- D7 Fish species (done, 103 of 109 waters)
- F3 Fish species filter (done)
- D19 PFC warning for the Friedberger Ach (done)

More waters:

- D8 LFV waters Paar 3, Paar 4, Schmutter, Zusam (entered as placeholders)
- D9 Kirnach, Kringsee and the western ring of the 1. AAC (done)
- D10 Third research pass west of Augsburg: FV Großaitingen and Staudenfischereiverein (done)
- D18 Wilder Kaiser: Fischerverein Kössen and St. Anglwirt (done)

Features:

- F2 Plan for a date (done)
- F5 Share button (done)
- F7 Offline use (done)
- F8 Report an error (done)

Release with `npm run release:minor`.

## 0.11 At the water

Goal: the map helps on the way to the water and at the water, not only with the ticket.

- F9 Parking and access points, shown while a water is selected, with route links (done)
- D23 Parking for 31 lakes from OSM and for eight more waters from the club pages and Thomas (in progress, rest needs local knowledge)
- F17 Sunrise and sunset for the shown day (done, allowed fishing hours left out)
- F21 Favourites with the chip "Meine Gewässer" (done)
- F23 `npm run links` to check the external links (done)
- Landscape silhouettes on the region buttons (done)

Release with `npm run release:minor`.

## 0.12 Answers from the clubs

Goal: the open questions that research alone could not answer are settled. Mostly phone calls and mails.

- D14 Opening hours of Osetskiy, Fischerheim FV Friedberg and Holland Blumen
- D3 Walter-See: confirm with the club that guests may fish alone
- D8 Real limits for the LFV waters Paar 3, Paar 4, Schmutter and Zusam
- D21 Real limits for Neufnach, Kleine Mindel, St. Anglwirt and Fischteich Tannheimer Tal
- D20 Guest prices for Achensee, Haldensee, Lech Höfen, Bloderteich and Fischteich Tannheimer Tal, plus Kaiserweiher, Lech Scheuring and Zusam Roppeltshausen once hejfish shows them in spring (D22)
- D7 leftovers: species for Wertach Siebnach, Wertach and Rollweiher (Wehringen), Friedberger Ach Rehling, Rothsee, Fernsteinsee

Done when no placeholder geometry is left and every water open to guests has a guest price.

## 1.0 Season 2027

Goal: a stable version with the new prices at the turn of the year.

- D11 Check the 2027 prices of all clubs in January, switch Hintersee to guests with a member. Start with `npm run links`
- T3 Decide and document how the data is maintained (done 2026-11-17, plain files plus `docs/data-maintenance.md` and `npm run due`)
- Final pass over the acceptance criteria

### Acceptance criteria for 1.0

Status on 2026-11-16 in brackets.

- No water in the core region with `guestAccess: unknown` (met)
- No placeholder geometry left (8 left: Paar 3, Paar 4, Schmutter, Zusam, Neufnach, Kleine Mindel, St. Anglwirt, Fischteich Tannheimer Tal)
- `npm run validate` shows no warning for stale `lastChecked` dates (met)
- Every water open to guests has a guest price and at least one sales point or online purchase (8 without guest price, 5 in Tyrol plus Kaiserweiher, Lech Scheuring and Zusam Roppeltshausen, see D20. Singold Großaitingen and Singold Wehringen have no sales point, but guests can only fish them with a member and get the ticket from a private person, which is accepted)
- Tests run in the deploy workflow (met)

## Later

Ideas without a release yet. Pick from here when planning the next release after 1.0.

- F6 Water level and temperature (on hold, no browser-readable source, see backlog)
- F9 Parking and access points (code done 2026-11-18, data in D23)
- D23 Parking and access points for the waters
- D12 Maximum depth for the remaining lakes (Tyrol done 2026-11-17, the Bavarian club lakes need the clubs)
- D22 Remaining candidates (Bichlacher Angelteiche, Moorsee Söll, Baggersee Burg). The six hejfish waters near Fischach were added on 2026-11-16
- F17 Sun times and allowed fishing hours (added 2026-11-18, sun times done 2026-11-19, allowed hours open until a rule needs them)
- F18 No-fishing zones inside a water (added 2026-11-18)
- F19 "Was darf ich heute fangen?", closed seasons and minimum sizes per species (added 2026-11-18)
- F20 Legal requirements per region (added 2026-11-18)
- F21 Favourites (added 2026-11-18, done 2026-11-19)
- F22 Private notes or catch log (added 2026-11-18, open whether wanted)
- F23 Link check for the external links in the data (added 2026-11-18, done 2026-11-19 as `npm run links`)
- F24 Sort by guest price (added 2026-11-18)

## How releases are made

`npm run release:minor` bumps the version, regenerates the changelog, commits, tags and pushes (see `scripts/release.mjs`). The tree has to be clean. Every push to `main` deploys, so a release is mainly a version mark for the changelog and the version shown in the app.
