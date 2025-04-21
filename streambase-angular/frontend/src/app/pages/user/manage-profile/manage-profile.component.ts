import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserFormComponent } from '../../../components/forms/user-form/user-form.component';
import { CustomButtonComponent } from '../../../components/ui/custom-button/custom-button.component';
import { DeleteAccountDialogComponent } from '../../../components/dialogs/delete-account-dialog/delete-account-dialog.component';
import type { User } from '../../../core/models/user.model';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SnackbarService } from '../../../core/services/snackBar.service';
import { UserAvatarComponent } from "../../../components/user-avatar/user-avatar.component";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    UserFormComponent,
    CustomButtonComponent,
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIcon,
    UserAvatarComponent
],
  templateUrl: './manage-profile.component.html',
  styleUrls: ['./manage-profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private snackbarService = inject(SnackbarService);
  private fb = inject(FormBuilder);

  user = signal<User | null>(null);
  isEditing = signal(false);
  isChangingPassword = signal(false);
  selectedImage: File | null = null;
  avatarHover = false;
  isSubmitting = signal(false);
  errorMessage = signal('');

  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.authService.fetchUserData().subscribe((user) => {
      this.user.set(user);
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  passwordsMatchValidator(
    group: AbstractControl
  ): { [key: string]: boolean } | null {
    const currentPassword = group.get('currentPassword')?.value;
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
  
    if (currentPassword && currentPassword.length > 0 && currentPassword === newPassword) {
      return { newPasswordSameAsCurrent: true };
    }

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
  
    return null;
  }
  

  onPasswordSubmit(event: Event): void {
    event.preventDefault();

    if (this.passwordForm.valid) {
      const { currentPassword, newPassword } = this.passwordForm.value;

      this.authService.updatePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.snackbarService.show(
            'Password updated successfully', 'success'
          );
          this.passwordForm.reset();
          this.isChangingPassword.set(false);
          this.errorMessage.set('');
        },
        error: (err) => {
          this.errorMessage.set('Invalid password');
          this.snackbarService.show('Invalid password', 'error');
        },
      });
    }
  }

  startEditing(): void {
    this.isEditing.set(true);
  }

  cancelEditing(): void {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  startChangingPassword(): void {
    this.isChangingPassword.set(true);
  }

  cancelChangingPassword(): void {
    this.isChangingPassword.set(false);
    this.errorMessage.set('');
    this.passwordForm.reset()
  }

  updateProfile(userData: Partial<User>): void {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService.updateProfile(userData).subscribe({
      next: () => {
        this.authService.fetchUserData().subscribe((user) => {
          this.user.set(user);
        });
        this.isSubmitting.set(false);
        this.isEditing.set(false);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          error.message || 'Failed to update profile. Please try again.'
        );
      },
    });
  }

  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0];

    if (!this.selectedImage || !this.user()?.id) {
      this.snackbarService.show('No image selected', 'error');
      return;
    }

    this.authService.updateUserProfileImage(this.user()!.id, this.selectedImage)
      .subscribe({
        next: (response) => {
          const user = this.user();
          if (user) {
            user.image = response.image;
            this.user.set(user);
          }
        },
        error: (err) => {
          this.snackbarService.show('Ooops! Something went wrong!', 'error');
          console.error('Error uploading image', err);
        }
      });
  }

  openDeleteDialog(): void {
    const dialogRef = this.dialog.open(DeleteAccountDialogComponent);

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Account was successfully deleted
        this.router.navigate(['/']);
      }
    });
  }
}
