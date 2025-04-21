import { inject } from "@angular/core"
import { type CanActivateFn, Router } from "@angular/router"
import { AuthService } from "../services/auth.service"

export const UserAuthGuard: CanActivateFn = (state) => {
  const authService = inject(AuthService)
  const router = inject(Router)

  if (authService.isLoggedIn()) {
    return true
  }

  // Store the attempted URL for redirecting
  const url = state.url

  // Navigate to the login page with extras
  router.navigate(["/sign-in"], {
    queryParams: { return: url },
  })

  return false
}

