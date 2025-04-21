import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  type Observable,
  Subject,
  catchError,
  forkJoin,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import type { User } from '../models';
import type { Movie, MovieReference } from '../models';
import { MovieService } from './movie.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private api = inject(ApiService);
  private movieService = inject(MovieService);
  private authService = inject(AuthService);

  // Signals for reactive state management
  private localStorageUser: Partial<User> | null = null;
  private currentUser = signal<Partial<User> | null>(null);
  private allUsers = signal<User[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  private refetchUserSubject = new Subject<
    'favorites' | 'watchlist' | 'watchedList'
  >();
  private destroy$ = new Subject<void>();

  public refetchRequested$ = this.refetchUserSubject.asObservable();

  constructor() {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (!user) {
        this.localStorageUser = null;
        return;
      }

      this.localStorageUser = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  triggerRefetch(list: 'favorites' | 'watchlist' | 'watchedList') {
    this.refetchUserSubject.next(list);
  }

  // Fetch user data
  fetchUserData(): Observable<User> {
    if (!this.localStorageUser || !this.localStorageUser.email) {
      return throwError(() => new Error('No user found'));
    }

    this.loading.set(true);

    return this.api
      .get<User[]>(`/users?email=${this.localStorageUser.email}`)
      .pipe(
        map((userData) => {
          if (!userData || userData.length === 0) {
            throw new Error('User not found');
          }

          const user = userData[0];

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            image: user.image || '',
            moviePreferences: user.moviePreferences || [],
            favorites: user.favorites || [],
            watchlist: user.watchlist || [],
            watchedList: user.watchedList || [],
            following: user.following || [],
            followers: user.followers || [],
            privilege: user.privilege || null,
          };
        }),
        tap((userData) => {
          this.loading.set(false);
          this.currentUser.set(userData);
        }),
        catchError((error) => {
          console.error('Error fetching user data:', error);
          this.loading.set(false);
          this.error.set(error.message || 'Failed to fetch user data');
          return throwError(() => new Error('Failed to fetch user data'));
        })
      );
  }

  // Fetch all users data
  fetchUsersData(): Observable<User[]> {
    this.loading.set(true);

    return this.api.get<User[]>('/users').pipe(
      map((usersData) => {
        return usersData.map((user) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          image: user.image || '',
          moviePreferences: user.moviePreferences || [],
          favorites: user.favorites || [],
          watchlist: user.watchlist || [],
          watchedList: user.watchedList || [],
          following: user.following || [],
          followers: user.followers || [],
          suspended: user.suspended || false,
          privilege: user.privilege || null,
        }));
      }),
      tap((usersData) => {
        this.loading.set(false);
        this.allUsers.set(usersData);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to fetch users data');
        return throwError(() => new Error('Failed to fetch users data'));
      })
    );
  }

  // Add movie to a list (favorites, watchlist, watchedList)
  private updateUserList(
    listName: 'favorites' | 'watchlist' | 'watchedList',
    movieData: MovieReference
  ): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      return throwError(() => new Error('No user found'));
    }

    const existingList = user[listName] || [];
    const movieExists = existingList.some(
      (movie) =>
        movie.id === movieData.id &&
        movie.media_type === movieData.media_type &&
        movie.title === movieData.title
    );

    if (movieExists) {
      return of({
        ...user,
        id: user.id || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        image: user.image || '',
        moviePreferences: user.moviePreferences || [],
        favorites: user.favorites || [],
        watchlist: user.watchlist || [],
        watchedList: user.watchedList || [],
        following: user.following || [],
        followers: user.followers || [],
        privilege: user.privilege || null,
      });
    }

    const updatedList = [...existingList, movieData];

    return this.api
      .patch<User>(
        `/users/${user.id}`,
        { [listName]: updatedList }
      )
      .pipe(
        tap((updatedUser) => {
          this.currentUser.set({
            ...user,
            [listName]: updatedUser[listName],
          });
        }),
        catchError((error) => {
          console.error(`Error updating ${listName}:`, error);
          this.error.set(error.message || `Failed to update ${listName}`);
          return throwError(() => new Error(`Failed to update ${listName}`));
        })
      );
  }

  addToFavorites(movieId: string, movieName: string, media_type: string) {
    return this.updateUserList('favorites', {
      id: movieId,
      title: movieName,
      media_type,
    });
  }

  addToWatchlist(movieId: string, movieName: string, media_type: string) {
    return this.updateUserList('watchlist', {
      id: movieId,
      title: movieName,
      media_type,
    });
  }

  addToWatchedList(movieId: string, movieName: string, media_type: string) {
    return this.updateUserList('watchedList', {
      id: movieId,
      title: movieName,
      media_type,
    });
  }

  // Remove movie from a list (favorites, watchlist, watchedList)
  private removeFromUserList(
    listName: 'favorites' | 'watchlist' | 'watchedList',
    movieId: string
  ): Observable<User> {
    const user = this.currentUser();
    if (!user) {
      return throwError(() => new Error('No user found'));
    }

    const updatedList = (user[listName] || []).filter(
      (movie) => movie.id !== movieId
    );

    return this.api
      .patch<User>(
        `/users/${user.id}`,
        { [listName]: updatedList }
      )
      .pipe(
        tap((updatedUser) => {
          this.currentUser.set({
            ...user,
            [listName]: updatedUser[listName],
          });
        }),
        catchError((error) => {
          console.error(`Error removing from ${listName}:`, error);
          this.error.set(error.message || `Failed to remove from ${listName}`);
          return throwError(
            () => new Error(`Failed to remove from ${listName}`)
          );
        })
      );
  }

  removeFromFavorites(movieId: string) {
    return this.removeFromUserList('favorites', movieId);
  }

  removeFromWatchlist(movieId: string) {
    return this.removeFromUserList('watchlist', movieId);
  }

  removeFromWatchedList(movieId: string) {
    return this.removeFromUserList('watchedList', movieId);
  }

  // Follow a user
  followUser(
    targetUserId: string
  ): Observable<{ following: string[]; followers: string[] }> {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user found'));
    }

    if (currentUser.id === targetUserId) {
      return throwError(() => new Error('Cannot follow yourself'));
    }

    return this.api.get<User>(`/users/${targetUserId}`).pipe(
      switchMap((targetUserData) => {
        const updatedFollowing = Array.from(
          new Set([...(currentUser.following || []), targetUserId])
        ).filter((id): id is string => !!id);
        const updatedFollowers = Array.from(
          new Set([...(targetUserData.followers ?? []), currentUser.id])
        ).filter((id): id is string => !!id);

        return forkJoin({
          currentUserUpdate: this.api.patch(
            `/users/${currentUser.id}`,
            { following: updatedFollowing }
          ),
          targetUserUpdate: this.api.patch(
            `/users/${targetUserId}`,
            { followers: updatedFollowers }
          ),
        }).pipe(
          map(() => ({
            following: updatedFollowing,
            followers: updatedFollowers,
          }))
        );
      }),
      tap((result) => {
        const user = this.currentUser();
        if (!user) return;
        this.currentUser.set({
          ...user,
          following: result.following,
        });
        console.log('current user updated')
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to follow user');
        return throwError(() => new Error('Failed to follow user'));
      })
    );
  }

  // Unfollow a user
  unfollowUser(
    targetUserId: string
  ): Observable<{ following: string[]; followers: string[] }> {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return throwError(() => new Error('No user found'));
    }

    if (currentUser.id === targetUserId) {
      return throwError(() => new Error('Cannot unfollow yourself'));
    }

    return this.api.get<User>(`/users/${targetUserId}`).pipe(
      switchMap((targetUserData) => {
        const updatedFollowing = (currentUser.following ?? []).filter(
          (id) => id !== targetUserId
        );
        const updatedFollowers = (targetUserData.followers ?? []).filter(
          (id) => id !== currentUser.id
        );

        return forkJoin({
          currentUserUpdate: this.api.patch(
            `/users/${currentUser.id}`,
            { following: updatedFollowing }
          ),
          targetUserUpdate: this.api.patch(
            `/users/${targetUserId}`,
            { followers: updatedFollowers }
          ),
        }).pipe(
          map(() => ({
            following: updatedFollowing,
            followers: updatedFollowers,
          }))
        );
      }),
      tap((result) => {
        const user = this.currentUser();
        if (!user) return;
        this.currentUser.set({
          ...user,
          following: result.following,
        });
        console.log('current user updated')
      }),
      catchError((error) => {
        this.error.set(error.message || 'Failed to unfollow user');
        return throwError(() => new Error('Failed to unfollow user'));
      })
    );
  }

  // Fetch movies list for a user
  fetchMoviesList(moviesData: MovieReference[]): Observable<Movie[]> {
    if (!moviesData || moviesData.length === 0) {
      return of([]);
    }

    // Create array of movie request observables
    const movieRequests = moviesData.map((movie) => {
      const { id, media_type } = movie;

      if (media_type === 'movie') {
        return this.movieService.fetchTMDBMovieData(
          `/movie/${id}?language=en-US`
        );
      } else if (media_type === 'tv') {
        return this.movieService.fetchTMDBMovieData(`/tv/${id}?language=en-US`);
      }

      return of(null);
    });

    // Filter out null requests before executing
    const validRequests = movieRequests.filter(Boolean);

    if (validRequests.length === 0) {
      return of([]);
    }

    // Use forkJoin to execute all requests in parallel
    return forkJoin(validRequests).pipe(
      map((results) => results.filter(Boolean) as Movie[])
    );
  }

  isFavorite(movieId: string): boolean {
    return (
      this.currentUser()?.favorites?.some(
        (movie: MovieReference) => movie.id === movieId
      ) ?? false
    );
  }

  isWatched(movieId: string) {
    return (
      this.currentUser()?.watchedList?.some(
        (movie: MovieReference) => movie.id === movieId
      ) ?? false
    );
  }

  isWatchlist(movieId: string) {
    return (
      this.currentUser()?.watchlist?.some(
        (movie: MovieReference) => movie.id === movieId
      ) ?? false
    );
  }

  userWatched() {
    const list = this.currentUser()?.watchedList || [];
    const randomIndex = Math.floor(Math.random() * list.length);
    return (
      list[randomIndex] || { title: 'Iron Man', id: 1726, media_type: 'movie' }
    );
  }

  isFollowing(userId: string): boolean {
    const currentUser = this.currentUser();
    if (!currentUser) {
      return false;
    }
    return currentUser.following?.includes(userId) ?? false;
  }

  getUserPrivilege() {
    return this.currentUser()?.privilege;
  }

  getUserData() {
    return this.currentUser();
  }

  getAllUsersData() {
    return this.currentUser();
  }
}
