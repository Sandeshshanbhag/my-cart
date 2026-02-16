const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyCxmlNH1poS382spz1cHg_hpad-T0zHNtI',
  authDomain: 'my-cart-54506.firebaseapp.com',
  projectId: 'my-cart-54506',
  storageBucket: 'my-cart-54506.firebasestorage.app',
  messagingSenderId: '577704235987',
  appId: '1:577704235987:web:94311fb4608f46a5011526',
});

const db = getFirestore(app);

async function run() {
  const allRef = collection(db, 'adminRequests');
  const allSnap = await getDocs(allRef);
  console.log('Total admin requests:', allSnap.size);
  allSnap.forEach(d => console.log('  ', d.id, JSON.stringify(d.data())));

  const q = query(allRef, where('status', '==', 'pending'));
  const pendingSnap = await getDocs(q);
  console.log('\nPending requests:', pendingSnap.size);
  pendingSnap.forEach(d => console.log('  ', d.id, JSON.stringify(d.data())));

  process.exit(0);
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
