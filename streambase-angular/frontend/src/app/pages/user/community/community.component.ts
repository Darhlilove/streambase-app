import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  UserService,
  NotificationService,
  SnackbarService,
} from '../../../core/services';
import { forkJoin, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap } from 'rxjs/operators';
import { Movie, User } from '../../../core/models';
import { MovieSliderComponent } from '../../../components/movie-slider/movie-slider.component';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserAvatarComponent } from "../../../components/user-avatar/user-avatar.component";

@Component({
  selector: 'app-community',
  standalone: true,
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss'],
  imports: [
    MovieSliderComponent,
    MatIcon,
    MatProgressSpinner,
    MatButtonToggleModule,
    ReactiveFormsModule,
    MatTooltipModule,
    UserAvatarComponent
],
})
export class CommunityComponent implements OnInit {
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private snackBar = inject(SnackbarService);

  searchControl = new FormControl('');
  view: 'following' | 'followers' | 'global' = 'following';

  allUsersData = signal<User[]>([]);
  currentUserData = computed(() => this.userService.getUserData());
  selectedUser: User | null = null;

  selectedUserFavoriteMovies: Movie[] = [];
  selectedUserWatchlistMovies: Movie[] = [];
  selectedUserWatchedListMovies: Movie[] = [];

  loading = true;
  searchTerm = '';
  selected = false;

  ngOnInit(): void {
    this.loadUsers();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => (this.searchTerm = term || ''))
      )
      .subscribe();
  }

  loadUsers(): void {
    this.userService.fetchUsersData().subscribe({
      next: (allUsers) => {
        this.allUsersData.set(allUsers);
        this.autoSelectUser();
        this.loading = false;
      },
      error: () => {
        this.snackBar.show('Failed to load users');
        this.loading = false;
      },
    });
  }

  autoSelectUser(): void {
    const filtered = this.filterUsers();
    this.selectedUser = filtered?.[0] ?? null;
    if (this.selectedUser) this.selected = true;
    this.fetchSelectedUserMovies();
  }

  filterUsers(): User[] {
    const currentUser = this.currentUserData();
    console.log('Current user:', currentUser);
    if (!currentUser) {
      throw new Error('No user found');
    }

    const term = this.searchTerm.toLowerCase();

    return this.allUsersData().filter((user) => {
      const lowerName = (
        (user.firstName ?? '') + (user.lastName ?? '')
      ).toLowerCase();

      // Check if user has content
      const hasContent =
        user.favorites?.length ||
        user.watchlist?.length ||
        user.watchedList?.length;

      if (!hasContent) return false;

      // Filter by view type
      if (this.view === 'following') {
        return (
          currentUser.following?.includes(user.id) && lowerName.includes(term)
        );
      }
      if (this.view === 'followers') {
        return (
          currentUser.followers?.includes(user.id) && lowerName.includes(term)
        );
      }
      if (this.view === 'global') {
        return (
          user.id !== currentUser.id &&
          !currentUser.following?.includes(user.id) &&
          !currentUser.followers?.includes(user.id) &&
          lowerName.includes(term)
        );
      }
      return false;
    });
  }

  fetchSelectedUserMovies(): void {
    if (!this.selectedUser) return;

    const fav = this.selectedUser.favorites ?? [];
    const watchlist = this.selectedUser.watchlist ?? [];
    const watched = this.selectedUser.watchedList ?? [];

    forkJoin({
      favorites: this.userService.fetchMoviesList(fav),
      watchlist: this.userService.fetchMoviesList(watchlist),
      watched: this.userService.fetchMoviesList(watched),
    }).subscribe(({ favorites, watchlist, watched }) => {
      this.selectedUserFavoriteMovies = favorites;
      this.selectedUserWatchlistMovies = watchlist;
      this.selectedUserWatchedListMovies = watched;
    });
  }

  handleViewChange(newView: 'following' | 'followers' | 'global'): void {
    this.view = newView;
    this.autoSelectUser();
  }

  handleUserClick(user: User): void {
    this.selectedUser = user;
    this.selected = true;
    this.fetchSelectedUserMovies();
  }

  handleFollow(userId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.currentUserData()) return;

    this.userService.followUser(userId).subscribe({
      next: () => {
        this.notificationService.sendNotification({
          to: userId,
          from: this.currentUserData()?.id,
          message: `${
            this.currentUserData()?.firstName +
            ' ' +
            this.currentUserData()?.lastName
          } followed you!`,
          read: false,
          date: new Date().toISOString(),
        }).subscribe(() => {});

        if(userId === this.selectedUser?.id){
          this.autoSelectUser()
        }
      },
      error: (error) => {
        console.error('Failed to follow user:', error);
        this.snackBar.show('Oops, failed to follow. Please try again');
      }
    });
  }

  handleUnfollow(userId: string, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.currentUserData()) return;

    this.userService.unfollowUser(userId).subscribe({
      next: () => {
        this.notificationService.sendNotification({
          to: userId,
          from: this.currentUserData()?.id,
          message: `${
            this.currentUserData()?.firstName +
            ' ' +
            this.currentUserData()?.lastName
          } unfollowed you!`,
          read: false,
          date: new Date().toISOString(),
        }).subscribe(() => {});

        if(userId === this.selectedUser?.id){
          this.autoSelectUser()
        }
      },
      error: (error) => {
        console.error('Failed to unfollow user:', error);
        this.snackBar.show('Oops, failed to unfollow. Please try again');
      }
    });
  }

  isFollowing(user: User){
    return this.userService.isFollowing(user.id);
  }
}
