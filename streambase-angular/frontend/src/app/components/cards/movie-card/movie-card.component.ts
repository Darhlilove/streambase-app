import { Component, computed, input, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatBadgeModule } from "@angular/material/badge"
import { Router } from "@angular/router"
import { MatDialog } from '@angular/material/dialog';

import type { Movie } from "../../../core/models"
import { CardIconsComponent } from "../../movie-card-icons/movie-card-icon.component"
import { AuthService } from "../../../core/services/auth.service"
import { SignInPromptDialogComponent } from "../../dialogs/sign-in-prompt-dialog/sign-in-prompt-dialog.component";

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
    CardIconsComponent
],
  templateUrl: './movie-card.component.html',
  styleUrl: './movie-card.component.scss'
})
export class MovieCardComponent {
  private authService = inject(AuthService)
  private router = inject(Router)
  private dialog = inject(MatDialog)

  // Inputs
  movie = input.required<Movie>()

  // State
  isHovered = signal(false)
  imageError = signal(false)

  // Computed values
  isLoggedIn = computed(() => this.authService.isLoggedIn())

  rating = computed(() => {
    return this.movie().vote_average ? Math.round(this.movie().vote_average! * 10) / 10 : 0
  })

  posterUrl = computed(() => {
    if (this.imageError()) return "movie-placeholder.jpg"
    return this.movie().poster_path
      ? `https://image.tmdb.org/t/p/w500${this.movie().poster_path}`
      : "movie-placeholder.jpg"
  })

  // Methods
  onImageError(): void {
    this.imageError.set(true)
  }

  openSignInDialog(): void {
    const dialogRef = this.dialog.open(SignInPromptDialogComponent);

    // Handle after closed
    dialogRef.afterClosed().subscribe({});
  }

  navigateToMovie(): void {
    if(!this.isLoggedIn()){
      this.openSignInDialog()
      return;
    }

    const movie = this.movie()
    this.router.navigate(['/watch', movie.id.toString()], {
      queryParams: { media_type: movie.media_type}
    });
  }

  onMouseEnter(): void {
    this.isHovered.set(true)
  }

  onMouseLeave(): void {
    this.isHovered.set(false)
  }
}
