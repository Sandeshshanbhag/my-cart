import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  Firestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  addDoc,
  collection,
  query,
  where,
  updateDoc,
} from '@angular/fire/firestore';

export interface AdminUser {
  email: string;
  role: string;
  grantedAt: string;
}

export interface AdminRequest {
  id: string;
  userEmail: string;
  userName: string;
  reason: string;
  status: string;
  requestedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private firestore = inject(Firestore);

  isAdmin(email: string): Observable<boolean> {
    if (!email) return of(false);
    const adminDoc = doc(this.firestore, 'admins', email);
    return from(getDoc(adminDoc)).pipe(
      map((docSnap) => docSnap.exists()),
      catchError(() => of(false))
    );
  }

  isSuperAdmin(email: string): Observable<boolean> {
    if (!email) return of(false);
    const adminDoc = doc(this.firestore, 'admins', email);
    return from(getDoc(adminDoc)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) return false;
        const data = docSnap.data();
        return data?.['role'] === 'superAdmin';
      }),
      catchError(() => of(false))
    );
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    const adminsRef = collection(this.firestore, 'admins');
    const snapshot = await getDocs(adminsRef);
    return snapshot.docs.map((d) => d.data() as AdminUser);
  }

  async removeAdmin(email: string, reason: string): Promise<void> {
    // Log the removal with reason so user can see why
    const removedRef = collection(this.firestore, 'removedAdmins');
    await addDoc(removedRef, {
      email,
      reason,
      removedAt: new Date().toISOString(),
    });
    // Remove from admins collection
    const adminDoc = doc(this.firestore, 'admins', email);
    await deleteDoc(adminDoc);
  }

  async getAdminRequests(): Promise<AdminRequest[]> {
    const requestsRef = collection(this.firestore, 'adminRequests');
    const q = query(requestsRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as AdminRequest[];
  }

  async approveRequest(request: AdminRequest): Promise<void> {
    // Check if user already exists as admin (don't overwrite superAdmin)
    const adminDocRef = doc(this.firestore, 'admins', request.userEmail);
    const existing = await getDoc(adminDocRef);
    if (!existing.exists()) {
      await setDoc(adminDocRef, {
        email: request.userEmail,
        role: 'admin',
        grantedAt: new Date().toISOString(),
      });
    }
    // Update request status
    const requestDoc = doc(this.firestore, 'adminRequests', request.id);
    await updateDoc(requestDoc, { status: 'approved' });
  }

  async rejectRequest(requestId: string): Promise<void> {
    const requestDoc = doc(this.firestore, 'adminRequests', requestId);
    await updateDoc(requestDoc, { status: 'rejected' });
  }
}
