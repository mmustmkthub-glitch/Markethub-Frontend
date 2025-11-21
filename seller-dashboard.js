const BASE_API = "https://mmustmkt-hub.onrender.com/api";

const API_URLS = {
    orders: `${BASE_API}/orders/mine/`,
    searchOrders: `${BASE_API}/orders/search/`, // 🆕 search endpoint
    trackOrder: `${BASE_API}/orders/track/`,
    feedbacks: `${BASE_API}/feedbacks/`,
    contact: `${BASE_API}/contact/`,
    buyerProfile: `${BASE_API}/users/buyer-profile/`,
    refreshToken: `${BASE_API}/token/refresh/`,
};

// ================================
// 🔒 AUTH CHECK
// ================================
const accessToken = localStorage.getItem("access_token");
if (!accessToken) {
    localStorage.setItem("redirect_after_login", "myorders.html");
    alert("⚠️ Please log in to access your dashboard.");
    window.location.href = "login.html";
}

// ================================
// 🧠 AUTH HELPERS
// ================================
function authHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
}

async function refreshAccessToken() {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) return false;

    try {
        const res = await fetch(API_URLS.refreshToken, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
        });

        if (!res.ok) throw new Error("Token refresh failed");

        const data = await res.json();
        localStorage.setItem("access_token", data.access);
        return true;
    } catch {
        return false;
    }
}

async function secureFetch(url, options = {}) {
    let res = await fetch(url, options);

    if (res.status === 401 && (await refreshAccessToken())) {
        options.headers = authHeaders();
        res = await fetch(url, options);
    }

    return res;
}

// ================================
// 🧭 TAB NAVIGATION
// ================================
document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll("nav ul li");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            contents.forEach((c) => c.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.tab).classList.add("active");
        });
    });

    loadOrders();
    loadProfile();
});

// ================================
// 📦 LOAD BUYER ORDERS
// ================================
async function loadOrders() {
    const container = document.getElementById("orders-container");
    if (!container) return;

    container.innerHTML = "<p>Loading your orders...</p>";

    try {
        const res = await secureFetch(API_URLS.orders, {
            headers: authHeaders(),
        });

        if (!res.ok) throw new Error("Failed to load orders from API");

        const data = await res.json();
        const orders = data.results || data;

        if (orders.length === 0) {
            container.innerHTML = "<p>No orders found.</p>";
            return;
        }

        container.innerHTML = renderOrders(orders);
    } catch (err) {
        console.error("❌ Failed to load orders:", err.message);
        container.innerHTML = "<p>❌ Failed to load orders. Please try again later.</p>";
    }
}

// ================================
// 🔍 SEARCH BUYER ORDERS BY NAME
// ================================
async function searchOrders() {
    const name = document.getElementById("buyer-search").value.trim();
    const container = document.getElementById("orders-container");

    if (!name) {
        loadOrders();
        return;
    }

    container.innerHTML = "<p>Searching orders...</p>";

    try {
        const res = await secureFetch(
            `${API_URLS.searchOrders}?buyer_name=${encodeURIComponent(name)}`,
            { headers: authHeaders() }
        );

        if (!res.ok) throw new Error("Search failed");

        const orders = await res.json();

        if (orders.length === 0) {
            container.innerHTML = "<p>No orders found for that name.</p>";
            return;
        }

        container.innerHTML = renderOrders(orders);
    } catch (err) {
        console.error("❌ Search failed:", err.message);
        container.innerHTML = "<p>❌ Failed to search orders.</p>";
    }
}

// ================================
// 📦 REUSABLE ORDER RENDER FUNCTION
// ================================
function renderOrders(orders) {
    return orders
        .map(
            (order) => `
        <div class="order-card">
            <h4>Order #${order.id}</h4>
            <p><strong>Buyer:</strong> ${order.buyer_name}</p>
            <p><strong>Total:</strong> KES ${order.total_price}</p>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment:</strong> ${order.payment_method}</p>
            <p><strong>Delivery:</strong> ${order.delivery_option} (Fee: KES ${order.delivery_fee})</p>
            <p><strong>Placed on:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            <button onclick="trackOrder(${order.id})">Track Order</button>
        </div>
    `
        )
        .join("");
}

