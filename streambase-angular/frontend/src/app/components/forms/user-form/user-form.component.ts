import { Component, Input, Output, EventEmitter, inject, type OnInit } from "@angular/core"
import { AbstractControlOptions, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { MatSelectModule } from "@angular/material/select"
import { MatDatepickerModule } from "@angular/material/datepicker"
import { MatNativeDateModule } from "@angular/material/core"
import type { User } from "../../../core/models/user.model"

@Component({
  selector: "app-user-form",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: "./user-form.component.html",
  styleUrls: ["./user-form.component.scss"],
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder)

  @Input() user: User | null = null
  @Input() formType: "register" | "profile" | "changePassword" = "register"
  @Input() isSubmitting = false
  @Input() errorMessage = ""

  @Output() formSubmit = new EventEmitter<any>()
  @Output() cancelEdit = new EventEmitter<void>()

  selectedFile: File | null = null;

  userForm!: FormGroup

  ngOnInit(): void {
    this.initForm()
  }

  private initForm(): void {
    this.userForm = this.fb.group(
      {
        firstName: [this.user?.firstName || "", [Validators.required]],
        lastName: [this.user?.lastName || "", [Validators.required]],
        email: [
          this.user?.email || "",
          [Validators.required, Validators.email]
        ],
        password: ["", this.formType === "register" ? [Validators.required, Validators.minLength(8)] : []],
        confirmPassword: ["", this.formType === "register" ? [Validators.required] : []],
        dateOfBirth: [this.user?.dateOfBirth ? new Date(this.user.dateOfBirth) : null, Validators.required],
        bio: [this.user?.bio || "", Validators.required],
        moviePreferences: [this.user?.moviePreferences || [], Validators.required],
      },
      {
        validators: this.formType === "register" ? this.passwordMatchValidator : null,
      } as AbstractControlOptions
    )

    if (this.formType === "profile") {
      this.userForm.get('email')?.disable()
    }
  }

  private passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get("password")
    const confirmPassword = form.get("confirmPassword")

    if (!password || !confirmPassword) return null

    return password.value === confirmPassword.value ? null : { passwordMismatch: true }
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key)
        control?.markAsTouched()
      })
      return
    }

    const formData = { ...this.userForm.getRawValue() }

    // Remove confirmPassword from the data sent to the server
    if ('confirmPassword' in formData) {
      delete formData.confirmPassword
    }

    // If password is empty in profile edit, remove it
    if (this.formType === "profile" && !formData.password) {
      delete formData.password
    }

    this.formSubmit.emit(formData)
    this.userForm.reset() 
  }

  onCancel(): void {
    this.cancelEdit.emit()
  }
}

