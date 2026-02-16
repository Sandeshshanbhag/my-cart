// Check what's in the Firestore 'users' collection
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkUsers() {
  console.log('Checking Firestore "users" collection...\n');
  const snapshot = await getDocs(collection(db, 'users'));
  
  if (snapshot.empty) {
    console.log('❌ Collection is EMPTY - no users tracked yet');
  } else {
    console.log(`Found ${snapshot.size} user(s):\n`);
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  📧 ${doc.id}`);
      console.log(`     Name: ${data.name}`);
      console.log(`     Login Count: ${data.loginCount}`);
      console.log(`     Last Login: ${data.lastLoginAt?.toDate()}`);
      console.log(`     Registered: ${data.registeredAt?.toDate()}`);
      console.log('');
    });
  }
  process.exit(0);
}

checkUsers().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
