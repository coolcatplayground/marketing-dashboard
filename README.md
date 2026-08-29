# CoolCat Analytics Dashboard — Portfolio Demo

A single-page, static HTML/CSS/JS analytics dashboard, originally built for a
real e-commerce client and adapted here as a **public portfolio demo**.
Bilingual (日本語/English) throughout.

> **This is a demo build.** All data source URLs, the passcode gate, and the
> real Firestore project have been stripped out. Every number, chart, and
> insight you see is generated fictional sample data — nothing on this page
> talks to a real spreadsheet, GA4 property, or backend. See
> [What's different from the original](#whats-different-from-the-original-client-build)
> below for the full list of changes.

---

## 1. Data Sources

All four feeds are configured in `js/data.js`'s `CONFIG` object (near the
top of the file) as published-CSV URLs, and each has a dummy-data fallback
so the dashboard still renders sensibly if a feed is unreachable.

**In this demo build, `CONFIG` is intentionally left blank** — every feed
falls back to generated sample data (see `buildDummy*` functions in
`js/app.js`), so the dashboard always runs entirely on fictional numbers.

| Feed | Config key | Powers | Notes |
|---|---|---|---|
| GA4 daily rollup | `GA4_DAILY_CSV_URL` | Overview KPIs, Trend chart, Monthly Business Performance | date, users, sessions, purchases, revenue |
| GA4 sources | `GA4_SOURCES_CSV_URL` | Traffic Sources doughnuts/table, Session Source table, channel drill-down, channel trend chart, All Sources filter | date, sourceMedium, sessions, users, purchases, revenue |
| GA4 landing pages | `GA4_LANDING_PAGES_CSV_URL` | Top Landing Pages | Fixed 30-day window only (source data volume constraint) — date, landingPage, pageTitle, sessions, ecommercePurchases, totalRevenue |
| New/Repeat spreadsheet | `NEW_REPEAT_CSV_URL` | Monthly Business Performance (via business-month rollup), New vs Repeat chart/table/insights, AOV chart | Raw two-header-row sheet, parsed positionally — see `loadNewRepeat()` in `data.js` |

**"Business month" rule** (used for Monthly Business Performance): the 21st
of the previous calendar month through the 20th of the named month (e.g.
"Feb 2026" = 2026‑01‑21 → 2026‑02‑20). Implemented in `buildBusinessMonths()`.

**A "live vs. dummy data" warning banner** shows at the top of every tab if
any of the four feeds fails to load, naming exactly which section(s) are
showing demo data instead of real numbers. In this build it will always
show, since no feeds are configured — that's expected.

---

## 2. Feature Tour

### Overview tab
- KPI cards (Users, Sessions, Purchases, Revenue, CVR) vs. previous period
- Metrics Trend chart (multi-metric line chart, optional 7-day moving average)
- **Key Insights** — auto-generated, factual (no "you should…" suggestions):
  revenue/CVR change, top channel by revenue, `(not set)` attribution-gap
  share, anomaly detection (z-score based spike/drop vs. the period's own
  average)
- **Rising Landing Page** — a distinct, clickable insight (last item in the
  Key Insights list, separately styled) built from `buildRisingLandingPageInsight()`
  in `data.js`. Unlike the other Key Insights, this ignores the main
  date-range picker entirely: it always compares the most recent 7 days
  against the 7 days before that (content pages only — see
  `classifyLandingPageType`), and only fires when a page both (a) had
  ≥10 sessions the prior week (noise floor) and (b) at least doubled
  week-over-week. Only the single biggest riser is shown, to avoid a
  noisy list. Clicking it jumps to the Landing Pages tab and reveals a
  dismissible highlight panel with that one page's own 30-day daily-
  sessions mini chart (`renderLandingPageMiniChart()` in `charts.js`),
  with the single biggest day picked out in a different color — found
  via the same per-page z-score method as the Landing Pages tab's own
  spike insight, just always returning *a* day rather than only a
  statistically-extreme one.

### Traffic tab
- **Traffic Sources**: two doughnuts (current vs. previous period), grouped
  either by **Ad Platform** (Google/Meta/Yahoo/Criteo/etc., named-vendor
  detection) or **GA4 Channel** (Direct/Organic/Paid/Referral/etc.)
