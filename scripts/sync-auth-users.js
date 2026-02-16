// Script to sync all Firebase Auth users to Firestore 'users' collection
// This ensures all existing users appear in the admin Users tab
//
// SETUP:
// 1. Go to Firebase Console → Project Settings → Service Accounts
// 2. Click "Generate new private key" → Download the JSON file
// 3. Save it as: scripts/serviceAccountKey.json
// 4. Run: node scripts/sync-auth-users.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function syncAllUsers() {
  console.log('🔍 Fetching all Firebase Auth users...\n');

  const listUsersResult = await admin.auth().listUsers();
  const users = listUsersResult.users;

  console.log(`Found ${users.length} registered user(s)\n`);

  let synced = 0;
  let skipped = 0;

  for (const user of users) {
    const email = user.email;
    if (!email) continue;

    const name = user.displayName || email.split('@')[0];
    const registeredAt = new Date(user.metadata.creationTime);
    const lastLoginAt = user.metadata.lastSignInTime
      ? new Date(user.metadata.lastSignInTime)
      : registeredAt;

    // Check if user doc already exists
    const docRef = db.collection('users').doc(email);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      console.log(`⏭️  Skipped (already tracked): ${email}`);
      skipped++;
    } else {
      await docRef.set({
        email,
        name,
        loginCount: 1,
        lastLoginAt: admin.firestore.Timestamp.fromDate(lastLoginAt),
        registeredAt: admin.firestore.Timestamp.fromDate(registeredAt),
      });
      console.log(`✅ Synced: ${name} (${email})`);
      synced++;
    }
  }

  console.log(`\n🎉 Done! Synced: ${synced}, Skipped: ${skipped}, Total: ${users.length}`);
  process.exit(0);
}

syncAllUsers().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
