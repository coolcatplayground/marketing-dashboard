# CoolCat Analytics Dashboard

An e-commerce analytics dashboard that turns four raw data exports into a single
bilingual (日本語 / English) decision surface — KPIs, channel attribution, landing-page
performance, and new-vs-repeat customer economics — with written insights generated from
the numbers rather than left for the reader to infer.

Built as a working internal tool for an online shop, then sanitized into this public
portfolio build. Static HTML/CSS/JS: no framework, no bundler, no build step.

**[▶ Live demo](https://coolcatplayground.github.io/marketing-dashboard/)** · runs entirely
on generated sample data

---

## The problem it solves

The shop's weekly review ran on four disconnected exports: a GA4 daily rollup, a GA4
source breakdown, a GA4 landing-page report, and a new-vs-repeat customer spreadsheet.
Answering "did revenue move, and why" meant opening all four, aligning them by hand on
mismatched date conventions, and rebuilding the same pivot every week. The numbers existed;
the reading of them was the work, and it was redone from scratch every time.

This dashboard makes that reading reproducible. It ingests all four feeds, reconciles them
onto one date model, and writes the interpretation out as text — so the weekly review starts
from a stated conclusion that can be argued with, instead of from a blank pivot table.

## What it demonstrates

Data modelling across mismatched sources · analytical judgment about which metrics are
trustworthy · generated narrative insight rather than raw chart dumps · a bilingual
architecture that survives interactive filtering · graceful degradation when upstream
data fails · clean data/presentation separation in plain JavaScript.

---

## Selected engineering decisions

These are the choices worth reviewing — each one was a judgment call with a real tradeoff.

**Per-page revenue and CVR are deliberately not shown.** GA4 attributes a purchase to
whichever page *started* the session, so a session-boundary reset mid-checkout credits the
order-confirmation page rather than the page that actually drove the sale. Landing-page
revenue would therefore have been a confidently-rendered wrong number. Sessions are
unaffected by that failure mode, so sessions is the only per-page metric exposed, alongside
a half-window trend badge. Knowing which chart *not* to draw was the more valuable half of
this feature.

**Translation happens at display time, never in the data.** Channel and device values stay
canonical English internally; `i18n.js` (~200 keys, en/ja kept in sync) resolves them only
at render. Because the click-to-filter drill-downs match on the internal key rather than the
visible label, switching language mid-session never breaks an active filter — the bug that
this design exists to prevent.

**Failure is visible, not silent.** Each of the four feeds falls back independently to
generated sample data, and a banner names exactly which sections are showing demo numbers.
A dashboard that silently renders stale or fabricated figures is worse than one that
refuses to load, because nobody can tell the difference from the outside.

**The date model matches the business, not the calendar.** Monthly performance rolls up on
the shop's own "business month" — the 21st of the prior month through the 20th — because
that is the boundary their financial reporting already used. Aligning the tool to the
existing convention mattered more than the tidier calendar-month implementation.

**Insights are factual, never prescriptive.** Generated statements report what changed
(revenue and CVR deltas, top channel by revenue, `(not set)` attribution gap, z-score
anomalies against the period's own baseline). They stop short of "you should…" — the tool
does not have the commercial context to earn that sentence, and pretending otherwise erodes
trust in the numbers it *is* right about.

---

## Features

**Overview** — KPI cards versus previous period; multi-metric trend chart with optional
7-day moving average; generated Key Insights; a Rising Landing Page callout that ignores the
main date picker to always compare the last 7 days against the 7 before, firing only when a
page clears a noise floor and at least doubles week-over-week.

**Traffic** — current-vs-previous doughnuts grouped by ad platform or GA4 channel; click any
channel to filter the source table and swap both doughnuts for that channel's trend line;
raw source/medium table; 30-day landing-page table with PC/smartphone filtering, click-through
detail panels, and content-vs-system page classification.

**Sales** — business-month performance rollup; AOV trend split by overall / new / repeat;
new-vs-repeat stacked bars with new-customer-share line; full customer history table.

**Notes** — team notes synced through Firestore, with a built-in unconfigured state.

**Throughout** — full 日本語 / English switching, dark theme, CSV export, and a dedicated
print stylesheet for PDF output.

---

## Stack

Vanilla JavaScript, no framework or bundler. Chart.js for rendering, PapaParse for CSV,
Lucide for icons, Firebase compat SDK for the notes tab — all from CDN.

```
index.html
css/    main · layout · cards · charts · tables · dark · print
js/
  data.js     loading, parsing, aggregation, classification — never touches the DOM
  ui.js       all DOM rendering and wiring — never fetches or aggregates
  charts.js   Chart.js rendering
  i18n.js     en/ja dictionary and formatting helpers
  notes.js    Firestore CRUD
  goals.js    monthly targets (Firestore, currently unwired)
  export.js   CSV download and print-to-PDF
  app.js      orchestration — the only file that calls both data and ui
```

`data.js` and `ui.js` are strictly separated so the analysis layer stays testable and the
rendering layer stays swappable. `app.js` is the single seam between them.

## Run it locally

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

---

## About this build

This is a sanitized copy of a tool built for a real client. The original's data-source URLs,
passcode gate, and Firebase project have been removed; the brand is fictional and all
product and landing-page names are invented. Every figure on the page is generated sample
data — nothing here reaches a real spreadsheet, GA4 property, or backend. The warning banner
therefore always shows, which is the intended behaviour.

The analysis logic, classification rules, chart and table behaviour, export paths, and print
stylesheet are unchanged from the production build, since those are the point of the demo.

<details>
<summary><b>Wiring it to real data</b></summary>

Four published-CSV URLs go in the `CONFIG` object at the top of `js/data.js`
(`GA4_DAILY_CSV_URL`, `GA4_SOURCES_CSV_URL`, `GA4_LANDING_PAGES_CSV_URL`,
`NEW_REPEAT_CSV_URL`). Publish each sheet via File → Share → Publish to web → CSV, and match
the columns documented above each loader function. Any feed left blank falls back to sample
data.

The Notes tab needs a Firestore project: create one, add a web app, and paste the config into
`FIREBASE_CONFIG` in both `js/notes.js` and `js/goals.js`. Scope the rules to the `notes` and
`targets` collections — and note that permissive rules leave anyone with the link able to
write, which is acceptable for an internal tool behind a private URL and not acceptable for a
public deployment.

Local CSS/JS references carry a `?v=N` cache-busting query string. Bump it on every deploy or
browsers will serve stale files indefinitely.

</details>
