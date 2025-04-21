import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  effect,
  EffectRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Movie, MovieReference, User } from '../../../core/models';
import { MovieCardComponent } from '../../../components/cards/movie-card/movie-card.component';
import { forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { MovieService, UserService } from '../../../core/services';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackBar.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-movie-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MovieCardComponent,
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':leave', [
        animate('300ms ease', style({ opacity: 0, transform: 'translateY(10px)' }))
      ])
    ])
  ],
  templateUrl: './my-lists.component.html',
  styleUrls: ['./my-lists.component.scss'],
})
export class MyListsComponent implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private movieService = inject(MovieService);
  private snackbarService = inject(SnackbarService);

  // State
  private user = this.authService.getUser();
  private _sortBy = signal<string>('title');
  private _filterText = signal<string>('');
  private _isLoading = signal<boolean>(false);
  private movies = signal<Movie[]>([]);

  title = signal<string>('My Favorites');
  emptyMessage = signal<string>('No movies found');
  listToView = signal<'favorites' | 'watchlist' | 'watchedList'>('favorites');

  // Computed values
  readonly sortBy = this._sortBy.asReadonly();
  readonly filterText = this._filterText.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly filteredMovies = computed(() => {
    let result = [...this.movies()];

    // Apply filter
    if (this._filterText()) {
      const filterText = this._filterText().toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title?.toLowerCase().includes(filterText) ||
          movie.name?.toLowerCase().includes(filterText) ||
          movie.overview?.toLowerCase().includes(filterText) ||
          movie.genres?.some((genre) =>
            genre.name.toLowerCase().includes(filterText)
          )
      );
    }

    // Apply sort
    switch (this._sortBy()) {
      case 'title':
        result.sort(
          (a, b) =>
            (a.title ?? '').localeCompare(b.title ?? '') ||
            (a.name ?? '').localeCompare(b.name ?? '')
        );
        break;
      case 'title-desc':
        result.sort((a, b) => (b.title ?? '').localeCompare(a.title ?? ''));
        break;
      case 'rating':
        result.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'rating-asc':
        result.sort((a, b) => (a.vote_average || 0) - (b.vote_average || 0));
        break;
      case 'release-date':
        result.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'release-date-asc':
        result.sort((a, b) => {
          const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
          const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;
          return dateA - dateB;
        });
        break;
    }

    return result;
  });

  // Effect to refetch user movie list as it changes
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadMovies('favorites', true);

    this.userService.refetchRequested$
      .pipe(takeUntil(this.destroy$))
      .subscribe(listType => {
        if(listType === this.listToView())
          this.loadMovies(listType, true);
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Methods
  setSortBy(sort: string): void {
    this._sortBy.set(sort);
  }

  setFilterText(filter: string): void {
    this._filterText.set(filter);
  }

  setLoading(isLoading: boolean): void {
    this._isLoading.set(isLoading);
  }

  loadMovies(listToView: 'favorites' | 'watchlist' | 'watchedList', isTrigger: boolean = false): void {
    this.setLoading(true);
    
    if(!isTrigger){
      this.listToView.set(listToView);
      this.title.set(
        listToView === 'favorites'
          ? 'My Favorites'
          : listToView === 'watchlist'
          ? 'My Watchlist'
          : 'My Watch History'
      );
    }

    if (!this.user?.email) {
      this.setLoading(false);
      return;
    }

    this.userService.fetchUserData().subscribe({
      next: (data) => {
        const listKey = listToView as keyof User;
        const movieSubData = data[listKey] ?? [];

        if (
          Array.isArray(movieSubData) &&
          movieSubData.every(
            (item) =>
              typeof item === 'object' && 'id' in item && 'media_type' in item
          )
        ) {
          this.getMovieDetails(movieSubData).subscribe((fetchedMovies) => {
            const current = this.movies();
          
            // Build a map of current movies for quick lookup
            const currentMap = new Map(current.map((movie) => [movie.id, movie]));
          
            // Track updated list
            const updated: Movie[] = [];
          
            // Step 1: Keep or replace existing movies
            for (const movie of fetchedMovies) {
              const existing = currentMap.get(movie.id);
              updated.push(existing ?? movie); // keep reference if unchanged
              currentMap.delete(movie.id); // remove from map, used to find obsolete later
            }
          
            // Step 2: currentMap now only contains movies that were removed — filter them out
            if (
              updated.length !== current.length || // something added or removed
              updated.some((m, i) => m.id !== current[i].id) // reordering or diff
            ) {
              this.movies.set(updated);
            }
          
            this.setLoading(false);
          });
        }
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.snackbarService.show('Failed to load movies', 'error');
        this.setLoading(false);
      },
    });
  }

  getMovieDetails(movies: MovieReference[]) {
    return movies.length
      ? forkJoin(
          movies.map((movie) =>
            this.movieService.fetchMovieDetails(
              movie.id.toString(),
              movie.media_type
            )
          )
        ).pipe(map((results) => results.filter((m): m is Movie => m !== null)))
      : of([]);
  }
}
