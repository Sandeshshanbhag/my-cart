import { createAction, props } from '@ngrx/store';
import { Product } from '../../models/product.model';

// Search
export const searchProducts = createAction(
  '[Product] Search Products',
  props<{ query: string }>()
);

export const searchProductsSuccess = createAction(
  '[Product] Search Products Success',
  props<{ products: Product[] }>()
);

export const searchProductsFailure = createAction(
  '[Product] Search Products Failure',
  props<{ error: string }>()
);

export const clearSearch = createAction('[Product] Clear Search');

// Recent Searches
export const addRecentSearch = createAction(
  '[Product] Add Recent Search',
  props<{ query: string }>()
);

// Cart
export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ product: Product }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ productId: number }>()
);

export const incrementCartItem = createAction(
  '[Cart] Increment Cart Item',
  props<{ productId: number }>()
);

export const decrementCartItem = createAction(
  '[Cart] Decrement Cart Item',
  props<{ productId: number }>()
);

// Favorites
export const toggleFavorite = createAction(
  '[Favorites] Toggle Favorite',
  props<{ product: Product }>()
);

// Recommended
export const loadRecommended = createAction('[Product] Load Recommended');

export const loadRecommendedSuccess = createAction(
  '[Product] Load Recommended Success',
  props<{ products: Product[] }>()
);

export const loadRecommendedFailure = createAction(
  '[Product] Load Recommended Failure',
  props<{ error: string }>()
);
