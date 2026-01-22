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

function openModal() {
  const overlay = qs("#modalOverlay");
  if (overlay) overlay.style.display = "grid";
}

function closeModal() {
  const overlay = qs("#modalOverlay");
  if (overlay) overlay.style.display = "none";
}

function wireCtas() {
  // Call buttons/links
  qsa("[data-call]").forEach((el) => {
    el.setAttribute("href", `tel:${phoneDigits}`);
    el.setAttribute("aria-label", `Call ${displayPhone}`);
  });

  // WhatsApp buttons/links
  qsa("[data-wa]").forEach((el) => {
    el.setAttribute("href", `https://wa.me/${whatsappNumber}?text=${waMsg}`);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noreferrer");
    el.setAttribute("aria-label", "WhatsApp message");
  });

  // Book buttons open modal
  qsa("[data-book]").forEach((el) => {
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
}

// Optional: if you add a booking "inline form" in hero, open modal on submit
function wireInlineForm() {
  const form = qs("[data-inline-booking]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    openModal();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wireCtas();
  wireInlineForm();
});
