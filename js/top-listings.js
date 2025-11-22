/* ===========================
🛍️ Top Listings Section JS (Optimized)
Fetches only the selected category from backend
=========================== */

document.addEventListener("DOMContentLoaded", () => {
const tabs = document.querySelectorAll(".section-tab-nav li a");

```
// 🔗 Live API endpoint
const API_URL = "https://mmustmkt-hub.onrender.com/api/toplistings/";

const TAB_CONTAINERS = {
    "All": "all-products",
    "Electronics & Accessories": "electronics-products",
    "Fashion & Apparel": "fashion-products",
    "Home & Room Essentials": "home-products",
    "Food & Beverages": "food-products",
};

let currentCategory = "All";

// ===========================
// 📦 Load products from API
// ===========================
async function loadProducts(category) {
    const containerId = TAB_CONTAINERS[category];
    const container = document.getElementById(containerId);

    // Clear all containers
    Object.values(TAB_CONTAINERS).forEach(id => {
        document.getElementById(id).innerHTML = "";
    });

    container.innerHTML = `<p class="loading">Loading ${category}...</p>`;

    // Build query param
    const query = category === "All" ? "" : `?category=${encodeURIComponent(category)}`;

    try {
        const response = await fetch(API_URL + query);
        const data = await response.json();

        if (!data.results || !Array.isArray(data.results)) {
            container.innerHTML = `<p class="error">⚠ Unexpected API response format.</p>`;
            return;
        }

        if (!data.results.length) {
            container.innerHTML = `<p class="no-products">No ${category} products found.</p>`;
            return;
        }

        renderProducts(data.results, container);
        initializeSlick(`#${containerId}`);
    } catch (error) {
        console.error("❌ Error fetching products:", error);
        container.innerHTML = `<p class="error">❌ Failed to load products.</p>`;
    }
}

// ===========================
// 🧱 Render products
// ===========================
function renderProducts(products, container) {
    container.innerHTML = "";
    products.forEach(p => {
        container.insertAdjacentHTML("beforeend", `
            <div class="product" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-image="${p.image_url}" data-category="${p.category}">
                <div class="product-img">
                    <img src="${p.image_url}" alt="${p.name}">
                    <div class="product-label">
                        ${p.discount ? `<span class="sale">-${p.discount}%</span>` : ""}
                        ${p.is_new ? `<span class="new">NEW</span>` : ""}
                    </div>
                </div>
                <div class="product-body">
                    <p class="product-category">${p.category}</p>
                    <h3 class="product-name"><a href="#">${p.name}</a></h3>
                    <h4 class="product-price">
                        KES ${Number(p.price).toLocaleString()} 
                        ${p.old_price ? `<del class="product-old-price">KES${Number(p.old_price).toLocaleString()}</del>` : ""}
                    </h4>
                    <div class="product-rating">${renderStars(p.rating)}</div>
                    <div class="product-btns">
                        <button class="add-to-wishlist"><i class="fa fa-heart-o"></i></button>
                        <button class="add-to-compare"><i class="fa fa-exchange"></i></button>
                        <button class="quick-view"><i class="fa fa-eye"></i></button>
                    </div>
                </div>
                <div class="add-to-cart">
                    <button class="add-to-cart-btn"><i class="fa fa-shopping-cart"></i> Add to Cart</button>
                </div>
            </div>
        `);
    });
    attachAddToCartListeners();
}

// ===========================
// ⭐ Add to Cart
// ===========================
function attachAddToCartListeners() {
    document.querySelectorAll(".add-to-cart-btn").forEach(btn => {
        btn.addEventListener("click", e => {
            const productEl = e.target.closest(".product");
            const product = {
                id: productEl.dataset.id,
                name: productEl.dataset.name,
                price: parseFloat(productEl.dataset.price),
                image: productEl.dataset.image,
                category: productEl.dataset.category,
                quantity: 1
            };
            addToCart(product);
        });
    });
}

function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem("cartItems")) || [];
    const existing = cart.find(p => p.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push(product);
    localStorage.setItem("cartItems", JSON.stringify(cart));
    showAddToCartSuccess(product);
}

function showAddToCartSuccess(product) {
    const overlay = document.createElement("div");
    overlay.style = `
        position: fixed; top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex; justify-content: center;
        align-items: center; z-index: 9999;`;

    overlay.innerHTML = `
        <div style="background:#fff; padding:30px; border-radius:15px; text-align:center;">
            <img src="assets/img/success.gif" style="width:100px; height:100px;">
            <h3 style="color:#28a745;">${product.name} added to cart!</h3>
            <p>Redirecting to your cart...</p>
        </div>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => {
        overlay.remove();
        window.location.href = "cart.html";
    }, 1500);
}

function renderStars(rating) {
    const stars = Math.min(5, Math.max(0, Math.round(rating / 2)));
    return Array.from({ length: 5 }, (_, i) =>
        `<i class="fa fa-star${i < stars ? "" : "-o"}"></i>`
    ).join("");
}

function initializeSlick(selector) {
    if (typeof $ !== "undefined" && $(selector).slick) {
        $(selector).slick("unslick");
        $(selector).slick({
            slidesToShow: 4,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 3000,
            arrows: true,
            prevArrow: '<button class="slick-prev"><i class="fa fa-angle-left"></i></button>',
            nextArrow: '<button class="slick-next"><i class="fa fa-angle-right"></i></button>',
            responsive: [
                { breakpoint: 992, settings: { slidesToShow: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1 } }
            ]
        });
    }
}

// ===========================
// 🏷️ Category Tabs
// ===========================
tabs.forEach(tab => {
    tab.addEventListener("click", e => {
        e.preventDefault();
        const category = e.target.textContent.trim();

        tabs.forEach(t => t.parentElement.classList.remove("active"));
        e.target.parentElement.classList.add("active");

        currentCategory = category;
        loadProducts(category);
    });
});

// ===========================
// 🚀 Initial Load
// ===========================
loadProducts(currentCategory);
```

});
