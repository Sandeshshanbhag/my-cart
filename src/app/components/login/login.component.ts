import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import * as AuthActions from '../../store/auth/auth.actions';
import {
  selectAuthError,
  selectAuthLoading,
} from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  error$;
  loading$;

  constructor(private fb: FormBuilder, private store: Store) {
    this.error$ = this.store.select(selectAuthError);
    this.loading$ = this.store.select(selectAuthLoading);
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordValidator]],
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
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.store.dispatch(AuthActions.login({ email, password }));
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
