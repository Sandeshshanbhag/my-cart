import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from '@angular/fire/auth';
import { User } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);

  register(name: string, email: string, password: string): Observable<User> {
    return from(
      createUserWithEmailAndPassword(this.auth, email, password).then(
        async (cred) => {
          await updateProfile(cred.user, { displayName: name });
          return {
            email: cred.user.email || email,
            name: name,
          } as User;
        }
      )
    ).pipe(
      catchError((error) => {
        return throwError(() => new Error(this.getFirebaseErrorMessage(error.code)));
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    return from(
      signInWithEmailAndPassword(this.auth, email, password).then((cred) => ({
        email: cred.user.email || email,
        name: cred.user.displayName || email.split('@')[0],
      }))
    ).pipe(
      catchError((error) => {
        return throwError(() => new Error(this.getFirebaseErrorMessage(error.code)));
      })
    );
  }

  logout(): void {
    signOut(this.auth);
  }

  isLoggedIn(): boolean {
    return !!this.auth.currentUser;
  }

  getUser(): User | null {
    const fbUser = this.auth.currentUser;
    if (fbUser) {
      return {
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || '',
      };
    }
    return null;
  }

  getAuthState(): Observable<User | null> {
    return new Observable((subscriber) => {
      onAuthStateChanged(this.auth, (fbUser) => {
        if (fbUser) {
          subscriber.next({
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || '',
          });
        } else {
          subscriber.next(null);
        }
      });
    });
  }

  private getFirebaseErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'No account found with this email. Please register first.';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/weak-password':
        return 'Password is too weak';
      default:
        return 'Authentication failed. Please try again.';
    }
  }
}
