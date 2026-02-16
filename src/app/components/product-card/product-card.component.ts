import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import * as ProductActions from '../../store/product/product.actions';
import { selectIsFavorite, selectCartItemQuantity } from '../../store/product/product.selectors';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent implements OnInit {
  @Input() product!: Product;
  isFavorite$!: Observable<boolean>;
  cartQuantity$!: Observable<number>;

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.isFavorite$ = this.store.select(selectIsFavorite(this.product.id));
    this.cartQuantity$ = this.store.select(selectCartItemQuantity(this.product.id));
  }

  addToCart(): void {
    this.store.dispatch(ProductActions.addToCart({ product: this.product }));
  }

  incrementCart(): void {
    this.store.dispatch(ProductActions.incrementCartItem({ productId: this.product.id }));
  }

  decrementCart(): void {
    this.store.dispatch(ProductActions.decrementCartItem({ productId: this.product.id }));
  }

  toggleFavorite(): void {
    this.store.dispatch(
      ProductActions.toggleFavorite({ product: this.product })
    );
  }

  getStars(rate: number): number[] {
    return Array(5)
      .fill(0)
      .map((_, i) => (i < Math.round(rate) ? 1 : 0));
  }
}
