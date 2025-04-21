import { Component, inject, signal, effect, OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { Router } from "@angular/router"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatCardModule } from "@angular/material/card"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"

import { MovieService } from "../../core/services"
import { MovieSliderComponent } from "../../components/movie-slider/movie-slider.component"
import { Movie } from "../../core/models"

@Component({
  selector: "app-home-page-content",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MovieSliderComponent,
],
  templateUrl: "./guest.component.html",
  styleUrls: ["./guest.component.scss"],
})
export class GuestComponent implements OnInit {
  private movieService = inject(MovieService);
  private router = inject(Router);

  // State
  trendingMovies = signal<Movie[]>([])
  trendingTv = signal<Movie[]>([])
  upcomingMovies = signal<Movie[]>([])
  loading = signal({
    trendingMovie: true,
    trendingTv: true,
    upcoming: true,
  })
  error = signal({
    trendingMovie: '',
    trendingTv: '',
    upcoming: '',
  })
  showSignInPrompt = signal(false)

  ngOnInit(): void {
    // Load movies when component initializes
    this.loadTrendingMovies()
    this.loadTrendingTv()
    this.loadUpcomingMovies()
  }

  // Methods
  loadTrendingMovies(): void {
    this.loading.update(state => ({ ...state, trendingMovie: true }));
    this.error.update(state => ({ ...state, trendingMovie: '' }));

    this.movieService.fetchTrendingMovies().subscribe({
      next: (movies) => {
        this.trendingMovies.set(movies);
        this.loading.update(state => ({ ...state, trendingMovie: false }));
      },
      error: (err) => {
        console.error("Failed to load trending movies", err);
        this.error.update(state => ({ ...state, trendingMovie: "Failed to load trending movies" }));
        this.loading.update(state => ({ ...state, trendingMovie: false }));
      }
    });
  }

  loadTrendingTv(): void {
    this.loading.update(state => ({ ...state, trendingTv: true }));
    this.error.update(state => ({ ...state, trendingTv: '' }));

    this.movieService.fetchTrendingTV().subscribe({
      next: (movies) => {
        this.trendingTv.set(movies);
        this.loading.update(state => ({ ...state, trendingTv: false }));
      },
      error: (err) => {
        console.error("Failed to load popular movies", err);
        this.error.update(state => ({ ...state, trendingTv: "Failed to load trending tv" }));
        this.loading.update(state => ({ ...state, trendingTv: false }));
      }
    });
  }

  loadUpcomingMovies(): void {
    this.loading.update(state => ({ ...state, upcoming: true }));
    this.error.update(state => ({ ...state, upcoming: '' }));

    this.movieService.fetchUpcoming().subscribe({
      next: (movies) => {
        this.upcomingMovies.set(movies);
        this.loading.update(state => ({ ...state, upcoming: false }));
      },
      error: (err) => {
        console.error("Failed to load upcoming movies", err);
        this.error.update(state => ({ ...state, upcoming: "Failed to load upcoming movies" }));
        this.loading.update(state => ({ ...state, upcoming: false }));
      }
    });
  }

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  navigateToSignUp(): void {
    this.router.navigate(['/sign-up']);
  }
}
