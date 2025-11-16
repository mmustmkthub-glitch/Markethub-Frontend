// ==========================
// MMUST MarketHub - Ads Page (Live API)
// ==========================

const API_URL = "http://127.0.0.1:8000/api/ads/";
const adsSection = document.getElementById("adsSection");

// ---------------------------
// FEATURED BANNER SECTION
// ---------------------------
const bannerInner = document.getElementById("bannerInner");
const prevBtn = document.getElementById("prevSlide");
const nextBtn = document.getElementById("nextSlide");

let currentSlide = 0;
let autoSlideInterval;

// Load ads (also used for banners)
async function loadAds() {
  adsSection.innerHTML = "<p>Loading advertisements...</p>";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch ads from API.");

    const data = await res.json();

    // ✅ Extract the list correctly (from pagination)
    const ads = Array.isArray(data) ? data : data.results || [];

    if (!ads.length) {
      adsSection.innerHTML = "<p>No active ads found.</p>";
      return;
    }

    renderBanner(ads);
    renderAds(ads);

  } catch (err) {
    console.error("⚠️ Error fetching ads:", err.message);
    adsSection.innerHTML = "<p>Could not load ads. Please try again later.</p>";

    bannerInner.innerHTML = `
      <div class="banner-slide">
        <img src="https://via.placeholder.com/1200x300?text=No+Active+Ads" alt="No Ads">
        <div class="banner-overlay">
          <h2>No Active Ads</h2>
          <p>Check back later for promotions.</p>
        </div>
      </div>`;
  }
}


// ---------------------------
// RENDER FEATURED BANNERS
// ---------------------------
function renderBanner(ads) {
  if (!ads || ads.length === 0) return;

  bannerInner.innerHTML = ads
    .map(
      (ad) => `
      <div class="banner-slide">
        <img src="${ad.image || 'https://via.placeholder.com/1200x300?text=No+Image'}" alt="${ad.title}">
        <div class="banner-overlay">
          <h2>${ad.title}</h2>
          <p>${ad.description || "No description provided."}</p>
        </div>
      </div>
    `
    )
    .join("");

  updateBannerPosition();
  startAutoSlide();
}

function updateBannerPosition() {
  bannerInner.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function nextSlideFunc() {
  const totalSlides = document.querySelectorAll(".banner-slide").length;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateBannerPosition();
}

function prevSlideFunc() {
  const totalSlides = document.querySelectorAll(".banner-slide").length;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateBannerPosition();
}

function startAutoSlide() {
  clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(nextSlideFunc, 5000);
}

// Event listeners
if (nextBtn && prevBtn) {
  nextBtn.addEventListener("click", () => {
    clearInterval(autoSlideInterval);
    nextSlideFunc();
    startAutoSlide();
  });

  prevBtn.addEventListener("click", () => {
    clearInterval(autoSlideInterval);
    prevSlideFunc();
    startAutoSlide();
  });
}

// ---------------------------
// RENDER ADS GRID
// ---------------------------
function renderAds(ads) {
  if (!ads || ads.length === 0) {
    adsSection.innerHTML = "<p>No active ads available right now.</p>";
    return;
  }

  adsSection.innerHTML = ads
    .map(
      (ad) => `
      <div class="ad-card" data-id="${ad.id}">
        <img src="${ad.image || 'https://via.placeholder.com/800x400?text=No+Image'}" alt="${ad.title}">
        <div class="ad-info">
          <h3>${ad.title}</h3>
          <p>${ad.description || "No description provided."}</p>
          <button class="btn viewBtn">View Details</button>
        </div>
      </div>
    `
    )
    .join("");

  document.querySelectorAll(".viewBtn").forEach((btn, index) => {
    btn.addEventListener("click", () => openAdModal(ads[index]));
  });
}

// ---------------------------
// MODAL FUNCTIONALITY
// ---------------------------
const modal = document.getElementById("adModal");
const closeModal = document.getElementById("closeModal");

function openAdModal(ad) {
  document.getElementById("modalBanner").src =
    ad.image || "https://via.placeholder.com/800x400?text=No+Image";
  document.getElementById("modalTitle").textContent = ad.title;
  document.getElementById("modalDescription").textContent =
    ad.description || "No description available.";
  document.getElementById("modalTarget").textContent = "—";
  document.getElementById("modalDuration").textContent = "—";
  document.getElementById("modalBudget").textContent = "—";

  modal.style.display = "flex";
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ---------------------------
// INITIALIZE
// ---------------------------
document.addEventListener("DOMContentLoaded", loadAds);
