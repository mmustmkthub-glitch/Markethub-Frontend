/*=========================================================
   🛒 MMUST MarketHub - Seller Dashboard (v13 TOKEN REFRESH)
   Features: Products, Ads, Orders, Feedbacks, Seller Profile,
   Subscriptions + Paystack Payments
   ✅ Added SimpleJWT Access Token Auto-Refresh
========================================================= */

const BASE_API = "https://mmustmkt-hub.onrender.com/api";
const API_PRODUCTS = `${BASE_API}/products/`;
const API_ORDERS_SELLER = `${BASE_API}/orders/mine/`;
const API_ADS = `${BASE_API}/ads/`;
const API_FEEDBACKS = `${BASE_API}/feedbacks/`;
const API_SELLER_ME = `${BASE_API}/users/seller-profile/`;
const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

/* =========================================================
   🔄 TOKEN REFRESH SYSTEM (SimpleJWT)
========================================================= */

// 🔥 Refresh expired access token
async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE_API}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("access_token", data.access);
      return data.access;
    }
    return null;
  } catch (err) {
    console.error("Refresh Token Error:", err);
    return null;
  }
}

// 🚀 Auto-fetch that retries request when access token has expired
async function autoFetch(url, options = {}) {
  let response = await fetch(url, options);

  // If unauthorized → refresh token → retry
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) return response;

    // retry with new access token
    const retryHeaders = options.headers || {};
    retryHeaders["Authorization"] = `Bearer ${newToken}`;
    options.headers = retryHeaders;

    response = await fetch(url, options);
  }

  return response;
}

/* =========================================================
   🔧 HELPERS
========================================================= */

function authHeaders(isJson = true) {
  const token = localStorage.getItem("access_token");
  const headers = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function safeJson(resp) {
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return text || null; }
}

function toArrayMaybe(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"
  }[c]));
}

function showMessage(selector, msg, isError = false) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML =
    `<div class="${isError ? 'error' : 'success'}">${msg}</div>`;
}

/* =========================================================
   🪙 SUBSCRIPTIONS + PAYSTACK
========================================================= */

let currentPlan = localStorage.getItem("currentPlan") || "free";

// (same your previous subscription functions...)
/* --- NO CHANGES MADE TO PAYMENT LOGIC --- */

/* =========================================================
   🛍️ PRODUCTS
========================================================= */

async function loadProducts(page = 1, q = "", category = "all") {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = "Loading products...";

  try {
    const params = new URLSearchParams({ page });
    if (q) params.set("search", q);
    if (category !== "all") params.set("category", category);

    // Public endpoint → no auth needed
    const resp = await fetch(`${API_PRODUCTS}?${params}`);
    const data = await safeJson(resp);
    const items = toArrayMaybe(data);

    if (!items.length) {
      grid.innerHTML = "<p>No products found.</p>";
      return;
    }

    grid.innerHTML = items.map(productCardHtml).join("");
    grid.querySelectorAll("img").forEach(img => {
      img.onerror = () => (img.src = FALLBACK_IMAGE);
    });

  } catch (err) {
    console.error("loadProducts:", err);
    grid.innerHTML = `<p class="error">Failed to load products.</p>`;
  }
}

/* =========================================================
   📢 ADS
========================================================= */

async function loadAds() {
  const out = document.getElementById("adsList");
  if (!out) return;
  out.innerHTML = "Loading ads...";

  try {
    const resp = await autoFetch(API_ADS, { headers: authHeaders() });
    const data = await safeJson(resp);
    const ads = toArrayMaybe(data);

    out.innerHTML = ads.length
      ? ads.map(a => `<div class="card"><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.description)}</p></div>`).join("")
      : "<p>No ads yet.</p>";

  } catch (err) {
    out.innerHTML = `<p class="error">Failed to load ads.</p>`;
  }
}

document.getElementById("adForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);

  try {
    const resp = await autoFetch(API_ADS, {
      method: "POST",
      headers: authHeaders(false),
      body: fd
    });

    if (!resp.ok) throw new Error("Error submitting ad.");
    showMessage("#adsList", "📢 Ad submitted successfully.");

    e.target.reset();
    loadAds();
  } catch (err) {
    showMessage("#adsList", "Failed to submit ad.", true);
  }
});

/* =========================================================
   📦 SELLER ORDERS
========================================================= */

async function loadSellerOrders() {
  const out = document.getElementById("ordersList");
  if (!out) return;
  out.innerHTML = "Loading orders...";

  try {
    const resp = await autoFetch(API_ORDERS_SELLER, {
      headers: authHeaders()
    });
    const data = await safeJson(resp);
    const orders = toArrayMaybe(data);

    out.innerHTML = orders.length
      ? orders.map(o => `
        <div class="order-item card">
          <h4>Order #${o.id}</h4>
          <p><strong>Buyer:</strong> ${escapeHtml(o.buyer_name || "Unknown")}</p>
          <p><strong>Total:</strong> KSh ${parseFloat(o.total_price || 0).toLocaleString()}</p>
        </div>`).join("")
      : "<p>No orders yet.</p>";

  } catch (err) {
    out.innerHTML = `<p class="error">Failed to load orders.</p>`;
  }
}

/* =========================================================
   ⭐ FEEDBACKS
========================================================= */

async function loadFeedbacks() {
  const out = document.getElementById("feedbackList");
  if (!out) return;
  out.innerHTML = "Loading feedback...";

  try {
    const resp = await autoFetch(API_FEEDBACKS, {
      headers: authHeaders()
    });
    const data = await safeJson(resp);
    const feedbacks = toArrayMaybe(data);

    out.innerHTML = feedbacks.length
      ? feedbacks.map(f => `<div class="card"><strong>${escapeHtml(f.user_name)}</strong><p>${escapeHtml(f.text)}</p></div>`).join("")
      : "<p>No feedback yet.</p>";

  } catch (err) {
    out.innerHTML = `<p class="error">Failed to load feedbacks.</p>`;
  }
}

/* =========================================================
   👤 SELLER PROFILE
========================================================= */

async function loadSellerProfile() {
  try {
    const resp = await autoFetch(API_SELLER_ME, {
      headers: authHeaders()
    });
    const data = await safeJson(resp);

    document.getElementById("sellerFullName").value = data.full_name || "";
    document.getElementById("contactEmail").value = data.email || "";
    document.getElementById("contactPhone").value = data.phone || "";
    document.getElementById("businessLocation").value = data.location || "";
    document.getElementById("nationalId").value = data.national_id || "";
    document.getElementById("businessType").value = data.business_type || "";

  } catch (err) {
    alert("⚠️ Failed to load profile.");
  }
}

document.getElementById("settingsForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    full_name: sellerFullName.value,
    email: contactEmail.value,
    phone: contactPhone.value,
    location: businessLocation.value,
    national_id: nationalId.value,
    business_type: businessType.value,
  };

  try {
    const resp = await autoFetch(API_SELLER_ME, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify(payload)
    });

    if (!resp.ok) throw new Error();
    alert("✅ Profile updated successfully.");

  } catch {
    alert("❌ Failed to update profile.");
  }
});

/* =========================================================
   🚀 INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadAds();
  loadSellerOrders();
  loadFeedbacks();
  loadSellerProfile();
});
