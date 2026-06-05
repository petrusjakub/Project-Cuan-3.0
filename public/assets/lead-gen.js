/* ============================================================
   PROJECT CUAN — LEAD GENERATION MODULE
   Pop-up CTA | Exit Intent | Floating Bar | Contextual Messages
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

  const DEFAULT_MESSAGE = 'Halo, saya dari website Project Cuan. Bisa konsultasi soal asuransi?';

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
      '.pc-modal-submit:active { transform: scale(0.98); }',
      '',
      '/* Floating Mobile CTA Bar */',
      '.pc-floating-bar {',
      '  position: fixed; bottom: 0; left: 0; right: 0;',
      '  padding: 12px 16px;',
      '  background: #00AC5B;',
      '  z-index: 9998;',
      '  display: none;',
      '  align-items: center; justify-content: center;',
      '  gap: 8px;',
      '  box-shadow: 0 -2px 12px rgba(0,0,0,0.15);',
      '  text-decoration: none;',
      '}',
      '.pc-floating-bar svg {',
      '  width: 22px; height: 22px; fill: #fff; flex-shrink: 0;',
      '}',
      '.pc-floating-bar span {',
      '  color: #fff; font-size: 14px; font-weight: 700;',
      '}',
      '@media (max-width: 768px) {',
      '  .pc-floating-bar { display: flex; }',
      '}'
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

      // Detect if user was scrolling down then rapidly scrolls up
      if (diff < 0) {
        scrollingDown = true;
      } else if (scrollingDown && diff > 100 && timeDiff < 300) {
        // Rapid upward scroll after scrolling down
        showExitPopup();
      }

      lastScrollY  = currentY;
      lastTimestamp = now;
    }, { passive: true });
  }

  /* ── 3. FLOATING MOBILE CTA BAR ── */
  function initFloatingBar() {
    var msg = getContextualMessage();
    var url = WA_BASE + encodeURIComponent(msg);

    var bar = document.createElement('a');
    bar.className = 'pc-floating-bar';
    bar.href = url;
    bar.target = '_blank';
    bar.rel = 'noopener';
    bar.id = 'pcFloatingBar';

    bar.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
      '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.12 1.52 5.853L.057 23.7a.5.5 0 0 0 .608.608l5.847-1.463A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.875 0-3.63-.506-5.14-1.39l-.37-.22-3.83.96.975-3.575-.24-.383A9.71 9.71 0 0 1 2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z"/>' +
      '</svg>' +
      '<span>Chat Sekarang - Konsultasi Gratis</span>';

    document.body.appendChild(bar);
  }

  /* ── 4. UPDATE CONTEXTUAL MESSAGES ── */
  function updateContextualLinks() {
    var msg = getContextualMessage();
    var url = WA_BASE + encodeURIComponent(msg);

    // Update existing wa.me links on the page to use contextual messages
    var links = document.querySelectorAll('a[href*="wa.me/' + WA_NUMBER + '"]');
    links.forEach(function (link) {
      link.href = url;
    });
  }

  /* ── INIT ── */
  function initLeadGen() {
    injectStyles();
    initTimedPopup();
    initExitIntent();
    initFloatingBar();
    updateContextualLinks();
  }

  // Run when DOM is ready (script may be loaded dynamically)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeadGen);
  } else {
    initLeadGen();
  }

})();
