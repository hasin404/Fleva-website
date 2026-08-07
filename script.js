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
    image: "assets/products/protein-bars.png",
    desc: "A dense, chewy bar loaded with real nuts and dark chocolate. 25g of protein, zero guilt, all crunch.",
  },
  {
    id: "freeze-dried-strawberry",
    name: "Freeze-Dried Strawberries",
    category: "Freeze-Dried Fruits",
    price: 450,
    tag: "100% REAL",
    color: "#D91C4A",
    accent: "var(--pink)",
    image: "assets/products/freeze-dried-fruits.png",
    desc: "Whole strawberries, freeze-dried to a light crunch. Nothing added, nothing hidden — just fruit.",
  },
  {
    id: "choc-fruit-mix",
    name: "Chocolate-Dipped Fruit Mix",
    category: "Chocolate Fruits",
    price: 480,
    tag: "SMALL BATCH",
    color: "#3A2418",
    accent: "var(--lime)",
    image: "assets/products/chocolate-fruits.png",
    desc: "Freeze-dried fruit dipped in real dark chocolate. Sweet, tart, and snappy in every bite.",
  },
  {
    id: "tropical-fruit-chips",
    name: "Tropical Fruit Chips",
    category: "Fruit Chips",
    price: 420,
    tag: "NO SUGAR ADDED",
    color: "#E0A72E",
    accent: "var(--plum)",
    image: "assets/products/fruit-chips.png",
    desc: "Kiwi, mango and banana, sliced and dried to a crisp. Tastes like sunshine, keeps like a snack.",
  },
  {
    id: "berry-power-powder",
    name: "Berry Power Powder",
    category: "Fruit Powders",
    price: 600,
    tag: "1 JAR = 3KG FRUIT",
    color: "#6C2BD9",
    accent: "var(--pink)",
    image: "assets/products/fruit-powders.png",
    desc: "Concentrated freeze-dried berries, milled fine. Stir into yogurt, smoothies, or oats.",
  },
  {
    id: "fleva-gift-box",
    name: "FLEVA Starter Gift Box",
    category: "Gift Boxes",
    price: 1200,
    tag: "6 SNACKS INSIDE",
    color: "#16140F",
    accent: "var(--lime)",
    image: "assets/products/gift-boxes.png",
    desc: "A curated box of our six favourites. Built for gifting, dangerously easy to keep for yourself.",
  },
];

/* ---- Storefront dynamic settings from API ---- */
let STOREFRONT = null;

