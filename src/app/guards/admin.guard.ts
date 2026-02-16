import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const adminService = inject(AdminService);
  const router = inject(Router);

  return authService.getAuthState().pipe(
    take(1),
    switchMap((user) => {
      if (!user) {
        router.navigate(['/login']);
        return [false];
      }
      return adminService.isAdmin(user.email).pipe(
        map((isAdmin) => {
          if (!isAdmin) {
            router.navigate(['/home']);
            return false;
          }
          return true;
        })
      );
    })
  );
};
