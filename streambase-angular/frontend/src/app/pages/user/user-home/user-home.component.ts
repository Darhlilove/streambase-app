import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MovieService, UserService } from '../../../core/services';
import { Movie } from '../../../core/models';
import { MovieSliderComponent } from '../../../components/movie-slider/movie-slider.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-user-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MovieSliderComponent,
  ],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.scss',
})
export class UserHomeComponent implements OnInit {
  private movieService = inject(MovieService);
  private userService = inject(UserService);
  private router = inject(Router);

  userWatched = computed(() => this.userService.userWatched());
  count = signal(0);

  // State for main sections
  trendingMovies = signal<Movie[]>([]);
  trendingTV = signal<Movie[]>([]);
  upcoming = signal<Movie[]>([]);
  similarMovies = signal<Movie[]>([]);

  // State for genre sections
  genreMovies: Record<
    number,
    { movies: Movie[]; loading: boolean; error: string }
  > = {};

  // Loading and error states
  loading = signal({
    trendingMovies: true,
    trendingTV: true,
    upcoming: true,
    similarMovies: true,
  });

  error = signal({
    trendingMovies: '',
    trendingTV: '',
    upcoming: '',
    similarMovies: '',
  });

  isLoading = computed(() => {
    const load = this.loading();

    const globalLoading =
      load.trendingMovies ||
      load.trendingTV ||
      load.upcoming ||
      load.similarMovies;

    const genreLoading = Object.values(this.genreMovies).some(
      (isLoading) => isLoading
    );

    return globalLoading || genreLoading;
  });

  // Genres
  genres = [
    { id: 28, name: 'Action Packed' },
    { id: 12, name: 'Ready for Adventure?' },
    { id: 53, name: 'Spine Thrillers' },
    { id: 35, name: 'Comedy - Laugh Out Loud' },
    { id: 16, name: 'Kids corner' },
    { id: 9648, name: 'Unravelling Mystery' },
    { id: 18, name: 'Drama Hits' },
    { id: 10751, name: 'Family Favourites' },
    { id: 10752, name: 'At War' },
    { id: 80, name: 'Crime Busters' },
    { id: 14, name: 'Fantasy Adventures' },
    { id: 27, name: 'Horror Films' },
    { id: 878, name: 'Science Fiction' },
    { id: 10749, name: 'Romantic Movies' },
    { id: 99, name: 'Documentaries' },
  ];

  ngOnInit(): void {
    // Initialize genre movies state
    this.genres.forEach((genre) => {
      this.genreMovies[genre.id] = {
        movies: [],
        loading: false,
        error: '',
      };
    });

    // Load initial content
    this.loadTrendingMovies();

    // Set up timer for background rotation (if needed)
    setInterval(() => {
      this.count.update((c) => (c === 19 ? 0 : c + 1));
    }, 10000);
  }

  loadTrendingMovies(): void {
    this.loading.update((state) => ({ ...state, trendingMovies: true }));
    this.error.update((state) => ({ ...state, trendingMovies: '' }));

    this.movieService.fetchTrendingMovies().subscribe({
      next: (movies) => {
        this.trendingMovies.set(movies);
        this.loading.update((state) => ({ ...state, trendingMovies: false }));
        // Load the next section after this one completes
        this.loadTrendingTV();
      },
      error: (err) => {
        this.error.update((state) => ({
          ...state,
          trendingMovies: 'Failed to load trending movies',
        }));
        this.loading.update((state) => ({ ...state, trendingMovies: false }));
        // Still try to load the next section
        this.loadTrendingTV();
      },
    });
  }

  loadTrendingTV(): void {
    this.loading.update((state) => ({ ...state, trendingTV: true }));
    this.error.update((state) => ({ ...state, trendingTV: '' }));

    this.movieService.fetchTrendingTV().subscribe({
      next: (movies) => {
        this.trendingTV.set(movies);
        this.loading.update((state) => ({ ...state, trendingTV: false }));
        // Load the next section
        this.loadUpcoming();
      },
      error: (err) => {
        this.error.update((state) => ({
          ...state,
          trendingTV: 'Failed to load trending TV',
        }));
        this.loading.update((state) => ({ ...state, trendingTV: false }));
        // Still try to load the next section
        this.loadUpcoming();
      },
    });
  }

  loadUpcoming(): void {
    this.loading.update((state) => ({ ...state, upcoming: true }));
    this.error.update((state) => ({ ...state, upcoming: '' }));

    this.movieService.fetchUpcoming().subscribe({
      next: (movies) => {
        this.upcoming.set(movies);
        this.loading.update((state) => ({ ...state, upcoming: false }));
        // Load the next section
        this.loadSimilarMovies();
      },
      error: (err) => {
        this.error.update((state) => ({
          ...state,
          upcoming: 'Failed to load upcoming movies',
        }));
        this.loading.update((state) => ({ ...state, upcoming: false }));
        // Still try to load the next section
        this.loadSimilarMovies();
      },
    });
  }

  loadSimilarMovies(): void {
    this.loading.update((state) => ({ ...state, similarMovies: true }));
    this.error.update((state) => ({ ...state, similarMovies: '' }));

    this.movieService.fetchSimilarMovies(this.userWatched().id.toString()).subscribe({
      next: (movies) => {
        this.similarMovies.set(movies);
        this.loading.update((state) => ({ ...state, similarMovies: false }));

        // Load Genre Movies
        for (const genre of this.genres) {
          this.loadGenreMovies(genre.id);
        }
      },
      error: (err) => {
        this.error.update((state) => ({
          ...state,
          similarMovies: `Failed to load similar movies`,
        }));
        this.loading.update((state) => ({ ...state, similarMovies: false }));

        // Still try to load Genre Movies
        for (const genre of this.genres) {
          this.loadGenreMovies(genre.id);
        }
      },
    });
  }

  loadGenreMovies(genreId: number): void {
    if (
      this.genreMovies[genreId].loading ||
      this.genreMovies[genreId].movies.length > 0
    ) {
      return; // Already loading or loaded
    }

    this.genreMovies[genreId].loading = true;
    this.genreMovies[genreId].error = '';

    this.movieService.fetchMoviesByGenre(genreId).subscribe({
      next: (movies) => {
        this.genreMovies[genreId].movies = movies;
        this.genreMovies[genreId].loading = false;
      },
      error: (err) => {
        this.genreMovies[genreId].error = `Failed to load ${this.getGenreName(
          genreId
        )} movies`;
        this.genreMovies[genreId].loading = false;
      },
    });
  }

  getGenreName(id: number): string {
    return this.genres.find((g) => g.id === id)?.name || 'Unknown';
  }
}
