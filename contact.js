/* =========================================================
   📞 MMUST MarketHub - Contact & Newsletter Integration
   Connected to Django Backend API
========================================================= */

const BASE_API = "http://127.0.0.1:8000/api";
const API_CONTACT = `${BASE_API}/feedbacks/contact/`; // ✅ Django Contact endpoint
const API_NEWSLETTER = `${BASE_API}/feedbacks/newsletter/subscribe/`; // ✅ Newsletter endpoint

document.addEventListener("DOMContentLoaded", () => {
  // ================================
  // 🛒 Cart count display
  // ================================
  const storedCart = JSON.parse(localStorage.getItem("cartItems")) || [];
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = storedCart.length;

  // ================================
  // 📩 CONTACT FORM HANDLER
  // ================================
  const contactForm = document.getElementById("contact-form");
  const contactResult = document.getElementById("contact-result");

  if (contactForm && contactResult) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const subject = document.getElementById("subject")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (!name || !email || !subject || !message) {
        contactResult.innerHTML = `
          <div class="alert alert-warning">
            ⚠️ Please fill in all required fields.
          </div>`;
        return;
      }

      contactResult.innerHTML = `
        <div class="alert alert-info">
          📤 Sending your message, please wait...
        </div>`;

      try {
        const res = await fetch(API_CONTACT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, subject, message }),
        });

        if (res.ok) {
          contactResult.innerHTML = `
            <div class="alert alert-success">
              ✅ Thank you, <strong>${name}</strong>! Your message has been sent successfully.
            </div>`;
          contactForm.reset();
        } else {
          const err = await res.json();
          contactResult.innerHTML = `
            <div class="alert alert-danger">
              ❌ Failed to send message: ${err.detail || "Please try again later."}
            </div>`;
        }
      } catch (error) {
        console.error("❌ Network Error:", error);
        contactResult.innerHTML = `
          <div class="alert alert-danger">
            🚫 Network error. Please check your connection or try again later.
          </div>`;
      }
    });
  }

  // ================================
  // 📰 NEWSLETTER SUBSCRIPTION HANDLER
  // ================================
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterResult = document.getElementById("newsletter-result");

  if (newsletterForm && newsletterResult) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("newsletter-email");
      const email = emailInput.value.trim();

      if (!email) {
        newsletterResult.innerHTML = `
          <div class="text-warning">⚠️ Please enter a valid email address.</div>`;
        return;
      }

      newsletterResult.innerHTML = `
        <div class="text-info">📤 Subscribing... please wait.</div>`;

      try {
        const res = await fetch(API_NEWSLETTER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (res.ok) {
          newsletterResult.innerHTML = `
            <div class="text-success">
              ✅ Thank you for subscribing! Check your inbox for updates.
            </div>`;
          emailInput.value = "";
        } else {
          const data = await res.json();
          if (data.email && data.email[0].includes("already exists")) {
            newsletterResult.innerHTML = `
              <div class="text-warning">⚠️ This email is already subscribed.</div>`;
          } else {
            newsletterResult.innerHTML = `
              <div class="text-danger">❌ Subscription failed. Please try again later.</div>`;
          }
        }
      } catch (error) {
        console.error("Newsletter Error:", error);
        newsletterResult.innerHTML = `
          <div class="text-danger">🚫 Network error. Please try again later.</div>`;
      }
    });
  }
});
