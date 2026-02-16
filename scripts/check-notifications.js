// Check notifications collection and test without composite index
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} = require('firebase/firestore');
const {
  getAuth,
  signInWithEmailAndPassword,
} = require('firebase/auth');

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
const auth = getAuth(app);

async function checkNotifications() {
  // Sign in to get access
  await signInWithEmailAndPassword(auth, 'sandeshshanbhag540@gmail.com', process.argv[2]);
  console.log('✅ Signed in\n');

  // Check ALL notifications (no filter)
  console.log('--- All documents in "notifications" collection ---');
  const allSnapshot = await getDocs(collection(db, 'notifications'));
  
  if (allSnapshot.empty) {
    console.log('❌ Collection is EMPTY - no notifications exist');
  } else {
    console.log(`Found ${allSnapshot.size} notification(s):\n`);
    allSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  ID: ${doc.id}`);
      console.log(`  To: ${data.userEmail}`);
      console.log(`  Type: ${data.type}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Message: ${data.message}`);
      console.log(`  Read: ${data.read}`);
      console.log(`  Created: ${data.createdAt?.toDate()}`);
      console.log('');
    });
  }

  process.exit(0);
}

checkNotifications().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
