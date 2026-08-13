/* ==========================================================================
   FLEVA — shared logic (product data, cart, auth, nav)
   Now connects to the backend API while keeping localStorage as fallback
   for guest users (not logged in).
   ========================================================================== */

const API_BASE = '/api/v1';

/* ---- Auth token management ---- */
let _accessToken = sessionStorage.getItem('fleva_access_token') || '';

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  return headers;
}

function setAccessToken(token) {
  _accessToken = token;
  sessionStorage.setItem('fleva_access_token', token);
}

function clearAccessToken() {
  _accessToken = '';
  sessionStorage.removeItem('fleva_access_token');
}

/**
 * API helper with auto-refresh on 401.
 */
async function apiFetch(url, options = {}) {
  options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  options.credentials = 'include'; // Send cookies (refresh token)

  let res = await fetch(url, options);

  // If token expired or missing, try to refresh
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers = { ...getAuthHeaders(), ...(options.headers || {}) };
      res = await fetch(url, options);
    } else {
      // Refresh failed, user needs to login again
      clearAccessToken();
      localStorage.removeItem(AUTH_KEY);
    }
  }

  return res;
}

async function refreshAccessToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      setAccessToken(data.accessToken);
      return true;
    }
  } catch (e) { /* silent */ }
  clearAccessToken();
  return false;
}

/* ---- Product data (loaded from API with static fallback) ---- */
const STATIC_PRODUCTS = [
  {
    id: "protein-bar-choc-nut",
    name: "Protein Bar — Chocolate Nut Crunch",
    category: "Protein Bars",
    price: 350,
    tag: "25G PROTEIN",
    color: "#7A4B26",
    accent: "var(--lime)",
    image: "/assets/products/protein-bars.png",
    desc: "A dense, chewy bar loaded with real nuts and dark chocolate. 25g of protein, zero guilt, all crunch.",
    stock: 50,
    availability: "in-stock",
  },
  {
    id: "freeze-dried-strawberry",
    name: "Freeze-Dried Strawberries",
    category: "Freeze-Dried Fruits",
    price: 450,
    tag: "100% REAL",
    color: "#D91C4A",
    accent: "var(--pink)",
    image: "/assets/products/freeze-dried-fruits.png",
    desc: "Whole strawberries, freeze-dried to a light crunch. Nothing added, nothing hidden — just fruit.",
    stock: 50,
    availability: "in-stock",
  },
  {
    id: "choc-fruit-mix",
    name: "Chocolate-Dipped Fruit Mix",
    category: "Chocolate Fruits",
    price: 480,
    tag: "SMALL BATCH",
    color: "#3A2418",
    accent: "var(--lime)",
    image: "/assets/products/chocolate-fruits.png",
    desc: "Freeze-dried fruit dipped in real dark chocolate. Sweet, tart, and snappy in every bite.",
    stock: 50,
    availability: "in-stock",
  },
  {
    id: "tropical-fruit-chips",
    name: "Tropical Fruit Chips",
    category: "Fruit Chips",
    price: 420,
    tag: "NO SUGAR ADDED",
    color: "#E0A72E",
    accent: "var(--plum)",
    image: "/assets/products/fruit-chips.png",
    desc: "Kiwi, mango and banana, sliced and dried to a crisp. Tastes like sunshine, keeps like a snack.",
    stock: 50,
    availability: "in-stock",
  },
  {
    id: "berry-power-powder",
    name: "Berry Power Powder",
    category: "Fruit Powders",
    price: 600,
    tag: "1 JAR = 3KG FRUIT",
    color: "#6C2BD9",
    accent: "var(--pink)",
    image: "/assets/products/fruit-powders.png",
    desc: "Concentrated freeze-dried berries, milled fine. Stir into yogurt, smoothies, or oats.",
    stock: 50,
    availability: "in-stock",
  },
  {
    id: "fleva-gift-box",
    name: "FLEVA Starter Gift Box",
    category: "Gift Boxes",
    price: 1200,
    tag: "6 SNACKS INSIDE",
    color: "#16140F",
    accent: "var(--lime)",
    image: "/assets/products/gift-boxes.png",
    desc: "A curated box of our six favourites. Built for gifting, dangerously easy to keep for yourself.",
    stock: 50,
    availability: "in-stock",
  },
];

/* ---- Storefront dynamic settings from API ---- */
let STOREFRONT = null;
let STOREFRONT_CONFIG = null;

