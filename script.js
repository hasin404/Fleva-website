/* ==========================================================================
   FLEVA — shared logic (product data, cart, mock auth, nav)
   Front-end only for now: cart + accounts persist in localStorage.
   Swap the CART / AUTH storage layer for real API calls when you have a backend.
   ========================================================================== */

/* To use a real photo for a product, add an "image" field with the file path,
   e.g. image: "assets/products/strawberries.jpg" — drop the matching file into
   the assets/products/ folder. Products without an "image" field automatically
   fall back to the illustrated placeholder, so you can swap them in one at a time. */
const PRODUCTS = [
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
    image: "",
    desc: "A curated box of our six favourites. Built for gifting, dangerously easy to keep for yourself.",
  },
];

const CART_KEY = "fleva_cart";
const AUTH_KEY = "fleva_auth";

/* ---------------- Cart ---------------- */
function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(id, qty=1){
  const cart = getCart();
  const existing = cart.find(i => i.id === id);
  if(existing){ existing.qty += qty; }
  else{ cart.push({ id, qty }); }
  saveCart(cart);
  showToast("Added to cart");
}
function removeFromCart(id){
  saveCart(getCart().filter(i => i.id !== id));
}
function setQty(id, qty){
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty = Math.max(1, qty);
  saveCart(cart);
}
function cartCount(){
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}
function cartTotal(){
  return getCart().reduce((sum, i) => {
    const p = PRODUCTS.find(p => p.id === i.id);
    return sum + (p ? p.price * i.qty : 0);
  }, 0);
}
function updateCartBadge(){
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------------- Mock auth ---------------- */
function getUser(){
  try{ return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch(e){ return null; }
}
function signUp(name, email, password){
  // NOTE: demo-only, plaintext localStorage. Replace with a real backend + hashing before launch.
  const user = { name, email };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}
function logIn(email, password){
  const user = { name: email.split("@")[0], email };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}
function logOut(){
  localStorage.removeItem(AUTH_KEY);
}
function updateAuthUI(){
  const user = getUser();
  document.querySelectorAll("[data-auth-icon]").forEach(el => {
    el.href = user ? "account.html" : "login.html";
  });
}

/* ---------------- Toast ---------------- */
let toastTimer;
function showToast(msg){
  let toast = document.querySelector(".toast");
  if(!toast){
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
function initMobileNav(){
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".mobile-nav");
  if(!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.add("open"));
  nav.querySelector(".close-btn")?.addEventListener("click", () => nav.classList.remove("open"));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
}

/* ---------------- Product card builder ---------------- */
function productPouchSVG(p, size="pouch"){
  // Small illustrated "pouch" placeholder standing in for real product photography.
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

function productMedia(p){
  return p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
    : productPouchSVG(p);
}

function renderProductCard(p){
  return `
  <article class="product-card">
    <a href="product.html?id=${p.id}" class="product-media" style="--pc:${p.color}">
      ${productMedia(p)}
    </a>
    <div class="product-info">
      <span class="product-cat">${p.category}</span>
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <div class="product-row">
        <span class="product-price">৳${p.price}</span>
        <button class="btn-add" data-add="${p.id}" aria-label="Add ${p.name} to cart">+</button>
      </div>
    </div>
  </article>`;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if(btn){
    addToCart(btn.dataset.add, 1);
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  updateCartBadge();
  updateAuthUI();
});
