import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService)
  const router = inject(Router)

  // If the user is an admin, redirect to the admin dashboard
  if (authService.isAdminLoggedIn()) {
    router.navigate(["/admin-dashboard"]);
    return false;
  }

  // If the user is logged in, redirect to the home page
  if (authService.isLoggedIn()) {
    router.navigate(["/home"]);
    return false;
  }

  return true;
}
