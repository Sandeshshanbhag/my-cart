import { Component, ElementRef, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
} from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);

  showPassword = signal(false);

  error = toSignal(this.store.select(selectAuthError));
  loading = toSignal(this.store.select(selectAuthLoading));

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, this.passwordValidator]],
  });

  constructor() {
    // ── Angular 18: afterNextRender() replaces ngAfterViewInit + isPlatformBrowser ──
    // Automatically only runs in the browser, never during SSR
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: '0px 0px -60px 0px',
        }
      );

      const revealElements = this.el.nativeElement.querySelectorAll('.reveal');
      revealElements.forEach((el: Element) => observer.observe(el));

      // ── Angular 18: DestroyRef replaces OnDestroy lifecycle hook ──
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < 8) {
      errors['minLength'] = 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      errors['uppercase'] = 'Must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      errors['lowercase'] = 'Must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      errors['number'] = 'Must contain at least one number';
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
      errors['specialChar'] = 'Must contain at least one special character';
    }

    return Object.keys(errors).length ? errors : null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ email, password }));
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