async function loadStorefront() {
  try {
    const res = await fetch(`${API_BASE}/storefront?t=${Date.now()}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.storefront) {
        STOREFRONT = data.storefront;

        const formatUrl = (s) => (!s ? '' : (s.startsWith('data:') || s.startsWith('http') || s.startsWith('/')) ? s : `/${s}`);

        // Update Hero Title, Subtitle, Button
        const hTitle = document.getElementById('hero-title');
        const hLede = document.getElementById('hero-lede');
        const hBtn = document.getElementById('hero-btn');

        if (hTitle && STOREFRONT.heroTitle) hTitle.innerHTML = STOREFRONT.heroTitle;
        if (hLede && STOREFRONT.heroSubtitle) hLede.innerHTML = STOREFRONT.heroSubtitle;
        if (hBtn) {
          if (STOREFRONT.heroBtnText && hBtn.childNodes[0]) hBtn.childNodes[0].textContent = STOREFRONT.heroBtnText + ' ';
          if (STOREFRONT.heroBtnLink) hBtn.href = STOREFRONT.heroBtnLink;
        }

        // Delivery fee
        if (STOREFRONT.deliveryFee !== undefined) {
          window.DELIVERY_FEE = STOREFRONT.deliveryFee;
        }

        // Hero Main Pack Images
        const hImg1 = document.getElementById('hero-img-1');
        const hImg2 = document.getElementById('hero-img-2');
        if (hImg1 && STOREFRONT.heroImage1) hImg1.src = formatUrl(STOREFRONT.heroImage1);
        if (hImg2 && STOREFRONT.heroImage2) hImg2.src = formatUrl(STOREFRONT.heroImage2);

        // Hero Floating Fruits
        const floatContainer = document.getElementById('hero-floating-container');
        if (floatContainer) {
          let floatHTML = '';
          const defaultCoords = [
            { top: '4%', left: '8%', width: '16%' },
            { top: '12%', right: '10%', width: '18%' },
            { bottom: '15%', left: '4%', width: '15%' },
            { bottom: '10%', right: '6%', width: '17%' },
            { top: '40%', left: '2%', width: '14%' },
            { top: '45%', right: '2%', width: '15%' },
            { top: '25%', left: '38%', width: '12%' },
          ];
          for (let i = 1; i <= 7; i++) {
            const imgKey = `heroFloat${i}`;
            if (STOREFRONT[imgKey]) {
              const pos = defaultCoords[i - 1] || defaultCoords[0];
              const styleStr = Object.entries(pos).map(([k, v]) => `${k}:${v}`).join(';');
              floatHTML += `<div class="float-item" style="position:absolute;${styleStr};z-index:2;"><img src="${formatUrl(STOREFRONT[imgKey])}" style="width:100%;height:auto;filter:drop-shadow(0 10px 15px rgba(0,0,0,0.2));" alt="fruit"></div>`;
            }
          }
          if (floatHTML) floatContainer.innerHTML = floatHTML;
        }

        // Craving Images
        const crvPlate = document.querySelector('.craving-visual');
        if (crvPlate) {
          const c1 = crvPlate.querySelector('.float-item:nth-child(2) img');
          const c2 = crvPlate.querySelector('.float-item:nth-child(3) img');
          const c3 = crvPlate.querySelector('.float-item:nth-child(4) img');
          const cMain = crvPlate.querySelector('div[style*="inset:30% 26%"] img');

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
  if (!buttons.length) return;

  const keyMap = {
    'energy': 'energy',
    'fruity': 'fruity',
    'guilt-free': 'guiltFree',
    'surprise': 'surpriseMe'
  };

  buttons.forEach(btn => {
    btn.onclick = () => {
      const type = btn.getAttribute('data-craving');
      const mappedKey = keyMap[type];
      if (cravingsMapping && cravingsMapping[mappedKey]) {
        const prod = cravingsMapping[mappedKey];
        const prodId = typeof prod === 'object' ? (prod.slug || prod._id) : prod;
        if (prodId) {
          window.location.href = `product-detail.html?id=${prodId}`;
          return;
        }
      }
      window.location.href = 'shop.html';
    };
  });
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
        PRODUCTS = data.products.map(p => ({
          id: p.slug || p._id,
          _id: p._id,
          name: p.title,
          category: p.categoryName || '',
          price: p.price,
          discountPrice: p.discountPrice || 0,
          tag: p.tag || '',
          color: p.color || '#16140F',
          accent: p.accent || 'var(--lime)',
          image: p.images?.[0]?.url || '',
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

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty += qty; }
  else { cart.push({ id, qty }); }
  saveCart(cart);

  // Sync to server if logged in
  if (_accessToken) {
    const product = PRODUCTS.find(p => p.id === id);
    if (product && product._id) {
      apiFetch(`${API_BASE}/cart`, {
        method: 'POST',
        body: JSON.stringify({ productId: product._id, qty }),
      }).catch(() => {});
    }
  }

  showToast("Added to cart");
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));

  if (_accessToken) {
    const product = PRODUCTS.find(p => p.id === id);
    if (product && product._id) {
      apiFetch(`${API_BASE}/cart/${product._id}`, { method: 'DELETE' }).catch(() => {});
    }
  }
}

function setQty(id, qty) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function cartTotal() {
  return getCart().reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}

function updateCartBadge() {
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
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
  const isAvailable = (p.availability === 'in-stock' && p.stock > 0) || (p.availability === 'pre-order');
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

let STOREFRONT_CONFIG = null;

async function loadStorefront() {
  try {
    const res = await fetch(`${API_BASE}/storefront?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && data.storefront) {
      STOREFRONT_CONFIG = data.storefront;
      window.STOREFRONT_CONFIG = data.storefront;
      document.dispatchEvent(new Event('storefront-loaded'));
      const sf = data.storefront;
      const title = document.getElementById('hero-title');
      const subtitle = document.getElementById('hero-lede');
      const btn = document.getElementById('hero-btn');
      const img1 = document.getElementById('hero-img-1');
      const img2 = document.getElementById('hero-img-2');
      
      const defaultTitle = 'Real fruits.<br>Crazy good.<span class="stroke">Fleva.</span>';
      const defaultSubtitle = 'From snacking to sharing, we make healthy feel insanely delicious.';
      const defaultBtnText = 'Explore now';
      const defaultBtnLink = 'shop.html';

      if (title) title.innerHTML = (sf.heroTitle && sf.heroTitle.trim()) ? sf.heroTitle : defaultTitle;
      if (subtitle) subtitle.innerHTML = (sf.heroSubtitle && sf.heroSubtitle.trim()) ? sf.heroSubtitle : defaultSubtitle;
      if (btn) {
        btn.innerHTML = `${(sf.heroBtnText && sf.heroBtnText.trim()) ? sf.heroBtnText : defaultBtnText} <span class="btn-dot">→</span>`;
        btn.href = sf.heroBtnLink || defaultBtnLink;
      }
      if (img1 && sf.heroImage1) img1.src = '/' + sf.heroImage1;
      if (img2 && sf.heroImage2) img2.src = '/' + sf.heroImage2;

      // Handle Hero Floating Images
      const floatContainer = document.getElementById('hero-floating-container');
      if (floatContainer) {
        floatContainer.innerHTML = '';
        const styles = [
          'top:2%;right:22%;width:9%;',
          'top:34%;left:2%;width:8%;animation-delay:.6s;',
          'bottom:20%;left:14%;width:9%;animation-delay:1s;',
          'top:10%;right:2%;width:7%;animation-delay:.3s;',
          'bottom:30%;right:12%;width:8%;animation-delay:1.2s;',
          'top:25%;left:35%;width:6%;animation-delay:0.8s;',
          'bottom:10%;left:40%;width:7%;animation-delay:1.5s;'
        ];
        
        let styleIndex = 0;
        for (let i = 1; i <= 7; i++) {
          if (sf[`heroFloat${i}`]) {
            const img = document.createElement('img');
            img.src = '/' + sf[`heroFloat${i}`];
            img.className = 'float-item';
            img.style.cssText = styles[styleIndex] + ' object-fit:contain; border-radius:50%; box-shadow:0 8px 16px rgba(0,0,0,0.1);';
            floatContainer.appendChild(img);
            styleIndex++;
          }
        }
      }

      const cimg1 = document.getElementById('craving-img-1');
      const cimg2 = document.getElementById('craving-img-2');
      const cimg3 = document.getElementById('craving-img-3');
      const cimgMain = document.getElementById('craving-img-main');
      if (cimg1 && sf.cravingImg1) cimg1.src = '/' + sf.cravingImg1;
      if (cimg2 && sf.cravingImg2) cimg2.src = '/' + sf.cravingImg2;
      if (cimg3 && sf.cravingImg3) cimg3.src = '/' + sf.cravingImg3;
      if (cimgMain && sf.cravingImgMain) cimgMain.src = '/' + sf.cravingImgMain;
    }
  } catch (err) {
    console.error('Failed to load storefront:', err);
  }
}

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

