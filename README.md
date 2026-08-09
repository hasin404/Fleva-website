# 🍓 FLEVA — Real Fruits. Crazy Good.

> **Full-Stack Premium E-Commerce Platform** featuring a 3D Continuous Product Showcase, Dynamic Ambient Flavor Color Glow, Interactive Cursor-Tracking Authentication Pages, and a Bespoke Admin Management System.

---

## 🌐 Live Production Links

* 🌐 **Live Website:** [https://fleva-website.vercel.app](https://fleva-website.vercel.app)
* 🛍️ **Shop Catalog:** [https://fleva-website.vercel.app/shop.html](https://fleva-website.vercel.app/shop.html)
* 🎁 **Product Details (PDP):** [https://fleva-website.vercel.app/product.html?id=fleva-starter-gift-box](https://fleva-website.vercel.app/product.html?id=fleva-starter-gift-box)
* 🎨 **Admin Control Panel:** [https://fleva-website.vercel.app/admin](https://fleva-website.vercel.app/admin)
* 📦 **GitHub Repository:** [https://github.com/hasin404/Fleva-website](https://github.com/hasin404/Fleva-website)

---

## ✨ Key Features & Version 2 Highlights

### 1. 🌀 3D Continuous Product Showcase Carousel
- **Non-Stop 3D Stage**: Smooth 2.6-second continuous rotation loop showcasing FLEVA's primary product packages (Pouch, Can, Fruit Chips) in 3D perspective depth (`transform-style: preserve-3d`).
- **Dynamic Perspective Layout**: Responsive positioning optimized for wide desktop monitor layouts and mobile top-center stack views.

### 2. 🌈 Dynamic Ambient Product Color Glow
- **Deep 3D Layering**: Positioned at `-300px` background depth behind all product packages (`z-index: 0`).
- **Flavor Color Morphing**: Smoothly transitions soft radial color glow as each product comes forward:
  - 🍓 **Pouch**: Vibrant Strawberry Crimson Red/Pink (`#FF1E56`)
  - 🍫 **Can**: Rich Chocolate Cocoa Amber (`#A0522D`)
  - 🥭 **Fruit Chips**: Bright Mango Yellow-Orange (`#FF9900`)

### 3. 👀 Interactive Cursor-Tracking Authentication (Login & Signup)
- **Googly Eye Tracking**: Embedded inside the dark visual panel of `login.html` and `signup.html`.
- **Real-Time Physics**: Both eye pupils dynamically compute cursor angle and radius offset on mousemove, creating a playful, engaging user experience.

### 4. 🛍️ Dynamic PDP (Product Detail Page) Engine
- **Fuzzy Slug & ID Resolution**: Parses human-readable slugs (e.g. `?id=fleva-starter-gift-box`) and MongoDB ObjectIds seamlessly.
- **Asynchronous Hydration**: Awaits catalog load to guarantee 100% render reliability without blank state flashes.

### 5. 🤖 Single Unified AI Chat Assistant
- Embedded AI floating assistant widget (`chat-widget.js`) integrated on all pages for instant customer assistance.

### 6. 🎨 Full-Featured Admin Control Panel (`/admin`)
- **Dashboard & Analytics**: Real-time sales, order stats, customer metrics, and revenue charts.
- **Full CRUD Management**: Products, Categories, Customer Accounts, Orders, Banners, and Coupons.
- **Storefront Customizer**: Dynamic home banner and hero image configuration without touching code.

---

## 🏗️ System Architecture

```
[ Frontend: HTML5 / CSS3 / Vanilla JS ] 
              │
              ▼ (Serverless Express API Routes)
[ Vercel API Gateway: /api/index.js ]
              │
              ▼
[ Node.js & Express REST Backend ]
              │
              ▼
[ Cloud Database: MongoDB Atlas Cluster ]
```

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Glassmorphism, 3D Transforms), Vanilla JavaScript (ES6+).
* **Backend**: Node.js, Express.js REST API.
* **Database**: MongoDB Atlas Cluster with Mongoose ODM.
* **Authentication**: Dual-Layered JWT (JSON Web Tokens) with HttpOnly cookies & role-based access control (`user`, `admin`, `superadmin`).
* **Deployment**: Vercel Serverless Functions (`/api/index.js`) & Vercel CDN.

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
   MONGO_URI=mongodb+srv://<username>:<password>@fleva.bg54fva.mongodb.net/fleva?retryWrites=true&w=majority
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