// ================================
// 🚚 TRACK ORDER STATUS (AUTHENTICATED)
// ================================
async function trackOrder(orderId) {
    const result = document.getElementById("track-result");
    if (!result) return;

    result.innerHTML = "<p>Tracking order...</p>";

    try {
        const res = await secureFetch(
            `${API_URLS.trackOrder}${orderId}/`,
            { headers: authHeaders() }
        );

        if (!res.ok) throw new Error("Tracking failed");

        const data = await res.json();

        result.innerHTML = `
            <div class="tracking-info">
                <h4>Order #${orderId}</h4>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Estimated Delivery:</strong> ${data.estimated_delivery || "N/A"}</p>
                <p><strong>Current Location:</strong> ${data.current_location || "Unknown"}</p>
            </div>
        `;
    } catch {
        result.innerHTML = "<p>❌ Unable to track order.</p>";
    }
}

document.getElementById("feedback-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("feedback-name").value.trim();
    const email = document.getElementById("feedback-email").value.trim();
    const message = document.getElementById("feedback-message").value.trim();
    const rating = document.getElementById("feedback-rating").value || null;
    const result = document.getElementById("comment-result");

    if (!name || !email || !message || !rating) {
        result.textContent = "⚠️ Please fill in all fields before submitting.";
        return;
    }

    result.textContent = "Submitting your feedback...";

    try {
        const res = await fetch("https://mmustmkt-hub.onrender.com/api/feedbacks/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, message, rating }),
        });

        if (!res.ok) throw new Error("Feedback submission failed");

        result.textContent = "✅ Thank you for your feedback!";
        document.getElementById("feedback-form").reset();
    } catch (err) {
        console.error("❌ Feedback Error:", err);
        result.textContent = "❌ Failed to submit feedback. Please try again later.";
    }
});

// ================================
// 📞 CONTACT SELLER FORM
// ================================
document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const sellerName = document.getElementById("seller-name").value.trim();
    const message = document.getElementById("message").value.trim();
    const result = document.getElementById("contact-result");

    if (!sellerName || !message) {
        result.textContent = "⚠️ Please fill in all fields.";
        return;
    }

    result.textContent = "Sending your message...";

    try {
        const res = await secureFetch(API_URLS.contact, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({
                seller_name: sellerName,
                message: message,
                buyer_name: localStorage.getItem("buyer_name") || "Anonymous",
                buyer_email: localStorage.getItem("buyer_email") || "",
                buyer_phone: localStorage.getItem("buyer_phone") || "",
            }),
        });

        if (!res.ok) throw new Error("Failed to send message");

        result.textContent = "✅ Message sent successfully!";
        document.getElementById("contact-form").reset();
    } catch (err) {
        console.error("❌ Contact Error:", err);
        result.textContent = "❌ Failed to send message. Please try again.";
    }
});

// ================================
// 👤 PROFILE LOAD & UPDATE
// ================================
async function loadProfile() {
    try {
        const res = await secureFetch(API_URLS.buyerProfile, {
            headers: authHeaders(),
        });

        if (!res.ok) throw new Error("Profile load failed");

        const profile = await res.json();

        document.getElementById("user-name").value = profile.name || "";
        document.getElementById("user-email").value = profile.email || "";
        document.getElementById("user-phone").value = profile.phone || "";
        document.getElementById("user-location").value = profile.location || "";
        document.getElementById("user-id").value = profile.id_number || "";
    } catch (err) {
        console.warn("⚠️ Failed to load profile:", err.message);
    }
}

document.getElementById("details-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const result = document.getElementById("details-result");

    const updatedData = {
        name: document.getElementById("user-name").value.trim(),
        email: document.getElementById("user-email").value.trim(),
        phone: document.getElementById("user-phone").value.trim(),
        location: document.getElementById("user-location").value.trim(),
        id_number: document.getElementById("user-id").value.trim(),
    };

    result.textContent = "Updating profile...";

    try {
        const res = await secureFetch(API_URLS.buyerProfile, {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify(updatedData),
        });

        if (!res.ok) throw new Error("Update failed");

        result.textContent = "✅ Profile updated successfully!";
    } catch {
        result.textContent = "❌ Failed to update profile.";
    }
});
