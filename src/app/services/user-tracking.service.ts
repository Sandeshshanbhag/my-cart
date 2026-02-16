import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  increment,
  Timestamp,
} from '@angular/fire/firestore';

export interface TrackedUser {
  email: string;
  name: string;
  loginCount: number;
  lastLoginAt: Date;
  registeredAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class UserTrackingService {
  private firestore = inject(Firestore);

  /**
   * Called on user registration — creates a new user doc with loginCount = 1
   */
  async trackRegistration(email: string, name: string): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', email);
    await setDoc(userDocRef, {
      email,
      name,
      loginCount: 1,
      lastLoginAt: Timestamp.now(),
      registeredAt: Timestamp.now(),
    });
  }

  /**
   * Called on user login — increments loginCount and updates lastLoginAt
   */
  async trackLogin(email: string, name: string): Promise<void> {
    const userDocRef = doc(this.firestore, 'users', email);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      await updateDoc(userDocRef, {
        loginCount: increment(1),
        lastLoginAt: Timestamp.now(),
        name, // keep name updated
      });
    } else {
      // User exists in Auth but no tracking doc (e.g. registered before tracking was added)
      await setDoc(userDocRef, {
        email,
        name,
        loginCount: 1,
        lastLoginAt: Timestamp.now(),
        registeredAt: Timestamp.now(),
      });
    }
  }

  /**
   * Get all tracked users — for admin panel
   */
  async getAllUsers(): Promise<TrackedUser[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, orderBy('lastLoginAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        email: data['email'],
        name: data['name'],
        loginCount: data['loginCount'] || 0,
        lastLoginAt: data['lastLoginAt']?.toDate() || new Date(),
        registeredAt: data['registeredAt']?.toDate() || new Date(),
      } as TrackedUser;
    });
  }
}
