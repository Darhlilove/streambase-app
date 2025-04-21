import {
  Component,
  inject,
  signal,
  computed,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DomSanitizer } from '@angular/platform-browser';
import { switchMap, tap, catchError, of, Subscription } from 'rxjs';
import { formatDistanceToNow } from 'date-fns';

import {
  MovieService,
  ReviewService,
  SnackbarService,
  UserService,
} from '../../../core/services';
import type { Movie, Video, Review, Cast, Reply } from '../../../core/models';
import { CardIconsComponent } from '../../../components/movie-card-icons/movie-card-icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { MovieCardComponent } from '../../../components/cards/movie-card/movie-card.component';
import { CastsCardComponent } from '../../../components/cards/casts-card/casts-card.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { CustomButtonComponent } from '../../../components/ui/custom-button/custom-button.component';
import { UserAvatarComponent } from '../../../components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatMenuModule,
    MatDividerModule,
    MovieCardComponent,
    CardIconsComponent,
    CastsCardComponent,
    CustomButtonComponent,
    UserAvatarComponent,
  ],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.scss'],
})
export class MovieDetailComponent implements OnInit, OnDestroy {
  [x: string]: any;
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private reviewService = inject(ReviewService);
  private snackbarService = inject(SnackbarService);
  private sanitizer = inject(DomSanitizer);
  private queryParamSub: Subscription;