async function loadStorefront() {
  try {
    const res = await fetch(`${API_BASE}/storefront?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.storefront) {
        STOREFRONT = data.storefront;
        STOREFRONT_CONFIG = data.storefront;
        window.STOREFRONT_CONFIG = data.storefront;
        document.dispatchEvent(new Event('storefront-loaded'));

        const formatUrl = (s) => (!s ? '' : (s.startsWith('data:') || s.startsWith('http') || s.startsWith('/')) ? s : `/${s}`);

        // Update Hero Title, Subtitle, Button
        const hTitle = document.getElementById('hero-title');
        const hLede = document.getElementById('hero-lede');
        const hBtn = document.getElementById('hero-btn');

        if (hTitle && STOREFRONT.heroTitle) hTitle.innerHTML = STOREFRONT.heroTitle;
        if (hLede && STOREFRONT.heroSubtitle) hLede.innerHTML = STOREFRONT.heroSubtitle;
        if (hBtn) {
          if (STOREFRONT.heroBtnText) hBtn.innerHTML = `${STOREFRONT.heroBtnText} <span class="btn-dot">→</span>`;
          if (STOREFRONT.heroBtnLink) hBtn.href = STOREFRONT.heroBtnLink;
        }

        // Delivery fee
        if (STOREFRONT.deliveryFee !== undefined) {
          window.DELIVERY_FEE = STOREFRONT.deliveryFee;
        }

        // Hero Main Pack Images
        const hImg1 = document.getElementById('hero-img-1');
        const hImg2 = document.getElementById('hero-img-2');
        const hImg3 = document.getElementById('hero-img-3');
        if (hImg1 && STOREFRONT.heroImage1) hImg1.src = formatUrl(STOREFRONT.heroImage1);
        if (hImg2 && STOREFRONT.heroImage2) hImg2.src = formatUrl(STOREFRONT.heroImage2);
        if (hImg3 && STOREFRONT.heroImage3) hImg3.src = formatUrl(STOREFRONT.heroImage3);

        // Craving Images
        const crvPlate = document.querySelector('.craving-visual');
        if (crvPlate) {
          const c1 = crvPlate.querySelector('.float-item:nth-child(2) img') || document.getElementById('craving-img-1');
          const c2 = crvPlate.querySelector('.float-item:nth-child(3) img') || document.getElementById('craving-img-2');
          const c3 = crvPlate.querySelector('.float-item:nth-child(4) img') || document.getElementById('craving-img-3');
          const cMain = document.getElementById('craving-main-img');

          if (c1 && STOREFRONT.cravingImg1) c1.src = formatUrl(STOREFRONT.cravingImg1);
          if (c2 && STOREFRONT.cravingImg2) c2.src = formatUrl(STOREFRONT.cravingImg2);
          if (c3 && STOREFRONT.cravingImg3) c3.src = formatUrl(STOREFRONT.cravingImg3);
          if (cMain && STOREFRONT.cravingImgMain) cMain.src = formatUrl(STOREFRONT.cravingImgMain);
        }

        // Craving click handlers
        setupCravingClickHandlers(STOREFRONT.cravings);
      }
    }
  } catch (e) {
    console.warn('Storefront API load failed', e);
  }
}

function setupCravingClickHandlers(cravingsMapping) {
  const buttons = document.querySelectorAll('#craving-choices button');
  const ctaBtn = document.querySelector('.craving-cta');
  const titleBtn = document.getElementById('craving-title-btn');
  const defaultVisual = document.getElementById('craving-default-visual');
  const productContainer = document.getElementById('craving-product-container');
  if (!buttons.length) return;

  const keyMap = {
    'energy': 'energy',
    'fruity': 'fruity',
    'guilt-free': 'guiltFree',
    'guiltFree': 'guiltFree',
    'surprise': 'surprise'
  };

  function showDefaultView() {
    buttons.forEach(b => b.classList.remove('picked'));
    if (defaultVisual) defaultVisual.style.display = 'block';
    if (productContainer) {
      productContainer.style.display = 'none';
      productContainer.innerHTML = '';
    }
    if (ctaBtn) ctaBtn.href = 'shop.html';
  }

  function getProductObj(target) {
    if (!target) return null;
    let targetId = target;
    if (typeof target === 'object') {
      targetId = target.slug || target._id || target.id;
    }
    let found = typeof findProduct === 'function' ? findProduct(targetId) : null;
    if (found) return found;

    if (typeof target === 'object') {
      const formatUrl = (s) => (!s ? '' : (s.startsWith('data:') || s.startsWith('http') || s.startsWith('/')) ? s : `/${s}`);
      return {
        id: target.slug || target._id,
        _id: target._id,
        slug: target.slug || target._id,
        name: target.title || target.name || 'FLEVA Product',
        category: target.categoryName || target.category || 'FLEVA Snacks',
        price: target.price || 350,
        discountPrice: target.discountPrice || 0,
        tag: target.tag || '',
        color: target.color || '#16140F',
        accent: target.accent || 'var(--lime)',
        image: formatUrl(target.images?.[0]?.url || target.image || '/assets/products/protein-bars.png'),
        desc: target.description || target.desc || '',
        stock: target.stock !== undefined ? target.stock : 50,
        availability: target.availability || 'in-stock',
      };
    }
    return null;
  }

  function selectCraving(selectedBtn) {
    const isAlreadyPicked = selectedBtn.classList.contains('picked');
    if (isAlreadyPicked) {
      showDefaultView();
      return;
    }

    buttons.forEach(b => b.classList.remove('picked'));
    selectedBtn.classList.add('picked');

    const type = selectedBtn.getAttribute('data-craving');
    const mappedKey = keyMap[type];
    let rawProduct = cravingsMapping ? cravingsMapping[mappedKey] : null;
    let productObj = getProductObj(rawProduct);

    if (productObj && productContainer && typeof renderProductCard === 'function') {
      if (defaultVisual) defaultVisual.style.display = 'none';
      productContainer.style.display = 'block';
      productContainer.innerHTML = renderProductCard(productObj);

      const prodId = productObj.slug || productObj.id || productObj._id;
      if (ctaBtn && prodId) ctaBtn.href = `product.html?id=${prodId}`;
    } else {
      showDefaultView();
    }
  }

  // Start with default visual
  showDefaultView();

  if (titleBtn) {
    titleBtn.onclick = () => showDefaultView();
  }

  buttons.forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      selectCraving(btn);
    };
  });
}

function findProduct(idOrSlug) {
  if (!idOrSlug) return null;
  const target = String(idOrSlug).toLowerCase();
  return PRODUCTS.find(p => 
    String(p.id || '').toLowerCase() === target || 
    String(p._id || '').toLowerCase() === target || 
    String(p.slug || '').toLowerCase() === target
  ) || null;
}

/**
 * Load products from the API. Falls back to static data.
 */
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products?limit=100&t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        // Map API products to frontend format
        const formatUrl = (s) => (!s ? '' : (s.startsWith('data:') || s.startsWith('http') || s.startsWith('/')) ? s : `/${s}`);
        PRODUCTS = data.products.map(p => ({
          id: p.slug || p._id,
          _id: p._id,
          slug: p.slug || p._id,
          name: p.title,
          category: p.categoryName || '',
          price: p.price,
          discountPrice: p.discountPrice || 0,
          tag: p.tag || '',
          color: p.color || '#16140F',
          accent: p.accent || 'var(--lime)',
          image: formatUrl(p.images?.[0]?.url || ''),
          desc: p.description || '',
          stock: p.stock,
          availability: p.availability || 'in-stock',
          advancePaymentPercentage: p.advancePaymentPercentage,
          rating: p.rating || 0,
          numReviews: p.numReviews || 0,
        }));
        return;
      }
    }
  } catch (e) {
    // Fallback to static
  }
  PRODUCTS = [...STATIC_PRODUCTS];
}

async function loadBanners() {
  try {
    const res = await fetch(`${API_BASE}/banners?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.banners) {
        // Find offer banner
        const offer = data.banners.find(b => b.type === 'offer' || b.type === 'popup');
        const annBanner = document.getElementById('announcement-banner');
        if (offer && annBanner) {
          annBanner.style.display = 'block';
          annBanner.textContent = offer.title;
          if (offer.link) {
            annBanner.dataset.link = offer.link;
            annBanner.style.textDecoration = 'underline';
          }
        }
        
        // Find hero banner
        const hero = data.banners.find(b => b.type === 'hero');
        const hTitle = document.getElementById('hero-title');
        const hLede = document.getElementById('hero-lede');
        const hBtn = document.getElementById('hero-btn');
        if (hero) {
          if (hTitle) hTitle.innerHTML = hero.title;
          if (hLede && hero.subtitle) hLede.innerHTML = hero.subtitle;
          if (hBtn && hero.link) hBtn.href = hero.link;
        }
      }
    }
  } catch (e) {
    console.warn("Failed to load banners");
  }
}

