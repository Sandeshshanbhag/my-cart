// Seed script to populate Firestore with products
// Run: node scripts/seed-products.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, deleteDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyCxmlNH1poS382spz1cHg_hpad-T0zHNtI',
  authDomain: 'my-cart-54506.firebaseapp.com',
  projectId: 'my-cart-54506',
  storageBucket: 'my-cart-54506.firebasestorage.app',
  messagingSenderId: '577704235987',
  appId: '1:577704235987:web:94311fb4608f46a5011526',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const products = [
  // Electronics
  {
    id: 1,
    title: 'Wireless Bluetooth Headphones',
    price: 59.99,
    description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and comfortable over-ear design.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 342 },
  },
  {
    id: 2,
    title: 'Smart Watch Fitness Tracker',
    price: 129.99,
    description: 'Advanced fitness tracker with heart rate monitor, GPS, sleep tracking, and 7-day battery life.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 218 },
  },
  {
    id: 3,
    title: 'Portable Bluetooth Speaker',
    price: 39.99,
    description: 'Waterproof portable speaker with 360-degree sound, 12-hour playtime, and built-in microphone.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop',
    rating: { rate: 4.1, count: 156 },
  },
  {
    id: 4,
    title: 'USB-C Fast Charging Cable',
    price: 12.99,
    description: 'Braided nylon USB-C cable with fast charging support, 6ft length, and durable connectors.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 891 },
  },
  {
    id: 5,
    title: 'Wireless Charging Pad',
    price: 24.99,
    description: 'Slim wireless charging pad compatible with all Qi-enabled devices. LED indicator and anti-slip surface.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400&h=400&fit=crop',
    rating: { rate: 4.0, count: 267 },
  },
  {
    id: 6,
    title: 'Mechanical Gaming Keyboard',
    price: 89.99,
    description: 'RGB backlit mechanical keyboard with blue switches, anti-ghosting, and programmable macro keys.',
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop',
    rating: { rate: 4.7, count: 445 },
  },

  // Clothing
  {
    id: 7,
    title: 'Classic Denim Jacket',
    price: 64.99,
    description: 'Timeless denim jacket with button closure, chest pockets, and comfortable cotton blend fabric.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=400&fit=crop',
    rating: { rate: 4.4, count: 189 },
  },
  {
    id: 8,
    title: 'Premium Cotton T-Shirt',
    price: 19.99,
    description: 'Soft premium cotton crew-neck t-shirt available in multiple colors. Pre-shrunk and fade-resistant.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    rating: { rate: 4.2, count: 567 },
  },
  {
    id: 9,
    title: 'Running Shoes - Lightweight',
    price: 79.99,
    description: 'Breathable mesh running shoes with cushioned sole, arch support, and reflective details for night runs.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 312 },
  },
  {
    id: 10,
    title: 'Leather Belt - Brown',
    price: 29.99,
    description: 'Genuine leather belt with classic buckle. Perfect for casual and formal wear.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 145 },
  },
  {
    id: 11,
    title: 'Warm Winter Hoodie',
    price: 44.99,
    description: 'Fleece-lined hoodie with kangaroo pocket and adjustable drawstring hood. Perfect for cold weather.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 278 },
  },
  {
    id: 12,
    title: 'Aviator Sunglasses',
    price: 34.99,
    description: 'Classic aviator sunglasses with UV400 protection, metal frame, and polarized lenses.',
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    rating: { rate: 4.1, count: 423 },
  },

  // Home & Kitchen
  {
    id: 13,
    title: 'Stainless Steel Water Bottle',
    price: 22.99,
    description: 'Double-wall insulated water bottle keeps drinks cold 24hrs or hot 12hrs. BPA-free, 750ml capacity.',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop',
    rating: { rate: 4.7, count: 634 },
  },
  {
    id: 14,
    title: 'Ceramic Coffee Mug Set',
    price: 18.99,
    description: 'Set of 4 elegant ceramic mugs, 12oz each. Microwave and dishwasher safe with comfortable handles.',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop',
    rating: { rate: 4.4, count: 201 },
  },
  {
    id: 15,
    title: 'Non-Stick Frying Pan',
    price: 32.99,
    description: '10-inch non-stick frying pan with heat-resistant handle and even heat distribution. PFOA-free coating.',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
    rating: { rate: 4.2, count: 178 },
  },
  {
    id: 16,
    title: 'Bamboo Cutting Board',
    price: 16.99,
    description: 'Eco-friendly bamboo cutting board with juice groove and easy-grip handles. Knife-friendly surface.',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 312 },
  },
  {
    id: 17,
    title: 'Scented Candle - Lavender',
    price: 14.99,
    description: 'Hand-poured soy wax candle with natural lavender essential oil. 50-hour burn time.',
    category: 'home',
    image: 'https://images.unsplash.com/photo-1602607663858-40ca2969a187?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 489 },
  },

  // Books
  {
    id: 18,
    title: 'The Art of Programming',
    price: 42.99,
    description: 'Comprehensive guide to modern software development practices, design patterns, and clean code principles.',
    category: 'books',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop',
    rating: { rate: 4.8, count: 723 },
  },
  {
    id: 19,
    title: 'Mindfulness Journal',
    price: 15.99,
    description: 'Guided mindfulness journal with daily prompts, gratitude exercises, and reflection pages. Hardcover.',
    category: 'books',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 198 },
  },
  {
    id: 20,
    title: 'Cooking Made Simple',
    price: 28.99,
    description: 'Over 200 easy recipes for beginners. Full-color photos, meal plans, and nutritional information included.',
    category: 'books',
    image: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 345 },
  },

  // Sports & Outdoors
  {
    id: 21,
    title: 'Yoga Mat - Premium',
    price: 34.99,
    description: 'Extra thick 6mm yoga mat with non-slip surface, alignment lines, and carrying strap included.',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 412 },
  },
  {
    id: 22,
    title: 'Resistance Bands Set',
    price: 19.99,
    description: 'Set of 5 resistance bands with different strength levels. Includes door anchor and carrying bag.',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=400&fit=crop',
    rating: { rate: 4.4, count: 567 },
  },
  {
    id: 23,
    title: 'Camping Backpack - 40L',
    price: 54.99,
    description: 'Waterproof hiking backpack with multiple compartments, padded straps, and hydration bladder pocket.',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 234 },
  },
  {
    id: 24,
    title: 'Jump Rope - Speed',
    price: 11.99,
    description: 'Adjustable speed jump rope with ball bearings, foam handles, and tangle-free steel cable.',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400&h=400&fit=crop',
    rating: { rate: 4.2, count: 189 },
  },

  // Beauty & Personal Care
  {
    id: 25,
    title: 'Facial Moisturizer - SPF 30',
    price: 24.99,
    description: 'Lightweight daily moisturizer with SPF 30, hyaluronic acid, and vitamin E. For all skin types.',
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 678 },
  },
  {
    id: 26,
    title: 'Organic Lip Balm Pack',
    price: 9.99,
    description: 'Pack of 4 organic lip balms with natural ingredients. Flavors: vanilla, honey, mint, and berry.',
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 345 },
  },
  {
    id: 27,
    title: 'Hair Care Gift Set',
    price: 36.99,
    description: 'Premium shampoo, conditioner, and hair mask set. Sulfate-free formula with argan oil and keratin.',
    category: 'beauty',
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54571a9f7?w=400&h=400&fit=crop',
    rating: { rate: 4.4, count: 256 },
  },

  // Toys & Games
  {
    id: 28,
    title: 'Building Blocks Set - 500 Pieces',
    price: 29.99,
    description: 'Creative building blocks set with 500 colorful pieces. Compatible with major brands. Ages 4+.',
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d7dd0?w=400&h=400&fit=crop',
    rating: { rate: 4.7, count: 534 },
  },
  {
    id: 29,
    title: 'Board Game - Strategy',
    price: 34.99,
    description: 'Award-winning strategy board game for 2-6 players. Average playtime 45 minutes. Ages 10+.',
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1611371805429-8b5c1b2c34ba?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 312 },
  },
  {
    id: 30,
    title: 'RC Drone with Camera',
    price: 89.99,
    description: 'Mini drone with HD camera, one-key takeoff, altitude hold, and 15-minute flight time. Great for beginners.',
    category: 'toys',
    image: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?w=400&h=400&fit=crop',
    rating: { rate: 4.2, count: 187 },
  },
];

async function seed() {
  console.log('🌱 Seeding Firestore with products...\n');

  // Clear existing products
  const productsRef = collection(db, 'products');
  const existing = await getDocs(productsRef);
  console.log(`  Deleting ${existing.size} existing products...`);
  for (const doc of existing.docs) {
    await deleteDoc(doc.ref);
  }

  // Add new products
  for (const product of products) {
    await addDoc(productsRef, product);
    console.log(`  ✅ Added: ${product.title}`);
  }

  console.log(`\n🎉 Done! ${products.length} products seeded to Firestore.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
