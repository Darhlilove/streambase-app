import { Component, inject } from "@angular/core"
import { FormBuilder, type FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { CustomButtonComponent } from "../../../components/ui/custom-button/custom-button.component"
import { AuthService } from "../../../core/services/auth.service"
import { SnackbarService } from "../../../core/services"

@Component({
  selector: "app-delete-account-dialog",
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, CustomButtonComponent],
  templateUrl: "./delete-account-dialog.component.html",
  styleUrls: ["./delete-account-dialog.component.scss"],
})
export class DeleteAccountDialogComponent {
  private dialogRef = inject(MatDialogRef<DeleteAccountDialogComponent>)
  private fb = inject(FormBuilder)
  private authService = inject(AuthService)
  private snackbarService = inject(SnackbarService)

  deleteForm: FormGroup = this.fb.group({
    password: ["", [Validators.required]],
  })

  isDeleting = false
  errorMessage = ""

  onCancel(): void {
    this.dialogRef.close(false)
  }

  onConfirm(): void {
    if (this.deleteForm.invalid) {
      return
    }

    this.isDeleting = true
    this.errorMessage = ""

    const password = this.deleteForm.get("password")?.value

    this.authService.deleteProfile(password).subscribe({
      next: () => {
        this.snackbarService.show('Account deleted successfully!')
        this.isDeleting = false
        this.dialogRef.close(true)
        this.authService.logout()
      },
      error: () => {
        this.isDeleting = false
        this.errorMessage = "Failed to delete account. Please try again."
      },
    })
  }
}

