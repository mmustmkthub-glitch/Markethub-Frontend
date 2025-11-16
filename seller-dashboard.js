/* =========================================================
   🛒 MMUST MarketHub - Seller Dashboard (v12 PAYSTACK FIXED)
   Features: Products, Ads, Orders, Feedbacks, Seller Profile, Subscriptions
   ✅ Integrated with Django REST API + Paystack Payments
========================================================= */

const BASE_API = "https://mmustmkt-hub.onrender.com/api";
const resp = await fetch(`${API_PRODUCTS}?${params}`);
const API_ORDERS_SELLER = `${BASE_API}/orders/mine/`;
const API_ADS = `${BASE_API}/ads/`;
const API_FEEDBACKS = `${BASE_API}/feedbacks/`;
const API_SELLER_ME = `${BASE_API}/users/seller-profile/`;
const FALLBACK_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

// ---------- Helpers ----------
function authHeaders(isJson = true) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("access");
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
  if (typeof payload === "object" && "results" in payload)
    return Array.isArray(payload.results) ? payload.results : [];
  return [];
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function showMessage(selector, msg, isError = false) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = `<div class="${isError ? 'error' : 'success'}">${msg}</div>`;
}
// ---------- Subscription System (Paystack) ----------
let currentPlan = localStorage.getItem("currentPlan") || "free";
let planToActivate = null;

function getPlanLimits(plan) {
  const limits = {
    free: { maxProducts: 5, maxAds: 1 },
    silver: { maxProducts: 30, maxAds: 5 },
    gold: { maxProducts: Infinity, maxAds: Infinity }
  };
  return limits[plan] || limits.free;
}

function getPlanPrice(plan) {
  switch (plan) {
    case "silver": return 500;
    case "gold": return 1500;
    default: return 0;
  }
}

function updateCurrentPlanDisplay() {
  const el = document.getElementById("currentPlan");
  if (el)
    el.textContent = `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Package`;
}

// ---------- Payment Helpers ----------
async function initPaystackPayment(amount, plan, sellerEmail) {
  try {
    const resp = await fetch(`${BASE_API}/payments/init/`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        amount,
        plan,
        email: sellerEmail,
      }),
    });

    const data = await safeJson(resp);
    if (!resp.ok) throw new Error(data.detail || "Payment initialization failed");

    return data.reference; // Backend-generated reference
  } catch (err) {
    console.error("initPaystackPayment:", err);
    alert(`❌ Failed to initialize payment: ${err.message}`);
  }
}

async function verifyPaystackPayment(reference, plan) {
  try {
    const resp = await fetch(`${BASE_API}/payments/verify/${reference}/`, {
      headers: authHeaders(),
    });
    const data = await safeJson(resp);

    if (resp.ok && data.status === "success") {
      currentPlan = plan;
      localStorage.setItem("currentPlan", currentPlan);
      updateCurrentPlanDisplay();
      alert("✅ Payment successful and subscription activated!");
      document.getElementById("paymentContainer").style.display = "none";
      document.getElementById("paymentContainer").innerHTML = "";
    } else {
      alert(`❌ Payment verification failed: ${data.message || "Unknown error"}`);
    }
  } catch (err) {
    console.error("verifyPaystackPayment:", err);
    alert(`❌ Verification error: ${err.message}`);
  }
}

// ---------- Render Payment UI ----------
function renderPaymentCard(plan, amount) {
  const container = document.getElementById("paymentContainer");
  const planDisplay = plan.charAt(0).toUpperCase() + plan.slice(1);

  container.innerHTML = `
    <div id="payment-card">
      <h2>Confirm Payment for ${planDisplay}</h2>
      <p>Amount: <strong>KSh <span id="amount">${amount}</span></strong></p>
      <input type="email" id="email" placeholder="Enter your email" />
      <button id="payBtn">Pay with Paystack</button><br>
      <button id="payment-cancel">Cancel</button>
      <p id="status" style="margin-top:15px;color:#f78d03;"></p>
    </div>
  `;
  container.style.display = "flex";

  document.getElementById("payment-cancel").addEventListener("click", () => {
    container.style.display = "none";
    container.innerHTML = "";
  });

  document.getElementById("payBtn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    if (!email) { alert("Enter a valid email"); return; }

    const reference = await initPaystackPayment(amount, plan, email);
    if (!reference) return;

    const handler = PaystackPop.setup({
      key: "pk_live_a490cf994f5bea7469c6224d8b7bff1df312ade8", // use your test/live key
      email: email,
      amount: amount * 100,
      currency: "KES",
      ref: reference, // backend-generated
      callback: (response) => verifyPaystackPayment(response.reference, plan),
      onClose: () => alert("Payment window closed."),
    });

    handler.openIframe();
  });
}

