/* ===========================
   🛍️ Top Listings Section JS (FINAL FIXED VERSION)
   Uses correct Cloudinary image_url
   =========================== */

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".section-tab-nav li a");
    const productsContainer = document.querySelector(".products-slick");

    // 🔗 Live API endpoint
    const API_URL = "https://mmustmkt-hub.onrender.com/api/toplistings/";

    // Default category
    let currentCategory = "Electronics";

    // ===========================
    // 📦 Load products from API
    // ===========================
    async function loadProducts(category) {
        productsContainer.innerHTML = `<p class="loading">Loading ${category}...</p>`;

        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                productsContainer.innerHTML = `<p class="error">⚠️ Unexpected API response format.</p>`;
                return;
            }

            // Filter by category
            const filtered = data.results.filter(
                product => product.category.toLowerCase() === category.toLowerCase()
            );

            if (!filtered.length) {
                productsContainer.innerHTML = `<p class="no-products">No ${category} products found.</p>`;
                return;
            }

            renderProducts(filtered);
            initializeSlick();
        } catch (error) {
            console.error("❌ Error fetching products:", error);
            productsContainer.innerHTML = `<p class="error">❌ Failed to load products. Please try again later.</p>`;
        }
    }

    // ===========================
    // 🧱 Render products
    // ===========================
    function renderProducts(products) {
        productsContainer.innerHTML = "";
        
        products.forEach(product => {
            const productHTML = `
                <div class="product" 
                     data-id="${product.id}"
                     data-name="${product.name}"
                     data-price="${product.price}"
                     data-image="${product.image_url}"
                     data-category="${product.category}">
                     
                    <div class="product-img">
                        <img src="${product.image_url}" alt="${product.name}">
                        <div class="product-label">
                            ${product.discount ? `<span class="sale">-${product.discount}%</span>` : ""}
                            ${product.is_new ? `<span class="new">NEW</span>` : ""}
                        </div>
                    </div>
                    
                    <div class="product-body">
                        <p class="product-category">${product.category}</p>
                        <h3 class="product-name"><a href="#">${product.name}</a></h3>
                        <h4 class="product-price">
                            KES${Number(product.price).toLocaleString()} 
                            ${product.old_price ? `<del class="product-old-price">KES${Number(product.old_price).toLocaleString()}</del>` : ""}
                        </h4>
                        <div class="product-rating">${renderStars(product.rating)}</div>
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
            `;
            productsContainer.insertAdjacentHTML("beforeend", productHTML);
        });

        attachAddToCartListeners();
    }

    // ===========================
    // ⭐ Add to Cart
    // ===========================
    function attachAddToCartListeners() {
        const cartButtons = document.querySelectorAll(".add-to-cart-btn");

        cartButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const productEl = e.target.closest(".product");
                const product = {
                    id: productEl.dataset.id,
                    name: productEl.dataset.name,
                    price: parseFloat(productEl.dataset.price),
                    image: productEl.dataset.image,   // ✔ Correct Cloudinary URL
                    category: productEl.dataset.category,
                    quantity: 1,
                };

                addToCart(product);
            });
        });
    }

    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem("cartItems")) || [];

        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push(product);
        }

        localStorage.setItem("cartItems", JSON.stringify(cart));
        showAddToCartSuccess(product);
    }

    // ===========================
    // 🎉 Success Overlay
    // ===========================
    function showAddToCartSuccess(product) {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "9999";

        overlay.innerHTML = `
            <div style="background:#fff; padding:30px; border-radius:15px; text-align:center;">
                <img src="assets/img/success.gif" alt="Added!" 
                     style="width:100px; height:100px; object-fit:contain; margin-bottom:10px;">
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

    // ===========================
    // ⭐ Rating stars
    // ===========================
    function renderStars(rating) {
        const stars = Math.min(5, Math.max(0, Math.round(rating / 2)));
        let html = "";
        for (let i = 1; i <= 5; i++) {
            html += `<i class="fa fa-star${i <= stars ? "" : "-o"}"></i>`;
        }
        return html;
    }

    // ===========================
    // 🎠 Slick Carousel
    // ===========================
    function initializeSlick() {
        if (typeof $ !== "undefined" && $(".products-slick").slick) {
            $(".products-slick").slick("unslick");
            $(".products-slick").slick({
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
    // 🏷️ Handle Category Tabs
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
});
