import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserFormComponent } from '../../../components/forms/user-form/user-form.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthPagesContainerComponent } from '../auth-pages-container/auth-pages-container.component';
import { SnackbarService } from '../../../core/services/snackBar.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [UserFormComponent, AuthPagesContainerComponent],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBarService = inject(SnackbarService);

  isSubmitting = signal(false);
  errorMessage = signal('');

  onRegister(userData: any): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.registerUser(userData).subscribe({
      next: () => {
        this.snackBarService.show(
          'Registration successful', 'success'
        );
        this.router.navigate(['/sign-in']);
        this.isSubmitting.set(false);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.message || 'Registration failed. Please try again.'
        );
      },
    });
  }

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }
}
