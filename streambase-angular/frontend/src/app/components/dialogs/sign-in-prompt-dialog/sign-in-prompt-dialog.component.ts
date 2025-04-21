import { Component, inject, input } from "@angular/core"
import { MatDialogModule, MatDialogRef } from "@angular/material/dialog"
import { Router } from "@angular/router"

@Component({
  selector: "app-sign-in-prompt-dialog",
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: "./sign-in-prompt-dialog.component.html",
  styleUrls: ["./sign-in-prompt-dialog.component.scss"],
})
export class SignInPromptDialogComponent {
  private dialogRef = inject(MatDialogRef<SignInPromptDialogComponent>)
  private router = inject(Router)

  navigateToSignIn(): void {
    this.dialogRef.close()
    this.router.navigate(["/sign-in"])
  }

  navigateToSignUp(): void {
    this.dialogRef.close()
    this.router.navigate(["/sign-up"])
  }

  close(): void {
    this.dialogRef.close()
  }
}

