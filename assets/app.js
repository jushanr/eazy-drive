// assets/app.js

// ===== CONFIG (edit these once) =====
const phoneDigits = "07957212670";          // tel: needs digits only
const displayPhone = "07957 212670";        // shown in UI (optional)
const whatsappNumber = "447957212670";      // wa.me needs country code, no +

// Default WhatsApp message
const waMsg = encodeURIComponent(
  "Hi! I’d like to book driving lessons. Are you available this week?"
);

// ===== Helpers =====
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));

function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
  document.body.style.overflow = lock ? "hidden" : "";
}

function openModal(prefill = {}) {
  const overlay = qs("#modalOverlay");
  if (!overlay) return;

  overlay.style.display = "grid";
  overlay.setAttribute("aria-hidden", "false");
  lockScroll(true);

  // Optional prefill for demo realism
  const form = overlay.querySelector('form[name="booking"]');
  if (form) {
    if (prefill.postcode) {
      const notes = form.querySelector('[name="notes"]');
      if (notes && !notes.value.includes(prefill.postcode)) {
        notes.value =
          `Postcode: ${prefill.postcode}\n` +
          (notes.value ? "\n" + notes.value : "");
      }
    }
    if (prefill.lessonType) {
      const lt = form.querySelector('[name="lessonType"]');
      if (lt && lt.value === "") lt.value = prefill.lessonType;
    }
  }
}

function closeModal() {
  const overlay = qs("#modalOverlay");
  if (!overlay) return;

  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
  lockScroll(false);
}

function ensureClickable(el) {
  // Allows <button> or <div> to behave safely like a link in the demo
  if (el.tagName.toLowerCase() !== "a") {
    el.setAttribute("role", "link");
    el.setAttribute("tabindex", "0");
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") el.click();
    });
  }
}

function showToast(msg) {
  let toast = qs("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.position = "fixed";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.bottom = "86px";
    toast.style.padding = "10px 12px";
    toast.style.borderRadius = "12px";
    toast.style.background = "#0b1f3a";
    toast.style.color = "#fff";
    toast.style.fontWeight = "800";
    toast.style.fontSize = "13px";
    toast.style.boxShadow = "0 14px 40px rgba(2,6,23,.22)";
    toast.style.zIndex = "200";
    toast.style.maxWidth = "min(520px, calc(100% - 18px))";
    toast.style.textAlign = "center";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 180ms ease";
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = "1";

  window.clearTimeout(window.__toastTimer);
  window.__toastTimer = window.setTimeout(() => {
    toast.style.opacity = "0";
  }, 2200);
}

function wireCtas() {
  // Call buttons/links
  qsa("[data-call]").forEach((el) => {
    ensureClickable(el);
    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("href", `tel:${phoneDigits}`);
    } else {
      el.addEventListener("click", () => (window.location.href = `tel:${phoneDigits}`));
    }
    el.setAttribute("aria-label", `Call ${displayPhone}`);
  });

  // WhatsApp buttons/links
  qsa("[data-wa]").forEach((el) => {
    ensureClickable(el);
    const url = `https://wa.me/${whatsappNumber}?text=${waMsg}`;
    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noreferrer");
    } else {
      el.addEventListener("click", () => window.open(url, "_blank", "noreferrer"));
    }
    el.setAttribute("aria-label", "WhatsApp message");
  });

  // Book buttons open modal
  qsa("[data-book]").forEach((el) => {
    ensureClickable(el);
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  });

  // Close modal
  qs("#closeModal")?.addEventListener("click", closeModal);

  // Click outside modal closes it
  qs("#modalOverlay")?.addEventListener("click", (e) => {
    if (e.target && e.target.id === "modalOverlay") closeModal();
  });

  // Escape key closes it
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Optional: close modal on submit (demo UX)
  const bookingForm = qs('form[name="booking"]');
  bookingForm?.addEventListener("submit", (e) => {
    // for demo UX (prevents refresh locally)
    e.preventDefault();
    showToast("Booking request sent — we’ll confirm availability ASAP.");
    closeModal();
  });
}

