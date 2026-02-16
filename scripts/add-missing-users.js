// Manually add missing users to the Firestore 'users' collection
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  Timestamp,
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

// Users to add (registered before tracking was added)
const missingUsers = [
  { email: 'ravish.kini24@gmail.com', name: 'Ravish Kini' },
];

async function addMissingUsers() {
  // Sign in as admin to get write permission
  console.log('Signing in as admin...');
  await signInWithEmailAndPassword(auth, 'sandeshshanbhag540@gmail.com', process.argv[2]);

  for (const user of missingUsers) {
    const docRef = doc(db, 'users', user.email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`⏭️  Already exists: ${user.email}`);
    } else {
      await setDoc(docRef, {
        email: user.email,
        name: user.name,
        loginCount: 1,
        lastLoginAt: Timestamp.now(),
        registeredAt: Timestamp.now(),
      });
      console.log(`✅ Added: ${user.name} (${user.email})`);
    }
  }

  console.log('\n🎉 Done!');
  process.exit(0);
}

addMissingUsers().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
