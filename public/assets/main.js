/* ============================================================
   PROJECT CUAN 2.0 — MAIN JS
   Dark Mode | Component Loader | Search | Scroll | Nav
   ============================================================ */

(function () {
  'use strict';

  /* ── CONFIG ── */
  const WA_NUMBER = '6287781896087';
  const INSTAGRAM = 'https://instagram.com/petrusjakub';
  const EMAIL     = 'petrusjakub.asn@gmail.com';

  /* ── PRODUCT INDEX (for search) ── */
  const PRODUCTS = [
    /* Kesehatan & Penyakit Kritis */
    { name: 'MiUHC',      full: 'MiUltimate HealthCare',                   cat: 'Kesehatan', icon: '🏥', url: '/pages/miuhc.html' },
    { name: 'MCCP',       full: 'Manulife Critical Care Protection',        cat: 'Kesehatan', icon: '💊', url: '/pages/mccp.html' },
    /* Jiwa & Perlindungan */
    { name: 'PAP',        full: 'ProActive Plus',                           cat: 'Jiwa',      icon: '🛡️', url: '/pages/pap.html' },
    { name: 'MDLA',       full: 'Manulife Dynamic Life Assurance',          cat: 'Jiwa',      icon: '❤️', url: '/pages/mdla.html' },
    { name: 'MDSA',       full: 'Manulife Dynamic Smart Assurance',         cat: 'Jiwa',      icon: '💡', url: '/pages/mdsa.html' },
    /* Dana Pensiun & Masa Depan */
    { name: 'MSP',        full: 'Manulife Saving Protector',                cat: 'Pensiun',   icon: '🌅', url: '/pages/msp.html' },
    { name: 'MiFiP',      full: 'MiFuture Income Protector',                cat: 'Pensiun',   icon: '📈', url: '/pages/mifip.html' },
    { name: 'MDWA',       full: 'Manulife Dynamic Wealth Assurance',        cat: 'Pensiun',   icon: '🌿', url: '/pages/mdwa.html' },
    { name: 'MiPrecious', full: 'MiPreparation Legacy for our Assurance',   cat: 'Pensiun',   icon: '💎', url: '/pages/miprecious.html' },
    /* Syariah */
    { name: 'MPS Flexi',  full: 'Manulife Perlindungan Syariah Flexi',      cat: 'Syariah',   icon: '☪️', url: '/pages/mps-flexi.html' },
    { name: 'MPPS',       full: 'Manulife Perlindungan Pendidikan Syariah', cat: 'Syariah',   icon: '📚', url: '/pages/mpps.html' },
    { name: 'MPDS',       full: 'Manulife Perlindungan Diri Syariah',       cat: 'Syariah',   icon: '🌙', url: '/pages/mpds.html' },
    /* Kombinasi */
    { name: 'MiSSION',    full: 'MiSmart Insurance Solution',               cat: 'Kombinasi', icon: '🎯', url: '/pages/mission.html' },
    /* Asuransi Umum */
    { name: 'Asuransi Mobil',      full: 'Proteksi Kendaraan Bermotor',  cat: 'Umum', icon: '🚗', url: '/pages/asuransi-mobil.html' },
    { name: 'Asuransi Properti',   full: 'Proteksi Rumah & Properti',    cat: 'Umum', icon: '🏠', url: '/pages/asuransi-properti.html' },
    { name: 'Asuransi Perjalanan', full: 'Proteksi Perjalanan & Wisata', cat: 'Umum', icon: '✈️', url: '/pages/asuransi-perjalanan.html' },
    { name: 'Asuransi Kumpulan',   full: 'Proteksi Kelompok/Korporat',  cat: 'Umum', icon: '👥', url: '/pages/asuransi-kumpulan.html' },
    /* Spesial */
    { name: 'Magna Sehat Premium', full: 'Asuransi Keluarga maks 5 orang, mulai 4jt/tahun', cat: 'Spesial', icon: '⭐', url: '/pages/magna-sehat-premium.html' },
    /* Info */
    { name: 'Tentang', full: 'Tentang Project Cuan & Agen', cat: 'Info', icon: 'ℹ️', url: '/pages/tentang.html' },
    { name: 'Bisnis',  full: 'Peluang Bisnis Asuransi',     cat: 'Info', icon: '💼', url: '/pages/bisnis.html' },
  ];


  /* ─────────────────────────────────
     1. COMPONENT LOADER
  ───────────────────────────────── */
  async function loadComponent(id, path) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('404');
      el.innerHTML = await res.text();
    } catch (e) {
      console.warn(`Component not loaded: ${path}`, e);
    }
  }

  /* ─────────────────────────────────
     2. DARK MODE
  ───────────────────────────────── */
  function initDarkMode() {
    const html   = document.documentElement;
    const stored = localStorage.getItem('pcTheme');
    const pref   = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && pref)) {
      html.classList.add('dark');
    }

    // Find toggle (may have been loaded via component)
    const toggle = document.getElementById('darkToggleInput');
    if (toggle) {
      toggle.checked = html.classList.contains('dark');
      toggle.addEventListener('change', () => {
        html.classList.toggle('dark', toggle.checked);
        localStorage.setItem('pcTheme', toggle.checked ? 'dark' : 'light');
      });
    }
  }

  /* ─────────────────────────────────
     3. HEADER SCROLL EFFECT
  ───────────────────────────────── */
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─────────────────────────────────
     4. HAMBURGER / MOBILE MENU
  ───────────────────────────────── */
  function initHamburger() {
    const btn  = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        btn.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Close on nav link click
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* ─────────────────────────────────
     5. SEARCH
  ───────────────────────────────── */
  function initSearch() {
    const overlay  = document.getElementById('searchOverlay');
    const input    = document.getElementById('searchInput');
    const results  = document.getElementById('searchResults');
    const openBtns = document.querySelectorAll('[data-search]');
    const closeBtn = document.getElementById('searchClose');
    if (!overlay || !input) return;

    function openSearch() {
      overlay.classList.add('open');
      setTimeout(() => input.focus(), 100);
      renderResults('');
    }

    function closeSearch() {
      overlay.classList.remove('open');
      input.value = '';
    }

    openBtns.forEach(b => b.addEventListener('click', openSearch));
    closeBtn && closeBtn.addEventListener('click', closeSearch);

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeSearch();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
    });

    input.addEventListener('input', () => renderResults(input.value));

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      const filtered = q
        ? PRODUCTS.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.full.toLowerCase().includes(q) ||
            p.cat.toLowerCase().includes(q))
        : PRODUCTS.slice(0, 8);

      results.innerHTML = filtered.length
        ? filtered.map(p => `
            <div class="search-result-item" onclick="location.href='${p.url}'">
              <div class="search-result-icon">${p.icon}</div>
              <div>
                <div class="search-result-name">${highlight(p.name, q)}</div>
                <div class="search-result-cat">${p.cat} · ${p.full}</div>
              </div>
            </div>`).join('')
        : `<div style="text-align:center;padding:24px;color:var(--txt-muted);font-size:var(--fs-sm)">
             Tidak ada hasil untuk "<strong>${query}</strong>"
           </div>`;
    }

    function highlight(text, q) {
      if (!q) return text;
      const re = new RegExp(`(${q})`, 'gi');
      return text.replace(re, `<mark style="background:var(--jade-10);color:var(--jade);border-radius:2px">$1</mark>`);
    }
  }

  /* ─────────────────────────────────
     6. SCROLL TO TOP / BOTTOM
  ───────────────────────────────── */
  function initScrollButtons() {
    const topBtn    = document.getElementById('scrollTop');
    const bottomBtn = document.getElementById('scrollBottom');
    const progress  = document.getElementById('scrollProgress');

    if (!topBtn && !bottomBtn) return;

    function update() {
      const scrolled = window.scrollY;
      const total    = document.body.scrollHeight - window.innerHeight;
      const pct      = total > 0 ? (scrolled / total) * 100 : 0;

      if (progress) progress.style.width = pct + '%';

      if (topBtn) topBtn.classList.toggle('visible', scrolled > 300);
      if (bottomBtn) bottomBtn.classList.toggle('visible', pct < 95);
    }

    window.addEventListener('scroll', update, { passive: true });
    update();

    topBtn    && topBtn.addEventListener('click',    () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    bottomBtn && bottomBtn.addEventListener('click', () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  }

  /* ─────────────────────────────────
     7. ACTIVE NAV LINK
  ───────────────────────────────── */
  function initActiveNav() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mega-link, .mobile-link, .footer-link').forEach(a => {
      const href = (a.getAttribute('href') || '').split('/').pop();
      if (href === current) a.classList.add('active');
    });
  }

  /* ─────────────────────────────────
     8. INTERSECTION OBSERVER (Fade Up)
  ───────────────────────────────── */
  function initFadeUp() {
    const els = document.querySelectorAll('.fade-up');
    if (!els.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────
     9. COUNT UP ANIMATION
  ───────────────────────────────── */
  function initCountUp() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el     = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const dec    = el.dataset.dec ? parseInt(el.dataset.dec) : 0;
        const dur    = 1800;
        const step   = 16;
        const inc    = target / (dur / step);
        let   curr   = 0;

        const timer = setInterval(() => {
          curr += inc;
          if (curr >= target) {
            curr = target;
            clearInterval(timer);
          }
          el.textContent = prefix + curr.toFixed(dec) + suffix;
        }, step);

        obs.unobserve(el);
      });
    }, { threshold: 0.5 });

    nums.forEach(n => obs.observe(n));
  }

  /* ─────────────────────────────────
     10. FAQ ACCORDION
  ───────────────────────────────── */
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const trigger = item.querySelector('.faq-trigger');
      if (!trigger) return;
      trigger.addEventListener('click', () => {
        const wasOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        // Toggle current
        if (!wasOpen) item.classList.add('open');
      });
    });
  }

  /* ─────────────────────────────────
     11. CATEGORY TAB FILTER
  ───────────────────────────────── */
  function initCatTabs() {
    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const parent = tab.closest('.cat-tabs');
        parent.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter  = tab.dataset.filter;
        const grid    = document.getElementById(tab.dataset.grid || 'productsGrid');
        if (!grid) return;

        grid.querySelectorAll('[data-cat]').forEach(card => {
          const match = filter === 'all' || card.dataset.cat === filter;
          card.style.display = match ? '' : 'none';
          if (match) {
            card.classList.remove('visible');
            requestAnimationFrame(() => card.classList.add('visible'));
          }
        });
      });
    });
  }

  /* ─────────────────────────────────
     12. PREMIUM CALCULATOR (generic)
  ───────────────────────────────── */
  window.PC = window.PC || {};

  window.PC.formatRp = (n) =>
    'Rp\u00A0' + Math.round(n).toLocaleString('id-ID');

  window.PC.hitungPremiGeneral = function (usia, gender, plan, baseRates) {
    const base        = baseRates[plan] || 0;
    const faktorUsia  = usia < 25 ? 0.85
                      : usia < 30 ? 1.00
                      : usia < 35 ? 1.18
                      : usia < 40 ? 1.40
                      : usia < 45 ? 1.70
                      : usia < 50 ? 2.10
                      : usia < 55 ? 2.60
                      :             3.20;
    const faktorGender = gender === 'wanita' ? 1.05 : 1.00;
    return Math.round((base * faktorUsia * faktorGender) / 12) * 12;
  };

  /* ─────────────────────────────────
     13. QUIZ / BISNIS PAGE
  ───────────────────────────────── */
  window.PC.initQuiz = function () {
    const steps    = document.querySelectorAll('.quiz-step');
    const bar      = document.getElementById('quizProgressBar');
    const counter  = document.getElementById('quizCounter');
    let   current  = 0;
    const answers  = {};

    function show(idx) {
      steps.forEach((s, i) => s.classList.toggle('active', i === idx));
      const pct = steps[idx] ? Math.round(((idx) / (steps.length - 1)) * 100) : 100;
      if (bar)     bar.style.width = pct + '%';
      if (counter) counter.textContent = `${Math.min(idx + 1, steps.length - 1)} / ${steps.length - 1}`;
    }

    show(0);

    document.querySelectorAll('.quiz-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const step    = steps[current];
        const selected = step ? step.querySelector('input[type=radio]:checked') : null;
        if (selected) answers[`q${current}`] = selected.value;

        if (current < steps.length - 1) {
          current++;
          show(current);
        }
      });
    });

    document.querySelectorAll('.quiz-back').forEach(btn => {
      btn.addEventListener('click', () => {
        if (current > 0) { current--; show(current); }
      });
    });
  };

  /* ─────────────────────────────────
     INIT
  ───────────────────────────────── */
  async function init() {
    // Load header & footer concurrently
    await Promise.all([
      loadComponent('site-header', '/components/header.html'),
      loadComponent('site-footer', '/components/footer.html'),
    ]);

    // Init all features (after components loaded)
    initDarkMode();
    initHeaderScroll();
    initHamburger();
    initSearch();
    initScrollButtons();
    initActiveNav();
    initFadeUp();
    initCountUp();
    initFAQ();
    initCatTabs();

    // Page-specific
    if (document.getElementById('quizStep0')) window.PC.initQuiz();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
