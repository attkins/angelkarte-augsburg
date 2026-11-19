# Maintaining the data

How the data of the Angelkarte is kept up to date. Decided on 2026-11-17 (T3): the data stays in the plain files in `public/data/`, there is no editor and no spreadsheet in between. This file is the playbook for whoever does the next round, a person or Claude.

The schema is described in [data-schema.md](data-schema.md). What is still open lives in [backlog.md](backlog.md), when it ships in [roadmap.md](roadmap.md).

## The loop

1. Run `npm run due`. It lists what is worth a look: price lists that start soon, waters open for guests without guest price or without a way to buy the ticket, unclear guest access, placeholder geometry, sales points without opening hours or with approximate coordinates, and the waters that were checked longest ago. `node scripts/due.mjs 30` shows the 30 oldest instead of 10.
   Now and then, and always before the January round, also run `npm run links`. It checks every external link in the data (club websites, `source`, online purchase, depth sources, warning links) and lists the broken ones, the ones that only work through a redirect to another page, and the ones the server refuses to a script. A moved link usually means the club rebuilt its site, so the price list may have changed too. Refused links (HTTP 401, 403, 429) are often bot protection, open them in a browser before changing anything. `npm run links -- hejfish.com` checks only matching links, `--strict` ends with exit code 1 when a link is broken. Without network every link fails, the script then says so instead of listing them.
2. Pick a club rather than a single water. Club pages and price lists usually cover all waters of a club at once.
3. Check the sources (see below), change the files, set `lastChecked` to today on every water whose prices, rules or access you actually checked. Leave it alone when you only added a depth or fixed a typo.
4. Run `npm run validate` and `npm test`. The validator reports broken references and wrong formats as errors, placeholders and stale dates as warnings.
5. Commit with a Conventional Commit message, for example `feat(data): FV Bobingen prices 2027`. Every push to `main` deploys.

## Once a year in January

Most clubs publish new prices at the turn of the year (see D11).

- Start with `npm run links`, so dead price list links are found first.
- Go through every club in `clubs.json` and look for the new price list.
- A list that is known before it applies goes into `prices` with `validFrom`, the old one into `previousPrices`. The app switches on its own. Remove `previousPrices` once the validator says so.
- Check seasons and guest periods as well, some clubs move them.
- Prices on hejfish are often only visible in season. Waters that only sell there get their price in spring.

## Sources, best first

1. The club's own pages, price lists and Gewässerordnung (PDF). Put the URL into `source`.
2. hejfish pages of the water. Season, species, rules and the limits on the water map. Each marker on the hejfish map opens a popup with a Google Maps link that carries the exact coordinates of the limit.
3. Club maps such as the Google My Maps of the 1. AAC. Their "Obere Grenze" and "Untere Grenze" points work the same way.
4. Official sources for facts about the water itself, for example Land Tirol for lake depths.
5. Angling portals and forums only as a hint where to look, never as the source of a price or a rule.

When sources disagree, take the club. When nothing official exists, leave the field empty rather than guessing, and write down in the backlog what is missing.

## Geometry

- Lakes: the outline from OpenStreetMap. A Nominatim reverse lookup with `polygon_geojson=1` on a point inside the lake returns it directly, Overpass works as well.
- Rivers and streams: the OSM river line cut between the two limits. Find the nearest OSM nodes to both limit points and walk along the ways in between (the D6 and D9 work in the backlog describes this in detail). Compare the length with what the club states, it usually matches within a few hundred metres.
- Simplify lines and outlines to a few metres and round coordinates to 5 decimals. The files stay readable and small.
- `geometryStatus` is `traced` when the limits come from a club or hejfish, `placeholder` when they are a guess. Write the assumption into `accessNote` or the backlog so the next round knows what to check.

## Parking and access points

- `npm run access-candidates -- <water ids>` lists the OSM parking places near a water (default within 400 m, `--radius=600` for more), nearest first, each with a link to OSM and a ready-to-paste entry. `--missing` runs it for every water without access points. It needs the public Overpass API, one request per water with a short pause in between.
- The list is only a starting point. Supermarket and company car parks show up as well, the script marks those with `access=customers` or `private`. Check every candidate on the aerial images (Luftbild in the app) before copying it into `accessPoints`.
- Add the club's own parking hints when the water page names them, for example "Parken nur am Vereinsheim". They win over OSM.
- Access points (`type: access`) mostly come from the club pages or from people who know the water, OSM rarely has them.
- Keep it to the two or three places that matter. A list of every car park around a big lake helps nobody.

## Sales points

- Only shops, petrol stations, hotels and club huts become pins. Private persons who sell tickets from home are mentioned in `accessNote` of the water, with a pointer to the club page, but get no pin and no address.
- Coordinates from the address via Nominatim. If only the street is found, set `coordinatesApproximate: true`.
- Opening hours as rules (`days`, `open`, `close`, optional `months`). Holidays without `ph` rules are shown as unknown, so add `ph` only when the shop states its holiday hours.

## Wording

The texts are shown to anglers as they are, so they follow the house style of the app.

- German, short, written out. No "&", no semicolons.
- `rules` are short sentences. The fly fishing filter looks for "fliegen" in the rules, so use "Kunstköder" in rules that are not about fly fishing.
- Fish species as the source names them, with the preferred names Döbel, Wels and Flussbarsch. A new name that belongs to an existing group (another trout, for example) needs an entry in `src/utils/species.ts`.
- Health warnings such as the PFC warnings go into `warning` with a link to the authority, not into `accessNote`.

## Adding a club or water

- Club ids are short slugs (`fv-ettringen`), water ids start with a short club prefix (`fve-muehlbach-siebnach`). Ids end up in shared links, so never rename them once published.
- Copy an existing water of the same kind as a template and replace every field. The validator catches missing fields.
- Waters open only to members still get an entry when they are worth knowing, with `guestAccess: membersOnly`.
- Link the water from its sales points (`waterIds`) and add `onlinePurchase` when it is sold online.