// ---------- Initialize Subscription Tab ----------
function initSubscriptionTab() {
  updateCurrentPlanDisplay();
  document.querySelectorAll(".select-plan").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      planToActivate = btn.dataset.plan;
      const amount = getPlanPrice(planToActivate);
      renderPaymentCard(planToActivate, amount);
    });
  });
}

// ---------- Sidebar Tabs ----------
document.querySelectorAll(".sd-sidebar nav ul li").forEach(li => {
  li.addEventListener("click", () => {
    document.querySelectorAll(".sd-sidebar nav ul li").forEach(x => x.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    li.classList.add("active");
    document.getElementById(`tab-${li.dataset.tab}`).classList.add("active");
  });
});

// ---------- Products ----------
let productsPage = 1;

async function loadProducts(page = 1, q = "", category = "all") {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;
  grid.innerHTML = "Loading products...";
  try {
    const params = new URLSearchParams({ page });
    if (q) params.set("search", q);
    if (category !== "all") params.set("category", category);

    const resp = await fetch(`${API_PRODUCTS}?${params}`, { headers: authHeaders(false) });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const data = await safeJson(resp);
    const items = toArrayMaybe(data);

    if (!items.length) {
      grid.innerHTML = "<p>No products found.</p>";
    } else {
      grid.innerHTML = items.map(productCardHtml).join("");
      grid.querySelectorAll("img").forEach(img => {
        img.onerror = () => (img.src = FALLBACK_IMAGE);
      });
      items.forEach(p => {
        document.querySelector(`[data-edit="${p.id}"]`)?.addEventListener("click", () => startEditProduct(p));
        document.querySelector(`[data-delete="${p.id}"]`)?.addEventListener("click", () => deleteProduct(p.id));
      });
    }
  } catch (err) {
    console.error("loadProducts:", err);
    grid.innerHTML = `<p class="error">Failed to load products: ${err.message}</p>`;
  }
}

function productCardHtml(p) {
  const img = p.image || p.image_url || FALLBACK_IMAGE;
  return `
    <div class="product-item card">
      <img src="${img}" alt="${escapeHtml(p.name)}"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
      <h4>${escapeHtml(p.name)}</h4>
      <p>KSh ${parseFloat(p.price || 0).toLocaleString()}</p>
      <p>${escapeHtml(p.location || "")}</p>
      <div class="card-actions">
        <button data-edit="${p.id}" class="btn">Edit</button>
        <button data-delete="${p.id}" class="btn danger">Delete</button>
      </div>
    </div>`;
}

async function handleProductForm(e) {
  e.preventDefault();
  if (!canUploadProduct()) return;

  const id = document.getElementById("productId").value || null;
  const fd = new FormData();
  fd.append("name", document.getElementById("productName").value.trim());
  fd.append("category", document.getElementById("productCategory").value);
  fd.append("price", document.getElementById("productPrice").value);
  fd.append("location", document.getElementById("productLocation").value.trim());
  fd.append("description", document.getElementById("productDescription").value.trim());
  const file = document.getElementById("productImage")?.files[0];
  if (file) fd.append("image", file);

  try {
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_PRODUCTS}${id}/` : API_PRODUCTS;
    const resp = await fetch(url, { method, headers: authHeaders(false), body: fd });
    const data = await safeJson(resp);
    if (!resp.ok) throw new Error(JSON.stringify(data));

    showMessage("#productsGrid", "✅ Product saved successfully.");
    e.target.reset();
    document.getElementById("productId").value = "";
    loadProducts(productsPage);
  } catch (err) {
    console.error("handleProductForm:", err);
    showMessage("#productsGrid", `❌ Error saving product: ${err.message}`, true);
  }
}

function canUploadProduct() {
  const limit = getPlanLimits(currentPlan).maxProducts;
  const count = document.querySelectorAll(".product-item").length;
  if (count >= limit) {
    alert(`🚫 Limit of ${limit} products for ${currentPlan.toUpperCase()} plan reached.`);
    return false;
  }
  return true;
}

function startEditProduct(p) {
  document.getElementById("productId").value = p.id || p.pk;
  document.getElementById("productName").value = p.name || "";
  document.getElementById("productCategory").value = p.category || "";
  document.getElementById("productPrice").value = p.price || "";
  document.getElementById("productLocation").value = p.location || "";
  document.getElementById("productDescription").value = p.description || "";
  document.querySelector('[data-tab="create"]').click();
}

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  try {
    const resp = await fetch(`${API_PRODUCTS}${id}/`, { method: "DELETE", headers: authHeaders() });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    showMessage("#productsGrid", "🗑️ Product deleted.");
    loadProducts(productsPage);
  } catch (err) {
    console.error("deleteProduct:", err);
    showMessage("#productsGrid", `Delete failed: ${err.message}`, true);
  }
}

document.getElementById("productForm")?.addEventListener("submit", handleProductForm);

// ---------- Ads ----------
async function loadAds() {
  const out = document.getElementById("adsList");
  if (!out) return;
  out.innerHTML = "Loading ads...";
  try {
    const resp = await fetch(API_ADS, { headers: authHeaders() });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const data = await safeJson(resp);
    const ads = toArrayMaybe(data);
    out.innerHTML = ads.length
      ? ads.map(a => `<div class="card"><h4>${escapeHtml(a.title)}</h4><p>${escapeHtml(a.description)}</p></div>`).join("")
      : "<p>No campaigns yet.</p>";
  } catch (err) {
    console.error("loadAds:", err);
    out.innerHTML = `<p class="error">Failed to load ads: ${err.message}</p>`;
  }
}

document.getElementById("adForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!canUploadAd()) return;

  const fd = new FormData(e.target);
  try {
    const resp = await fetch(API_ADS, { method: "POST", headers: authHeaders(false), body: fd });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    showMessage("#adsList", "📢 Ad campaign submitted successfully.");
    e.target.reset();
    loadAds();
  } catch (err) {
    console.error("handleAdForm:", err);
    showMessage("#adsList", `Failed to submit ad: ${err.message}`, true);
  }
});

function canUploadAd() {
  const limit = getPlanLimits(currentPlan).maxAds;
  const count = document.querySelectorAll("#adsList .card").length;
  if (count >= limit) {
    alert(`🚫 You reached your ad limit (${limit}) for the ${currentPlan.toUpperCase()} plan.`);
    return false;
  }
  return true;
}

// ---------- Orders ----------
async function loadSellerOrders() {
  const out = document.getElementById("ordersList");
  if (!out) return;
  out.innerHTML = "Loading orders...";
  try {
    const resp = await fetch(API_ORDERS_SELLER, { headers: authHeaders() });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const data = await safeJson(resp);
    const orders = toArrayMaybe(data);
    out.innerHTML = orders.length
      ? orders.map(o => `
        <div class="order-item card">
          <h4>Order #${o.id}</h4>
          <p><strong>Buyer:</strong> ${escapeHtml(o.buyer_name || "Unknown")}</p>
          <p><strong>Total:</strong> KSh ${parseFloat(o.total_price || 0).toLocaleString()}</p>
          <p><strong>Payment:</strong> ${escapeHtml(o.payment_method || "")}</p>
        </div>`).join("")
      : "<p>No orders yet.</p>";
  } catch (err) {
    console.error("loadSellerOrders:", err);
    out.innerHTML = `<p class="error">Failed to load orders: ${err.message}</p>`;
  }
}

// ---------- Feedbacks ----------
async function loadFeedbacks() {
  const out = document.getElementById("feedbackList");
  if (!out) return;
  out.innerHTML = "Loading feedbacks...";
  try {
    const resp = await fetch(API_FEEDBACKS, { headers: authHeaders() });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const data = await safeJson(resp);
    const feedbacks = toArrayMaybe(data);
    out.innerHTML = feedbacks.length
      ? feedbacks.map(f => `<div class="card"><strong>${escapeHtml(f.user_name || "User")}</strong><p>${escapeHtml(f.text)}</p></div>`).join("")
      : "<p>No feedback yet.</p>";
  } catch (err) {
    console.error("loadFeedbacks:", err);
    out.innerHTML = `<p class="error">Failed to load feedbacks: ${err.message}</p>`;
  }
}

// ---------- Seller Profile ----------
async function loadSellerProfile() {
  try {
    const resp = await fetch(API_SELLER_ME, { headers: authHeaders() });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    const data = await safeJson(resp);
    document.getElementById("sellerFullName").value = data.full_name || "";
    document.getElementById("contactEmail").value = data.email || "";
    document.getElementById("contactPhone").value = data.phone || "";
    document.getElementById("businessLocation").value = data.location || "";
    document.getElementById("nationalId").value = data.national_id || "";
    document.getElementById("businessType").value = data.business_type || "";
  } catch (err) {
    console.error("loadSellerProfile:", err);
    alert("⚠️ Failed to load profile details.");
  }
}

document.getElementById("settingsForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById("sellerFullName").value.trim(),
    email: document.getElementById("contactEmail").value.trim(),
    phone: document.getElementById("contactPhone").value.trim(),
    location: document.getElementById("businessLocation").value.trim(),
    national_id: document.getElementById("nationalId").value.trim(),
    business_type: document.getElementById("businessType").value.trim(),
  };
  try {
    const resp = await fetch(API_SELLER_ME, { method: "PUT", headers: authHeaders(true), body: JSON.stringify(payload) });
    if (!resp.ok) throw new Error(`Server ${resp.status}`);
    alert("✅ Profile updated successfully.");
  } catch (err) {
    console.error("settingsForm:", err);
    alert("❌ Failed to update profile.");
  }
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadAds();
  loadSellerOrders();
  loadFeedbacks();
  loadSellerProfile();
  initSubscriptionTab();
});
