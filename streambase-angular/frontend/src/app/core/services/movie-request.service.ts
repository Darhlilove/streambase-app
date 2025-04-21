import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { type Observable, catchError, of, switchMap, tap } from 'rxjs';
import type { MovieRequest } from '../models/movie-request.model';
import { SnackbarService } from './snackBar.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class MovieRequestService {
  private api = inject(ApiService);
  private snackbarService = inject(SnackbarService)
  private notificationService = inject(NotificationService)
  private API_ENDPOINT = `/movie-requests`;

  // Signals for reactive state management
  requests = signal<MovieRequest[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Helper function to generate the current timestamp
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Fetch all movie requests
  fetchMovieRequests(): Observable<MovieRequest[]> {
    this.loading.set(true);
    this.error.set(null);

    return this.api.get<MovieRequest[]>(this.API_ENDPOINT).pipe(
      tap((requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to fetch movie requests');
        throw error;
      })
    );
  }

  getMovieRequests(): Observable<MovieRequest[]> {
    return this.api.get<MovieRequest[]>(this.API_ENDPOINT);
  }

  getMovieRequestById(id: string): Observable<MovieRequest> {
    return this.api.get<MovieRequest>(`${this.API_ENDPOINT}/${id}`);
  }

  createMovieRequest(request: MovieRequest, userId: string, userName: string): Observable<MovieRequest> {
    const localMoviesEndpoint = '/movies';
    return this.api
      .get<any[]>(`${localMoviesEndpoint}?title=${encodeURIComponent(request.movieTitle)}&media_type=${request.mediaType}`)
      .pipe(
        switchMap((localMovies) => {
          const existing = localMovies.find(
            (movie) =>
              movie.title.toLowerCase() === request.movieTitle.toLowerCase() &&
              new Date(movie.released).getFullYear() === parseInt(request.year)
          );
  
          // Inform user if movie already exists
          if (existing) {
            this.snackbarService.show('Movie already exists. You can search now to view', 'info');
            return of(existing as MovieRequest);
          }
  
          // Post request to server if movie doesn't exist
          return this.api.post<MovieRequest>(this.API_ENDPOINT, request).pipe(
            tap(() => {
              const notificationData = {
                date: new Date().toISOString(),
                from: userId,
                to: 'Admin1',
                message: `${userName} requested for a movie!`,
                read: false,
              };
              this.notificationService.sendNotification(notificationData).subscribe();
              this.snackbarService.show('Your movie request has been submitted!', 'success');
            })
          );
        }),
        catchError((error) => {
          this.snackbarService.show('Failed to create movie request', 'error');
          throw error;
        })
      );
  }  

  updateMovieRequest(
    id: string,
    request: Partial<MovieRequest>
  ): Observable<MovieRequest> {
    return this.api.patch<MovieRequest>(`${this.API_ENDPOINT}/${id}`, request);
  }

  deleteMovieRequest(id: string): Observable<void> {
    return this.api.delete<void>(`${this.API_ENDPOINT}/${id}`);
  }
}
