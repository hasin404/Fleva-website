/* ==========================================================================
   FLEVA — Complete Database Reset & Seed Script
   Clears all stale data and initializes a clean, production-ready environment.
   Run: npm run seed (or node utils/seedData.js)
   ========================================================================== */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Storefront = require('../models/Storefront');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const AIChat = require('../models/AIChat');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const Review = require('../models/Review');

const categories = [
  { name: 'Protein Bars', description: 'High-protein bars for energy and recovery' },
  { name: 'Freeze-Dried Fruits', description: 'Whole fruits, freeze-dried to a perfect crunch' },
  { name: 'Chocolate Fruits', description: 'Freeze-dried fruit dipped in real dark chocolate' },
  { name: 'Fruit Chips', description: 'Sliced and dried to a crispy chip' },
  { name: 'Fruit Powders', description: 'Concentrated freeze-dried berry powder' },
  { name: 'Gift Boxes', description: 'Curated gift boxes of FLEVA favourites' },
  { name: 'Bundles', description: 'Multi-pack bundles at great value' },
];

const products = [
  {
    title: 'Protein Bar — Chocolate Nut Crunch',
    description: 'A dense, chewy bar loaded with real nuts and dark chocolate. 25g of protein, zero guilt, all crunch.',
    price: 350,
    categoryName: 'Protein Bars',
    stock: 200,
    sku: 'FLV-PB-001',
    tags: ['protein', 'chocolate', 'nuts', 'energy'],
    isBestSeller: true,
    isFeatured: true,
    color: '#7A4B26',
    accent: 'var(--lime)',
    tag: '25G PROTEIN',
    availability: 'in-stock',
    images: [{ url: '/assets/products/protein-bars.png', alt: 'Protein Bar — Chocolate Nut Crunch' }],
  },
  {
    title: 'Freeze-Dried Strawberries',
    description: 'Whole strawberries, freeze-dried to a light crunch. Nothing added, nothing hidden — just fruit.',
    price: 450,
    categoryName: 'Freeze-Dried Fruits',
    stock: 150,
    sku: 'FLV-FD-001',
    tags: ['strawberry', 'freeze-dried', 'healthy', 'vegan'],
    isBestSeller: true,
    isFeatured: true,
    color: '#D91C4A',
    accent: 'var(--pink)',
    tag: '100% REAL',
    availability: 'in-stock',
    images: [{ url: '/assets/products/freeze-dried-fruits.png', alt: 'Freeze-Dried Strawberries' }],
  },
  {
    title: 'Chocolate-Dipped Fruit Mix',
    description: 'Freeze-dried fruit dipped in real dark chocolate. Sweet, tart, and snappy in every bite.',
    price: 480,
    categoryName: 'Chocolate Fruits',
    stock: 120,
    sku: 'FLV-CF-001',
    tags: ['chocolate', 'fruit', 'mix', 'snack'],
    isFeatured: true,
    color: '#3A2418',
    accent: 'var(--lime)',
    tag: 'SMALL BATCH',
    availability: 'pre-order',
    advancePaymentPercentage: 20,
    images: [{ url: '/assets/products/chocolate-fruits.png', alt: 'Chocolate-Dipped Fruit Mix' }],
  },
  {
    title: 'Tropical Fruit Chips',
    description: 'Kiwi, mango and banana, sliced and dried to a crisp. Tastes like sunshine, keeps like a snack.',
    price: 420,
    categoryName: 'Fruit Chips',
    stock: 180,
    sku: 'FLV-FC-001',
    tags: ['tropical', 'kiwi', 'mango', 'banana', 'chips'],
    isFeatured: true,
    color: '#E0A72E',
    accent: 'var(--plum)',
    tag: 'NO SUGAR ADDED',
    availability: 'in-stock',
    images: [{ url: '/assets/products/fruit-chips.png', alt: 'Tropical Fruit Chips' }],
  },
  {
    title: 'Berry Power Powder',
    description: 'Concentrated freeze-dried berries, milled fine. Stir into yogurt, smoothies, or oats.',
    price: 600,
    categoryName: 'Fruit Powders',
    stock: 80,
    sku: 'FLV-FP-001',
    tags: ['berry', 'powder', 'smoothie', 'superfood'],
    color: '#6C2BD9',
    accent: 'var(--pink)',
    tag: '1 JAR = 3KG FRUIT',
    availability: 'in-stock',
    images: [{ url: '/assets/products/fruit-powders.png', alt: 'Berry Power Powder' }],
  },
  {
    title: 'FLEVA Starter Gift Box',
    description: 'A curated box of our six favourites. Built for gifting, dangerously easy to keep for yourself.',
    price: 1200,
    categoryName: 'Gift Boxes',
    stock: 50,
    sku: 'FLV-GB-001',
    tags: ['gift', 'box', 'starter', 'bundle'],
    isFeatured: true,
    color: '#16140F',
    accent: 'var(--lime)',
    tag: '6 SNACKS INSIDE',
    availability: 'in-stock',
    images: [{ url: '/assets/products/gift-boxes.png', alt: 'FLEVA Starter Gift Box' }],
  },
];

