import { Component, inject, type OnInit } from '@angular/core';
import {
  FormBuilder,
  type FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NotificationService } from '../../../core/services';
import { MovieRequestService } from '../../../core/services';
import { finalize } from 'rxjs/operators';
import { SnackbarService } from '../../../core/services/snackBar.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CustomButtonComponent } from '../../../components/ui/custom-button/custom-button.component';

@Component({
  selector: 'app-movie-request',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CustomButtonComponent,
  ],
  templateUrl: './movie-request.component.html',
  styleUrls: ['./movie-request.component.scss'],
})
export class MovieRequestComponent implements OnInit {
  requestForm: FormGroup;
  isSubmitting = false;
  user: any;

  private fb = inject(FormBuilder);
  private snackbarService = inject(SnackbarService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private movieRequestService = inject(MovieRequestService);

  constructor() {
    this.requestForm = this.fb.group({
      movieTitle: ['', [Validators.required, Validators.minLength(3)]],
      mediaType: ['', Validators.required],
      year: ['', [Validators.required, Validators.pattern('^[0-9]{4}$')]],
    });
  }

  ngOnInit(): void {
    this.user = this.authService.getUser();
  }

  get movieTitle() {
    return this.requestForm.get('movieTitle');
  }
  get mediaType() {
    return this.requestForm.get('mediaType');
  }
  get year() {
    return this.requestForm.get('year');
  }

  handleSubmitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const timestamp = new Date().toISOString();

    const formData = {
      ...this.requestForm.value,
      senderId: this.user?.id,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.movieRequestService
      .createMovieRequest(formData, this.user.id, this.user.name)
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: (response) => {
          if (response) {
            this.requestForm.reset();
          } else {
            this.snackbarService.show(
              'Something went wrong. Please try again.', 'error'
            );
          }
        },
        error: () => {
          this.snackbarService.show('Network error. Please try again later.', 'error');
        },
      });
  }
}
