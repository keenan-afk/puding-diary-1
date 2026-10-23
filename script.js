/**
 * PUDING DIARY — OFFICIAL SCRIPT
 * Features:
 * 1. Fullscreen Testimonial Image Lightbox (Bukti Foto Alumni WhatsApp)
 * 2. Dynamic Footer Year
 */

(function () {
  'use strict';

  // Set Current Year in Footer
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ==========================================================================
     TESTIMONIAL LIGHTBOX MODAL (BUKTI FOTO WHATSAPP ALUMNI)
     ========================================================================== */

  function initTestimonialLightbox() {
    const lightbox = document.getElementById('testi-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.getElementById('lightbox-close-btn');
    const prevBtn = document.getElementById('lightbox-prev-btn');
    const nextBtn = document.getElementById('lightbox-next-btn');

    if (!lightbox || !lightboxImg) return;

    // Collect all testimonial cards
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
     INITIALIZATION RUNNER
     ========================================================================== */

  document.addEventListener('DOMContentLoaded', () => {
    initTestimonialLightbox();
  });

})();
