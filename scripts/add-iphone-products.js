// Script to add iPhone-related products to Firestore
// Run: node scripts/add-iphone-products.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

const iphoneProducts = [
  {
    id: 101,
    title: 'iPhone 16 Pro Max - 256GB',
    price: 1199.99,
    description: 'Apple iPhone 16 Pro Max with A18 Pro chip, 48MP camera system, titanium design, and all-day battery life. Available in Desert Titanium.',
    category: 'iphone',
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop',
    rating: { rate: 4.8, count: 1254 },
  },
  {
    id: 102,
    title: 'iPhone 16 Pro - 128GB',
    price: 999.99,
    description: 'Apple iPhone 16 Pro with A18 Pro chip, Camera Control button, 48MP Fusion camera, and stunning Super Retina XDR display.',
    category: 'iphone',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
    rating: { rate: 4.7, count: 982 },
  },
  {
    id: 103,
    title: 'iPhone 16 - 128GB',
    price: 799.99,
    description: 'Apple iPhone 16 with A18 chip, advanced dual-camera system, Action button, and Dynamic Island. Available in 5 stunning colors.',
    category: 'iphone',
    image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop',
    rating: { rate: 4.6, count: 876 },
  },
  {
    id: 104,
    title: 'iPhone 15 - 128GB',
    price: 699.99,
    description: 'Apple iPhone 15 with A16 Bionic chip, 48MP camera, Dynamic Island, USB-C connectivity, and ceramic shield front.',
    category: 'iphone',
    image: 'https://images.unsplash.com/photo-1591337676887-a217a6c6e7d0?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 2341 },
  },
  {
    id: 105,
    title: 'iPhone SE (3rd Gen) - 64GB',
    price: 429.99,
    description: 'Apple iPhone SE with A15 Bionic chip, Touch ID, 4.7-inch Retina HD display, and 12MP camera. The most affordable iPhone.',
    category: 'iphone',
    image: 'https://images.unsplash.com/photo-1624348305923-3765e3b839e3?w=400&h=400&fit=crop',
    rating: { rate: 4.2, count: 1567 },
  },
  {
    id: 106,
    title: 'iPhone MagSafe Leather Case',
    price: 59.99,
    description: 'Premium leather case with MagSafe compatibility. Snaps perfectly into place, protects your iPhone with style. Available in multiple colors.',
    category: 'iphone accessories',
    image: 'https://images.unsplash.com/photo-1603313011101-320576395fb5?w=400&h=400&fit=crop',
    rating: { rate: 4.4, count: 534 },
  },
  {
    id: 107,
    title: 'iPhone MagSafe Charger',
    price: 39.99,
    description: 'Apple MagSafe wireless charger with perfectly aligned magnets for faster wireless charging up to 15W. Compatible with iPhone 12 and later.',
    category: 'iphone accessories',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop',
    rating: { rate: 4.3, count: 891 },
  },
  {
    id: 108,
    title: 'iPhone Screen Protector - Tempered Glass',
    price: 14.99,
    description: '9H hardness tempered glass screen protector for iPhone. Anti-scratch, anti-fingerprint, bubble-free installation with alignment frame.',
    category: 'iphone accessories',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop',
    rating: { rate: 4.1, count: 2876 },
  },
  {
    id: 109,
    title: 'AirPods Pro (2nd Gen) with USB-C',
    price: 249.99,
    description: 'Apple AirPods Pro with Active Noise Cancellation, Adaptive Audio, Personalized Spatial Audio, and MagSafe charging case with USB-C.',
    category: 'iphone accessories',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop',
    rating: { rate: 4.7, count: 3421 },
  },
  {
    id: 110,
    title: 'iPhone 20W USB-C Power Adapter',
    price: 19.99,
    description: 'Apple 20W USB-C power adapter for fast charging your iPhone. Charges up to 50% in around 30 minutes with compatible cable.',
    category: 'iphone accessories',
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop',
    rating: { rate: 4.5, count: 4123 },
  },
];

async function addProducts() {
  console.log('📱 Adding iPhone products to Firestore...\n');

  const productsRef = collection(db, 'products');

  for (const product of iphoneProducts) {
    await addDoc(productsRef, product);
    console.log(`  ✅ Added: ${product.title}`);
  }

  console.log(`\n🎉 Done! ${iphoneProducts.length} iPhone products added to Firestore.`);
  process.exit(0);
}

addProducts().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
