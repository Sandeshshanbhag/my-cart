import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CartItem } from '../../models/product.model';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { selectCartItems, selectCartItemCount } from '../../store/product/product.selectors';
import { selectAuthUser } from '../../store/auth/auth.selectors';
import * as ProductActions from '../../store/product/product.actions';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private firestore = inject(Firestore);
  private emailService = inject(EmailService);

  cartItems$!: Observable<CartItem[]>;
  cartItemCount$!: Observable<number>;
  user$!: Observable<any>;

  shippingForm!: FormGroup;
  currentStep = 1; // 1 = Review, 2 = Shipping, 3 = Confirmation
  orderPlaced = false;
  orderSubmitting = false;
  orderId = '';
  emailSent = false;

  // Coupon
  couponCode = '';
  couponApplied = false;
  couponDiscount = 0;
  couponError = '';

  // Payment
  selectedPayment = 'cod';

  // Delivery estimate
  estimatedDelivery = '';

  ngOnInit(): void {
    this.cartItems$ = this.store.select(selectCartItems);
    this.cartItemCount$ = this.store.select(selectCartItemCount);
    this.user$ = this.store.select(selectAuthUser);

    this.shippingForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s-]{3,10}$/)]],
      country: ['India', Validators.required],
    });

    // Pre-fill user info
    this.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.shippingForm.patchValue({
          fullName: user.name || '',
          email: user.email || '',
        });
      }
    });

    // Compute estimated delivery
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 5);
    this.estimatedDelivery = delivery.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Redirect if cart is empty
    this.cartItems$.pipe(take(1)).subscribe(items => {
      if (!items || items.length === 0) {
        this.router.navigate(['/home']);
      }
    });
  }

  getSubtotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  getShipping(items: CartItem[]): number {
    const subtotal = this.getSubtotal(items);
    return subtotal > 50 ? 0 : 5.99;
  }

  getTax(items: CartItem[]): number {
    return this.getSubtotal(items) * 0.08;
  }

  getTotalItems(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }

  nextStep(): void {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step <= this.currentStep) {
      this.currentStep = step;
    }
  }

  removeItem(productId: number): void {
    this.store.dispatch(ProductActions.removeFromCart({ productId }));
  }

  incrementItem(productId: number): void {
    this.store.dispatch(ProductActions.incrementCartItem({ productId }));
  }

  decrementItem(productId: number): void {
    this.store.dispatch(ProductActions.decrementCartItem({ productId }));
  }

  applyCoupon(): void {
    const code = this.couponCode.trim().toUpperCase();
    this.couponError = '';
    if (code === 'SAVE10') {
      this.couponApplied = true;
      this.couponDiscount = 10;
    } else if (code === 'SAVE20') {
      this.couponApplied = true;
      this.couponDiscount = 20;
    } else if (code === 'FLAT5') {
      this.couponApplied = true;
      this.couponDiscount = 5;
    } else {
      this.couponError = 'Invalid coupon code';
      this.couponApplied = false;
      this.couponDiscount = 0;
    }
  }

  removeCoupon(): void {
    this.couponCode = '';
    this.couponApplied = false;
    this.couponDiscount = 0;
    this.couponError = '';
  }

  getCouponSavings(items: CartItem[]): number {
    return this.getSubtotal(items) * (this.couponDiscount / 100);
  }

  getTotal(items: CartItem[]): number {
    const subtotal = this.getSubtotal(items);
    const discount = this.couponApplied ? subtotal * (this.couponDiscount / 100) : 0;
    return subtotal - discount + this.getShipping(items) + this.getTax(items);
  }

  getSavingsPercent(items: CartItem[]): number {
    if (!this.couponApplied) return 0;
    return this.couponDiscount;
  }

  selectPayment(method: string): void {
    this.selectedPayment = method;
  }

  async placeOrder(): Promise<void> {
    if (this.shippingForm.invalid) {
      this.shippingForm.markAllAsTouched();
      this.currentStep = 2;
      return;
    }

    this.orderSubmitting = true;
    try {
      const items = await this.cartItems$.pipe(take(1)).toPromise();
      const user = await this.user$.pipe(take(1)).toPromise();

      const orderData = {
        userId: user?.email || 'guest',
        userName: user?.name || 'Guest',
        items: items?.map(i => ({
          productId: i.product.id,
          title: i.product.title,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.image,
        })),
        shipping: this.shippingForm.value,
        paymentMethod: this.selectedPayment,
        couponCode: this.couponApplied ? this.couponCode : null,
        couponDiscount: this.couponApplied ? this.couponDiscount : 0,
        subtotal: this.getSubtotal(items || []),
        discount: this.couponApplied ? this.getCouponSavings(items || []) : 0,
        shippingCost: this.getShipping(items || []),
        tax: this.getTax(items || []),
        total: this.getTotal(items || []),
        estimatedDelivery: this.estimatedDelivery,
        status: 'confirmed',
        placedAt: new Date().toISOString(),
      };

      const ordersRef = collection(this.firestore, 'orders');
      const docRef = await addDoc(ordersRef, orderData);
      this.orderId = docRef.id.slice(0, 8).toUpperCase();
      this.orderPlaced = true;
      this.currentStep = 3;

      // Send order confirmation email
      const shipping = this.shippingForm.value;
      const emailSent = await this.emailService.sendOrderConfirmation({
        toEmail: shipping.email,
        toName: shipping.fullName,
        orderId: this.orderId,
        items: orderData.items || [],
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        shippingCost: orderData.shippingCost,
        tax: orderData.tax,
        total: orderData.total,
        paymentMethod: this.selectedPayment,
        shippingAddress: `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.zipCode}, ${shipping.country}`,
        estimatedDelivery: this.estimatedDelivery,
      });
      this.emailSent = emailSent;

      // Clear cart after order
      items?.forEach(item => {
        this.store.dispatch(ProductActions.removeFromCart({ productId: item.product.id }));
      });
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      this.orderSubmitting = false;
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