const CART_KEY = "fleva_cart";
const AUTH_KEY = "fleva_auth";

/* ---------------- Cart ---------------- */
// Guest cart (localStorage) — used when not logged in
function getLocalCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch (e) { return []; }
}
function saveLocalCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function getCart() { return getLocalCart(); }

function saveCart(cart) { saveLocalCart(cart); }

function findProduct(id) {
  if (!id || !PRODUCTS || !PRODUCTS.length) return null;
  const sId = String(id).toLowerCase().trim();
  const cleanStr = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetClean = cleanStr(sId);

  return PRODUCTS.find(p => {
    if (!p) return false;
    const pId = String(p.id || '').toLowerCase();
    const pMongoId = String(p._id || '').toLowerCase();
    const pSlug = String(p.slug || '').toLowerCase();
    const pName = String(p.name || '').toLowerCase();

    if (pId === sId || pMongoId === sId || pSlug === sId) return true;
    if (cleanStr(pId) === targetClean || cleanStr(pSlug) === targetClean) return true;
    if (targetClean.includes(cleanStr(pId)) || cleanStr(pId).includes(targetClean)) return true;
    if (cleanStr(pName).includes(targetClean) || targetClean.includes(cleanStr(pName))) return true;
    return false;
  }) || PRODUCTS[0];
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const targetId = String(id);
  const existing = cart.find(i => String(i.id) === targetId);
  if (existing) { existing.qty += qty; }
  else { cart.push({ id: targetId, qty }); }
  saveCart(cart);

  // Sync to server if logged in
  if (_accessToken) {
    const product = findProduct(id);
    if (product && product._id) {
      apiFetch(`${API_BASE}/cart`, {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, qty }),
      }).catch(() => {});
    }
  }

  showToast("Added to cart 🛒");
}

