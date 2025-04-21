import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AdminUserAuthGuard: CanActivateFn = (state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdminLoggedIn() || authService.isLoggedIn()) {
    return true;
  }

  // Store the attempted URL for redirecting
  const url = state.url;

  // If admin is not logged in, redirect to the admin login page with extras
  if (authService.isAdminLoggedIn()) {
    router.navigate(['/admin-sign-in'], {
      queryParams: { return: url },
    });
  }

  // If the user is not logged in, redirect to the login page with extras
  if (authService.isLoggedIn()) {
    router.navigate(['/sign-in'], {
      queryParams: { return: url },
    });
  }

  return false;
};
