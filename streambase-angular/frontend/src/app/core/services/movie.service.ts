import { Injectable, inject, signal } from "@angular/core"
import { ApiService } from "./api.service"
import { type Observable, catchError, map, of, tap, switchMap, throwError } from "rxjs"
import type { Cast, Movie } from "../models"
import type { Video } from "../models"

@Injectable({
  providedIn: "root",
})
export class MovieService {
  private api = inject(ApiService)

  // Signals for reactive state management
  jsonMovies = signal<Movie[]>([])
  genreMovies = signal<Record<string, Movie[]>>({})
  trendingMovies = signal<Movie[]>([])
  trendingTV = signal<Movie[]>([])
  upcoming = signal<Movie[]>([])
  similarMovies = signal<Movie[]>([])
  videos = signal<Video[]>([])
  loading = signal<boolean>(false)
  error = signal<string | null>(null)

  // Fetch movie data from TMDB
  fetchTMDBMovieData(url: string): Observable<Movie> {
    return this.api.getTMDB<Movie>(url).pipe(
      catchError((error) => {
        console.error("Error fetching TMDB data:", error)
        return of(null as unknown as Movie)
      }),
    )
  }

  // Fetch video for a movie
  fetchVideo(movieId: string, mediaType: string): Observable<Video[]> {
    if (!movieId) {
      console.error("movie_id is undefined")
      return of([])
    }

    // Fetch the video data from the TMDB API for the specified movie
    const endpoint =
      mediaType === "tv" ? `/tv/${movieId}/videos?language=en-US` : `/movie/${movieId}/videos?language=en-US`

    return this.api.getTMDB<{ results: Video[] }>(endpoint).pipe(
      map((response) => response.results || []),
      catchError((error) => {
        console.error("Error fetching video data:", error)
        return of([])
      }),
    )
  }

