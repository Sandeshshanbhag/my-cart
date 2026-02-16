import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, exhaustMap, catchError, tap, take, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { UserTrackingService } from '../../services/user-tracking.service';

@Injectable()
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private userTrackingService = inject(UserTrackingService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          switchMap((user) =>
            from(this.userTrackingService.trackLogin(user.email, user.name)).pipe(
              map(() => AuthActions.loginSuccess({ user })),
              catchError(() => of(AuthActions.loginSuccess({ user }))) // still login even if tracking fails
            )
          ),
          catchError((error) =>
            of(AuthActions.loginFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess, AuthActions.registerSuccess),
        tap(() => this.router.navigate(['/home']))
      ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ name, email, password }) =>
        this.authService.register(name, email, password).pipe(
          switchMap((user) =>
            from(this.userTrackingService.trackRegistration(user.email, user.name)).pipe(
              map(() => AuthActions.registerSuccess({ user })),
              catchError(() => of(AuthActions.registerSuccess({ user }))) // still register even if tracking fails
            )
          ),
          catchError((error) =>
            of(AuthActions.registerFailure({ error: error.message }))
          )
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout();
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  autoLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.autoLogin),
      exhaustMap(() =>
        this.authService.getAuthState().pipe(
          take(1),
          map((firebaseUser) => {
            if (firebaseUser) {
              const user = {
                email: firebaseUser.email || '',
                name: firebaseUser.name || 'User',
              };
              return AuthActions.autoLoginSuccess({ user });
            }
            return AuthActions.autoLoginFailure();
          })
        )
      )
    )
  );
}
