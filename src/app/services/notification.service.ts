import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';

export interface AppNotification {
  id?: string;
  userEmail: string;
  type: 'admin_approved' | 'admin_rejected' | 'admin_removed' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private firestore = inject(Firestore);

  /**
   * Create a notification for a user
   */
  async addNotification(
    userEmail: string,
    type: AppNotification['type'],
    title: string,
    message: string
  ): Promise<void> {
    const notifRef = collection(this.firestore, 'notifications');
    await addDoc(notifRef, {
      userEmail,
      type,
      title,
      message,
      read: false,
      createdAt: Timestamp.now(),
    });
  }

  /**
   * Get all notifications for a user (newest first)
   */
  async getNotifications(userEmail: string): Promise<AppNotification[]> {
    const notifRef = collection(this.firestore, 'notifications');
    const q = query(
      notifRef,
      where('userEmail', '==', userEmail)
    );
    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userEmail: data['userEmail'],
        type: data['type'],
        title: data['title'],
        message: data['message'],
        read: data['read'] || false,
        createdAt: data['createdAt']?.toDate() || new Date(),
      } as AppNotification;
    });
    // Sort newest first (client-side to avoid needing composite index)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return notifications;
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notifDoc = doc(this.firestore, 'notifications', notificationId);
    await updateDoc(notifDoc, { read: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userEmail: string): Promise<void> {
    const notifRef = collection(this.firestore, 'notifications');
    const q = query(
      notifRef,
      where('userEmail', '==', userEmail),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((d) =>
      updateDoc(doc(this.firestore, 'notifications', d.id), { read: true })
    );
    await Promise.all(updates);
  }
}
