# Tiny Landlord — website

The one site for the whole Tiny Landlord family, three Android games by
eiilo games. **All three games are presented as released** (since
2026-10-29): "Out now on Android", a Google Play badge in each hero and
About section, a "Get it on Google Play" button in each header and a
"Get it" button on each family-list card, and download buttons for all
three in the footer. The Tycoon page also has screenshots with a
full-screen viewer. One privacy policy per app for Google Play and AdMob
(each covers its in-app purchases). No playable port. Each Play link
404s until that app reaches production, which is expected (playbook §11).

Plain static files, no build step, no third-party requests.

## One franchise, one site (rule)

Every Tiny Landlord game lives on this site, one **path** per game.
Paths are preferred over subdomains: one domain to buy, one DNS zone, one
GitHub Pages repo, one Search Console property, and every page shares the
domain's trust and links. A new game in the series gets a new folder here,
not a new domain or a `<game>.tiny-landlord.com` subdomain.

| Path | Game (repo) | Package | Privacy policy |
|---|---|---|---|
| `/` | Tiny Landlord, the classic (`../tiny-landlord`) | `com.eiilo.games.tinylandlord` | `/privacy/` |
| `/tycoon/` | Tiny Landlord: Tycoon (`../tiny-landlord-tycoon`) | `com.eiilo.games.tinylandlord.tycoon` | `/tycoon/privacy/` |
| `/idle/` | Tiny Landlord: Idle (`../tiny-landlord-idle`) | `com.eiilo.games.tinylandlord.idle` | `/idle/privacy/` |

- The root is both the classic game's page and the family hub: its
  "The Tiny Landlord games" section (`/#games`) lists all three, and its
  hero has a "New: Tycoon is out" link.
- Every game page ends with the same family list, and every policy links
  the other two.

## Navigation (the same three blocks on every page)

1. **Games bar** (`<nav class="games" id="top">`, dark): the three games
   with their icons. The current game is `aria-current="page"` on its own
   page and `aria-current="true"` on its policy.
2. **Page header** (`<header class="top">`, sticky): the game's brand, the
   page's section links (`<nav class="sections">`, in-page `#anchors` plus
   Privacy) and the game's small `.get` Google Play button (on its page
   and its policy). On phones the section links are one row that scrolls sideways.
   `nav.js` keeps anchors below the sticky header (`--header-h`) and marks
   the section being read (`aria-current="location"`).
3. **Footer** (dark): the games, the three privacy policies, a download
   button per game, contact, "Back to the top" (`#top`) and Google's trademark line (required
   next to the badge).

A new page or game copies all three from an existing page. A new section
on a game page gets a link in its header's `.sections`.
- **One `app-ads.txt` at the root serves all three apps** (same AdMob
  publisher). AdMob reads it from the developer website's root, so all
  three Play listings use `https://tiny-landlord.com` as the website.
- JSON-LD: the root defines the shared `WebSite` (`/#website`) and
  `Organization` (`/#eiilo`); each game page has a `WebPage` that
  `isPartOf` the website and one `["VideoGame", "MobileApplication"]`
  (`/tycoon/#game`, `/idle/#game`) authored and published by `/#eiilo`.
- Each page uses its own game's favicon and share image.

```
index.html                  classic game + family hub: hero, the game, the stats, about, the Tiny Landlord games
privacy/index.html          classic policy, served at /privacy/
tycoon/index.html           Tiny Landlord: Tycoon (released): hero, screenshots, the game, the city, every day, endings, free to play, about
tycoon/privacy/index.html   Tycoon policy, served at /tycoon/privacy/
idle/index.html             Tiny Landlord: Idle coming-soon page
idle/privacy/index.html     Idle policy, served at /idle/privacy/
404.html                    not-found page (noindex), lists the three games
style.css                   one stylesheet for every page
nav.js                      sticky-header anchor offset and the section highlight (every page)
lightbox.js                 screenshot viewer, copied from mooddude.app: each .shots link opens a swipeable full-screen carousel
img/                        per-game icons, the Tycoon's screenshots and share card, google-play.png (see "Art" below)
tools/build-art.sh          rebuilds the game images from the game repos (--capture re-renders the Tycoon's first)
tools/mobile-check.mjs      the playbook §11 phone check on all seven pages
tools/policy.mjs            privacy policy versions: list, date (first publication), new, check
app-ads.txt                 AdMob authorised-seller line for all three apps (same eiilo publisher as the other games)
robots.txt, sitemap.xml, CNAME, .nojekyll
```

## IMPORTANT: the domain is a candidate

