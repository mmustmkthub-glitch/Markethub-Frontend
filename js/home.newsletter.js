// ================================
  // 📰 NEWSLETTER SUBSCRIPTION HANDLER
  // ================================
  const BASE_API = "https://mmustmkt-hub.onrender.com/api";
  const API_NEWSLETTER = `${BASE_API}/feedbacks/newsletter/subscribe/`; // ✅ Newsletter endpoint

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