// If you add a booking "inline form" (availability bar), open modal on submit + prefill
function wireInlineForm() {
  const form = qs("[data-inline-booking]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const postcode = (form.querySelector('[name="postcode"]')?.value || "").trim();
    const lessonType = (form.querySelector('[name="type"]')?.value || "").trim();

    openModal({
      postcode: postcode || "",
      lessonType: lessonType && lessonType !== "Lesson Type" ? lessonType : ""
    });
  });
}

/**
 * Testimonials marquee behaviour:
 * - Desktop: pause on hover (CSS)
 * - Mobile: tap toggles pause/resume
 * - Mobile: if user starts to scroll (touchmove) or scrolls page, force resume
 *   (prevents the “stuck frozen” iOS hover/active state issue)
 *
 * Requires CSS:
 *   .testimonialSlider.isPaused .testimonialTrack { animation-play-state: paused; }
 *   and hover pause limited to hover devices only.
 */
function wireTestimonialMarquee() {
  const slider = qs(".testimonialSlider");
  const track = qs(".testimonialTrack");
  if (!slider || !track) return;

  let paused = false;

  const setPaused = (on) => {
    paused = !!on;
    slider.classList.toggle("isPaused", paused);
    slider.setAttribute("aria-live", paused ? "polite" : "off");
  };

  // Detect tap vs scroll intent
  let startX = 0;
  let startY = 0;
  let moved = false;

  slider.addEventListener(
    "touchstart",
    (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
      moved = false;
    },
    { passive: true }
  );

  slider.addEventListener(
    "touchmove",
    (e) => {
      const t = e.touches?.[0];
      if (!t) return;

      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      // user is scrolling the page (vertical movement)
      if (dy > 10 && dy > dx) {
        moved = true;
        // if they scroll while paused, immediately resume so it never gets stuck
        if (paused) setPaused(false);
      }
    },
    { passive: true }
  );

  slider.addEventListener(
    "touchend",
    () => {
      // Only toggle if it was a tap (not a scroll gesture)
      if (!moved) setPaused(!paused);
    },
    { passive: true }
  );

  slider.addEventListener(
    "touchcancel",
    () => {
      // Cancelled touches shouldn’t leave it paused
      if (paused) setPaused(false);
    },
    { passive: true }
  );

  // If the user scrolls the page and it ends up paused due to iOS weirdness, resume after scroll settles
  let scrollTimer = null;
  window.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (paused) setPaused(false);
      }, 140);
    },
    { passive: true }
  );
}

function wireHeroSlider() {
  const slides = document.querySelectorAll(".heroSlide");
  if (!slides.length || slides.length < 2) return;

  let current = 0;

  setInterval(() => {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
  wireCtas();
  wireInlineForm();
  wireTestimonialMarquee();
  wireHeroSlider();
  wireRevealAnimations();
});



// ===== Premium mobile menu toggle =====
document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".topbar");
  const menu = document.querySelector("#mobileMenu");
  const btn = document.querySelector("#menuBtn");
  const closeBtn = document.querySelector("#menuClose");

  if (!topbar || !menu || !btn) return;

  const openMenu = () => {
    topbar.classList.add("menuOpen");
    menu.classList.add("open");
    document.body.classList.add("menuOpen");
    menu.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    topbar.classList.remove("menuOpen");
    menu.classList.remove("open");
    document.body.classList.remove("menuOpen");
    menu.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const isOpen = topbar.classList.contains("menuOpen");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  });

  menu.addEventListener("click", (e) => {
    if (e.target === menu) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  menu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => closeMenu());
  });
});


function wireRevealAnimations() {
  const targets = document.querySelectorAll(
    '.heroCopy, .heroVisual, .trustItem, .tile, .quote, .passGallery img, .section h2, .section .card'
  );
  if (!targets.length) return;

  targets.forEach((el, index) => {
    el.classList.add('reveal');
    el.classList.add(`reveal-delay-${index % 4}`);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  targets.forEach((el) => observer.observe(el));
}