function removeFromCart(id) {
  const targetId = String(id);
  saveCart(getCart().filter(i => String(i.id) !== targetId));

  if (_accessToken) {
    const product = findProduct(id);
    if (product && product._id) {
      apiFetch(`${API_BASE}/cart/${product._id}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

function setQty(id, qty) {
  const cart = getCart();
  const targetId = String(id);
  const item = cart.find(i => String(i.id) === targetId);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return getCart().reduce((sum, i) => {
    const p = findProduct(i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-count], #cart-badge, .cart-count, .badge-count").forEach(el => {
    el.textContent = n;
    el.style.display = n > 0 ? "inline-flex" : "none";
  });
}

/* ---------------- Auth (API-backed) ---------------- */
function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch (e) { return null; }
}

function saveUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

async function signUp(name, email, password, phone, dob) {
  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, phone, dob }),
    });
    const data = await res.json();
    if (data.success) {
      setAccessToken(data.accessToken);
      saveUser(data.user);
      return data.user;
    } else {
      throw new Error(data.message || 'Signup failed');
    }
  } catch (err) {
    throw err;
  }
}

async function logIn(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.success) {
      setAccessToken(data.accessToken);
      saveUser(data.user);
      return data.user;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  } catch (err) {
    throw err;
  }
}

async function logOut() {
  try {
    await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch (e) { /* silent */ }
  clearAccessToken();
  localStorage.removeItem(AUTH_KEY);
}

function updateAuthUI() {
  const user = getUser();
  document.querySelectorAll("[data-auth-icon]").forEach(el => {
    el.href = user ? "account.html" : "login.html";
  });
}

/* ---------------- Toast ---------------- */
let toastTimer;
function showToast(msg) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="dot"></span><span class="toast-msg"></span>`;
    document.body.appendChild(toast);
  }
  toast.querySelector(".toast-msg").textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------------- Mobile nav ---------------- */
function initMobileNav() {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".mobile-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.add("open"));
  nav.querySelector(".close-btn")?.addEventListener("click", () => nav.classList.remove("open"));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
}

/* ---------------- Product card builder ---------------- */
function productPouchSVG(p, size = "pouch") {
  return `
  <svg viewBox="0 0 200 240" class="pouch-svg" aria-hidden="true">
    <defs>
      <linearGradient id="grad-${p.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${p.color}"/>
        <stop offset="100%" stop-color="${p.color}" stop-opacity="0.7"/>
      </linearGradient>
    </defs>
    <path d="M20 40 Q20 10 50 10 L150 10 Q180 10 180 40 L180 210 Q180 230 160 230 L40 230 Q20 230 20 210 Z" fill="url(#grad-${p.id})"/>
    <rect x="20" y="34" width="160" height="14" fill="${p.color}" opacity="0.85"/>
    <circle cx="100" cy="12" r="7" fill="${p.color}"/>
    <text x="100" y="110" text-anchor="middle" font-family="Anton" font-size="22" fill="#F1EAD6" transform="rotate(-4 100 110)">FLEVA</text>
    <text x="100" y="150" text-anchor="middle" font-family="Work Sans" font-weight="700" font-size="11" fill="${p.accent}" opacity="0.95">${p.category.toUpperCase()}</text>
    <text x="100" y="205" text-anchor="middle" font-family="Space Mono" font-size="9" fill="#F1EAD6" opacity="0.7">${p.tag}</text>
  </svg>`;
}

function productMedia(p) {
  return p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : productPouchSVG(p);
}

function renderProductCard(p) {
  const isAvailable = !p.availability || p.availability === 'in-stock' || p.availability === 'pre-order' || (p.stock !== undefined && p.stock > 0);
  let badgeText = '';
  if (p.availability === 'out-of-stock' || (p.availability === 'in-stock' && p.stock <= 0)) badgeText = 'Out of Stock';
  else if (p.availability === 'pre-order') badgeText = 'Pre-Order';
  else if (p.availability === 'upcoming') badgeText = 'Upcoming';
  
  const badgeHtml = badgeText ? `<div class="status-badge ${p.availability}">${badgeText}</div>` : '';
  const btnHtml = isAvailable 
    ? `<button class="btn-add" data-add="${p.id}" aria-label="Add ${p.name} to cart">+</button>` 
    : `<button class="btn-add disabled" disabled aria-label="Unavailable">—</button>`;

  return `
  <article class="product-card">
    <a href="product.html?id=${p.id}" class="product-media" style="--pc:${p.color}">
      ${badgeHtml}
      ${productMedia(p)}
    </a>
    <div class="product-info">
      <span class="product-cat">${p.category}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <div class="product-row">
        <span class="product-price">৳${p.price}</span>
        ${btnHtml}
      </div>
    </div>
  </article>`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) {
    addToCart(btn.dataset.add, 1);
  }
});



document.addEventListener("DOMContentLoaded", async () => {
  initMobileNav();
  updateCartBadge();
  updateAuthUI();

  // Try to load products, banners, and storefront config from API
  await Promise.all([loadProducts(), loadBanners(), loadStorefront()]);

  // Setup Cravings section interactions
  const cravingBtns = document.querySelectorAll('#craving-choices button');
  if (cravingBtns.length > 0) {
    cravingBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        cravingBtns.forEach(b => b.classList.remove('picked'));
        btn.classList.add('picked');
        
        const type = btn.dataset.craving;
        const mappedType = type === 'guilt-free' ? 'guiltFree' : type;
        
        const defaultContent = document.getElementById('craving-default-content');
        const productCardContainer = document.getElementById('craving-product-card');
        
        if (STOREFRONT_CONFIG && STOREFRONT_CONFIG.cravings && STOREFRONT_CONFIG.cravings[mappedType]) {
          const item = STOREFRONT_CONFIG.cravings[mappedType];
          const productId = (item && typeof item === 'object') ? String(item._id || item.id) : String(item);
          let product = PRODUCTS.find(p => (String(p._id) === productId || String(p.id) === productId));
          
          if (!product && typeof item === 'object' && item.title) {
            product = {
              id: String(item._id || item.id),
              _id: String(item._id || item.id),
              name: item.title,
              title: item.title,
              price: item.price,
              discountPrice: item.discountPrice || 0,
              desc: item.description,
              category: item.categoryName || 'Snacks',
              images: item.images,
              availability: item.availability || 'in-stock',
              stock: item.stock ?? 10
            };
          }
          
          if (product) {
            if (defaultContent) defaultContent.style.display = 'none';
            if (productCardContainer) {
              productCardContainer.style.display = 'block';
              productCardContainer.innerHTML = renderProductCard(product);
            }
            return;
          }
        }
        
        // Fallback to default visuals if no product found
        if (defaultContent) defaultContent.style.display = 'block';
        if (productCardContainer) {
          productCardContainer.style.display = 'none';
          productCardContainer.innerHTML = '';
        }
      });
    });
  }

  // Cravings reset handler
  const cravingHeading = document.getElementById('craving-heading');
  if (cravingHeading) {
    cravingHeading.addEventListener('click', () => {
      cravingBtns.forEach(b => b.classList.remove('picked'));
      const defaultContent = document.getElementById('craving-default-content');
      const productCardContainer = document.getElementById('craving-product-card');
      if (defaultContent) defaultContent.style.display = 'block';
      if (productCardContainer) {
        productCardContainer.style.display = 'none';
        productCardContainer.innerHTML = '';
      }
    });
  }

  // Inject Search UI
  const headerIcons = document.querySelector('.header-icons');
  if (headerIcons && !document.querySelector('button[aria-label="Search"]')) {
    const searchBtn = document.createElement('button');
    searchBtn.className = 'icon-btn';
    searchBtn.setAttribute('aria-label', 'Search');
    searchBtn.innerHTML = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
    searchBtn.onclick = () => document.getElementById('search-bar').classList.toggle('open');
    headerIcons.prepend(searchBtn);
  }

  if (!document.getElementById('search-bar')) {
    const searchBar = document.createElement('div');
    searchBar.id = 'search-bar';
    searchBar.className = 'search-bar-overlay';
    searchBar.innerHTML = `
      <div class="wrap" style="display:flex; align-items:center; height:100%;">
        <form action="shop.html" method="GET" style="flex:1; display:flex; align-items:center; gap:10px;">
          <input type="text" name="q" placeholder="Search for snacks, boxes..." required class="search-input">
          <button type="submit" class="btn btn-primary" style="padding:10px 20px;">Search</button>
          <button type="button" class="icon-btn" onclick="document.getElementById('search-bar').classList.remove('open')" aria-label="Close search">✕</button>
        </form>
      </div>
    `;
    document.body.appendChild(searchBar);
  }

  // Dispatch event so page-specific scripts know products are ready
  window.dispatchEvent(new Event('products-loaded'));
});

