import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import * as ProductActions from './product.actions';
import { ProductService } from '../../services/product.service';

@Injectable()
export class ProductEffects {
  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  searchProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.searchProducts),
      switchMap(({ query }) =>
        this.productService.searchProducts(query).pipe(
          map((products) =>
            ProductActions.searchProductsSuccess({ products })
          ),
          catchError((error) =>
            of(
              ProductActions.searchProductsFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );

  loadRecommended$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadRecommended),
      switchMap(() =>
        this.productService.getRecommendedProducts().pipe(
          take(1),
          map((products) =>
            ProductActions.loadRecommendedSuccess({ products })
          ),
          catchError((error) =>
            of(
              ProductActions.loadRecommendedFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );
}
