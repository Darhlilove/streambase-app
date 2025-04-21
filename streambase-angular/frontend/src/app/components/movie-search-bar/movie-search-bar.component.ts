import {
  Component,
  inject,
  signal,
  computed,
  input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  switchMap,
  tap,
  catchError,
  takeUntil,
} from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { MovieService } from '../../core/services/movie.service';
import type { Movie } from '../../core/models/movie.model';
import { AuthService } from '../../core/services/auth.service';
import { MovieResultsComponent } from "../movie-results/movie-results.component";
import { MatDialog } from '@angular/material/dialog';
import { SignInPromptDialogComponent } from '../dialogs/sign-in-prompt-dialog/sign-in-prompt-dialog.component';

@Component({
  selector: 'app-movie-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MovieResultsComponent
],
  templateUrl: './movie-search-bar.component.html',
  styleUrls: ['./movie-search-bar.component.scss'],
})
export class MovieSearchBarComponent implements OnInit, OnDestroy {
  // Input property for width
  width = input<string>('100%');

  // Services
  private movieService = inject(MovieService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog)
  private destroy$ = new Subject<void>();


  // Form control for search input
  searchControl = new FormControl('');

  // Signals for component state
  searchType = signal<string>('Title');
  searchResults = signal<Movie[]>([]);
  isSearching = signal<boolean>(false);
  isSearchError = signal<boolean>(false);
  showResults = signal<boolean>(false);
  genreQuery = signal<string>('');

  // Computed values
  hasResults = computed(() => this.searchResults().length > 0);

  // Available search filters
  filters = ['Title', 'Genre', 'Director', 'Actor', 'Year'];

  // Genres
  genres = [
    {
      id: 28,
      name: 'Action',
    },
    {
      id: 12,
      name: 'Adventure',
    },
    {
      id: 16,
      name: 'Animation',
    },
    {
      id: 35,
      name: 'Comedy',
    },
    {
      id: 80,
      name: 'Crime',
    },
    {
      id: 99,
      name: 'Documentary',
    },
    {
      id: 18,
      name: 'Drama',
    },
    {
      id: 10751,
      name: 'Family',
    },
    {
      id: 14,
      name: 'Fantasy',
    },
    {
      id: 36,
      name: 'History',
    },
    {
      id: 27,
      name: 'Horror',
    },
    {
      id: 10402,
      name: 'Music',
    },
    {
      id: 9648,
      name: 'Mystery',
    },
    {
      id: 10749,
      name: 'Romance',
    },
    {
      id: 878,
      name: 'Science Fiction',
    },
    {
      id: 10770,
      name: 'TV Movie',
    },
    {
      id: 53,
      name: 'Thriller',
    },
    {
      id: 10752,
      name: 'War',
    },
    {
      id: 37,
      name: 'Western',
    },
  ];

  ngOnInit(): void {
    // Set up search input subscription
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((value) => !!value && value.length > 1),
        tap(() => {
          this.isSearching.set(true);
          this.isSearchError.set(false);
        }),
        switchMap((value) =>
          this.movieService
            .performSearch(
              this.searchType(),
              this.searchType() === 'Genre' ? this.genreQuery() : value || ''
            )
            .pipe(
              catchError(() => {
                this.isSearchError.set(true);
                this.isSearching.set(false);
                return of([]);
              })
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((results) => {
        this.searchResults.set(results ?? []);
        this.isSearching.set(false);
        this.showResults.set(true);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Handle search result click
  handleMovieClick(movie: Movie) {
    const user = this.authService.getUser();

    if (user) {
      this.router.navigate(['/watch', movie.id], {
        queryParams: { media_type: movie.media_type ?  movie.media_type : movie.release_date ? 'movie' : 'tv'},
      });
      this.showResults.set(false);
      this.searchControl.setValue('');
    } else {
      this.openSignInDialog();
      this.showResults.set(false);
      this.searchControl.setValue('');
    }
  }

  // Set genre type to search for
  setGenreSearchTerm(genreName: string, genreId: number) {
    this.searchType.set('Genre');
    this.setSearchValueManually(genreName);
    this.genreQuery.set(genreId.toString());
  }

  // Change search type
  setSearchType(type: string) {
    this.searchType.set(type);
  }

  // Close search results
  closeResults() {
    setTimeout(() => {
      this.showResults.set(false);
    }, 300);
  }

  // Error handler for broken image link
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://dummyimage.com/48x60/757575/757575.png';
  }

  // Show search results
  makeResultsVisible() {
    if (this.searchControl.value && this.searchControl.value?.length > 1) {
      this.showResults.set(true);
    }
  }
 
  // Used to set the genre type when a user selects
  @ViewChild('searchInput') searchInput!: ElementRef;
  setSearchValueManually(value: string): void {
    this.searchControl.setValue(value);
    this.searchInput.nativeElement.focus();
  }

  // Sign in dialog to be used if user is not logged in
  openSignInDialog(): void {
      const dialogRef = this.dialog.open(SignInPromptDialogComponent);
  
      // Handle after closed
      dialogRef.afterClosed().subscribe({});
    }
}