- **Click a channel** in the comparison table below the doughnuts to:
  1. Filter the Session Source table to just that channel's raw rows
  2. Swap both doughnuts for **one line chart** of that channel's current-
     period trend only (metric toggle: Sessions/Users/Purchases/Revenue/CVR).
- **Session Source / Medium** table — raw sourceMedium rows, Show All toggle
- **Top Landing Pages**:
  - Fixed 30-day window (independent of the main date-range picker)
  - PC/Smartphone device filter
  - **Click any page row** to open a dismissible detail panel — same
    underlying panel/mini-chart as the Overview "Rising Landing Page"
    insight's click-through (see above), but general-purpose: works for
    any page (content or system, rising or falling), scoped to whichever
    device filter is currently selected, and re-filters automatically if
    the device filter changes while it's open. Shows this-week-vs-last-week
    sessions (or "no data last week" if there's nothing to compare against)
    plus the page's 30-day daily-sessions mini chart with its single
    biggest day picked out. `buildLandingPageDetail()` in `data.js`;
    `renderLandingRisingPanel(insight, { generic: true })` in `ui.js` is
    what swaps the panel's "Rising Page Detected" framing for a neutral
    "Page Detail" label in this generic case.
  - **Page classification**: a page is "content" (kept) if its title contains
    a pipe delimiter (`｜` or `|`) separating item name from shop name — a
    site template convention for real product/content pages. Anything
    else (bare shop name, "X - shopname", "X / shopname", blank `(not set)`,
    checkout-flow titles) is "system" and hidden by default via the "Hide
    login/checkout/system pages" toggle.
  - Revenue/CVR are **not shown per page** — GA4 attributes a purchase to
    whichever page started the session, and a session-boundary reset
    mid-checkout can attribute it to the order-confirmation page itself
    rather than the actual driver. Sessions aren't affected by this, so
    that's the only metric shown, plus a per-row trend badge (half-window
    % change) and a Show All toggle.
  - Insights (separated visually into their own callout box): momentum
    (biggest half-window mover, rising/cooling), device mismatch (a page
    skewing hard toward one device vs. the overall split), and single-day
    spike detection (per-page z-score vs. that page's own daily average —
    rising only, drops intentionally not flagged here since a one-day dip
    on a low-traffic page is usually just noise)
- **All Sources filter**: scopes KPIs, Trend chart, Monthly Business
  Performance, and both traffic tables to one channel (built from the
  sources feed only, since that's the only feed with a channel dimension —
  New/Repeat and Landing Pages aren't affected by this filter)

### Sales tab (in this order)
1. Monthly Business Performance (business-month rollup table)
2. AOV Trend chart (Overall / New / Repeat customer AOV, line chart)
3. New/Repeat customers table (full history mirror of the raw spreadsheet)
4. New vs Repeat Customers chart (stacked bars + new-customer-share line)
5. New vs Repeat Insights (YoY new-customer share, repeat revenue share,
   AOV comparison, 3-month trend direction — all factual, no suggestions)

### Notes tab
- Designed to sync across devices/teammates via **Firestore** (`js/notes.js`)
  — in this demo build no Firestore project is configured, so the tab
  gracefully shows a "not configured" empty state instead of erroring
- Each note has an **author** (remembered per-device) and a **category**
  (General/Traffic/Sales/Product/Bug/Idea)
- **Archive** (default action, reversible, no confirmation) vs. **Delete
  Forever** (only reachable from the archived view, requires confirmation)

### Settings tab
- Dark theme toggle
- Language toggle (日本語/English) — applies instantly across every chart,
  table, insight sentence, and date/number format on the page
- Monthly Targets form exists in the markup but is currently paused/
  commented out (see `js/goals.js` and the note next to its `<script>`
  tag in `index.html`) — not wired up in this build

### Export
- **CSV** (`js/export.js`) — downloads the underlying raw numeric values
  (not display-formatted strings), so exports are directly usable in a
  spreadsheet
- **PDF** — no export library; `printCurrentView()` just calls
  `window.print()`, and `css/print.css` hides the sidebar/action buttons
  so the browser prints whichever tab is currently on screen, filters and
  charts included. Use the browser's own print dialog to "Save as PDF"

---

## 3. Bilingual Support (日本語/English)

- `js/i18n.js` holds the full dictionary (~200 keys, en/ja always kept in
  sync) plus `t()`, `channelLabel()`, `deviceLabel()`, `formatMonth()`,
  `formatDateTime()`, `applyStatic()`
- Internal classification keys (channel names, device names) stay in
  English internally — translation only happens at display time — so
  switching languages never breaks the click-to-filter drill-downs
- Every dynamically-generated insight sentence is built through the
  dictionary with `{placeholder}` interpolation, not hardcoded strings

---

## 4. Cache-Busting

Every local CSS/JS reference in `index.html` is loaded with a `?v=N` query
string. **Bump this number on every future update** to every `css/*.css`
and `js/*.js` reference — otherwise browsers may keep serving an old
cached copy of a file indefinitely, even after redeploying.

---

## 5. Firebase Setup (Notes + Monthly Targets)

The Notes tab is built to sync through Firestore, and `js/goals.js`
(Monthly Targets — currently unwired, see Settings tab above) shares the
same project. Both ship with placeholder (`REPLACE_ME`) config values, so
they run with no real database attached. To wire up your own:

1. Go to https://console.firebase.google.com → Add project.
2. Build → Firestore Database → Create database.
3. Firestore → Rules tab, scope access to the `notes` and `targets`
   collections:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if true;
    }
    match /targets/{docId} {
      allow read, write: if true;
    }
  }
}
```

4. Project settings → General → "Your apps" → Add app (Web) → paste the
   resulting `firebaseConfig` values into `FIREBASE_CONFIG` in both
   `js/notes.js` and `js/goals.js` (same project, same object).

Note: with open rules like the above, anyone with the dashboard link can
add/archive/delete notes or edit targets — fine for an internal team tool
behind a private link, not something to point at a public repo's live
database (which is exactly why this demo ships unconfigured).

---

## 6. File Structure

```
index.html
css/
  main.css        theme tokens, base layout
  layout.css      page structure, cards, notes, landing pages
  cards.css       KPI cards
  charts.css      chart containers, traffic doughnut/comparison styling
  tables.css      table styling
  dark.css        dark-theme overrides
  print.css       print/PDF-export stylesheet (media="print")
