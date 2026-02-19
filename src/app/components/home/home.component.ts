import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, pairwise, skip, take, switchMap, filter } from 'rxjs/operators';
import { Product, CartItem } from '../../models/product.model';
import * as ProductActions from '../../store/product/product.actions';
import * as AuthActions from '../../store/auth/auth.actions';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import {
  selectSearchResults,
  selectRecentSearches,
  selectCartItemCount,
  selectCartItems,
  selectFavorites,
  selectProductLoading,
  selectSearchQuery,
  selectRecommendedProducts,
} from '../../store/product/product.selectors';
import { selectAuthUser } from '../../store/auth/auth.selectors';
import { ProductCardComponent } from '../product-card/product-card.component';
import { AdminService } from '../../services/admin.service';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { ChatService } from '../../services/chat.service';
import { ChatMessage } from '../../models/chat.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ProductCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewChecked {
  searchQuery = '';
  searchResults$!: Observable<Product[]>;
  recentSearches$!: Observable<string[]>;
  cartItemCount$!: Observable<number>;
  cartItems$!: Observable<CartItem[]>;
  favorites$!: Observable<Product[]>;
  loading$!: Observable<boolean>;
  currentQuery$!: Observable<string>;
  user$!: Observable<any>;
  recommended$!: Observable<Product[]>;
  isAdmin$!: Observable<boolean>;

  showCart = false;
  cartBounce = false;
  showAdminRequest = false;
  adminRequestReason = '';
  adminRequestSubmitting = false;
  adminRequestSuccess = false;

  // Profile menu
  showProfileMenu = false;

  // Notifications
  showNotifications = false;
  notifications: AppNotification[] = [];
  unreadCount = 0;
  loadingNotifications = false;

  // Chat
  isChatOpen = false;
  chatMessages: ChatMessage[] = [];
  chatInput = '';
  isChatLoading = false;
  private shouldScrollChat = false;
  @ViewChild('chatMessagesContainer') chatMessagesContainer!: ElementRef;

  // Feedback
  showFeedback = false;
  feedbackSubmitted = false;
  feedbackSubmitting = false;
  private fb = inject(FormBuilder);
  feedbackForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    type: ['suggestion', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;
  private cartSubscription!: Subscription;
  private firestore = inject(Firestore);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private chatService = inject(ChatService);
  private router = inject(Router);

  constructor(private store: Store) {
    this.searchResults$ = this.store.select(selectSearchResults);
    this.recentSearches$ = this.store.select(selectRecentSearches);
    this.cartItemCount$ = this.store.select(selectCartItemCount);
    this.cartItems$ = this.store.select(selectCartItems);
    this.favorites$ = this.store.select(selectFavorites);
    this.loading$ = this.store.select(selectProductLoading);
    this.currentQuery$ = this.store.select(selectSearchQuery);
    this.user$ = this.store.select(selectAuthUser);
    this.recommended$ = this.store.select(selectRecommendedProducts);
    this.isAdmin$ = this.user$.pipe(
      switchMap(user => user ? this.adminService.isAdmin(user.email) : of(false))
    );
  }

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadRecommended());
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim()) {
        this.store.dispatch(ProductActions.searchProducts({ query: query.trim() }));
      } else {
        this.store.dispatch(ProductActions.clearSearch());
      }
    });

    // Animate cart icon when items are added
    this.cartSubscription = this.cartItemCount$.pipe(
      skip(1),
      pairwise()
    ).subscribe(([prev, curr]) => {
      if (curr > prev) {
        this.cartBounce = true;
        setTimeout(() => this.cartBounce = false, 600);
      }
    });

    // Load notifications - wait for user to be available
    this.user$.pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => {
      if (user?.email) {
        this.loadNotifications(user.email);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (query) {
      this.store.dispatch(ProductActions.addRecentSearch({ query }));
      this.store.dispatch(ProductActions.searchProducts({ query }));
    }
  }

  onRecentSearchClick(query: string): void {
    this.searchQuery = query;
    this.onSearch();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.store.dispatch(ProductActions.clearSearch());
  }

  toggleCart(): void {
    this.showCart = !this.showCart;
    if (this.showCart) {
      this.showProfileMenu = false;
      this.showNotifications = false;
    }
  }

  getCartTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  goToCheckout(): void {
    this.showCart = false;
    this.router.navigate(['/checkout']);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
    if (this.showProfileMenu) {
      this.showCart = false;
      this.showNotifications = false;
    }
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  scrollToFavorites(): void {
    const el = document.getElementById('favorites-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  removeFromCart(productId: number): void {
    this.store.dispatch(ProductActions.removeFromCart({ productId }));
  }

  incrementCartItem(productId: number): void {
    this.store.dispatch(ProductActions.incrementCartItem({ productId }));
  }

  decrementCartItem(productId: number): void {
    this.store.dispatch(ProductActions.decrementCartItem({ productId }));
  }

  toggleAdminRequest(): void {
    this.showAdminRequest = !this.showAdminRequest;
    if (!this.showAdminRequest) {
      this.adminRequestReason = '';
      this.adminRequestSuccess = false;
    }
  }

  async submitAdminRequest(): Promise<void> {
    if (!this.adminRequestReason.trim()) return;

    this.adminRequestSubmitting = true;
    try {
      const adminRequestsRef = collection(this.firestore, 'adminRequests');
      const user = await this.user$.pipe(take(1)).toPromise();
      await addDoc(adminRequestsRef, {
        userEmail: user?.email || 'unknown',
        userName: user?.name || 'unknown',
        reason: this.adminRequestReason.trim(),
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
      this.adminRequestSuccess = true;
      this.adminRequestReason = '';
      setTimeout(() => {
        this.showAdminRequest = false;
        this.adminRequestSuccess = false;
      }, 2500);
    } catch (error) {
      console.error('Failed to submit admin request:', error);
    } finally {
      this.adminRequestSubmitting = false;
    }
  }

  navigateToCreateProduct(): void {
    this.router.navigate(['/create-product']);
  }

  // ---- Notifications ----
  async loadNotifications(email: string): Promise<void> {
    this.loadingNotifications = true;
    try {
      this.notifications = await this.notificationService.getNotifications(email);
      this.unreadCount = this.notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      this.loadingNotifications = false;
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.showCart = false;
      this.showProfileMenu = false;
    }
  }

  async markNotificationRead(notification: AppNotification): Promise<void> {
    if (notification.read || !notification.id) return;
    try {
      await this.notificationService.markAsRead(notification.id);
      notification.read = true;
      this.unreadCount = this.notifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllRead(): Promise<void> {
    const user = await this.user$.pipe(take(1)).toPromise();
    if (!user?.email) return;
    try {
      await this.notificationService.markAllAsRead(user.email);
      this.notifications.forEach(n => n.read = true);
      this.unreadCount = 0;
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'admin_approved': return '✅';
      case 'admin_rejected': return '❌';
      case 'admin_removed': return '🚫';
      default: return 'ℹ️';
    }
  }

  // ---- Chat ----
  ngAfterViewChecked(): void {
    if (this.shouldScrollChat) {
      this.scrollChatToBottom();
      this.shouldScrollChat = false;
    }
  }

  toggleChat(): void {
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.showCart = false;
      this.showNotifications = false;
      this.shouldScrollChat = true;
    }
  }

  async sendChatMessage(): Promise<void> {
    const message = this.chatInput.trim();
    if (!message || this.isChatLoading) return;

    this.chatInput = '';
    this.isChatLoading = true;
    this.shouldScrollChat = true;

    try {
      await this.chatService.sendMessage(message);
      this.chatMessages = this.chatService.getHistory();
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      this.isChatLoading = false;
      this.shouldScrollChat = true;
    }
  }

  sendQuickMessage(message: string): void {
    this.chatInput = message;
    this.sendChatMessage();
  }

  clearChat(): void {
    this.chatService.clearHistory();
    this.chatMessages = [];
  }

  private scrollChatToBottom(): void {
    try {
      const el = this.chatMessagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (_err) { /* ignore */ }
  }

  // ---- Feedback ----
  toggleFeedback(): void {
    this.showFeedback = !this.showFeedback;
    if (this.showFeedback) {
      this.showCart = false;
      this.showNotifications = false;
      this.isChatOpen = false;
      // Pre-fill name/email from logged in user
      this.user$.pipe(take(1)).subscribe(user => {
        if (user) {
          this.feedbackForm.patchValue({
            name: user.name || '',
            email: user.email || '',
          });
        }
      });
    }
  }

  async submitFeedback(): Promise<void> {
    if (this.feedbackForm.invalid) return;
    this.feedbackSubmitting = true;
    try {
      const feedbackRef = collection(this.firestore, 'feedback');
      await addDoc(feedbackRef, {
        ...this.feedbackForm.value,
        submittedAt: new Date().toISOString(),
        status: 'new',
      });
      this.feedbackSubmitted = true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      this.feedbackSubmitting = false;
    }
  }

  resetFeedback(): void {
    this.feedbackForm.reset({ type: 'suggestion' });
    this.feedbackSubmitted = false;
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
