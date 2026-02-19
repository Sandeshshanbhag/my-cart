import { ActionReducer, INIT, UPDATE } from '@ngrx/store';

const STORAGE_KEY = 'mycart_state';

// Keys to persist from each reducer slice
const PERSISTED_KEYS: Record<string, string[]> = {
  product: ['cartItems', 'favorites', 'recentSearches'],
};

export function hydrationMetaReducer(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    // On app init, rehydrate from localStorage
    if (action.type === INIT || action.type === UPDATE) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Merge stored state with initial state
          const hydratedState: any = { ...state };
          for (const sliceKey of Object.keys(PERSISTED_KEYS)) {
            if (parsed[sliceKey]) {
              hydratedState[sliceKey] = {
                ...(state?.[sliceKey] || {}),
                ...parsed[sliceKey],
              };
            }
          }
          return reducer(hydratedState, action);
        }
      } catch (e) {
        console.warn('Failed to rehydrate state:', e);
      }
    }

    const nextState = reducer(state, action);

    // Save relevant slices to localStorage after every action
    try {
      const toStore: any = {};
      for (const [sliceKey, keys] of Object.entries(PERSISTED_KEYS)) {
        if (nextState[sliceKey]) {
          toStore[sliceKey] = {};
          for (const key of keys) {
            toStore[sliceKey][key] = nextState[sliceKey][key];
          }
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to persist state:', e);
    }

    return nextState;
  };
}