  // States
  currentUser = computed(() => this.authService.getUser());
  userPrivilege = computed(() => this.userService.getUserPrivilege());
  isAdmin = computed(() => !!this.authService.isAdminLoggedIn());
  movie = signal<Movie | null>(null);
  movieId: string = '';
  mediaType = signal<string>('');
  videos = signal<Video[]>([]);
  similarMovies = signal<Movie[]>([]);
  casts = signal<Cast[]>([]);
  fullCast = signal<Cast[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  activeTab = signal(0);
  showFullCast = signal(false);
  isPlayTrailer = signal(false);

  reviews = computed<Review[]>(() => this.reviewService.getReviews());
  isReviewingMovie = signal(false);
  newReview = '';
  ratingStars = [1, 2, 3, 4, 5];
  newRating = 0;
  hoverRating = 0;
  reviewBeingEdited = '';
  replyBeingEdited = '';

  commentingOn = signal<string | null>(null);
  viewReplies = signal<string | null>(null);
  newReply = '';

  // Computed values
  trailerUrl = computed(() => {
    const trailer = this.videos().find(
      (video) => video.type === 'Trailer' && video.site === 'YouTube'
    );

    if (!trailer) return null;

    const base = `https://www.youtube.com/embed/${trailer.key}`;
    const url = this.isPlayTrailer() ? base + '?autoplay=1&mute=1' : base;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  backdropUrl = computed(() => {
    if (!this.movie() || !this.movie()?.backdrop_path) return null;
    return `https://image.tmdb.org/t/p/original${this.movie()?.backdrop_path}`;
  });

  posterUrl = computed(() => {
    if (!this.movie() || !this.movie()?.poster_path)
      return '/assets/images/no-poster.jpg';
    return `https://image.tmdb.org/t/p/w500${this.movie()?.poster_path}`;
  });

  releaseYear = computed(() => {
    const movie = this.movie();
    if (!movie) return '';

    const date = movie.release_date || movie.first_air_date;
    if (!date) return '';
    
    return new Date(date).getFullYear();
  });

  runtime = computed(() => {
    const movie = this.movie();
    if (!movie || !movie.runtime) return 'N/A';

    if (this.mediaType() === 'movie') {
      const hours = Math.floor(movie.runtime / 60);
      const minutes = movie.runtime % 60;

      return `${hours}h ${minutes}m`;
    }

    return null;
  });

  seasons = computed(() => {
    return (
      this.movie()?.number_of_seasons +
      ' Seasons ' +
      this.movie()?.number_of_episodes +
      ' Episodes'
    );
  });

  genres = computed(() => {
    const movie = this.movie();
    if (!movie || !movie.runtime) return 'N/A';

    return movie.genres?.map((g) => g.name).join(', ');
  });

  isLoggedIn = computed(() => this.authService.isLoggedIn());

  // Constructor
  constructor() {
    this.queryParamSub = this.route.queryParamMap.subscribe((queryParams) => {
      const mediaType = queryParams.get('media_type');
      this.mediaType.set(mediaType || 'movie');
      if (mediaType) {
        localStorage.setItem('media_type', mediaType);
      }
    });
  }

  // Initialisation onInIt
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const movieId = params.get('id');
          if (!movieId) {
            this.error.set('Movie ID not found');
            return of(null);
          }

          this.movieId = movieId;

          this.loading.set(true);
          this.error.set(null);

          return this.movieService
            .fetchMovieDetails(movieId, this.mediaType())
            .pipe(
              tap((movie) => {
                this.movie.set(movie);
                this.loadVideos(movieId, this.mediaType());
                this.loadCasts(movieId, this.mediaType());
                this.loadReviews(movieId);
                this.loadSimilarMovies(movieId, this.mediaType());
              }),
              catchError((err) => {
                this.error.set('Failed to load movie details');
                return of(null);
              })
            );
        })
      )
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.error.set('An error occurred while loading the movie');
        },
      });
  }

  // Clean up after leaving page
  ngOnDestroy(): void {
    localStorage.removeItem('media_type');
    this.queryParamSub.unsubscribe();
  }

  // Methods
  loadVideos(movieId: string, mediaType: string): void {
    this.movieService.fetchVideos(movieId, mediaType).subscribe({
      next: (videos) => this.videos.set(videos),
      error: () => console.error('Failed to load videos'),
    });
  }

  loadReviews(movieId: string): void {
    this.reviewService.fetchReviews(movieId).subscribe({
      error: () => console.error('Failed to load reviews'),
    });
  }

  loadSimilarMovies(movieId: string, media_type: string): void {
    this.movieService.fetchSimilarMovies(movieId, media_type).subscribe({
      next: (movies) => {
        if (movies.length === 0) {
          const fallbackGenres = [28, 12, 53, 80, 14];
          const genre =
            this.movie()?.genre_ids?.[0] ??
            this.pickRandomNumber(fallbackGenres);
          this.movieService.fetchMoviesByGenre(genre).subscribe({
            next: (movies) => this.similarMovies.set(movies),
          });
        } else {
          this.similarMovies.set(movies);
        }
      },
      error: () => console.error('Failed to load similar movies'),
    });
  }

  loadCasts(movieId: string, media_type: string): void {
    this.movieService.fetchCast(movieId, media_type).subscribe({
      next: (casts) => {
        this.casts.set(casts);
        this.fullCast.set(casts.slice(0, Math.min(5, casts.length)));
      },
      error: () => console.error('Failed to load similar movies'),
    });
  }

  changeTab(index: number): void {
    this.activeTab.set(index);
    console.log('user privilege: ', this.userPrivilege());
  }

  get stars(): { index: number; fill: number }[] {
    const rating = (this.movie()?.vote_average || 0) / 2;
    const fullStars = Math.floor(rating);
    const partial = rating - fullStars;

    return Array.from({ length: 5 }).map((_, i) => {
      let fill = 0;
      if (i < fullStars) fill = 100;
      else if (i === fullStars) fill = partial * 100;

      return { index: i, fill };
    });
  }

  toggleCastList() {
    this.showFullCast.update((v) => !v);
    const count = this.showFullCast() ? this.casts().length : 5;
    this.fullCast.set(this.casts().slice(0, count));
  }

  pickRandomNumber(numbers: number[]): number {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    return numbers[randomIndex];
  }

  handlePlayVideo() {
    const movie = this.movie();
    if (movie) {
      this.userService.addToWatchedList(
        movie.id.toString(),
        movie.title || movie.name || 'Unknown',
        movie.media_type || 'movie'
      );
    }
  }

  playtrailer() {
    this.changeTab(1);
    this.isPlayTrailer.set(true);
  }

  formatDistanceToNow(date: string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  }

  userReviewIsAvailable() {
    return this.reviews().some(
      (r: Review) => r.user.email === this.currentUser()?.dateOfBirth
    );
  }

  setRating(value: number) {
    if (!this.userReviewIsAvailable()) {
      this.newRating = value;
    }
  }

  resetHover() {
    this.hoverRating = 0;
  }

  /** Function to decide which stars should be filled */
  getStarFill(index: number): boolean {
    return (this.hoverRating || this.newRating) > index;
  }

  /** Filled star for rating and hollow otherwise */
  getStarIcon(index: number): string {
    return (this.hoverRating || this.newRating) > index
      ? 'star'
      : 'star_border';
  }

  handleReview(isZeroReviews: boolean = false) {
    if (isZeroReviews || this.isReviewingMovie()) {
      const user = this.currentUser();
      if (!user) {
        this.snackbarService.show(
          'Oops, something went wrong. Please try again.',
          'error'
        );
        return;
      }
      if (this.newRating === 0) {
        this.snackbarService.show('Please provide a rating.', 'error');
        return;
      }

      const reviewData: Partial<Review> = {
        text: this.newReview.trim(),
        user: { name: user?.name, email: user?.email, image: user?.image },
        movieId: this.movieId,
        movieMediaType: this.mediaType(),
        rating: this.newRating,
        replies: [],
      };
      this.reviewService.postOrUpdateReview(reviewData).subscribe(() => {
        this.newReview = '';
        this.isReviewingMovie.set(false);
      });
    } else {
      this.isReviewingMovie.set(true);
    }
  }

  onEditReview(review: Review) {
    this.newReview = review.text;
    this.newRating = review.rating;
    this.reviewBeingEdited = review.id;
    this.isReviewingMovie.set(true);
  }

  onCancelReview() {
    this.newReview = '';
    this.newRating = 0;
    this.reviewBeingEdited = '';
    this.isReviewingMovie.set(false);
  }

  editReview(reviewId: string) {
    const reviewData: Partial<Review> = {
      text: this.newReview.trim(),
      rating: this.newRating,
    };
    this.reviewService
      .postOrUpdateReview(reviewData, reviewId)
      .subscribe(() => {
        this.newReview = '';
        this.isReviewingMovie.set(false);
      });
  }

  handleFlagReview(reviewId: string, flag: boolean) {
    const reviewData: Partial<Review> = {
      flagged: flag,
    };
    this.reviewService
      .postOrUpdateReview(reviewData, reviewId, true)
      .subscribe(() => {});
  }

  deleteReview(reviewId: string) {
    this.reviewService.deleteReview(reviewId).subscribe();
  }

  isNewReviewAllow(): boolean {
    return !this.reviews().some((r) => r.user.email === this.currentUser()?.email)
  }

  handleReplyReview(reviewId: string) {
    const user = this.currentUser();
    const replyData: Partial<Reply> = {
      replyText: this.newReply.trim(),
      replyUser: { name: user?.name, email: user?.email, image: user?.image },
      replyDate: new Date().toISOString(),
    };
    this.reviewService.postOrUpdateReply(replyData, reviewId).subscribe(() => {
      this.newReply = '';
      this.commentingOn.set(null);
    });
  }

  onEditReply(reply: Reply) {
    this.replyBeingEdited = reply.replyId;
    this.newReply = reply.replyText;
  }

  editReply(reviewId: string, replyId: string) {
    const replyData: Partial<Reply> = {
      replyText: this.newReply.trim(),
    };

    this.reviewService
      .postOrUpdateReply(replyData, reviewId, replyId)
      .subscribe(() => {
        this.newReply = '';
        this.commentingOn.set(null);
        this.replyBeingEdited = '';
      });
  }

  cancelReply() {
    this.commentingOn.set(null);
    this.newReply = '';
    this.replyBeingEdited = '';
  }

  toggleReplies(reviewId: string) {
    this.viewReplies.set(this.viewReplies() === reviewId ? null : reviewId);
  }

  getSortedReplies(review: Review): Reply[] {
    return [...(review.replies || [])].sort(
      (a, b) =>
        new Date(b.replyDate).getTime() - new Date(a.replyDate).getTime()
    );
  }

  isReplyAllowed(review: Review): boolean {
    const current = this.currentUser();
    if (!current) return false;

    const notOwnReview = review.user.email !== current.email;
    const hasNotAlreadyReplied = !review.replies.some(
      (reply) => reply.replyUser.email === current.email
    );
    const bool = notOwnReview && hasNotAlreadyReplied;

    return bool;
  }

  deleteReply(reviewId: string, replyId: string) {
    this.reviewService.deleteReply(reviewId, replyId).subscribe();
  }

  handleFlagReply(reviewId: string, replyId: string, flag: boolean) {
    const replyData: Partial<Reply> = {
      flagged: flag,
    };
    this.reviewService
      .postOrUpdateReply(replyData, reviewId, replyId, true)
      .subscribe();
  }
}
