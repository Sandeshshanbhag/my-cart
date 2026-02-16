const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, getDocs } = require('firebase/firestore');

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
  // Check all admins
  console.log('=== All Admins ===');
  const adminsRef = collection(db, 'admins');
  const allSnap = await getDocs(adminsRef);
  allSnap.forEach(d => console.log('Doc ID:', d.id, 'Data:', JSON.stringify(d.data())));

  // Check specific admin doc
  console.log('\n=== Check sandeshshanbhag540@gmail.com ===');
  const adminDoc = doc(db, 'admins', 'sandeshshanbhag540@gmail.com');
  const snap = await getDoc(adminDoc);
  console.log('Exists:', snap.exists());
  if (snap.exists()) {
    console.log('Data:', JSON.stringify(snap.data()));
    console.log('Role:', snap.data().role);
    console.log('Is superAdmin:', snap.data().role === 'superAdmin');
  }

  process.exit(0);
}

run().catch(e => { console.error('Error:', e); process.exit(1); });
