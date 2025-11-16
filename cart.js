// ================================
// 🛍️ MMUST MarketHub - Cart Logic
// ================================

// Retrieve saved cart from localStorage
let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

// DOM Elements
const cartTable = document.getElementById("cart-items");
const totalDisplay = document.getElementById("cart-total");
const checkoutBtn = document.getElementById("checkout");

// =======================
// 🛒 Render Cart Items
// =======================
function renderCart() {
  cartTable.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartTable.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center; padding: 20px;">
          🛍️ Your cart is empty.<br>
          <a href="marketplace.html">Browse products</a>
        </td>
      </tr>`;
    totalDisplay.textContent = "0";
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;

  cart.forEach((item, index) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    total += price * quantity;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name || "Unnamed Product"}</td>
      <td>KES ${(price * quantity).toLocaleString()} (${quantity} × ${price.toLocaleString()})</td>
      <td>${item.seller || "Unknown Seller"}</td>
      <td><button class="remove-btn" data-index="${index}">❌</button></td>
    `;
    cartTable.appendChild(row);
  });

  totalDisplay.textContent = total.toLocaleString();

  // Remove item functionality
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const i = e.target.dataset.index;
      cart.splice(i, 1);
      localStorage.setItem("cartItems", JSON.stringify(cart));
      renderCart();
    });
  });
}

// =======================
// 🚀 Handle Checkout Redirect
// =======================
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    alert("⚠️ Your cart is empty!");
    return;
  }

  // ✅ Check login status
  const token = localStorage.getItem("access_token");
  if (!token) {
    alert("🔒 Please log in before proceeding to checkout.");
    localStorage.setItem("redirect_after_login", window.location.href);
    window.location.href = "sign-up-overlay.html";
    return;
  }

  // ✅ Save cart and subtotal for checkout page
  const total_price = cart.reduce(
    (sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1),
    0
  );
  localStorage.setItem("checkoutItems", JSON.stringify(cart));
  localStorage.setItem("checkoutTotal", total_price);

  // 🧾 Redirect to checkout page
  window.location.href = "order.html";
});

// =======================
// 🏁 Initialize
// =======================
renderCart();
