# FLEVA - Real Fruits. Crazy Good.

## 🚀 Project Overview
FLEVA is a modern, highly responsive, full-stack e-commerce platform designed for selling premium freeze-dried fruit and protein snacks. The project successfully evolved from a static HTML/CSS prototype into a fully integrated, production-ready system featuring a dynamic customer storefront, a 3D product showcase stage, an interactive authentication suite, a robust RESTful API backend, and a comprehensive Admin Dashboard.

---

## 🌐 Live Production Links

* 🌐 **Live Storefront Website:** [https://fleva-website.vercel.app](https://fleva-website.vercel.app)
* 🛍️ **Shop Catalog:** [https://fleva-website.vercel.app/shop.html](https://fleva-website.vercel.app/shop.html)
* 🎁 **Product Details (PDP):** [https://fleva-website.vercel.app/product.html?id=fleva-starter-gift-box](https://fleva-website.vercel.app/product.html?id=fleva-starter-gift-box)
* 🎨 **Admin Dashboard:** [https://fleva-website.vercel.app/admin](https://fleva-website.vercel.app/admin)
* 📦 **GitHub Repository:** [https://github.com/hasin404/Fleva-website](https://github.com/hasin404/Fleva-website)

---

## 🏗️ System Architecture & Connectivity

The architecture follows a decoupled client-server model, ensuring separation of concerns and high scalability.

### 1. Database Layer (MongoDB & Mongoose)
The absolute source of truth for the platform.
- **Products & Inventory**: Stores all product metadata, pricing, stock levels, and image URLs.
- **Users**: Securely stores customer and admin accounts, utilizing encrypted passwords and role-based access control (`user`, `admin`, `superadmin`).
- **Orders**: Tracks customer carts converted to purchases, along with their fulfillment status (`pending`, `shipped`, `delivered`).
- **Storefront Config**: A unique global document that manages dynamic UI settings, such as the floating hero images on the homepage, without requiring hardcoded HTML changes.

### 2. Backend API Layer (Node.js & Express)
The engine of the application, responsible for enforcing business rules, security, and data flow.
- **Authentication System**: Uses dual-layered JWT (JSON Web Tokens). It validates admin access via HttpOnly cookies and `sessionStorage` tokens to prevent 403 Forbidden errors while keeping state secure.
- **RESTful Endpoints**: Provides `/api/v1/...` routes. The frontend consumes public routes (e.g., fetching products, global search), while the Admin Panel consumes protected routes (e.g., updating inventory, viewing analytics).
- **File Handling & Vercel Gateway**: Serves images and exports the Express application via `/api/index.js` for zero-config Vercel serverless deployment.

### 3. Customer Storefront (Frontend)
Built with lightweight Vanilla JavaScript, HTML5, and CSS3 for lightning-fast performance.
- **3D Looping Hero Showcase**: Features a 2.6-second continuous 3D rotation stage (`transform-style: preserve-3d`) showcasing primary product packages (Pouch, Can, Fruit Chips).
- **Dynamic Ambient Color Glow**: A deep 3D background layer (`-300px` transform depth, `z-index: 0`) that smoothly morphs radial glow colors (Strawberry Crimson Red, Cocoa Amber Brown, Mango Yellow-Orange) depending on the active centered product.
- **Interactive Eye-Tracking Authentication**: `login.html` and `signup.html` feature interactive googly eyes that calculate real-time angle and radius offsets to track customer mouse cursor movements.
- **Dynamic Hydration**: Scripts (`script.js`) fetch data from the Backend API to dynamically build product grids, individual product pages (`shop.html`, `product.html`), search results, and single AI Assistant chat interactions.
- **Checkout & Cart**: Managed locally and synced with the backend during checkout (`checkout.html`), supporting 20% advance pre-order calculations and delivery fees.

### 4. Admin Dashboard (`/admin`)
A bespoke, secure single-page application built for store managers.
- **Real-time Management**: Interacts directly with protected backend APIs to manage CRUD operations for Products, Orders, Customers, Banners, and Coupons.
- **Storefront Customization**: Allows admins to upload real fruit images directly into the slots of the homepage Hero section, syncing instantly with the customer-facing site.
- **Responsive & Ergonomic**: Features a mobile-friendly slide-out drawer navigation, top-right profile toggles, and horizontally scrolling data tables so the store can be managed from a phone on the go.

---

## 🗺️ Implementation Roadmap (Accomplished)

1. **Phase 1: Foundation & Auth**
   - Established the Node/Express backend and MongoDB connection.
   - Built the JWT authentication flow, isolating Admin vs. Customer scopes.
   - Fixed token collision bugs (`403 Forbidden`) by strictly separating admin `sessionStorage` keys.

2. **Phase 2: Product & Inventory Engine**
   - Migrated hardcoded HTML products into MongoDB.
   - Created the Product API and hydrated `shop.html` and `product.html`.
   - Implemented pre-order logic, including custom 20% advance payment calculations inside the checkout flow.
   - Engineered a robust Global Search feature with an interactive overlay.

3. **Phase 3: Admin Dashboard Ecosystem**
   - Built out the full suite of Admin panels (`dashboard.html`, `products.html`, `orders.html`, `customers.html`, `storefront.html`).
   - Hooked up `admin.js` to securely fetch and mutate backend data.
   - Allowed dynamic image uploads from the admin panel directly into the backend storage.

4. **Phase 4: Responsive Design & Polish**
   - Executed a comprehensive CSS overhaul across the entire platform.
   - Transformed rigid desktop layouts into fluid, mobile-first grids.
   - Compacted UI elements (Search bars, Checkout summaries, Admin tables) to ensure maximum screen real-estate usage on mobile devices.
   - Implemented sleek side-drawer UI patterns for admin forms and navigation.
   - Wired up dynamic footer links (Instagram/Facebook) and visual polish.

5. **Phase 5: Version 2 Features, 3D Showcase & Cloud Deployment (Newly Completed)**
   - **3D Product Showcase Carousel**: Engineered non-stop 3D rotation stage with responsive desktop and mobile stacking layouts.
   - **Dynamic Ambient Flavor Glow**: Created deep 3D background color aura morphing in sync with centered products.
   - **Interactive Cursor-Tracking Eyes**: Added real-time mouse tracking googly eyes to customer login and signup pages.
   - **PDP Slug Engine**: Upgraded `product.html` with fuzzy slug/ID resolution (`product.html?id=fleva-starter-gift-box`) and asynchronous catalog loading protection.
   - **Single Unified AI Assistant**: Streamlined floating AI chat widget (`chat-widget.js`) across all storefront pages.
   - **Vercel & MongoDB Atlas Deployment**: Deployed production build to Vercel serverless architecture connected to cloud MongoDB Atlas.

---

## 🚀 Future Roadmap & Next Steps (Phase 6)

To further enhance the platform, the following features are planned for future iterations:

### 1. Live Payment Gateway Integration
- **Local & Global Gateways**: Integrate live API keys for bKash, Nagad, SSLCommerz (Bangladesh), and Stripe (International cards).
- **Automated Payment Status Callbacks**: Real-time webhook listeners to auto-update order status from `pending` to `paid`.

### 2. Automated SMS & Email Notifications
- **Order Tracking Updates**: Send automated SMS/Email confirmations upon order placement, dispatch, and delivery.
- **Password Reset & OTP Verification**: Implement 6-digit OTP verification during customer registration.

### 3. Customer Reviews & Photo Submissions
- **Verified Buyer Reviews**: Allow authenticated customers to submit star ratings, reviews, and unboxing images on product PDP pages.

### 4. Advanced Admin Analytics & Inventory Alerts
- **CSV Data Export**: Export sales reports, order history, and customer lists to CSV.
- **Stock Threshold Alerts**: Automated admin dashboard notifications when product stock falls below 10 units.

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hasin404/Fleva-website.git
   cd Fleva-website
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables (`backend/.env`):**
   ```env
   PORT=3000
   MONGO_URI=mongodb+srv://abrar420240_db_user:NaLRCSO6gYnXORtG@fleva.bg54fva.mongodb.net/fleva?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Start the local development server:**
   ```bash
   node server.js
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

---

## 👤 Author

**Hasin Abrar (`hasin404`)**
- GitHub: [@hasin404](https://github.com/hasin404)
- Email: `hasinabrrr@gmail.com`

---

© 2026 FLEVA. All rights reserved.
