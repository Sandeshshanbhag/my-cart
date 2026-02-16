import { createReducer, on } from '@ngrx/store';
import { Product, CartItem } from '../../models/product.model';
import * as ProductActions from './product.actions';

export interface ProductState {
  searchResults: Product[];
  recentSearches: string[];
  cartItems: CartItem[];
  favorites: Product[];
  recommendedProducts: Product[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
}

export const initialProductState: ProductState = {
  searchResults: [],
  recentSearches: [],
  cartItems: [],
  favorites: [],
  recommendedProducts: [],
  loading: false,
  error: null,
  searchQuery: '',
};

export const productReducer = createReducer(
  initialProductState,

  // Search
  on(ProductActions.searchProducts, (state, { query }) => ({
    ...state,
    loading: true,
    error: null,
    searchQuery: query,
  })),
  on(ProductActions.searchProductsSuccess, (state, { products }) => ({
    ...state,
    searchResults: products,
    loading: false,
  })),
  on(ProductActions.searchProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(ProductActions.clearSearch, (state) => ({
    ...state,
    searchResults: [],
    searchQuery: '',
  })),

  // Recent Searches
  on(ProductActions.addRecentSearch, (state, { query }) => {
    const filtered = state.recentSearches.filter(
      (s) => s.toLowerCase() !== query.toLowerCase()
    );
    return {
      ...state,
      recentSearches: [query, ...filtered].slice(0, 8),
    };
  }),

  // Cart
  on(ProductActions.addToCart, (state, { product }) => {
    const existing = state.cartItems.find((item) => item.product.id === product.id);
    if (existing) {
      return {
        ...state,
        cartItems: state.cartItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }
    return {
      ...state,
      cartItems: [...state.cartItems, { product, quantity: 1 }],
    };
  }),
  on(ProductActions.incrementCartItem, (state, { productId }) => ({
    ...state,
    cartItems: state.cartItems.map((item) =>
      item.product.id === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item
    ),
  })),
  on(ProductActions.decrementCartItem, (state, { productId }) => {
    const item = state.cartItems.find((i) => i.product.id === productId);
    if (!item) return state;
    if (item.quantity <= 1) {
      return {
        ...state,
        cartItems: state.cartItems.filter((i) => i.product.id !== productId),
      };
    }
    return {
      ...state,
      cartItems: state.cartItems.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      ),
    };
  }),
  on(ProductActions.removeFromCart, (state, { productId }) => ({
    ...state,
    cartItems: state.cartItems.filter((item) => item.product.id !== productId),
  })),

  // Favorites
  on(ProductActions.toggleFavorite, (state, { product }) => {
    const exists = state.favorites.some((f) => f.id === product.id);
    return {
      ...state,
      favorites: exists
        ? state.favorites.filter((f) => f.id !== product.id)
        : [...state.favorites, product],
    };
  }),

  // Recommended
  on(ProductActions.loadRecommendedSuccess, (state, { products }) => ({
    ...state,
    recommendedProducts: products,
  }))
);
