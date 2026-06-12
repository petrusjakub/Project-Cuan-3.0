/* ============================================================
   PASTIJAGA — LEAD GENERATION MODULE
   Pop-up CTA | Exit Intent | Contextual Messages
   ============================================================ */

(function () {
  'use strict';

  /* ── CONFIG ── */
  const WA_NUMBER = '6287781896087';
  const WA_BASE   = 'https://wa.me/' + WA_NUMBER + '?text=';

  const POPUP_CTA_KEY     = 'pc_popup_cta_shown';
  const EXIT_INTENT_KEY   = 'pc_exit_intent_shown';
  const POPUP_CTA_DAYS    = 7;
  const EXIT_INTENT_DAYS  = 3;

  /* Session flags */
  let popupCTATriggered  = false;
  let popupCTASubmitted  = false;
  let exitIntentShown    = false;

  /* ── CONTEXTUAL MESSAGES ── */
  const PAGE_MESSAGES = {
    '/pages/pap.html':                'Halo, saya tertarik dengan produk PAP (ProActive Plus). Bisa dibantu?',
    '/pages/miuhc.html':              'Halo, saya tertarik dengan produk MiUHC (MiUltimate HealthCare). Bisa konsultasi?',
    '/pages/mdsa.html':               'Halo, saya tertarik dengan produk MDSA (Dynamic Smart Assurance). Bisa konsultasi?',
    '/pages/mdla.html':               'Halo, saya tertarik dengan produk MDLA (Dynamic Life Assurance). Bisa dibantu?',
    '/pages/mdwa.html':               'Halo, saya tertarik dengan produk MDWA (Dynamic Wealth Assurance). Bisa konsultasi?',
    '/pages/mission.html':            'Halo, saya tertarik dengan produk MiSSION (MiSmart Insurance Solution). Bisa dibantu?',
    '/pages/mps-flexi.html':          'Halo, saya tertarik dengan produk MPS Flexi (Perlindungan Syariah). Bisa konsultasi?',
    '/pages/mccp.html':               'Halo, saya tertarik dengan produk MCCP (Critical Care Protection). Bisa konsultasi?',
    '/pages/mifip.html':              'Halo, saya tertarik dengan produk MiFiP (MiFuture Income Protector). Bisa dibantu?',
    '/pages/miprecious.html':         'Halo, saya tertarik dengan produk MiPrecious. Bisa konsultasi?',
    '/pages/msp.html':                'Halo, saya tertarik dengan produk MSP (Manulife Saving Protector). Bisa dibantu?',
    '/pages/mpds.html':               'Halo, saya tertarik dengan produk MPDS (Perlindungan Diri Syariah). Bisa konsultasi?',
    '/pages/mpps.html':               'Halo, saya tertarik dengan produk MPPS (Perlindungan Pendidikan Syariah). Bisa dibantu?',
    '/pages/magna-sehat-premium.html':'Halo, saya tertarik dengan Magna Sehat Premium. Bisa konsultasi?',
    '/pages/bisnis.html':             'Halo, saya tertarik dengan peluang bisnis agen asuransi. Bisa dibantu?',
    '/pages/rekrutmen-agen.html':     'Halo, saya tertarik untuk bergabung sebagai agen Manulife. Bisa dibantu?'
  };

  const DEFAULT_MESSAGE = 'Halo, saya dari website PastiJaga. Bisa konsultasi soal asuransi?';

  /* ── HELPERS ── */
  function getContextualMessage() {
    var path = window.location.pathname;
    return PAGE_MESSAGES[path] || DEFAULT_MESSAGE;
  }

  function isExpired(key, days) {
    var stored = localStorage.getItem(key);
    if (!stored) return true;
    var ts = parseInt(stored, 10);
    if (isNaN(ts)) return true;
    var elapsed = Date.now() - ts;
    return elapsed > days * 24 * 60 * 60 * 1000;
  }

  function markShown(key) {
    localStorage.setItem(key, Date.now().toString());
  }

  function buildWAUrl(nama, nomor) {
    var msg = 'Halo, nama saya ' + nama + ', nomor WA saya ' + nomor + '. Saya tertarik untuk konsultasi asuransi.';
    return WA_BASE + encodeURIComponent(msg);
  }

  /* ── INJECT STYLES ── */
  function injectStyles() {
    var css = [
      '/* Lead Gen Animations */',
      '@keyframes pcFadeIn { from { opacity: 0; } to { opacity: 1; } }',
      '@keyframes pcSlideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }',
      '',
      '/* Modal Overlay */',
      '.pc-modal-overlay {',
      '  position: fixed; inset: 0;',
      '  background: rgba(0,0,0,0.6);',
      '  z-index: 9999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  animation: pcFadeIn 0.3s ease;',
      '  padding: 16px;',
      '}',
      '',
      '/* Modal Box */',
      '.pc-modal-box {',
      '  max-width: 420px; width: 90%;',
      '  background: var(--bg-card, #fff);',
      '  border-radius: 20px;',
      '  padding: 32px;',
      '  box-shadow: 0 20px 60px rgba(0,0,0,0.3);',
      '  position: relative;',
      '  animation: pcSlideUp 0.4s ease;',
      '  color: var(--txt-head, #1a1a1a);',
      '}',
      '',
      '/* Dark Mode */',
      'html.dark .pc-modal-box {',
      '  background: #162638;',
      '  color: #DDE8F0;',
      '}',
      'html.dark .pc-modal-input {',
      '  background: #1e3248;',
      '  border-color: #2a4a6b;',
      '  color: #DDE8F0;',
      '}',
      '',
      '/* Close Button */',
      '.pc-modal-close {',
      '  position: absolute; top: 12px; right: 16px;',
      '  background: none; border: none;',
      '  font-size: 24px; cursor: pointer;',
      '  color: var(--txt-muted, #888);',
      '  line-height: 1; padding: 4px 8px;',
      '  border-radius: 8px;',
      '  transition: background 0.2s;',
      '}',
      '.pc-modal-close:hover { background: rgba(0,0,0,0.08); }',
      'html.dark .pc-modal-close:hover { background: rgba(255,255,255,0.08); }',
      '',
      '/* Modal Title */',
      '.pc-modal-title {',
      '  font-size: 20px; font-weight: 700;',
      '  margin-bottom: 8px; text-align: center;',
      '}',
      '.pc-modal-subtitle {',
      '  font-size: 14px; color: var(--txt-muted, #666);',
      '  margin-bottom: 20px; text-align: center;',
      '}',
      'html.dark .pc-modal-subtitle { color: #8fa8c8; }',
      '',
      '/* Form Inputs */',
      '.pc-modal-input {',
      '  width: 100%; padding: 12px;',
      '  border: 2px solid var(--border, #e0e0e0);',
      '  border-radius: 12px;',
      '  font-size: 15px;',
      '  margin-bottom: 12px;',
      '  background: var(--bg, #fff);',
      '  color: var(--txt-head, #1a1a1a);',
      '  box-sizing: border-box;',
      '  transition: border-color 0.2s;',
      '  outline: none;',
      '}',
      '.pc-modal-input:focus {',
      '  border-color: #00AC5B;',
      '}',
      '',
      '/* Submit Button */',
      '.pc-modal-submit {',
      '  width: 100%; padding: 14px;',
      '  background: #00AC5B; color: #fff;',
      '  border: none; border-radius: 12px;',
      '  font-size: 15px; font-weight: 700;',
      '  cursor: pointer;',
      '  margin-top: 4px;',
      '  transition: background 0.2s, transform 0.1s;',
      '}',
      '.pc-modal-submit:hover { background: #009a50; }',
      '.pc-modal-submit:active { transform: scale(0.98); }'
    ].join('\n');

    var style = document.createElement('style');
    style.id = 'pc-lead-gen-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── MODAL CREATION ── */
  function createModal(title, subtitle, onSubmit, onClose) {
    var overlay = document.createElement('div');
    overlay.className = 'pc-modal-overlay';

    var box = document.createElement('div');
    box.className = 'pc-modal-box';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'pc-modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Tutup');
    closeBtn.addEventListener('click', function () {
      overlay.remove();
      if (onClose) onClose();
    });

    var titleEl = document.createElement('div');
    titleEl.className = 'pc-modal-title';
    titleEl.textContent = title;

    var subtitleEl = document.createElement('div');
    subtitleEl.className = 'pc-modal-subtitle';
    subtitleEl.textContent = subtitle;

    var form = document.createElement('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nama  = form.querySelector('[name="nama"]').value.trim();
      var nomor = form.querySelector('[name="nomor"]').value.trim();
      if (!nama || !nomor) return;
      overlay.remove();
      if (onSubmit) onSubmit(nama, nomor);
    });

    var inputNama = document.createElement('input');
    inputNama.className = 'pc-modal-input';
    inputNama.type = 'text';
    inputNama.name = 'nama';
    inputNama.placeholder = 'Nama Anda';
    inputNama.required = true;

    var inputWA = document.createElement('input');
    inputWA.className = 'pc-modal-input';
    inputWA.type = 'tel';
    inputWA.name = 'nomor';
    inputWA.placeholder = 'Nomor WhatsApp (cth: 08123456789)';
    inputWA.required = true;
    inputWA.pattern = '08[0-9]{8,12}';
    inputWA.title = 'Masukkan nomor HP Indonesia yang valid (dimulai dengan 08, 10-14 digit)';

    var submitBtn = document.createElement('button');
    submitBtn.className = 'pc-modal-submit';
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Konsultasi via WhatsApp';

    form.appendChild(inputNama);
    form.appendChild(inputWA);
    form.appendChild(submitBtn);

    box.appendChild(closeBtn);
    box.appendChild(titleEl);
    box.appendChild(subtitleEl);
    box.appendChild(form);
    overlay.appendChild(box);

    // Close on overlay click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        overlay.remove();
        if (onClose) onClose();
      }
    });

    document.body.appendChild(overlay);
    inputNama.focus();
    return overlay;
  }

  /* ── 1. TIMED POP-UP CTA ── */
  function initTimedPopup() {
    if (!isExpired(POPUP_CTA_KEY, POPUP_CTA_DAYS)) return;

    setTimeout(function () {
      if (popupCTATriggered) return;
      popupCTATriggered = true;

      createModal(
        'Konsultasi Gratis!',
        'Isi data Anda untuk konsultasi asuransi langsung via WhatsApp.',
        function (nama, nomor) {
          popupCTASubmitted = true;
          markShown(POPUP_CTA_KEY);
          window.open(buildWAUrl(nama, nomor), '_blank');
        },
        function () {
          markShown(POPUP_CTA_KEY);
        }
      );
    }, 10000);
  }

  /* ── 2. EXIT INTENT POP-UP ── */
  function initExitIntent() {
    if (!isExpired(EXIT_INTENT_KEY, EXIT_INTENT_DAYS)) return;

    function showExitPopup() {
      if (exitIntentShown || popupCTATriggered || popupCTASubmitted) return;
      exitIntentShown = true;

      createModal(
        'Tunggu! Konsultasi GRATIS sebelum Anda pergi',
        'Jangan lewatkan kesempatan konsultasi gratis dengan agen profesional kami.',
        function (nama, nomor) {
          markShown(EXIT_INTENT_KEY);
          window.open(buildWAUrl(nama, nomor), '_blank');
        },
        function () {
          markShown(EXIT_INTENT_KEY);
        }
      );
    }

    // Desktop: mouse leaving viewport top
    document.addEventListener('mouseout', function (e) {
      if (e.clientY < 0) {
        showExitPopup();
      }
    });

    // Mobile: rapid scroll-up detection
    var lastScrollY   = window.scrollY;
    var lastTimestamp  = Date.now();
    var scrollingDown  = false;

    window.addEventListener('scroll', function () {
      var currentY = window.scrollY;
      var now      = Date.now();
      var diff     = lastScrollY - currentY;
      var timeDiff = now - lastTimestamp;

      // Only arm exit-intent after user has scrolled past 50% of page depth
      var pageHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrollPercent = pageHeight > 0 ? (currentY / pageHeight) : 0;
      var pastHalf = scrollPercent >= 0.5 || (lastScrollY / pageHeight) >= 0.5;

      // Detect if user was scrolling down then rapidly scrolls up
      if (diff < 0) {
        scrollingDown = true;
      } else if (scrollingDown && pastHalf && diff > 200 && timeDiff < 300) {
        // Rapid upward scroll after scrolling down past 50% depth
        showExitPopup();
      }

      lastScrollY  = currentY;
      lastTimestamp = now;
    }, { passive: true });
  }

  /* ── 3. UPDATE CONTEXTUAL MESSAGES ── */
  function updateContextualLinks() {
    var msg = getContextualMessage();
    var url = WA_BASE + encodeURIComponent(msg);

    // Update existing wa.me links on the page to use contextual messages
    // Skip links with data-no-override attribute to allow opt-out
    var links = document.querySelectorAll('a[href*="wa.me/' + WA_NUMBER + '"]:not([data-no-override])');
    links.forEach(function (link) {
      link.href = url;
    });
  }

  /* ── INIT ── */
  function initLeadGen() {
    injectStyles();
    initTimedPopup();
    initExitIntent();
    updateContextualLinks();
  }

  // Run when DOM is ready (script may be loaded dynamically)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeadGen);
  } else {
    initLeadGen();
  }

})();
