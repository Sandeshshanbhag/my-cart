const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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
  await setDoc(doc(db, 'admins', 'sandeshshanbhag540@gmail.com'), {
    email: 'sandeshshanbhag540@gmail.com',
    role: 'superAdmin',
    grantedAt: new Date().toISOString(),
  });
  console.log('✅ Fixed: sandeshshanbhag540@gmail.com is now superAdmin again');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
