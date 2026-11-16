// The demo store is one model behind five feeds, so the feeds have to agree
// with each other the way real exports would. Run with: node --test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadDemo() {
  const ctx = { window: {}, Math, Date, Object, Array, Map, Set, Number, String, JSON };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'demo-data.js'), 'utf8'), ctx);
  return ctx.window.CoolCatDemo;
}

const demo = loadDemo();
const daily = demo.daily();
const sources = demo.sources();
const landing = demo.landingPages();
const ads = demo.adSpend();
const months = demo.newRepeat();
const sum = (rows, k) => rows.reduce((t, r) => t + r[k], 0);
const byDate = (rows) => rows.reduce((m, r) => m.set(r.date, [...(m.get(r.date) || []), r]), new Map());
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

test('the daily feed ends today and is in date order', () => {
  assert.strictEqual(daily[daily.length - 1].date, iso(new Date()));
  for (let i = 1; i < daily.length; i++) assert.ok(daily[i - 1].date < daily[i].date);
});

test('traffic sources add up to the daily totals', () => {
  const src = byDate(sources);
  for (const d of daily) {
    const rows = src.get(d.date) || [];
    assert.strictEqual(sum(rows, 'sessions'), d.sessions, d.date + ' sessions');
    assert.strictEqual(sum(rows, 'purchases'), d.purchases, d.date + ' purchases');
    assert.strictEqual(sum(rows, 'revenue'), d.revenue, d.date + ' revenue');
  }
});

test('landing pages never claim more sessions than their source sent', () => {
  // a source can have several rows a day (google / cpc has one per campaign)
  const total = (rows) => rows.reduce((m, r) => {
    const k = r.date + '|' + r.sourceMedium;
    return m.set(k, (m.get(k) || 0) + r.sessions);
  }, new Map());
  const src = total(sources);
  const lp = total(landing);
  for (const [k, v] of lp) assert.ok(v <= (src.get(k) || 0), k);
});

test('the ads feed is consistent: Meta over-reports, new + repeat = orders, no future rows', () => {
  assert.ok(ads.length > 0);
  const today = iso(new Date());
  for (const r of ads) {
    assert.ok(r.date < today, 'ads feed is weekly, never today');
    assert.strictEqual(r.newOrders + r.repeatOrders, r.orders, r.date + ' ' + r.campaign);
    assert.ok(r.clicks <= r.impressions);
  }
  assert.ok(sum(ads, 'metaPurchases') > sum(ads, 'orders'), 'Meta credits itself with more purchases than the order system confirms');
});

test('the monthly sheet splits into new and repeat exactly', () => {
  assert.ok(months.length >= 24);
  for (const m of months) {
    assert.strictEqual(m.newOrders + m.repeatOrders, m.totalOrders, `${m.year}-${m.month}`);
    assert.strictEqual(m.newRevenue + m.repeatRevenue, m.totalRevenue, `${m.year}-${m.month}`);
    assert.strictEqual(m.visitorsPc + m.visitorsSp, m.visitorsTotal, `${m.year}-${m.month}`);
  }
});

test('the same day shows the same numbers on every load', () => {
  const again = loadDemo();
  assert.strictEqual(JSON.stringify(again.daily().slice(-60, -1)), JSON.stringify(daily.slice(-60, -1)));
  assert.strictEqual(JSON.stringify(again.adSpend().slice(0, 50)), JSON.stringify(ads.slice(0, 50)));
});

test('the numbers look like a small shop, not a random walk', () => {
  const last = daily.slice(-365);
  const revenue = sum(last, 'revenue');
  const orders = sum(last, 'purchases');
  const aov = revenue / orders;
  const cvr = orders / sum(last, 'sessions');
  assert.ok(revenue > 1.2e8 && revenue < 4e8, 'yearly revenue ' + revenue);
  assert.ok(aov > 5000 && aov < 8500, 'AOV ' + aov);
  assert.ok(cvr > 0.015 && cvr < 0.04, 'CVR ' + cvr);
});