**`tiny-landlord.com` is NOT purchased yet** (still not in the OVH
account on 2026-10-29, so there is no DNS zone to set up). It is written into `CNAME`,
every `canonical`/OG URL, the sitemap, robots.txt, the three privacy
policies and the `hello@tiny-landlord.com` addresses. Confirm it is still
available, buy it at OVH, and set up e-mail forwarding for `hello@`
**before deploying**; if a different domain is chosen, search-and-replace
`tiny-landlord.com` across this repo and the three games' `RELEASE.md`
first.

## Art

Every game image comes from the game repos, by one command:

```sh
tools/build-art.sh              # convert what is in the games' store/ folders
tools/build-art.sh --capture    # first re-render the Tycoon's Play screenshots and feature graphic from the current game
```

- Icons: each game's `store/general/icon_512.png` (the Play listing icon)
  as `img/<game>-icon-512.png` (JSON-LD), `-180.png` (apple-touch-icon,
  hero, games bar, family list) and `-32.png` (favicon).
- Tycoon screenshots: the Play listing's `store/screenshots/[1-7]_*.png`
  (rendered by the game's `store/screenshots/capture.gd`, fixed seed) as
  `img/tycoon-shot-N.webp` (1080x1920, opened by the viewer) and
  `img/tycoon-shot-N-sm.webp` (360x640, the strip and the hero's srcset).
  If the listing's shots change in number or content, update the
  `.shots` captions and alt texts, the JSON-LD `screenshot` list and the
  sitemap's `image:image` entries.
- `img/social-tycoon.png`: the Tycoon's 1200x630 share card, the Play
  feature graphic scaled to 630 px high and centre-cropped (smooth art, no
  `-filter point`).
- `img/google-play.png`: Google's official badge (270x80), copied from
  mooddude.app. Google's trademark line is in every footer.

Run the game capture with nothing else needing the display; it uses a
throwaway save and trophy store, so the player's files are never touched.

## TODO before deploy

- [ ] Buy the domain (above) and set up `hello@` forwarding to an inbox
      you read.
- [ ] Date each privacy policy before its URL goes into Play Console /
      AdMob: `node tools/policy.mjs date <classic|tycoon|idle> <YYYY-MM-DD>`
      (see "Privacy policies" below). Before that, fix or accept the open
      points listed there.
- [ ] Create the remaining 1200x630 PNG share cards and keep their
      source: `img/social.png` (classic) and `img/social-idle.png`
      (`img/social-tycoon.png` is done, by `tools/build-art.sh`). Each game's `store/general/feature_graphic.png`
      (1024x500, smooth art) can be cropped with the playbook recipe, e.g.
      `magick ../tiny-landlord-tycoon/store/general/feature_graphic.png -resize x630 -gravity center -crop 1200x630+0+0 +repage -strip img/social-tycoon.png`,
      or crop a screenshot
      (`magick shot.png -resize 1200x800 -gravity south -crop 1200x630+0+0 +repage -strip img/social.png`),
      or build a designed card as `tools/og-card.html` + headless Chromium
      (see `../../Shipped/cute-shooter-landing-page/README.md`). Keep the
      command or HTML in this README.
- [ ] Screenshots on the classic and Idle pages once their store
      screenshots are final, the Tycoon's way (`.shots` strip,
      `lightbox.js`, JSON-LD `screenshot`, sitemap `image:image`).
- [ ] Mobile check at 320, 390 and 412 px wide before every deploy:
      `tools/mobile-check.mjs` (usage in its header) fails on sideways
      scroll, a broken image or a tap target under 44 px. Last passed
      2026-10-29 on all seven pages. Look at its screenshots too.
- [ ] Validate: `xmllint --noout sitemap.xml`, parse the JSON-LD on every
      page, `node tools/policy.mjs check`. Bump `lastmod` in the sitemap
      whenever a page changes.

## Privacy policies

One policy per game, at the URL its Play listing links:
`/privacy/` (Tiny Landlord), `/tycoon/privacy/` and `/idle/privacy/`.
Each was checked line by line against its game's code on 2026-10-29
(save files, ads.gd, the consent flow, the Firebase plugin, play_services.gd,
store.gd and the merged Android manifest) and rewritten to match.

**Versions** (`tools/policy.mjs`, adapted from mooddude.app's). In each
policy folder, `index.html` is the version in effect and
`<YYYY-MM-DD>.html` is each earlier version, named by the date it took
effect; old versions are never deleted.

```sh
node tools/policy.mjs list                                  # each policy, its date, its past versions
node tools/policy.mjs date tycoon 2026-11-01                # first publication: sets the first effective date
node tools/policy.mjs new tycoon 2026-12-01 "Added crash reporting."   # every change after that
node tools/policy.mjs check                                 # before every deploy (--draft while some are undated)
```

- Until `date`, a policy reads "Not yet published" and may be edited in
  place. Run `date` when its URL first goes into Play Console / AdMob.
- After that, never edit a policy in place. `new` archives the current
  page (`noindex`, no canonical or `og:url`, an "old version" notice with
  its dates and a link to the current one), moves `index.html` to the new
  date, adds a row on top of its "Changes and past versions" table and
  bumps the sitemap. Then edit `index.html` with the new wording and run
  `check`.
- Publish the new version before the app version that needs it ships, and
  update that app's Data safety form in Play Console to match.
- Keep the markers the tool relies on: `<p class="date"><time
  class="effective" datetime="…">`, `<tbody data-versions>` and the one
  `<tr data-current>` row.

**What would need a new version** (each policy describes the code as of
2026-10-29): new SDKs or plugins (crash reporting, another ad network,
mediation, notifications, cloud saves); new data in the save; new
products; a change to ad placements, the consent flow or the Play Games
features; and any code fix below that changes behaviour the policy
describes.

**Open points to decide before dating the policies** (found in the code
audit; the policies describe the code as it is):

- **Consent fallback (all three games, and the shipped games' `ads.gd`
  too):** the 8 s `CONSENT_TIMEOUT` starts the ads SDK even while the
  consent form is still on screen, and after a failed consent request.
  The policies now say so. Fixing it (cancel the timer once the form
  shows, check `can_request_ads`) is better, and would need the
  consent paragraph changed back.
- **Remove Ads still loads ads in the background** (`_on_sdk_ready` loads
  the interstitial and rewarded ads without a `no_ads()` check). The
  policies say so; skipping those loads is a one-line fix per game.
- **Firebase is not in any build yet:** each game needs its
  `google-services.json` (RELEASE.md) before the "Usage statistics"
  section is true. No consent-mode defaults are set, so Firebase counts
  the first launch before the consent form; the policies say so.
- **No in-app link to the policy.** Play's User Data policy expects one;
  the Settings or Credits screen could link it.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Links are root-absolute (`/privacy/`, `/style.css`), so the site must be
served from the root of a domain.

## Deploy (GitHub Pages)

No build step: what is in `main` is what is served.

1. Push to a public repository `eiilo-games/tiny-landlord-landing-page`.
2. Settings > Pages > Build and deployment: Source "Deploy from a branch",
   branch `main`, folder `/ (root)`.
3. Custom domain: `tiny-landlord.com` (already in `CNAME`). Once the DNS
   below resolves and the certificate is issued, tick **Enforce HTTPS**.
4. Verify the domain for the organisation, so no other GitHub account can
   claim it: org Settings > Pages > Verified domains > Add a domain, then
   add the `_github-pages-challenge-eiilo-games` TXT record it shows at
   OVH and click Verify.

DNS at OVH (Web Cloud > Domain names > `tiny-landlord.com` > DNS zone):

| Host  | Type  | Target                   |
|-------|-------|--------------------------|
| (apex)| A     | `185.199.108.153`        |
| (apex)| A     | `185.199.109.153`        |
| (apex)| A     | `185.199.110.153`        |
| (apex)| A     | `185.199.111.153`        |
| (apex)| AAAA  | `2606:50c0:8000::153`    |
| (apex)| AAAA  | `2606:50c0:8001::153`    |
| (apex)| AAAA  | `2606:50c0:8002::153`    |
| (apex)| AAAA  | `2606:50c0:8003::153`    |
| `www` | CNAME | `eiilo-games.github.io.` |

Delete OVH's default apex A record (`213.186.33.5`) and any default `www`
record (A, AAAA or CNAME) first; leftovers break the certificate. GitHub
redirects `www.tiny-landlord.com` to the apex.

## After it is live (day one)

- **Search Console**: add a Domain property for `tiny-landlord.com` (DNS TXT
  record at OVH; it covers every path), submit `sitemap.xml` the same day,
  then URL-inspect `/`, `/tycoon/`, `/idle/` and the three privacy pages and
  click **Request indexing**. Pre-launch 404 entries: click **Validate
  fix** once live (playbook §11).
- Same in Bing Webmaster Tools (import from Search Console).
- **Link this site from eiilo.com** (all three game pages) — that is how
  Google discovers and trusts a new game domain.
- In Play Console, for each of the three apps (once it exists), set the
  developer website to `https://tiny-landlord.com` (AdMob checks
  `https://tiny-landlord.com/app-ads.txt`, at the root, for all three) and
  the privacy policy to that app's own URL: `/privacy/`, `/tycoon/privacy/`
  or `/idle/privacy/`. Use the same URL in AdMob and keep each app's Data
  safety form in line with its policy.
- After any `img/social*.png` ever changes, re-scrape that page in
  Facebook's Sharing Debugger; chat apps cache the old one.