/* ---- Version 2: 3D Hero Carousel Controller ---- */
let heroCarouselIndex = 0;
let heroCarouselTimer = null;

function initHero3DCarousel() {
  const cards = [
    document.getElementById('card-slot-1'),
    document.getElementById('card-slot-2'),
    document.getElementById('card-slot-3')
  ].filter(Boolean);

  const indicators = document.querySelectorAll('#carousel-indicators .indicator');
  const stage = document.getElementById('carousel-3d-stage');

  if (cards.length < 3) return;

  const positions = ['pos-center', 'pos-right-back', 'pos-left-back'];

  function updateCarousel() {
    cards.forEach((card, i) => {
      const posIndex = (i - heroCarouselIndex + 3) % 3;
      card.className = `carousel-3d-card ${positions[posIndex]}`;
    });

    indicators.forEach((ind, idx) => {
      if (ind) ind.classList.toggle('active', idx === heroCarouselIndex);
    });

    const glow = document.getElementById('hero-ambient-glow');
    if (glow) {
      glow.className = `hero-ambient-glow flavor-${heroCarouselIndex + 1}`;
    }
  }

  function nextSlide() {
    heroCarouselIndex = (heroCarouselIndex + 1) % 3;
    updateCarousel();
  }

  function startAutoPlay() {
    stopAutoPlay();
    heroCarouselTimer = setInterval(nextSlide, 2600);
  }

  function stopAutoPlay() {
    if (heroCarouselTimer) clearInterval(heroCarouselTimer);
  }

  // Click on background card shifts it to front center stage
  cards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      heroCarouselIndex = idx;
      updateCarousel();
      startAutoPlay();
    });
  });

  // Click on indicators
  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => {
      heroCarouselIndex = idx;
      updateCarousel();
      startAutoPlay();
    });
  });

  updateCarousel();
  startAutoPlay();
}

document.addEventListener('DOMContentLoaded', async () => {
  initHero3DCarousel();
  await loadStorefront();
  await loadProducts();
  await loadBanners();
  window.dispatchEvent(new CustomEvent('products-loaded'));
  document.dispatchEvent(new CustomEvent('products-loaded'));
  if (typeof initShop === 'function') initShop();
  if (typeof renderFeatured === 'function') renderFeatured();
});