/* ==========================================================================
   AI Chat Widget Logic
   ========================================================================== */
function initAIChatWidget() {
  if (document.getElementById('ai-widget-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'ai-widget-btn';
  btn.className = 'ai-widget-btn';
  btn.innerHTML = '✨';
  btn.setAttribute('aria-label', 'Open AI Chat');

  const chatWin = document.createElement('div');
  chatWin.id = 'ai-chat-window';
  chatWin.className = 'ai-chat-window';
  chatWin.innerHTML = `
    <div class="ai-chat-header">
      <h3>FLEVA Support</h3>
      <button class="ai-chat-close" id="ai-chat-close">✕</button>
    </div>
    <div class="ai-chat-messages" id="ai-chat-messages">
      <div class="ai-msg bot">Hi there! 👋 I'm the FLEVA Assistant. How can I help you today?</div>
    </div>
    <div class="ai-suggestions" id="ai-suggestions">
      <button class="ai-chip">🚚 Shipping Policy</button>
      <button class="ai-chip">📞 Contact Info</button>
      <button class="ai-chip">🔥 Best Sellers</button>
      <button class="ai-chip">🔄 Returns</button>
    </div>
    <form class="ai-chat-input" id="ai-chat-form">
      <input type="text" id="ai-chat-input" placeholder="Ask about shipping, products..." autocomplete="off">
      <button type="submit">↑</button>
    </form>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(chatWin);

  const messagesDiv = document.getElementById('ai-chat-messages');
  const chatForm = document.getElementById('ai-chat-form');
  const chatInput = document.getElementById('ai-chat-input');

  btn.addEventListener('click', () => {
    chatWin.classList.add('open');
    chatInput.focus();
    btn.style.display = 'none';
  });

  document.getElementById('ai-chat-close').addEventListener('click', () => {
    chatWin.classList.remove('open');
    btn.style.display = 'flex';
  });

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'ai-msg ' + sender;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return msg;
  }

  // Handle suggestion chips
  document.getElementById('ai-suggestions').addEventListener('click', (e) => {
    if (e.target.classList.contains('ai-chip')) {
      const text = e.target.textContent;
      chatInput.value = text;
      chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      // Optional: hide suggestions after first click
      // document.getElementById('ai-suggestions').style.display = 'none';
    }
  });

  let aiSessionId = sessionStorage.getItem('aiSessionId') || null;

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    chatInput.value = '';

    const typingMsg = addMessage('Typing...', 'bot typing');

    try {
      const res = await fetch(API_BASE + '/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: aiSessionId })
      });
      const data = await res.json();
      
      typingMsg.remove();
      if (data.success) {
        aiSessionId = data.sessionId;
        sessionStorage.setItem('aiSessionId', aiSessionId);
        addMessage(data.reply, 'bot');
      } else {
        addMessage("Oops, I couldn't reach the server right now.", 'bot');
      }
    } catch (err) {
      typingMsg.remove();
      addMessage("Connection error. Please try again.", 'bot');
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof initAIChatWidget === 'function') initAIChatWidget();
  await loadStorefront();
  await loadProducts();
  await loadBanners();
  document.dispatchEvent(new CustomEvent('products-loaded'));
});

