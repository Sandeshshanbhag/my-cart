// Script to add an admin user to Firestore
// Usage: node scripts/add-admin.js <email>
// Example: node scripts/add-admin.js sandesh@example.com

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address.');
  console.log('Usage: node scripts/add-admin.js <email>');
  process.exit(1);
}

async function addAdmin() {
  console.log(`🛡️  Adding admin: ${email}`);

  // Use email as the document ID for easy lookup
  const adminRef = doc(db, 'admins', email);
  await setDoc(adminRef, {
    email: email,
    role: 'admin',
    grantedAt: new Date().toISOString(),
  });

  console.log(`✅ ${email} is now an admin!`);
  process.exit(0);
}

addAdmin().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
