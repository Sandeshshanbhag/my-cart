import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { take, switchMap } from 'rxjs/operators';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { selectAuthUser } from '../../store/auth/auth.selectors';
import { AdminService } from '../../services/admin.service';
import { selectFavorites, selectCartItems } from '../../store/product/product.selectors';
import { Product, CartItem } from '../../models/product.model';

interface Order {
  id: string;
  orderId: string;
  items: { title: string; price: number; quantity: number; image: string }[];
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  estimatedDelivery: string;
  status: string;
  placedAt: string;
  couponCode?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private adminService = inject(AdminService);

  user$!: Observable<any>;
  favorites$!: Observable<Product[]>;
  cartItems$!: Observable<CartItem[]>;
  isAdmin$!: Observable<boolean>;

  activeTab = 'overview';
  orders: Order[] = [];
  loadingOrders = true;
  selectedOrder: Order | null = null;

  // Stats
  totalOrders = 0;
  totalSpent = 0;
  memberSince = '';

  ngOnInit(): void {
    this.user$ = this.store.select(selectAuthUser);
    this.favorites$ = this.store.select(selectFavorites);
    this.cartItems$ = this.store.select(selectCartItems);
    this.isAdmin$ = this.user$.pipe(
      switchMap(user => user ? this.adminService.isAdmin(user.email) : of(false))
    );

    this.user$.pipe(take(1)).subscribe((user) => {
      if (user) {
        this.loadOrders(user.email);
      }
    });
  }

  async loadOrders(email: string): Promise<void> {
    this.loadingOrders = true;
    try {
      const ordersRef = collection(this.firestore, 'orders');
      const q = query(ordersRef, where('userId', '==', email));
      const snapshot = await getDocs(q);
      this.orders = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          orderId: doc.id.slice(0, 8).toUpperCase(),
          ...doc.data(),
        } as Order))
        .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
      this.totalOrders = this.orders.length;
      this.totalSpent = this.orders.reduce((sum, o) => sum + (o.total || 0), 0);
      if (this.orders.length > 0) {
        const oldest = this.orders[this.orders.length - 1];
        this.memberSince = new Date(oldest.placedAt).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      this.loadingOrders = false;
    }
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.selectedOrder = null;
  }

  viewOrderDetail(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrderDetail(): void {
    this.selectedOrder = null;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      confirmed: '#10b981',
      shipped: '#0ea5e9',
      delivered: '#059669',
      cancelled: '#ef4444',
      processing: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  }

  getPaymentLabel(method: string): string {
    const labels: Record<string, string> = {
      cod: '💵 Cash on Delivery',
      upi: '📱 UPI',
      card: '💳 Credit/Debit Card',
      netbanking: '🏦 Net Banking',
    };
    return labels[method] || method;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