  // Post movie to JSON
  postMovieToJson(movie: Movie): Observable<Movie> {
    try {
      const timestamp = new Date().toISOString()
      const movieWithTimestamp = {
        id: String(movie.id),
        title: movie.title,
        media_type: movie.media_type || "movie",
        poster: movie.poster_path,
        backdrop: movie.backdrop_path,
        released: movie.release_date || movie.first_air_date,
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      return this.api.get<Movie[]>("/movies", "http://localhost:3001").pipe(
        switchMap((movies) => {
          const existingMovie = movies.find((existingMovie) => existingMovie.id === movie.id)

          if (existingMovie) {
            return this.api.put<Movie>(
              `/movies/${existingMovie.id}`,
              { ...movieWithTimestamp, createdAt: existingMovie.createdAt },
              "http://localhost:3001",
            )
          } else {
            return this.api.post<Movie>("/movies", movieWithTimestamp, "http://localhost:3001")
          }
        }),
        catchError((error) => {
          console.error("Error posting movie to JSON:", error)
          throw error
        }),
      )
    } catch (error) {
      console.error("Error in postMovieToJson:", error)
      return of({} as Movie)
    }
  }

  // Fetch JSON movies
  fetchJSONMovies(): Observable<Movie[]> {
    this.loading.set(true)

    return this.api.get<Movie[]>("/movies", "http://localhost:3001").pipe(
      tap((movies) => {
        this.jsonMovies.set(movies)
        this.loading.set(false)
      }),
      catchError((error) => {
        this.loading.set(false)
        this.error.set(error.message)
        return of([])
      }),
    )
  }

  // Fetch movies by genre
  fetchMoviesByGenre(genreId: number): Observable<Movie[]> {
    this.loading.set(true)

    return this.api
      .getTMDB<{ results: Movie[] }>(
        `/discover/movie?with_genres=${genreId}&include_adult=false&include_video=true&language=en-US`,
      )
      .pipe(
        map((response) => response.results || []),
        tap((movies) => {
          // Update genre movies signal
          const currentGenreMovies = this.genreMovies()
          this.genreMovies.set({
            ...currentGenreMovies,
            [genreId]: movies,
          })

          // Post each movie to JSON
          // movies.forEach((movie) => this.postMovieToJson(movie).subscribe())

          this.loading.set(false)
        }),
        catchError((error) => {
          this.loading.set(false)
          this.error.set(error.message)
          return of([])
        }),
      )
  }

  // Fetch trending movies
  fetchTrendingMovies(): Observable<Movie[]> {
    this.loading.set(true)

    return this.api
      .getTMDB<{ results: Movie[] }>(`/trending/movie/week?include_adult=false&include_video=true&language=en-US`)
      .pipe(
        map((response) => response.results || []),
        tap((movies) => {
          this.trendingMovies.set(movies)

          // Post each movie to JSON
          // movies.forEach((movie) => this.postMovieToJson(movie).subscribe())

          this.loading.set(false)
        }),
        catchError((error) => {
          this.loading.set(false)
          this.error.set(error.message)
          return of([])
        }),
      )
  }

  // Fetch trending TV shows
  fetchTrendingTV(): Observable<Movie[]> {
    this.loading.set(true)

    return this.api.getTMDB<{ results: Movie[] }>(`/trending/tv/day?language=en-US`).pipe(
      map((response) => response.results || []),
      tap((movies) => {
        this.trendingTV.set(movies)

        // Post each movie to JSON
        // movies.forEach((movie) => this.postMovieToJson(movie).subscribe())

        this.loading.set(false)
      }),
      catchError((error) => {
        this.loading.set(false)
        this.error.set(error.message)
        return of([])
      }),
    )
  }

  // Fetch upcoming movies
  fetchUpcoming(): Observable<Movie[]> {
    this.loading.set(true)

    const today = new Date().toISOString().split("T")[0]
    const threeMonthsLater = new Date()
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
    const futureDate = threeMonthsLater.toISOString().split("T")[0]

    return this.api
      .getTMDB<{ results: Movie[] }>(
        `/discover/movie?include_adult=false&include_video=true&language=en-US&page=1&primary_release_date.gte=${today}&primary_release_date.lte=${futureDate}&release_date.gte=${today}&release_date.lte=${futureDate}&sort_by=popularity.desc`,
      )
      .pipe(
        map((response) => response.results || []),
        tap((movies) => {
          this.upcoming.set(movies)

          // Post each movie to JSON
          // movies.forEach((movie) => this.postMovieToJson(movie).subscribe())

          this.loading.set(false)
        }),
        catchError((error) => {
          this.loading.set(false)
          this.error.set(error.message)
          return of([])
        }),
      )
  }

  // Fetch similar movies
  fetchSimilarMovies(movieId: string, media_type: string = "movie"): Observable<Movie[]> {
    this.loading.set(true)

    return this.api.getTMDB<{ results: Movie[] }>(
      media_type === 'movie'
      ? `/movie/${movieId}/similar?language=en-US&page=1`
      : `/tv/${movieId}/similar?language=en-US&page=1`).pipe(
      map((response) => response.results || []),
      tap((movies) => {
        this.similarMovies.set(movies)

        // Post each movie to JSON
        // movies.forEach((movie) => this.postMovieToJson(movie).subscribe())

        this.loading.set(false)
      }),
      catchError((error) => {
        this.loading.set(false)
        this.error.set(error.message)
        return of([])
      }),
    )
  }

  // Fetch videos for a movie
  fetchVideos(movieId: string, mediaType: string): Observable<Video[]> {
    this.loading.set(true)

    return this.fetchVideo(movieId, mediaType).pipe(
      tap((videos) => {
        this.videos.set(videos)
        this.loading.set(false)
      }),
      catchError((error) => {
        this.loading.set(false)
        this.error.set(error.message)
        return of([])
      }),
    )
  }

  // Fetch movie/tv credits
  fetchCast(movieId: string, mediaType: string): Observable<Cast[]>{
    if (!movieId) {
      console.error("movie id is undefined")
      return of([])
    }

    if (!mediaType) {
      console.error("media type is undefined")
      return of([])
    }

    // Fetch the credits data from the TMDB API for the specified movie
    const endpoint =
      mediaType === "tv" ? `/tv/${movieId}/credits?language=en-US` : `/movie/${movieId}/credits?language=en-US'`

    return this.api.getTMDB<{ cast: Cast[] }>(endpoint).pipe(
      map((response) => response.cast ?? []),
      catchError((error) => {
        console.error("Error fetching video data:", error)
        return of([])
      }),
    )
  }

  fetchMovieDetails(movieId: string, mediaType: string): Observable<Movie | null> {
    if (!movieId || !mediaType) {
      console.error("movieId or mediaType is undefined");
      return of(null);
    }

    const endpoint =
      mediaType === 'tv' ? `/tv/${movieId}?language=en-US` : `/movie/${movieId}?language=en-US`;

    return this.api.getTMDB<Movie>(endpoint).pipe(
      map((movie) => ({
        ...movie,
        media_type: mediaType as 'movie' | 'tv'
      })),
      catchError((error) => {
        console.error("Error fetching movie details:", error);
        return of(null); // Return null on error to match return type
      })
    );
  }

  performSearch(searchType: string, query: string): Observable<Movie[] | null> {
    let endpoint = "";

    switch (searchType) {
      case "Title":
        endpoint = `/search/multi?query=${encodeURIComponent(query)}`;
        break;
      case "Genre":
        endpoint = `/discover/movie?with_genres=${encodeURIComponent(query)}`;
        break;
      case "Director":
      case "Actor":
        endpoint = `/search/person?query=${encodeURIComponent(query)}`;
        break;
      case "Year":
        endpoint = `/discover/movie?primary_release_year=${encodeURIComponent(query)}`;
        break;
      default:
        return throwError(() => new Error("Invalid search type"));
    }
    return this.api.getTMDB<{results: Movie[]}>(endpoint).pipe(
      map(data => {
        if (data.results) {

          function sortMovies(a: Movie, b: Movie) {
            if (b.release_date !== a.release_date) {
              const dateA =  new Date(a.release_date || a.first_air_date || 0);
              const dateB =  new Date(b.release_date || b.first_air_date || 0);
              return dateB.getTime() - dateA.getTime();
            }
            const popA = a.popularity ? a.popularity : 0;
            const popB = b.popularity ? b.popularity : 0;
            return popB - popA;
          }

          if (searchType === "Title" || searchType === "Genre" || searchType === "Year") {
            const sortedMovies = data.results
              .filter(result => result.media_type !== 'person')
              .sort(sortMovies);

            return sortedMovies.map(item => ({ label: item.title || item.name, ...item }));
          }

          if (searchType === "Director" || searchType === "Actor") {
            const movies: Movie[] = [];

            // Iterate over the results and filter movies based on known_for_department
            data.results.forEach(result => {
              if (searchType === "Actor" && result.known_for_department === "Acting" && Array.isArray(result.known_for)) {
                result.known_for.forEach(movie => {
                  movies.push(movie);
                });
              }

              if (searchType === "Director" && result.known_for_department === "Directing" && Array.isArray(result.known_for)) {
                result.known_for.forEach(movie => {
                  movies.push(movie);
                });
              }
            });

            if (movies.length === 0) {
              return []; // Return empty array if no movies found
            }

            const sortedMovies = movies
              .sort(sortMovies);

            return sortedMovies.map(item => ({ label: item.title || item.name, ...item }));
          }
        }
        return [];
      }),
      catchError((error) => {
        console.error("Error fetching movies:", error);
        return of(null); // Return null on error to match return type
      })
    );
  }

}

