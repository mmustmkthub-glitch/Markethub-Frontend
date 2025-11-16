// ================================
// 🛍️ MMUST MarketHub - Marketplace
// ================================

// ---------- API BASE URL ----------
const API_URL = "https://mmustmkt-hub.onrender.com/api/products/products/";

// ---------- DOM ELEMENTS ----------
const grid = document.getElementById('product-grid');
const categorySelect = document.getElementById('category');
const sortSelect = document.getElementById('sort');
const searchInput = document.getElementById('search');
const loadMoreBtn = document.getElementById('load-more');
const cartCount = document.getElementById('cart-count');

// ---------- CART ----------
let cart = JSON.parse(localStorage.getItem("cartItems")) || [];
updateCartCount();

function updateCartCount() {
  if (cartCount) cartCount.textContent = cart.length;
}

function addToCart(product) {
  // Check if product already in cart
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.quantity = (existing.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      seller: product.seller || "Unknown Seller",
      image: product.image || product.image_url || "https://via.placeholder.com/230?text=No+Image",
      quantity: 1
    });
  }

  localStorage.setItem("cartItems", JSON.stringify(cart));
  updateCartCount();

  // Friendly feedback
  alert(`✅ ${product.name} added to cart!`);
}

// ---------- PRODUCT STATE ----------
let products = [];
let filteredProducts = [];
let visibleCount = 6;

// ---------- FETCH PRODUCTS ----------
async function fetchProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const text = await response.text();
    console.log("Raw API Response:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON format from API");
    }

    if (data && Array.isArray(data.results)) {
      products = data.results;
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      throw new Error("Unexpected API response format");
    }

    filteredProducts = [...products];
    filterAndSort();

  } catch (error) {
    console.error("Fetch error:", error);
    if (grid) {
      grid.innerHTML = `
        <p style="text-align:center; color:red;">
          ⚠️ Failed to load products. Please check your API server.<br>
          <small>${error.message}</small>
        </p>`;
    }
  }
}

// ---------- DISPLAY PRODUCTS ----------
function displayProducts(items) {
  grid.innerHTML = "";
  const visibleItems = items.slice(0, visibleCount);

  if (visibleItems.length === 0) {
    grid.innerHTML = "<p style='text-align:center;'>No products found 😔</p>";
    loadMoreBtn.style.display = 'none';
    return;
  }

  visibleItems.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${p.image || p.image_url || 'https://via.placeholder.com/230?text=No+Image'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p><strong>KES ${parseFloat(p.price).toLocaleString()}</strong></p>
      <p>${p.seller || "Unknown Seller"} — ${p.location || ""}</p>
      <div class="actions">
        <button class="cart-btn"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
        <button class="message-btn"><i class="fa fa-envelope"></i> Message Seller</button>
      </div>
    `;

    // ✅ Add to cart handler
    card.querySelector(".cart-btn").addEventListener("click", () => addToCart(p));
    grid.appendChild(card);
  });

  loadMoreBtn.style.display = visibleCount >= items.length ? "none" : "block";
}

// ---------- FILTER & SORT ----------
function filterAndSort() {
  visibleCount = 6;
  filteredProducts = [...products];

  const selectedCategory = categorySelect.value;
  const sortOption = sortSelect.value;
  const searchTerm = searchInput.value.toLowerCase();

  if (selectedCategory !== "all") {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      (p.seller && p.seller.toLowerCase().includes(searchTerm))
    );
  }

  if (sortOption === "lowest") filteredProducts.sort((a, b) => a.price - b.price);
  if (sortOption === "highest") filteredProducts.sort((a, b) => b.price - a.price);
  if (sortOption === "newest") filteredProducts.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

  displayProducts(filteredProducts);
}

// ---------- EVENT LISTENERS ----------
categorySelect.addEventListener("change", () => {
  filterAndSort();
  updatePageTitle();
});
sortSelect.addEventListener("change", filterAndSort);
searchInput.addEventListener("input", () => {
  filterAndSort();
  updatePageTitle();
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += 6;
  displayProducts(filteredProducts);
});

// 🛒 Cart navigation
const cartIcon = document.getElementById("cart");
if (cartIcon) {
  cartIcon.addEventListener("click", () => {
    window.location.href = "cart.html";
  });
}

// ---------- INITIAL LOAD ----------
fetchProducts();

// ---------- DYNAMIC PAGE TITLE ----------
function updatePageTitle() {
  let title = "MMUST MarketHub | Marketplace";
  const selectedCategory = categorySelect.value;
  const searchTerm = searchInput.value.trim();

  if (searchTerm) {
    title = `MMUST MarketHub | Searching for "${searchTerm}"`;
  } else if (selectedCategory !== "all") {
    title = `MMUST MarketHub | ${selectedCategory}`;
  }

  document.title = title;
}
