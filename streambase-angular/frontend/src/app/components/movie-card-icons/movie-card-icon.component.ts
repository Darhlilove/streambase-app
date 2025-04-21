import { Component, input, output, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { UserService } from '../../core/services';
import type { Movie } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-card-icons',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './movie-card-icon.component.html',
  styleUrls: ['./movie-card-icon.component.scss'],
})
export class CardIconsComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Inputs
  movie = input.required<Movie>();
  showLabels = input(false);
  size = input<'small' | 'medium' | 'large'>('large');
  direction = input<string>('column');

  // Computed values
  isLoggedIn = computed(() => this.authService.isLoggedIn());

  isFavorite = computed(() => {
    if (!this.isLoggedIn()) return false;
    return this.userService.isFavorite(this.movie().id.toString());
  });

  isInWatchlist = computed(() => {
    if (!this.isLoggedIn()) return false;
    return this.userService.isWatchlist(this.movie().id.toString());
  });

  isWatched = computed(() => {
    if (!this.isLoggedIn()) return false;
    return this.userService.isWatched(this.movie().id.toString());
  });

  // Methods
  private handleFavoriteAction(
    movieId: number | string,
    title: string,
    mediaType: 'movie' | 'tv' | 'person'
  ): void {
    if (this.isFavorite()) {
      this.userService.removeFromFavorites(movieId.toString()).subscribe({
        next: () => this.userService.triggerRefetch('favorites')
      });
    } else {
      this.userService
        .addToFavorites(movieId.toString(), title, mediaType)
        .subscribe({
          next: () => this.userService.triggerRefetch('favorites')
        });
    }
  }

  private handleWatchlistAction(
    movieId: number | string,
    title: string,
    mediaType: 'movie' | 'tv' | 'person'
  ): void {
    if (this.isInWatchlist()) {
      this.userService.removeFromWatchlist(movieId.toString()).subscribe({
        next: ()=> this.userService.triggerRefetch('watchlist')
      });
    } else {
      this.userService
        .addToWatchlist(movieId.toString(), title, mediaType)
        .subscribe({
          next: ()=> this.userService.triggerRefetch('watchlist')
        });
    }
  }

  private handleWatchedAction(
    movieId: number | string,
    title: string,
    mediaType: 'movie' | 'tv' | 'person'
  ): void {
    if (this.isWatched()) {
      this.userService.removeFromWatchedList(movieId.toString()).subscribe({
        next: ()=> this.userService.triggerRefetch('watchedList')
      });
    } else {
      this.userService
        .addToWatchedList(movieId.toString(), title, mediaType)
        .subscribe({
          next: ()=> this.userService.triggerRefetch('watchedList')
        });
    }
  }

  toggleUserListAction(
    event: Event,
    action: 'favorites' | 'watchlist' | 'watched'
  ): void {
    event.stopPropagation();

    // Check if user is logged in
    if (!this.isLoggedIn()) {
      this.router.navigate(['/sign-in']);
      return;
    }

    const movie = this.movie();
    if (!movie) return;

    const mediaType =
      movie.media_type ?? (movie.number_of_seasons ? 'tv' : 'movie');
    const title = movie.title ?? movie.name ?? 'Unknown';

    switch (action) {
      case 'favorites':
        this.handleFavoriteAction(movie.id, title, mediaType);
        break;

      case 'watchlist':
        this.handleWatchlistAction(movie.id, title, mediaType);
        break;

      case 'watched':
        this.handleWatchedAction(movie.id, title, mediaType);
        break;
    }
  }

  // Helper methods
  getButtonClass(): string {
    switch (this.size()) {
      case 'small':
        return 'icon-button-small';
      case 'large':
        return 'icon-button-large';
      default:
        return 'icon-button-medium';
    }
  }

  getIconClass(): string {
    switch (this.size()) {
      case 'small':
        return 'icon-small';
      case 'large':
        return 'icon-large';
      default:
        return 'icon-medium';
    }
  }
}
