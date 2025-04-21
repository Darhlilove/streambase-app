import { inject } from "@angular/core"
import { type CanActivateFn, Router } from "@angular/router"
import { AuthService } from "../services/auth.service"

export const AdminAuthGuard: CanActivateFn = (state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isAdminLoggedIn()) {
    return true
  }

  // Store the attempted URL for redirecting
  const url = state.url

  // Navigate to the admin login page with extras
  router.navigate(["/admin-sign-in"], {
    queryParams: { return: url },
  })

  return false
}