js/
  i18n.js         translation dictionary + helpers
  charts.js       all Chart.js rendering (trend, doughnuts, New/Repeat, AOV, channel-trend)
  ui.js           all DOM rendering/wiring (no data logic)
  data.js         all data loading/parsing/aggregation/classification (no DOM)
  notes.js        Firestore CRUD for Team Notes
  goals.js        Firestore CRUD for Monthly Targets (currently unwired — see Settings tab)
  export.js       CSV download + print-to-PDF helpers
  app.js          orchestration: loads data, wires UI callbacks together
```

`data.js` and `ui.js` are deliberately kept separate — `data.js` never
touches the DOM, `ui.js` never fetches/aggregates data. `app.js` is the only
file that calls both.

---

## What's different from the original client build

This repo is a sanitized copy of a dashboard originally built for a real
online shop. For this public portfolio version:

- **No real data source links.** All four `CONFIG` CSV URLs in `js/data.js`
  are blank, so every tab runs on generated sample data.
- **No passcode gate.** The original had a light client-side deterrent
  (`js/gate.js`) in front of the dashboard; it's been removed entirely here
  since there's nothing sensitive behind this version.
- **No real Firebase project.** `js/notes.js` and `js/goals.js` both ship
  with placeholder credentials (same underlying project in the original),
  so the Notes tab runs in its built-in "not configured" state and Monthly
  Targets — currently unwired anyway — has nothing real to connect to.
- **Fictional brand/content.** The dashboard is rebranded as "CoolCat" (a
  fictional pet-products shop), and the sample landing-page/product titles
  used to seed the dummy data are made up cat-themed content — the original
  client's name, product names, and real customer mentions have been
  replaced.
- **Richer sample traffic sources.** The dummy Traffic Sources data was
  expanded from ~20 to 32 source/medium combinations spanning organic and
  paid search, organic and paid social (including TikTok and YouTube),
  display, email, and referral, so the doughnuts/tables/channel drill-down
  have more realistic variety to show off.
- Everything else — the insight logic, the classification rules, the
  chart/table behavior, the CSV/PDF export, the print stylesheet — is
  unchanged, since that's the point of the demo. This version is kept in
  sync with the real project's latest style/feature updates each time a
  new export is sanitized.
