// ================================
// 🛒 MMUST MarketHub - order.js (FINAL v10)
// ================================

const API_URL = "http://127.0.0.1:8000/api/orders/";

// =======================
// 📦 DOM ELEMENTS
// =======================
const orderTable = document.getElementById("order-items");
const orderSubtotalEl = document.getElementById("order-subtotal");
const deliveryFeeEl = document.getElementById("delivery-fee");
const orderTotalEl = document.getElementById("order-total");
const buyerForm = document.getElementById("buyer-form");
const deliverySelect = document.getElementById("delivery-option");
const confirmBtn = document.getElementById("confirm-order");

// =======================
// 🧾 LOAD CHECKOUT DATA
// =======================
const checkoutItems = JSON.parse(localStorage.getItem("checkoutItems")) || [];
const checkoutTotal = parseFloat(localStorage.getItem("checkoutTotal")) || 0;

// 🧹 Clear leftover data if previous order was completed
if (localStorage.getItem("orderCompleted") === "true") {
  localStorage.removeItem("cartItems");
  localStorage.removeItem("checkoutItems");
  localStorage.removeItem("checkoutTotal");
  localStorage.removeItem("orderCompleted");
}

let subtotal = checkoutTotal;
let deliveryFee = 0;

// =======================
// 🧾 DISPLAY ORDER SUMMARY
// =======================
function renderOrder() {
  if (!checkoutItems.length) {
    orderTable.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; color:red;">
          ⚠️ No items found. Please return to your cart.
        </td>
      </tr>`;
    orderSubtotalEl.textContent = "0";
    deliveryFeeEl.textContent = "0";
    orderTotalEl.textContent = "0";
    return;
  }

  orderTable.innerHTML = "";
  subtotal = 0;

  checkoutItems.forEach((item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 1;
    subtotal += price * qty;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name || "Unnamed Product"}</td>
      <td>${price.toLocaleString()} × ${qty}</td>
      <td>${item.seller || "Unknown Seller"}</td>
    `;
    orderTable.appendChild(row);
  });

  updateTotals();
}

// =======================
// 🚚 DELIVERY FEE HANDLER
// =======================
function updateDeliveryFee() {
  const selected = deliverySelect.options[deliverySelect.selectedIndex];
  deliveryFee = parseFloat(selected.getAttribute("data-fee")) || 0;
  updateTotals();
}

function updateTotals() {
  const total = subtotal + deliveryFee;
  orderSubtotalEl.textContent = subtotal.toLocaleString();
  deliveryFeeEl.textContent = deliveryFee.toLocaleString();
  orderTotalEl.textContent = total.toLocaleString();
}

// Listen for delivery option change
deliverySelect.addEventListener("change", updateDeliveryFee);

// Initial render
renderOrder();

// =======================
// 🚀 HANDLE ORDER SUBMISSION
// =======================
buyerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  confirmBtn.disabled = true;
  confirmBtn.textContent = "⏳ Processing...";

  const buyer_name = document.getElementById("buyer-name").value.trim();
  const buyer_phone = document.getElementById("buyer-phone").value.trim();
  const buyer_address = document.getElementById("buyer-address").value.trim();
  const payment_method = document.getElementById("payment-method").value;
  const delivery_option = deliverySelect.value;

  // ✅ Validation
  if (!buyer_name || !buyer_phone || !buyer_address || !payment_method || !delivery_option) {
    alert("⚠️ Please fill in all fields before confirming your order.");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Confirm Order";
    return;
  }

  if (!checkoutItems.length) {
    alert("⚠️ Your checkout is empty. Please return to cart.");
    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Confirm Order";
    return;
  }

  // ✅ Prepare item data
  const items_data = checkoutItems.map((item) => ({
    product: item.id,
    seller: item.seller_id || item.seller?.id || null,
    price: parseFloat(item.price) || 0,
    quantity: parseInt(item.quantity) || 1,
  }));

  const total_price = subtotal + deliveryFee;

  const payload = {
    buyer_name,
    buyer_phone,
    buyer_address,
    payment_method,
    delivery_option,
    delivery_fee: deliveryFee,
    total_price,
    items_data,
  };

  console.group("🧾 Sending Order Payload");
  console.log(JSON.stringify(payload, null, 2));
  console.groupEnd();

  // ✅ Send to API
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("🔒 Please log in again before placing your order.");
      localStorage.setItem("redirect_after_login", window.location.href);
      window.location.href = "login.html";
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      alert(`🎉 Thank you, ${buyer_name}! Your order has been placed successfully.`);

      // ✅ Clear all cart-related data
      localStorage.removeItem("cartItems");
      localStorage.removeItem("checkoutItems");
      localStorage.removeItem("checkoutTotal");

      // 🚩 Mark as completed (for safety if page reloads)
      localStorage.setItem("orderCompleted", "true");

      // 🚀 Redirect to orders page
      window.location.href = "myorders.html";
    } else {
      console.error("❌ Order Error Response:", data);
      alert(`⚠️ Order failed (${res.status}):\n` + JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("🚨 Network/Server error:", err);
    alert("⚠️ Unable to reach the server. Please check your connection and try again.");
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.textContent = "✅ Confirm Order";
  }
});
