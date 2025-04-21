import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '../api.service';
import { Movie } from '../../models';
import { catchError, map, Observable, switchMap, tap, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AdminMovieService {
  private readonly MOVIE_REQUESTS_API_ENDPOINT = '/movie-requests';
  private readonly TMDB_SEARCH_ENDPOINT = '/search';

  private api = inject(ApiService);

  /**
   * Signal to store the list of movies fetched from the API.
   */
  private jsonMovies = signal<Movie[]>([]);

  constructor() {
    this.fetchJSONMovies().subscribe({
      next: (movies) => {
        this.jsonMovies.set(movies);
      },
    });
  }

  /**
   * Fetches the list of movies from the API and updates the signal.
   * @returns An observable of the list of movies.
   */
  fetchJSONMovies(): Observable<Movie[]> {
    return this.api.get<Movie[]>('/movies').pipe(
      map((movies) => {
        if (!movies || movies.length === 0) {
          console.error('No movies found');
          return [];
        }

        return movies;
      }),
      tap((movies) => {
        this.jsonMovies.set(movies);
      })
    );
  }

  /**
   * Returns the list of movies from the signal.
   * @returns An array of movies.
   */
  getJSONMovies(): Movie[] {
    return this.jsonMovies();
  }

  /**
   * Returns a movie by its ID.
   * @param id The ID of the movie.
   * @returns The movie object or undefined if not found.
   */
  getJSONMovieById(id: number): Movie | undefined {
    return this.jsonMovies().find((movie) => movie.id === id);
  }

  /**
   * Adds a new movie to the list and updates the signal.
   * @param movie The movie object to be added.
   * @returns An observable of the added movie.
   */
  addJSONMovie(movie: Movie): Observable<Movie> {
    return this.api.post<Movie>('/movies', movie).pipe(
      map((newMovie) => {
        this.jsonMovies.update((movies) => [...movies, newMovie]);
        return newMovie;
      })
    );
  }

  /**
   * Updates an existing movie in the list and updates the signal.
   * @param movie The movie object to be updated.
   * @returns An observable of the updated movie.
   */
  updateJSONMovie(movie: Movie): Observable<Movie> {
    return this.api.put<Movie>(`/movies/${movie.id}`, movie).pipe(
      map((updatedMovie) => {
        this.jsonMovies.update((movies) =>
          movies.map((m) => (m.id === updatedMovie.id ? updatedMovie : m))
        );
        return updatedMovie;
      })
    );
  }

  /**
   * Deletes a movie from the list and updates the signal.
   * @param id The ID of the movie to be deleted.
   * @returns An observable of void.
   */
  deleteJSONMovie(id: number): Observable<void> {
    return this.api.delete<void>(`/movies/${id}`).pipe(
      map(() => {
        this.jsonMovies.update((movies) =>
          movies.filter((movie) => movie.id !== id)
        );
      })
    );
  }

  /**
   * Constructor that initializes the service and fetches the list of movies.
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Fetches the list of movie requests from the API.
   * @returns An observable of the list of movie requests.
   */
  fetchMovieRequests() {
    return this.api
      .get<any[]>(this.MOVIE_REQUESTS_API_ENDPOINT)
      .pipe(catchError(this.handleError));
  }

  // /**
  //  * Approves a movie request by searching for the movie on TMDB and updating the request status.
  //  * @param requestId The ID of the movie request to approve.
  //  * @param title The title of the movie to search for on TMDB.
  //  * @param mediaType The type of media (e.g., "movie" or "tv").
  //  * @returns An observable of the updated movie request.
  //  * @throws An error if the movie is not found on TMDB.
  //  */
  // approveMovieRequest(requestId: string, title: string, mediaType: string) {
  //   const tmdbEndpoint = `${this.TMDB_SEARCH_ENDPOINT}/${mediaType}`;

  //   return this.api
  //     .getTMDB<any>(tmdbEndpoint, new HttpParams().set('query', title))
  //     .pipe(
  //       switchMap((tmdbData) => {
  //         if (!tmdbData.results || tmdbData.results.length === 0) {
  //           throw new Error(`Movie "${title}" not found on TMDB`);
  //         }

  //         const tmdbId = tmdbData.results[0].id;
  //         const patchData = {
  //           status: 'approved',
  //           updatedAt: this.getCurrentTimestamp(),
  //           tmdb_id: tmdbId,
  //         };

  //         return this.api.patch<any>(
  //           `${this.API_ENDPOINT}/${requestId}`,
  //           patchData
  //         );
  //       }),
  //       catchError(this.handleError)
  //     );
  // }

  /**
   * Approves a movie request by searching for the movie in the local database first.
   * If not found, it searches TMDB and adds the movie to the local database.
   * @param requestId The ID of the movie request to approve.
   * @param title The title of the movie to search for.
   * @param mediaType The type of media (e.g., "movie" or "tv").
   * @returns An observable of the updated movie request.
   */
  approveMovieRequest(requestId: string, title: string, mediaType: string) {
    const tmdbEndpoint = `${this.TMDB_SEARCH_ENDPOINT}/${mediaType}`;
    const localMoviesEndpoint = '/movies';

    return this.api
      .get<any[]>(`${localMoviesEndpoint}?title=${encodeURIComponent(title)}`)
      .pipe(
        switchMap(() => {
          // Search TMDB
          return this.api
            .getTMDB<any>(tmdbEndpoint, new HttpParams().set('query', title))
            .pipe(
              switchMap((tmdbData) => {
                if (!tmdbData.results || tmdbData.results.length === 0) {
                  this.declineMovieRequest(requestId, 'Movie not found on TMDB');
                  throw new Error(`Movie not found on TMDB`);
                }

                const movie = tmdbData.results[0];
                const timestamp = this.getCurrentTimestamp();

                const newMovie = {
                  id: String(movie.id),
                  title: movie.title,
                  media_type: movie.media_type || mediaType || 'movie',
                  poster: movie.poster_path,
                  backdrop: movie.backdrop_path,
                  released: movie.release_date || movie.first_air_date,
                  createdAt: timestamp,
                  updatedAt: timestamp,
                };

                // First, post to JSON server
                return this.api.post<any>(localMoviesEndpoint, newMovie).pipe(
                  switchMap(() => {
                    // Add movie jsonMovies signal
                    this.jsonMovies.update((movies) => [...movies, newMovie]);

                    // Then approve the request
                    const patchData = {
                      status: 'approved',
                      updatedAt: timestamp,
                      tmdb_id: newMovie.id,
                    };

                    return this.api.patch<any>(
                      `${this.MOVIE_REQUESTS_API_ENDPOINT}/${requestId}`,
                      patchData
                    );
                  })
                );
              })
            );
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Declines a movie request and updates the request status.
   * @param requestId The ID of the movie request to decline.
   * @returns An observable of the updated movie request.
   */
  declineMovieRequest(requestId: string, reason?: string) {
    const patchData = {
      status: 'declined',
      updatedAt: this.getCurrentTimestamp(),
      reason: reason || 'No reason provided',
    };

    return this.api
      .patch<any>(`${this.MOVIE_REQUESTS_API_ENDPOINT}/${requestId}`, patchData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles errors from the API calls.
   * @param error The error object.
   * @returns An observable that throws an error.
   */
  private handleError(error: any) {
    const message = error?.message || 'Unknown error occurred';
    return throwError(() => new Error(message));
  }
}
