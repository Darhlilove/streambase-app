import { Component, inject, input, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { AuthPagesContainerComponent } from '../auth-pages-container/auth-pages-container.component';
import { UserService } from '../../../core/services';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    AuthPagesContainerComponent,
  ],
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // States
  private returnUrl: string = '/';

  isAdmin = input<boolean>(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.returnUrl = params['return'] || this.isAdmin() ? 'admin-dashboard' : 'home';
    });
  }

  signInForm: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  constructor() {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      adminPin: ['', this.isAdmin() ? [Validators.required] : []],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    if (this.signInForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.signInForm.controls).forEach((key) => {
        const control = this.signInForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const { email, password, adminPin, rememberMe } = this.signInForm.value;

    if (this.isAdmin()) {
      this.authService.loginAdmin({ email, password, pin: adminPin }, rememberMe).subscribe({
        next: () => {
              this.router.navigateByUrl(this.returnUrl);
              this.isSubmitting.set(false);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            error.message || 'Sign in failed. Please try again.'
          );
        }
      });
    } else {
      this.authService.loginUser({ email, password }, rememberMe).subscribe({
        next: () => {
              this.router.navigateByUrl(this.returnUrl);
              this.isSubmitting.set(false);
        },
        error: (error) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            error.message || 'Sign in failed. Please try again.'
          );
        }
      });
    }
  }

  navigateToSignUp(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin-sign-up']);
      return;
    }
    
    // If the user is not an admin, navigate to the regular sign-up page
    this.router.navigate(['/sign-up']);
  }

  useTestLogin(checked: boolean): void {
    if (checked) {
      this.signInForm.patchValue({
        email: 'example@mail.com',
        password: 'JohnDoe1'
      });
    } else {
      this.signInForm.patchValue({
        email: '',
        password: ''
      });
    }
  }
}
