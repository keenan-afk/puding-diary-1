/**
 * PUDING DIARY — OFFICIAL INTERACTIVE JAVASCRIPT
 * Features:
 * 1. Accessible WhatsApp Registration Modal with Strict Indonesian Validation
 * 2. Fullscreen Testimonial Image Lightbox (Bukti Foto Alumni WhatsApp)
 * 3. Dynamic Footer Year
 */

(function () {
  'use strict';

  // Pinned WhatsApp Destination
  const WA_PHONE_NUMBER = '6281326422626';

  // Set Current Year in Footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ==========================================================================
     1. ACCESSIBLE REGISTRATION MODAL & WHATSAPP REDIRECTION
     ========================================================================== */

  function initRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const openBtns = document.querySelectorAll('.open-modal-btn');
    const form = document.getElementById('registration-form');

    const inputKelas = document.getElementById('field-kelas');
    const inputNama = document.getElementById('field-nama');
    const inputKota = document.getElementById('field-kota');
    const inputTelepon = document.getElementById('field-telepon');

    const errorNama = document.getElementById('error-nama');
    const errorKota = document.getElementById('error-kota');
    const errorTelepon = document.getElementById('error-telepon');

    let previousActiveElement = null;

    if (!modal) return;

    function openModal(triggerElement) {
      previousActiveElement = triggerElement || document.activeElement;

      // Pre-select class if trigger specifies one
      if (triggerElement && triggerElement.dataset && triggerElement.dataset.class && inputKelas) {
        inputKelas.value = triggerElement.dataset.class;
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus first input
      setTimeout(() => {
        if (inputNama) inputNama.focus();
      }, 100);
    }

    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';

      // Return focus to trigger button
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
    }

    // Open button triggers
    openBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(btn);
      });
    });

    // Close on button click
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Accessible Focus Trap & Escape Key
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('active')) return;

      if (e.key === 'Escape') {
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    });

    // Form Validation Helpers
    function setFieldError(input, errorEl, message) {
      const group = input ? input.closest('.form-group') : null;
      if (group) group.classList.add('has-error');
      if (errorEl) errorEl.textContent = message;
    }

    function clearFieldError(input, errorEl) {
      const group = input ? input.closest('.form-group') : null;
      if (group) group.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
    }

    [inputNama, inputKota, inputTelepon].forEach((input) => {
      if (!input) return;
      input.addEventListener('input', () => {
        const group = input.closest('.form-group');
        const err = group ? group.querySelector('.form-error-msg') : null;
        clearFieldError(input, err);
      });
    });

    // Form Submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const kelas = inputKelas ? inputKelas.value : '📌 KELAS 3: Bundling Paket Kelas Puding';
        const nama = inputNama ? inputNama.value.trim() : '';
        const kota = inputKota ? inputKota.value.trim() : '';
        const telepon = inputTelepon ? inputTelepon.value.trim() : '';

        let isValid = true;

        // 1. Validasi Nama
        if (!nama || nama.length < 2) {
          setFieldError(inputNama, errorNama, 'Mohon isi nama lengkap Bunda ya.');
          isValid = false;
        } else {
          clearFieldError(inputNama, errorNama);
        }

        // 2. Validasi Kota
        if (!kota || kota.length < 2) {
          setFieldError(inputKota, errorKota, 'Mohon cantumkan kota domisili Bunda.');
          isValid = false;
        } else {
          clearFieldError(inputKota, errorKota);
        }

        // 3. Validasi Nomor Telepon Indonesia
        const cleanPhone = telepon.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^(\+?62|0)8[1-9][0-9]{7,11}$/;

        if (!cleanPhone) {
          setFieldError(inputTelepon, errorTelepon, 'Nomor WhatsApp wajib diisi.');
          isValid = false;
        } else if (!phoneRegex.test(cleanPhone)) {
          setFieldError(inputTelepon, errorTelepon, 'Nomor WhatsApp kurang tepat. Contoh yang benar: 081234567890');
          isValid = false;
        } else {
          clearFieldError(inputTelepon, errorTelepon);
        }

        if (!isValid) return;

        // Build WhatsApp Message (structured with selected class)
        const messageText = 
`Halo Puding Diary, saya ingin daftar kelas puding.
Pilihan: ${kelas}
Nama: ${nama}
Kota: ${kota}
No. Telepon: ${telepon}`;

        const waUrl = `https://wa.me/${WA_PHONE_NUMBER}?text=${encodeURIComponent(messageText)}`;

        // Open WhatsApp in new tab
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // Reset and close
        form.reset();
        closeModal();
      });
    }
  }

  /* ==========================================================================
     2. TESTIMONIAL LIGHTBOX MODAL (BUKTI FOTO WHATSAPP ALUMNI)
     ========================================================================== */

  function initTestimonialLightbox() {
    const lightbox = document.getElementById('testi-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');

    if (!lightbox || !lightboxImg) return;

    // Collect all cards
    const cards = Array.from(document.querySelectorAll('.testi-card'));
    if (cards.length === 0) return;

    const items = cards.map((card) => {
      const img = card.querySelector('.testi-img');
      const fullSrc = img ? img.src : '';
      const caption = img ? img.alt : '';
      return { fullSrc, caption };
    });

    let currentIndex = 0;
    let lastActiveElement = null;

    function openLightbox(index) {
      if (index < 0 || index >= items.length) return;
      lastActiveElement = document.activeElement;
      currentIndex = index;
      updateLightboxContent();

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (closeBtn) closeBtn.focus();
    }

    function updateLightboxContent() {
      const item = items[currentIndex];
      if (!item) return;
      lightboxImg.src = item.fullSrc;
      lightboxImg.alt = item.caption || 'Bukti foto testimoni alumni Puding Diary';

      if (prevBtn) prevBtn.setAttribute('aria-label', `Foto sebelumnya (${currentIndex + 1} dari ${items.length})`);
      if (nextBtn) nextBtn.setAttribute('aria-label', `Foto berikutnya (${currentIndex + 1} dari ${items.length})`);
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lightboxImg.src = '';

      if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
        lastActiveElement.focus();
      }
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      updateLightboxContent();
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % items.length;
      updateLightboxContent();
    }

    // Attach click and keyboard events on cards
    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        openLightbox(idx);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(idx);
        }
      });
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    // Navigation buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
      });
    }

    // Backdrop click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // Keyboard support: Escape, ArrowLeft, ArrowRight
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      }
    });
  }

  /* ==========================================================================
     3. INITIALIZATION RUNNER
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initRegistrationModal();
    initTestimonialLightbox();
  });

})();
