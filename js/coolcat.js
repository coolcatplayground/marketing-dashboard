/* ==========================================================
   CoolCat Analytics
   Portfolio layer: the cats, and a little motion

   Everything here is decoration on top of the dashboard; none of it
   changes a number. The illustrations (assets/*.webp) were painted
   with Codex in an ink-and-wash editorial style.

   • a vermilion seal mark beside the logo
   • a cat reading the paper, sitting on the briefing's bottom rule
   • when every feed is on demo data, the yellow "demo data" warning
     becomes a quiet portfolio note with a cat peeking over its edge
   • a cat asleep wherever a feature is switched off (notes, settings)
   • a cat strolling along the header on arrival and on Refresh
   • KPI figures count up to their new value instead of jumping

   All motion is skipped under prefers-reduced-motion.
========================================================== */

(function () {

    const reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const lang = () => (window.I18N ? window.I18N.getLang() : "ja");

    const TEXT = {
        ja: {
            demo: "ポートフォリオ用のデモです。数字はすべて架空の猫用品店「CoolCat」のもので、実在の企業データは含まれていません。",
            notes: "公開デモにはデータベースがないため、メモはお休み中です（社内版ではFirestoreでチーム全員に同期されます）。",
        },
        en: {
            demo: "Portfolio demo — every number comes from CoolCat, a fictional cat-supply shop. No real company data is included.",
            notes: "The public demo has no database, so notes are taking a nap. (Internally they sync across the team through Firestore.)",
        },
    };
    const tx = (k) => (TEXT[lang()] || TEXT.en)[k];

    function img(name, cls) {
        const el = document.createElement("img");
        el.src = `assets/${name}.webp`;
        el.className = `ccArt ${cls}`;
        el.alt = "";
        el.decoding = "async";
        el.setAttribute("aria-hidden", "true");
        return el;
    }

    /* ---------- seal mark ---------- */
    const logo = document.querySelector(".topbar .logo");
    if (logo && !logo.querySelector(".ccMark")) {
        logo.insertAdjacentHTML("afterbegin",
            `<svg class="ccMark" viewBox="0 0 24 24" aria-hidden="true">` +
            `<rect x="1" y="1" width="22" height="22" rx="5"/>` +
            `<path d="M6.2 9.4 6.6 5.2l3.3 2.5a7.4 7.4 0 0 1 4.2 0l3.3-2.5.4 4.2c.8 1.1 1.2 2.4 1.2 3.7 0 3.4-2.9 5.7-7 5.7s-7-2.3-7-5.7c0-1.3.4-2.6 1.2-3.7Z"/>` +
            `</svg>`);
    }

    /* ---------- the reader on the briefing rule ---------- */
    const brief = document.getElementById("brief");
    if (brief) brief.appendChild(img("cat-reading", "ccReader"));

    /* ---------- the walker along the header ---------- */
    const topbar = document.querySelector(".topbar");
    let walker = null;
    function stroll() {
        if (reduceMotion || !topbar) return;
        if (!walker) {
            // .ccWalk clips to the header, .ccStride carries the cat across, the cat itself bobs
            walker = document.createElement("div");
            walker.className = "ccWalk";
            walker.setAttribute("aria-hidden", "true");
            const stride = document.createElement("div");
            stride.className = "ccStride";
            stride.appendChild(img("cat-walk", "ccWalker"));
            walker.appendChild(stride);
            topbar.prepend(walker);
            walker.addEventListener("animationend", (e) => { if (e.animationName === "ccStroll") walker.classList.remove("isWalking"); });
        }
        walker.classList.remove("isWalking");
        void walker.offsetWidth;            // restart the animation
        walker.classList.add("isWalking");
    }
    const refreshBtn = document.getElementById("refreshBtn");
    if (refreshBtn) refreshBtn.addEventListener("click", stroll);
    window.addEventListener("load", () => {
        let seen = false;
        try {
            seen = sessionStorage.getItem("coolcat-strolled") === "1";
            sessionStorage.setItem("coolcat-strolled", "1");
        } catch (e) { /* storage off: stroll every load */ }
        if (!seen) setTimeout(stroll, 900);
    });

    /* ---------- strings the portfolio says differently ---------- */
    if (window.I18N) {
        const t = window.I18N.t;
        window.I18N.t = (key, vars) => (key === "notes.notConfigured" ? tx("notes") : t(key, vars));
    }

    /* ---------- the demo note, with a cat peeking over it ---------- */
    let lastWarning = null;
    function decorateWarning(status, states) {
        const el = document.getElementById("dataSourceWarning");
        const textEl = document.getElementById("dataSourceWarningText");
        if (!el || !textEl || !status) return;
        const allDemo = !!states && ["daily", "sources", "landingPages", "newRepeat"].every((k) => !status[k] && states[k] === "demo");
        el.classList.toggle("ccDemo", allDemo);
        if (!allDemo) return;
        textEl.textContent = tx("demo");
        if (!el.querySelector(".ccPeek")) {
            const peek = document.createElement("span");
            peek.className = "ccPeek";
            peek.appendChild(img("cat-peek", "ccPeeker"));
            el.appendChild(peek);
        }
    }
    const ui = window.CoolCat && window.CoolCat.ui;
    if (ui && ui.renderDataSourceWarning) {
        const render = ui.renderDataSourceWarning;
        ui.renderDataSourceWarning = function (status, states) {
            render.apply(this, arguments);
            lastWarning = [status, states];
            decorateWarning(status, states);
        };
    }
    const langSelect = document.getElementById("languageSelect");
    if (langSelect) langSelect.addEventListener("change", () => setTimeout(() => {
        if (lastWarning) decorateWarning(lastWarning[0], lastWarning[1]);
    }, 0));

    /* ---------- a sleeping cat where a feature is switched off ---------- */
    function napSpots() {
        document.querySelectorAll(".notesEmpty, .emptyState").forEach((el) => {
            if (el.querySelector(".ccNap")) return;
            el.classList.add("ccHasNap");
            el.prepend(img("cat-sleeping", "ccNap"));
        });
    }

    /* ---------- KPI figures count up ---------- */
    // "¥11.42M" → prefix ¥, 11.42, suffix M; "1,750"; "2.45%"
    const NUM = /^([^\d\-−]*?)([\-−]?)(\d[\d,]*(?:\.\d+)?)(.*)$/s;
    const written = new WeakMap();   // element -> the text we wrote ourselves
    const frames = new WeakMap();    // element -> running animation frame
    const shown = new Map();         // "vitals:revenue" -> last figure shown there
    function parse(text) {
        const m = NUM.exec(text.trim());
        if (!m) return null;
        const raw = m[3];
        const dot = raw.indexOf(".");
        return {
            prefix: m[1], suffix: m[4], minus: m[2] || "-",
            value: parseFloat(raw.replace(/,/g, "")) * (m[2] ? -1 : 1),
            decimals: dot < 0 ? 0 : raw.length - dot - 1,
            commas: raw.includes(","),
        };
    }
    function format(p, v) {
        let s = Math.abs(v).toFixed(p.decimals);
        if (p.commas) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return p.prefix + (v < 0 ? p.minus : "") + s + p.suffix;
    }
    function slotOf(el) {
        // the vitals are rebuilt on every render, so remember figures by slot, not by element
        const box = el.closest("section");
        const tile = el.closest("[data-vital]");
        const tiles = box ? [...box.querySelectorAll(".vitalValue")] : [];
        return `${box ? box.id : "?"}:${tile ? tile.dataset.vital : tiles.indexOf(el)}`;
    }
    function countUp(el) {
        const target = el.textContent;
        if (written.get(el) === target) return;
        const to = parse(target);
        if (!to) return;
        const slot = slotOf(el);
        const prev = shown.get(slot);
        shown.set(slot, to);
        if (reduceMotion) return;
        // only count between figures of the same unit and scale
        const from = prev && prev.prefix === to.prefix && prev.suffix === to.suffix ? prev.value : 0;
        if (from === to.value) return;
        cancelAnimationFrame(frames.get(el));
        const t0 = performance.now();
        const dur = prev ? 520 : 820;
        const step = (now) => {
            const k = Math.min(1, (now - t0) / dur);
            const e = 1 - Math.pow(1 - k, 3);
            const text = k < 1 ? format(to, from + (to.value - from) * e) : target;
            written.set(el, text);
            el.textContent = text;
            if (k < 1) frames.set(el, requestAnimationFrame(step));
        };
        frames.set(el, requestAnimationFrame(step));
    }

    const mo = new MutationObserver((records) => {
        const hits = new Set();
        let nap = false;
        records.forEach((r) => {
            const n = r.target.nodeType === 1 ? r.target : r.target.parentElement;
            const v = n && n.closest(".vitalValue");
            if (v) hits.add(v);
            r.addedNodes.forEach((a) => {
                if (a.nodeType !== 1) return;
                if (a.matches(".vitalValue")) hits.add(a);
                a.querySelectorAll(".vitalValue").forEach((x) => hits.add(x));
                if (a.matches(".notesEmpty, .emptyState") || a.querySelector(".notesEmpty, .emptyState")) nap = true;
            });
        });
        hits.forEach(countUp);
        if (nap) napSpots();
    });
    ["vitals", "adsVitals", "notesList"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) mo.observe(el, { childList: true, subtree: true, characterData: true });
    });
    napSpots();

})();
