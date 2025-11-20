// ================================
// 🛍️ MMUST MarketHub - Marketplace (Fixed)
// ================================

// ---------- API BASE URL ----------
const API_URL = "https://mmustmkt-hub.onrender.com/api/products/products/";

// ---------- DOM ELEMENTS (guarded) ----------
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
      // ✅ Use image_url first (Cloudinary full URL). fallback to image (rare) then placeholder
      image: product.image_url || product.image || "https://via.placeholder.com/230?text=No+Image",
      quantity: 1
    });
  }

  localStorage.setItem("cartItems", JSON.stringify(cart));
  updateCartCount();

  // Friendly feedback (non-blocking)
  showToast(`${product.name} added to cart`);
}

// small non-blocking toast
function showToast(message, timeout = 1200) {
  const t = document.createElement('div');
  t.textContent = message;
  t.style.position = 'fixed';
  t.style.right = '20px';
  t.style.bottom = '20px';
  t.style.background = '#000';
  t.style.color = '#fff';
  t.style.padding = '10px 14px';
  t.style.borderRadius = '8px';
  t.style.boxShadow = '0 6px 18px rgba(0,0,0,0.3)';
  t.style.zIndex = 9999;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), timeout);
}

// ---------- PRODUCT STATE ----------
let products = [];
let filteredProducts = [];
let visibleCount = 6;

// ---------- FETCH PRODUCTS ----------
async function fetchProducts() {
  if (!grid) return console.warn('Product grid element not found in DOM.');

  try {
    const response = await fetch(API_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const data = await response.json();
    console.log('Raw API Response:', JSON.stringify(data));

    if (data && Array.isArray(data.results)) {
      products = data.results;
    } else if (Array.isArray(data)) {
      products = data;
    } else {
      throw new Error('Unexpected API response format');
    }

    filteredProducts = [...products];
    filterAndSort();

  } catch (error) {
    console.error('Fetch error:', error);
    if (grid) {
      grid.innerHTML = `\n        <p style="text-align:center; color:red;">\n          ⚠️ Failed to load products. Please check your API server.<br>\n          <small>${error.message}</small>\n        </p>`;
    }
  }
}

// ---------- DISPLAY PRODUCTS ----------
function displayProducts(items) {
  if (!grid) return;
  grid.innerHTML = "";
  const visibleItems = items.slice(0, visibleCount);

  if (visibleItems.length === 0) {
    grid.innerHTML = "<p style='text-align:center;'>No products found 😔</p>";
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  visibleItems.forEach(p => {
    const imageUrl = p.image_url || p.image || 'https://via.placeholder.com/230?text=No+Image';

    const card = document.createElement('div');
    card.className = 'product-card';

    // Use onerror to fallback if image 404s
    card.innerHTML = `
      <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='https://via.placeholder.com/230?text=No+Image'">
      <h3>${escapeHtml(p.name)}</h3>
      <p><strong>KES ${Number(p.price).toLocaleString()}</strong></p>
      <p>${escapeHtml(p.seller || 'Unknown Seller')} — ${escapeHtml(p.location || '')}</p>
      <div class="actions">
        <button class="cart-btn"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
        <button class="message-btn"><i class="fa fa-envelope"></i> Message Seller</button>
      </div>
    `;

    // attach add to cart
    const cartBtn = card.querySelector('.cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => addToCart(p));
    }

    // optional: message handler
    const msgBtn = card.querySelector('.message-btn');
    if (msgBtn) {
      msgBtn.addEventListener('click', () => {
        showToast('Messaging feature not implemented yet');
      });
    }

    grid.appendChild(card);
  });

  if (loadMoreBtn) loadMoreBtn.style.display = visibleCount >= items.length ? 'none' : 'block';
}

// simple html escape to avoid injection
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ---------- FILTER & SORT ----------
function filterAndSort() {
  visibleCount = 6;
  filteredProducts = [...products];

  const selectedCategory = categorySelect ? categorySelect.value : 'all';
  const sortOption = sortSelect ? sortSelect.value : '';
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  if (selectedCategory && selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
  }

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(p =>
      (p.name && p.name.toLowerCase().includes(searchTerm)) ||
      (p.seller && p.seller.toLowerCase().includes(searchTerm))
    );
  }

  if (sortOption === 'lowest') filteredProducts.sort((a, b) => Number(a.price) - Number(b.price));
  if (sortOption === 'highest') filteredProducts.sort((a, b) => Number(b.price) - Number(a.price));
  if (sortOption === 'newest') filteredProducts.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));

  displayProducts(filteredProducts);
}

// ---------- EVENT LISTENERS (guarded) ----------
if (categorySelect) {
  categorySelect.addEventListener('change', () => {
    filterAndSort();
    updatePageTitle();
  });
}
if (sortSelect) sortSelect.addEventListener('change', filterAndSort);
if (searchInput) searchInput.addEventListener('input', () => { filterAndSort(); updatePageTitle(); });
if (loadMoreBtn) loadMoreBtn.addEventListener('click', () => { visibleCount += 6; displayProducts(filteredProducts); });

// 🛒 Cart navigation
const cartIcon = document.getElementById('cart');
if (cartIcon) {
  cartIcon.addEventListener('click', () => { window.location.href = 'cart.html'; });
}

// ---------- INITIAL LOAD ----------
fetchProducts();

// ---------- DYNAMIC PAGE TITLE ----------
function updatePageTitle() {
  let title = 'MMUST MarketHub | Marketplace';
  const selectedCategory = categorySelect ? categorySelect.value : 'all';
  const searchTerm = searchInput ? searchInput.value.trim() : '';

  if (searchTerm) {
    title = `MMUST MarketHub | Searching for "${searchTerm}"`;
  } else if (selectedCategory && selectedCategory !== 'all') {
    title = `MMUST MarketHub | ${selectedCategory}`;
  }

  document.title = title;
}