async function seed() {
  try {
    await connectDB();
    console.log('🧹 Clearing old localhost database collections...');

    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
      Storefront.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
      Inventory.deleteMany({}),
      AIChat.deleteMany({}),
      Cart.deleteMany({}),
      Notification.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('   ✅ All collections cleared.');

    // 1. Categories
    const createdCategories = [];
    for (const cat of categories) {
      const c = await Category.create(cat);
      createdCategories.push(c);
    }
    console.log(`   ✅ Created ${createdCategories.length} categories.`);

    const catMap = {};
    createdCategories.forEach(c => { catMap[c.name] = c._id; });

    // 2. Products
    const createdProducts = [];
    for (const p of products) {
      p.category = catMap[p.categoryName] || null;
      const prod = await Product.create(p);
      createdProducts.push(prod);
    }
    console.log(`   ✅ Created ${createdProducts.length} products.`);

    // 3. Admin User
    const adminUser = await User.create({
      customerId: 'CUST-ADMIN01',
      name: 'FLEVA Admin',
      email: 'admin@fleva.com',
      phone: '01700000000',
      dob: new Date('1990-01-01'),
      password: 'admin123456',
      role: 'superadmin',
      isVerified: true,
    });
    console.log('   ✅ Admin created (admin@fleva.com / admin123456).');

    // 4. Storefront Config & Cravings Mapping
    await Storefront.create({
      globalId: 'main',
      heroTitle: 'Real fruits.<br>Crazy good.<span class="stroke">Fleva.</span>',
      heroSubtitle: 'From snacking to sharing, we make healthy feel insanely delicious.',
      heroBtnText: 'Explore now',
      heroBtnLink: 'shop.html',
      heroImage1: 'assets/hero/pouch-front.png',
      heroImage2: 'assets/hero/can-front.png',
      cravingImg1: 'assets/craving/product-1.png',
      cravingImg2: 'assets/craving/product-2.png',
      cravingImg3: 'assets/craving/product-3.png',
      cravingImgMain: 'assets/craving/product-main.png',
      deliveryFee: 80,
      cravings: {
        energy: createdProducts[0]._id,      // Protein Bar
        fruity: createdProducts[1]._id,      // Freeze-Dried Strawberries
        guiltFree: createdProducts[3]._id,   // Tropical Fruit Chips
        surprise: createdProducts[2]._id,    // Chocolate-Dipped Fruit Mix
      }
    });
    console.log('   ✅ Storefront settings initialized with default cravings.');

    // 5. Banners
    await Banner.create({
      title: 'Real Fruits. Crazy Good.',
      subtitle: 'From snacking to sharing, we make healthy feel insanely delicious.',
      link: '/shop.html',
      type: 'hero',
      image: { url: 'assets/hero/pouch-front.png' },
      isActive: true,
      sortOrder: 1,
    });
    await Banner.create({
      title: 'Flash Sale — 10% Off Everything',
      subtitle: 'Use coupon FLEVA10 at checkout.',
      link: '/shop.html',
      type: 'flash-sale',
      image: { url: 'assets/products/freeze-dried-fruits.png' },
      isActive: true,
      sortOrder: 2,
    });
    console.log('   ✅ Banners created.');

    // 6. Coupons
    await Coupon.create({
      code: 'FLEVA10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 500,
      maxDiscount: 200,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 1000,
      isActive: true,
    });
    await Coupon.create({
      code: 'WELCOME50',
      type: 'fixed',
      value: 50,
      minOrderAmount: 300,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
      isActive: true,
    });
    console.log('   ✅ Sample coupons created (FLEVA10, WELCOME50).');

    console.log('\n🎉 FLEVA Database reset and seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
