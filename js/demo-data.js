/* ==========================================================
   CoolCat Analytics
   Demo Store (portfolio build)

   The fictional cat-supply shop every tab runs on when no live feed
   is configured. One model produces all five feeds, so they agree
   with each other: the traffic sources add up to the daily totals,
   the landing pages add up to the sources, the Meta ad clicks are
   the Meta sessions, and the monthly new/repeat sheet is the daily
   orders summed by business month (21st–20th).

   Values are keyed to calendar dates, not to Math.random, so the
   same day shows the same numbers on every load; the window always
   ends today, so the demo never looks stale.

   What the data is built to show:
   • a weekly rhythm (Sunday evening shopping, LINE broadcasts on
     Tuesdays, the newsletter on Thursdays)
   • a year: 猫の日 (2/22), summer cooling goods, Black Friday, a
     December gift peak, January's 初売り then lull
   • a slow shift from Yahoo! search toward Instagram and AI assistants
   • Meta ads from about four months ago, which Meta credits with
     more purchases than the order system confirms
   • this week: an Instagram reel about the cat kotatsu, so lots of
     sessions on one page that convert poorly; and today, a LINE
     broadcast pushing the matatabi sticks
========================================================== */

window.CoolCatDemo = (function () {

    /* ---------- deterministic noise ---------- */

    function hash(str) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    // uniform 0..1 for a given key
    function u(key) {
        let t = (hash(key) + 0x6D2B79F5) | 0;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    // roughly normal, mean 0, sd 1
    function n(key) { return (u(key + "a") + u(key + "b") + u(key + "c") - 1.5) * 2; }
    // multiplicative noise around 1
    function wobble(key, sd) { return Math.exp(n(key) * sd); }

    /* ---------- dates ---------- */

    const pad = (v) => String(v).padStart(2, "0");
    const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    function addDays(d, k) { const x = new Date(d); x.setDate(x.getDate() + k); return x; }
    const HISTORY_DAYS = 900;

    /* ---------- the shop's year ---------- */

    // sessions by calendar month (smooth enough at this scale)
    const MONTH_TRAFFIC = [0.92, 1.00, 0.95, 0.96, 1.00, 1.05, 1.12, 1.08, 0.95, 0.99, 1.06, 1.24];
    const MONTH_AOV = [0.98, 1.03, 0.97, 0.97, 0.99, 1.00, 1.04, 1.02, 0.97, 0.98, 1.03, 1.17];
    // Sunday first
    const WEEKDAY = [1.13, 1.04, 1.00, 0.97, 0.96, 0.92, 1.01];

    // dated events: traffic, conversion and basket multipliers
    function calendarEvent(d) {
        const m = d.getMonth() + 1, day = d.getDate();
        if (m === 2 && day >= 15 && day <= 22) {
            const lift = day === 22 ? 1.9 : 1 + (day - 14) * 0.08;   // 猫の日 build-up
            return { traffic: lift, cvr: 1.25, aov: 1.08 };
        }
        if (m === 11 && day >= 21) return { traffic: 1.22, cvr: 1.25, aov: 1.05 };   // Black Friday
        if (m === 12 && day <= 24) return { traffic: 1.10, cvr: 1.15, aov: 1.05 };   // gifts
        if (m === 1 && day <= 4) return { traffic: 1.25, cvr: 1.2, aov: 1.0 };       // 初売り
        return { traffic: 1, cvr: 1, aov: 1 };
    }

    /* ---------- traffic sources ----------
       share: of sessions on an ordinary day at the start of the history
       cvr / aov: relative to the shop average
       trend(age, fromEnd): multiplier over time (age = days since start)
       campaigns: split the source's rows the way a campaign column would */

    const YEAR = 365;
    const SOURCES = [
        { sm: "google / organic", share: 0.27, cvr: 1.0, aov: 1.0 },
        { sm: "yahoo / organic", share: 0.10, cvr: 1.15, aov: 1.05, trend: (a) => Math.pow(0.82, a / YEAR) },
        { sm: "bing / organic", share: 0.02, cvr: 1.1, aov: 1.0 },
        { sm: "(direct) / (none)", share: 0.14, cvr: 1.55, aov: 1.08 },
        { sm: "google / cpc", share: 0.11, cvr: 1.3, aov: 1.0,
          campaigns: [["Brand_Search", 0.45], ["PMax_Shopping", 0.40], ["NonBrand_Search", 0.15]] },
        { sm: "yahoo / cpc", share: 0.035, cvr: 1.1, aov: 1.0, campaigns: [["Yahoo_Search", 1]] },
        { sm: "instagram / social", share: 0.06, cvr: 0.55, aov: 0.95, trend: (a) => Math.pow(1.35, a / YEAR) },
        { sm: "line / social", share: 0.045, cvr: 1.8, aov: 1.0 },
        { sm: "facebook / social", share: 0.012, cvr: 0.6, aov: 1.0, trend: (a) => Math.pow(0.85, a / YEAR) },
        { sm: "x.com / referral", share: 0.012, cvr: 0.5, aov: 0.95 },
        { sm: "tiktok / social", share: 0.004, cvr: 0.35, aov: 0.9, trend: (a) => Math.pow(2.2, a / YEAR) },
        { sm: "pinterest / social", share: 0.005, cvr: 0.6, aov: 1.0 },
        { sm: "youtube / organic", share: 0.008, cvr: 0.6, aov: 1.0 },
        { sm: "newsletter / email", share: 0.03, cvr: 2.2, aov: 1.12 },
        { sm: "criteo / display", share: 0.015, cvr: 0.7, aov: 1.0 },
        { sm: "note.com / referral", share: 0.008, cvr: 0.9, aov: 1.0 },
        { sm: "hatenablog.com / referral", share: 0.006, cvr: 0.8, aov: 1.0 },
        { sm: "ameblo.jp / referral", share: 0.006, cvr: 0.8, aov: 1.0 },
        { sm: "px.a8.net / referral", share: 0.008, cvr: 1.7, aov: 0.95 },
        { sm: "af.moshimo.com / referral", share: 0.004, cvr: 1.6, aov: 0.95 },
        { sm: "chatgpt.com / referral", share: 0.0015, cvr: 1.2, aov: 1.05, trend: (a) => Math.pow(4, a / YEAR) },
        { sm: "perplexity / (not set)", share: 0.0004, cvr: 1.2, aov: 1.05, trend: (a) => Math.pow(4, a / YEAR) },
        { sm: "mail.nifty.com / referral", share: 0.002, cvr: 1.5, aov: 1.0 },
        { sm: "coolcat-magazine.example / referral", share: 0.006, cvr: 1.1, aov: 1.0 },
        { sm: "p01.mul-pay.jp / referral", share: 0.004, cvr: 9.0, aov: 1.0 },
        { sm: "(not set) / (not set)", share: 0.006, cvr: 0.8, aov: 1.0 },
    ];
    const META_SOURCES = [["instagram / cpc", 0.7], ["facebook / cpc", 0.3]];

    const BASE_SESSIONS = 2350;       // an ordinary weekday at the start of the history
    const GROWTH = 1.16;              // per year
    const BASE_CVR = 0.024;
    const BASE_AOV = 6100;

    /* ---------- Meta ads ---------- */

    const ADS_START = 128;            // days before today
    const META_CAMPAIGNS = [
        { campaign: "LAL_Prospecting_給餌器", product: "自動給餌器", from: 128, spend: 9000, cpc: 62, ctr: 0.011, cvr: 0.014, newShare: 0.68, aov: 7400 },
        { campaign: "Retargeting_DPA", product: "カタログ（DPA）", from: 120, spend: 5000, cpc: 38, ctr: 0.016, cvr: 0.034, newShare: 0.24, aov: 6200 },
        { campaign: "IG_Reels_猫こたつ", product: "猫こたつ", from: 41, spend: 11000, cpc: 55, ctr: 0.013, cvr: 0.012, newShare: 0.72, aov: 8900 },
    ];

    function metaDay(d, fromEnd) {
        return META_CAMPAIGNS.filter((c) => fromEnd <= c.from).map((c) => {
            const key = iso(d) + c.campaign;
            const ramp = Math.min(1, (c.from - fromEnd + 1) / 21);           // three-week learning phase
            const lateBoost = fromEnd < 30 ? 1.35 : 1;                        // budget raised last month
            const spend = Math.round(c.spend * ramp * lateBoost * wobble(key + "s", 0.18));
            const clicks = Math.max(0, Math.round(spend / c.cpc * wobble(key + "c", 0.12)));
            const impressions = Math.round(clicks / (c.ctr * wobble(key + "t", 0.1)));
            const orders = Math.max(0, Math.round(clicks * c.cvr * wobble(key + "o", 0.45) - 0.2));
            const newOrders = Math.round(orders * c.newShare * wobble(key + "n", 0.15));
            const newO = Math.min(orders, newOrders);
            const repeatOrders = orders - newO;
            const per = c.aov * wobble(key + "a", 0.12);
            const newRevenue = Math.round(newO * per * 0.92);
            const repeatRevenue = Math.round(repeatOrders * per * 1.08);
            // Meta also counts view-through and cross-device purchases: well above confirmed orders
            const metaPurchases = Math.round(orders * 1.7 + clicks * 0.004 * u(key + "m"));
            // new customers from this day who have bought again since: it takes time, so the
            // last few weeks show only a handful (rounded by a hash so small days aren't always 0)
            const againRate = fromEnd > 2 ? 0.22 * Math.min(1, (fromEnd - 2) / 75) * wobble(key + "b", 0.3) : 0;
            const newBoughtAgain = Math.min(newO, Math.floor(newO * againRate + u(key + "r")));
            return {
                date: iso(d), platform: "Meta", campaign: c.campaign, product: c.product,
                spend, impressions, clicks, metaPurchases, orders, newOrders: newO, repeatOrders,
                revenue: newRevenue + repeatRevenue, newRevenue, repeatRevenue, newBoughtAgain,
            };
        });
    }

    /* ---------- one day of traffic, by source ---------- */

    function dayFactors(d, age, fromEnd) {
        const ev = calendarEvent(d);
        return {
            traffic: MONTH_TRAFFIC[d.getMonth()] * WEEKDAY[d.getDay()] * ev.traffic * Math.pow(GROWTH, age / YEAR),
            cvr: ev.cvr,
            aov: MONTH_AOV[d.getMonth()] * ev.aov,
            // today is still being counted
            partial: fromEnd === 0 ? Math.max(0.2, (new Date().getHours() + 1) / 24) : 1,
        };
    }

    // per-source multipliers for the dated stories
    function storyLift(sm, d, fromEnd) {
        const dow = d.getDay();
        if (sm === "line / social") {
            if (fromEnd === 0) return { traffic: 4.2, cvr: 1.1 };             // today's broadcast
            if (dow === 2) return { traffic: 2.6, cvr: 1.1 };                 // Tuesday broadcasts
        }
        if (sm === "newsletter / email" && dow === 4) return { traffic: 2.2, cvr: 1 };
        if (sm === "instagram / social" && fromEnd >= 1 && fromEnd <= 7) {
            // the kotatsu reel: up for a week, peaking two days ago, few buyers
            const shape = [0, 3.1, 4.6, 3.9, 3.0, 2.4, 1.9, 1.5][fromEnd];
            return { traffic: shape, cvr: 0.42 };
        }
        return { traffic: 1, cvr: 1 };
    }

    function sourceDay(d, age, fromEnd) {
        const f = dayFactors(d, age, fromEnd);
        const date = iso(d);
        const rows = [];
        const push = (sm, campaign, sessions, cvr, aov) => {
            sessions = Math.max(0, Math.round(sessions * f.partial));
            if (!sessions) return;
            const key = date + sm + (campaign || "");
            const purchases = Math.max(0, Math.round(sessions * Math.min(0.6, BASE_CVR * cvr * f.cvr) * wobble(key + "p", 0.2) - 0.3 + u(key + "r") * 0.6));
            const revenue = Math.round(purchases * BASE_AOV * aov * f.aov * wobble(key + "v", 0.08));
            const users = Math.max(1, Math.round(sessions * (0.74 + 0.08 * u(key + "u"))));
            rows.push({ sourceMedium: sm, date, sessions, users, purchases, revenue, channel: null, campaign: campaign || null });
        };
        SOURCES.forEach((s) => {
            const lift = storyLift(s.sm, d, fromEnd);
            const sessions = BASE_SESSIONS * s.share * f.traffic * (s.trend ? s.trend(age, fromEnd) : 1) * lift.traffic * wobble(date + s.sm, 0.12);
            if (s.campaigns) s.campaigns.forEach(([c, w]) => push(s.sm, c, sessions * w * wobble(date + c, 0.1), s.cvr * lift.cvr, s.aov));
            else push(s.sm, null, sessions, s.cvr * lift.cvr, s.aov);
        });
        // Meta ad clicks arrive as instagram / facebook cpc sessions; GA4 credits them with fewer
        // purchases than the order system does (last click elsewhere, other devices)
        metaDay(d, fromEnd).forEach((a) => META_SOURCES.forEach(([sm, w]) => {
            push(sm, a.campaign, a.clicks * 0.86 * w / f.partial, 0.42, 1.15);
        }));
        return rows;
    }

    /* ---------- landing pages (the last 45 days) ---------- */

    const SHOP = "CoolCat公式ショップWEB本店";
    const PAGES = [
        { lp: "/", title: "トップページ", w: 1.4, direct: 3 },
        { lp: "/smartphone/index.html", title: SHOP, w: 1.6, direct: 3 },
        { lp: "/smartphone/login.html", title: "会員ページログイン", w: 0.8, email: 4, line: 3 },
        { lp: "/smartphone/EntryOrderConfirm.html", title: "ご注文内容確認", w: 0.35 },
        { lp: "/smartphone/page78.html", title: "商品一覧 / " + SHOP, w: 0.9 },
        { lp: "/smartphone/detail.html", title: "ぬくぬく猫こたつ ヒーター付き｜" + SHOP, w: 0.7, social: 2, kotatsu: true },
        { lp: "/smartphone/detail.html", title: "自動給餌器 2Lタンク【特典付き】｜" + SHOP, w: 0.8, cpc: 2.5 },
        { lp: "/smartphone/detail.html", title: "またたびスティック 10本セット【2個購入で特典付き】｜" + SHOP, w: 0.6, line: 2.5, matatabi: true },
        { lp: "/smartphone/detail.html", title: "キャットタワー 木製 180cm｜" + SHOP, w: 0.55, cpc: 1.8 },
        { lp: "/smartphone/detail.html", title: "ミラクル猫砂 10L【定期便】｜" + SHOP, w: 0.65, email: 2 },
        { lp: "/shopdetail/000000002741", title: "【スタッフレビュー】うちの猫に使ってみました｜" + SHOP, w: 0.35, social: 1.5 },
        { lp: "/blog/cat-winter-care", title: "冬の猫の乾燥対策 5つのポイント｜CoolCat公式ブログ", w: 0.45, organic: 3 },
        { lp: "/blog/toy-guide-2026", title: "2026年 猫のおもちゃ選び方ガイド｜CoolCat公式ブログ", w: 0.35, organic: 3 },
        { lp: "/detail.html", title: "キャットタワー 木製 180cm｜" + SHOP, w: 0.3, pc: true, cpc: 1.5 },
        { lp: "/detail.html", title: "自動給餌器 2Lタンク【特典付き】｜" + SHOP, w: 0.25, pc: true, organic: 1.5 },
    ];

    function affinity(page, sm, fromEnd) {
        let a = page.w;
        if (/organic/.test(sm)) a *= page.organic || 1;
        if (/cpc|display/.test(sm)) a *= page.cpc || 1;
        if (/social|x\.com|tiktok/.test(sm)) a *= page.social || 1;
        if (/email|mail\./.test(sm)) a *= page.email || 1;
        if (/^line/.test(sm)) a *= page.line || 1;
        if (/direct/.test(sm)) a *= page.direct || 1;
        if (/mul-pay/.test(sm)) a = page.lp.includes("EntryOrderConfirm") ? 50 : 0.01;   // back from payment
        if (page.kotatsu && sm === "instagram / social" && fromEnd >= 1 && fromEnd <= 7) a *= 9;   // the reel
        if (page.kotatsu && sm === "instagram / cpc" && fromEnd <= 41) a *= 4;                      // the reel's ad
        if (page.matatabi && sm === "line / social" && fromEnd === 0) a *= 8;                       // today's broadcast
        return a;
    }

    function landingRowsFor(d, fromEnd, srcRows) {
        const date = iso(d);
        const out = [];
        srcRows.forEach((s) => {
            const weights = PAGES.map((p) => affinity(p, s.sourceMedium, fromEnd) * wobble(date + s.sourceMedium + p.title + p.lp, 0.25));
            const total = weights.reduce((a, b) => a + b, 0);
            PAGES.forEach((p, i) => {
                const share = weights[i] / total;
                const sessions = Math.floor(s.sessions * share);
                if (!sessions) return;
                const system = !/[｜|]/.test(p.title) && !/blog/.test(p.lp);
                out.push({
                    landingPage: p.lp, pageTitle: p.title,
                    device: p.pc ? "PC" : (u(date + p.title + s.sourceMedium + "dev") < 0.06 ? "Tablet" : (p.lp.startsWith("/smartphone/") ? "Smartphone" : "PC")),
                    pageType: null,        // filled by the data layer's own classifier
                    date, sourceMedium: s.sourceMedium, sessions,
                    purchases: system && !/EntryOrderConfirm/.test(p.lp) ? 0 : Math.floor(s.purchases * share),
                    revenue: system && !/EntryOrderConfirm/.test(p.lp) ? 0 : Math.floor(s.revenue * share),
                });
            });
        });
        return out;
    }

    /* ---------- build everything once ---------- */

    let cache = null;
    function build() {
        if (cache) return cache;
        const end = today();
        const start = addDays(end, -(HISTORY_DAYS - 1));
        const daily = [], sources = [], landing = [], ads = [];
        // the ads feed is refreshed weekly: it stops at the most recent Sunday
        const feedEnd = addDays(end, -((end.getDay() + 7) % 7 || 7));
        for (let i = 0; i < HISTORY_DAYS; i++) {
            const d = addDays(start, i);
            const fromEnd = HISTORY_DAYS - 1 - i;
            const rows = sourceDay(d, i, fromEnd);
            sources.push(...rows);
            daily.push(rows.reduce((t, r) => {
                t.users += r.users; t.sessions += r.sessions; t.purchases += r.purchases; t.revenue += r.revenue; return t;
            }, { date: iso(d), users: 0, sessions: 0, purchases: 0, revenue: 0 }));
            // GA4 users are de-duplicated across sources
            daily[daily.length - 1].users = Math.round(daily[daily.length - 1].users * 0.93);
            if (fromEnd < 45) landing.push(...landingRowsFor(d, fromEnd, rows));
            if (fromEnd <= ADS_START && d <= feedEnd) ads.push(...metaDay(d, fromEnd));
        }
        cache = { daily, sources, landing, ads };
        return cache;
    }

    /* ---------- the monthly new / repeat sheet ---------- */

    function newRepeat() {
        const { daily, ads } = build();
        const adNew = new Map();
        ads.forEach((a) => adNew.set(a.date, (adNew.get(a.date) || 0) + a.newOrders));
        const months = new Map();
        daily.forEach((r) => {
            const [y, m, dd] = r.date.split("-").map(Number);
            let year = y, month = m;               // business month: the 21st starts the next one
            if (dd >= 21) { month += 1; if (month > 12) { month = 1; year += 1; } }
            const k = year * 100 + month;
            if (!months.has(k)) months.set(k, { year, month, revenue: 0, orders: 0, users: 0, adNew: 0 });
            const b = months.get(k);
            b.revenue += r.revenue; b.orders += r.purchases; b.users += r.users; b.adNew += adNew.get(r.date) || 0;
        });
        const first = Math.min(...months.keys());
        return Array.from(months.values())
            .filter((b) => b.year * 100 + b.month !== first)          // the first month is only partly in the history
            .map((b) => {
                const key = `${b.year}-${b.month}`;
                // the order system sees a little more than GA4 (blocked trackers, phone orders keyed online)
                const totalOrders = Math.round(b.orders * 1.04);
                const totalRevenue = Math.round(b.revenue * 1.04);
                // new customers: a slow slide, gift months and 猫の日 bring newcomers, Meta ads add some back
                const ageYears = (b.year * 12 + b.month - Math.floor(first / 100) * 12 - (first % 100)) / 12;
                let share = 0.135 - 0.018 * ageYears + ({ 12: 0.045, 2: 0.025, 11: 0.015 }[b.month] || 0);
                let newOrders = Math.round(totalOrders * share * wobble(key + "n", 0.06)) + Math.round(b.adNew * 0.8);
                newOrders = Math.min(newOrders, totalOrders);
                const newAov = 0.86;            // first orders are smaller baskets
                const newRevenue = Math.round(totalRevenue * (newOrders / totalOrders) * newAov);
                const visitorsTotal = Math.round(b.users * 0.64);
                const visitorsPc = Math.round(visitorsTotal * (0.19 - 0.012 * ageYears));
                return {
                    year: b.year, month: b.month,
                    period: window.I18N ? window.I18N.formatMonth(b.year, b.month - 1) : `${b.year}-${pad(b.month)}`,
                    totalRevenue, totalOrders, newRevenue, newOrders,
                    repeatRevenue: totalRevenue - newRevenue, repeatOrders: totalOrders - newOrders,
                    visitorsPc, visitorsSp: visitorsTotal - visitorsPc, visitorsTotal,
                };
            });
    }

    // the data layer's own classifier fills pageType, as it does for live rows
    function landingPages() {
        const classify = window.CoolCat && window.CoolCat.data && window.CoolCat.data.classifyLandingPageType;
        return build().landing.map((r) => Object.assign({}, r, { pageType: classify ? classify(r.landingPage, r.pageTitle) : r.pageType }));
    }

    return {
        daily: () => build().daily.map((r) => Object.assign({}, r)),
        sources: () => build().sources.map((r) => Object.assign({}, r)),
        landingPages,
        newRepeat,
        adSpend: () => build().ads.map((r) => Object.assign({}, r)),
    };
})();
