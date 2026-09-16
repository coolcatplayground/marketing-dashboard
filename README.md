# CoolCat Analytics Dashboard

### Did revenue move this week, and why?

An e-commerce marketing dashboard built for the team at my workplace, rebuilt here with a fictional cat-supply shop. It pulls four separate data exports into one bilingual (日本語 / English) page and, instead of leaving you to squint at charts, **writes out what changed** in plain sentences.

**[▶ Open the live demo](https://coolcatplayground.github.io/marketing-dashboard/)** — every number is generated sample data, so the yellow "demo data" banner always shows. That's intended.

---

## Field notes: the creature in the wild

The weekly marketing review ran on four exports that didn't talk to each other: daily GA4 totals, traffic by source, landing-page traffic, and a new-versus-repeat customer spreadsheet. Answering "did revenue move, and why?" meant opening all four, lining them up by hand across mismatched date formats, and rebuilding the same pivot table every single week.

The numbers were all there. The *reading* of them was the work, and it started from zero every time. This dashboard does that reading once, the same way every time, so the meeting starts from a written conclusion people can argue with instead of a blank pivot table.

## A tour of the rooms

**Overview.** Headline numbers (users, sessions, purchases, revenue, conversion rate) against a comparison period, a trend chart with an optional 7-day moving average, and **Key Insights**: short sentences about what changed, which channel led, and which days looked unusual.

- **Compare against the previous period or the same period last year.** Handy when a month is naturally busy, so this December is judged against last December rather than November.
- **Top Landing Pages Insights** is its own card now. It flags any page **spiking today or yesterday** compared with its usual day, plus the page that has risen the most over the past week. Biggest influx first, and a click opens that page's detail with the day's traffic sources.

**Traffic.** Where visitors came from this period versus last, grouped by ad platform or by channel. Click a channel to filter everything to it and see its trend. The landing-page table covers the last 30 days, splits PC from smartphone, and can hide system pages (cart, login and so on) that inflate the counts.

**Sales.** Performance by business month, average order value split into overall / new / repeat, and new-versus-repeat customers with the new-customer share over time.

**Notes.** A shared team notebook for writing down what actually happened ("magazine feature went out", "site was down Tuesday"). The demo has no database behind it, so this tab shows its not-yet-connected screen.

**Everywhere.** Full 日本語 / English switching, dark theme, CSV export, and a print layout for PDF.

## House rules

- **Some charts are deliberately missing.** GA4 credits a sale to the page where the visit *started*, so a visitor whose session resets mid-checkout gets credited to the order-confirmation page. Revenue per landing page would be a confidently wrong number, so the dashboard shows only sessions per page, which that problem doesn't affect.
- **"No data" never pretends to be "no change."** If the comparison period falls outside the available data (easy to do with same-period-last-year), the percentages say "N/A", the range bar shows a warning, and the insights skip every sentence that depends on the comparison. A silent "0.0%" would have been a lie.
- **Demo data announces itself.** Each of the four feeds falls back to sample data on its own, and a banner names exactly which sections are showing it. A dashboard that quietly shows made-up numbers is worse than one that refuses to load.
- **The month follows the business, not the calendar.** Monthly figures run from the 21st to the 20th, because that's the boundary the company's financial reporting already uses.
- **Insights state facts, not orders.** The sentences report what changed. They stop short of "you should…", because the dashboard doesn't know the commercial context behind the numbers, and pretending it did would undermine the parts it gets right.
- **Switching language never breaks a filter.** Channel names are translated only on screen, so an active filter keeps working when you switch languages mid-session.

## Construction

The questions, the metrics that are worth trusting, and the house rules above came from using this in real weekly reviews. The dashboard itself was built with generative AI under my direction.

This public version runs on generated sample data with a fictional brand. The internal version's data connections, passcode screen and team database are not included, and no company data appears anywhere in this repository.
