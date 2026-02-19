import { ApplicationConfig, provideZoneChangeDetection, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideStore, Store } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app.routes';
import { authReducer } from './store/auth/auth.reducer';
import { productReducer } from './store/product/product.reducer';
import { AuthEffects } from './store/auth/auth.effects';
import { ProductEffects } from './store/product/product.effects';
import { hydrationMetaReducer } from './store/hydration.meta-reducer';
import { environment } from '../environments/environment';
import * as AuthActions from './store/auth/auth.actions';

function initAuth(store: Store) {
  return () => store.dispatch(AuthActions.autoLogin());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStore({
      auth: authReducer,
      product: productReducer,
    }, {
      metaReducers: [hydrationMetaReducer],
    }),
    provideEffects([AuthEffects, ProductEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: (store: Store) => initAuth(store),
      deps: [Store],
      multi: true,
    },
  ],
};
