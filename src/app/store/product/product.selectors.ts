import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './product.reducer';

export const selectProductState =
  createFeatureSelector<ProductState>('product');

export const selectSearchResults = createSelector(
  selectProductState,
  (state) => state.searchResults
);

export const selectRecentSearches = createSelector(
  selectProductState,
  (state) => state.recentSearches
);

export const selectCartItems = createSelector(
  selectProductState,
  (state) => state.cartItems
);

export const selectCartItemCount = createSelector(
  selectCartItems,
  (items) => items.reduce((total, item) => total + item.quantity, 0)
);

export const selectCartTotal = createSelector(
  selectCartItems,
  (items) => items.reduce((total, item) => total + item.product.price * item.quantity, 0)
);

export const selectFavorites = createSelector(
  selectProductState,
  (state) => state.favorites
);

export const selectProductLoading = createSelector(
  selectProductState,
  (state) => state.loading
);

export const selectSearchQuery = createSelector(
  selectProductState,
  (state) => state.searchQuery
);

export const selectIsFavorite = (productId: number) =>
  createSelector(selectFavorites, (favorites) =>
    favorites.some((f) => f.id === productId)
  );

export const selectCartItemQuantity = (productId: number) =>
  createSelector(selectCartItems, (items) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  });

export const selectRecommendedProducts = createSelector(
  selectProductState,
  (state) => state.recommendedProducts
);
