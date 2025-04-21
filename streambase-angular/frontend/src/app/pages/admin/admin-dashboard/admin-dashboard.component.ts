import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AdminMovieService } from '../../../core/services/admin/admin-movie.service';
import { UserService } from '../../../core/services';
import { Movie } from '../../../core/models';
import { User } from '../../../core/models';
import { orderBy } from 'lodash-es';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { MovieResultsComponent } from '../../../components/movie-results/movie-results.component';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NgxChartsModule, MovieResultsComponent, MatIcon],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  private movieService = inject(AdminMovieService);
  private userService = inject(UserService);
  private router = inject(Router);

  /**
   * Signal to store the list of users.
   */
  users = signal<User[]>([]);

  /**
   * Computed signal to calculate the total number of users.
   */
  totalUsers = computed(() => this.users().length);

  /**
   * Computed signal to calculate the total number of active users.
   */
  totalActiveUsers = computed(() =>
    this.users().filter((user) => !user.suspended).length
  );

  /**
   * Computed signal to calculate the total number of suspended users.
   */
  totalSuspendedUsers = computed(() =>
    this.users().filter((user) => user.suspended).length
  );
  /**
   * Computed signal to retrieve the list of movies.
   */
  movies = computed(() => this.movieService.getJSONMovies());

  /**
   * Computed signal to calculate the total number of unique movie/tv records.
   */
  totalMovies = computed(() =>
    new Set(this.movies().filter(m => m.media_type === 'movie').map(m => m.id)).size
  );
  
  totalTvShows = computed(() =>
    new Set(this.movies().filter(m => m.media_type === 'tv').map(m => m.id)).size
  );

  /**
   * Signal to store the top 10 most favorited movies.
   */
  topFavorites = signal<Movie[]>([]);

  /**
   * Signal to store the top 10 most watched movies.
   */
  topWatchlist = signal<Movie[]>([]);

  /**
   * Signal to store the top 10 most watched movies.
   */
  topWatched = signal<Movie[]>([]);

  /**
   * Signal to store movie statistics grouped by year and media type.
   */
  moviesByYearAndMediaType = computed<{
    xLabels: string[];
    movieData: number[];
    tvData: number[];
  } | null>(() => {
    const movieList = this.movies();
    return movieList.length > 0
      ? this.getMoviesByYearAndMediaType(movieList)
      : null;
  });

  /**
   * Computed signal to retrieve the chart data for movies and TV shows.
   */
  chartData = computed(() => {
    const stats = this.moviesByYearAndMediaType();
    if (!stats) return [];

    return [
      {
        name: 'Movies',
        series: stats.xLabels.map((year, i) => ({
          name: year,
          value: stats.movieData[i] || 0,
        })),
      },
      {
        name: 'TV Shows',
        series: stats.xLabels.map((year, i) => ({
          name: year,
          value: stats.tvData[i] || 0,
        })),
      },
    ];
  });


  /**
   * Store the number of skeletons to display.
   */
  skeletons = Array(4); 

  /**
   * Constructor to initialize the component.
   * Sets up reactive effects for statistics.
   */
  constructor() {
    effect(() => {
      const allUsers = this.users();
      if (allUsers.length > 0) {
        this.calculateTopMovieStats(allUsers);
      }
    });
  }

  /**
   * Initializes the component by fetching movies and users data.
   */
  ngOnInit(): void {
    // Fetch movies and users data
    // this.movieService.fetchJSONMovies().subscribe();
    this.userService.fetchUsersData().subscribe((data) => this.users.set(data));
  }

  /**
   * Calculates the top 10 movies for favorites, watchlist, and watched lists.
   * @param users The list of users to process.
   */
  private calculateTopMovieStats(users: User[]) {
    const processTop = (key: keyof User) => {
      const countMap: Record<
        string,
        { id: number; media_type: string; title: string; count: number }
      > = {};

      users.forEach((user) => {
        const list = user[key] as any[];
        if (!list) return;

        list.forEach((movie) => {
          const movieKey = `${movie.id}-${movie.media_type}`;
          if (!countMap[movieKey]) {
            countMap[movieKey] = {
              id: movie.id,
              media_type: movie.media_type,
              title: movie.title,
              count: 0,
            };
          }
          countMap[movieKey].count += 1;
        });
      });

      return orderBy(Object.values(countMap), ['count'], ['desc']).slice(0, 10);
    };

    this.userService
      .fetchMoviesList(processTop('favorites'))
      .subscribe(this.topFavorites.set);
    this.userService
      .fetchMoviesList(processTop('watchlist'))
      .subscribe(this.topWatchlist.set);
    this.userService
      .fetchMoviesList(processTop('watchedList'))
      .subscribe(this.topWatched.set);
  }

  /**
   * Groups movies by year and media type (movie or TV).
   * @param movies The list of movies to process.
   * @returns An object containing the years, movie counts, and TV counts.
   */
  private getMoviesByYearAndMediaType(movies: Movie[]) {
    // Remove duplicates based on movie ID
    const uniqueMap = new Map<number, Movie>();
    movies.forEach((movie) => {
      if (!uniqueMap.has(parseInt(movie.id as string))) {
        uniqueMap.set(parseInt(movie.id as string), movie);
      }
    });

    // Group by year and media type
    const movieYearMap: Record<string, { movie: number; tv: number }> = {};
    Array.from(uniqueMap.values()).forEach((movie) => {
      let year = movie.released ? new Date(movie.released).getFullYear() : NaN;
      if (isNaN(year)) year = 1900;
      const key = String(year);

      if (!movieYearMap[key]) {
        movieYearMap[key] = { movie: 0, tv: 0 };
      }
      if (movie.media_type === 'movie') movieYearMap[key].movie++;
      else if (movie.media_type === 'tv') movieYearMap[key].tv++;
    });

    // Sort years and prepare data for chart
    const xLabels = Object.keys(movieYearMap).sort();
    const movieData = xLabels.map((year) => movieYearMap[year].movie);
    const tvData = xLabels.map((year) => movieYearMap[year].tv);

    return { xLabels, movieData, tvData };
  }

  /**
   * Handles the click event on a movie item.
   * Navigates to the movie details page with the selected movie ID and media type.
   * @param movie The selected movie object.
   */
  handleMovieClick(movie: Movie) {
    this.router.navigate(['/watch', movie.id], {
      queryParams: {
        media_type: movie.media_type ?  movie.media_type : movie.release_date ? 'movie' : 'tv',
      },
    });
  }

  // For X-axis labels
  formatXAxis = (value: string) => {
    return value; // Add custom formatting if needed
  };

  // For Y-axis labels
  formatYAxis = (value: number) => {
    return value.toString(); // Add custom formatting if needed
  };
}
