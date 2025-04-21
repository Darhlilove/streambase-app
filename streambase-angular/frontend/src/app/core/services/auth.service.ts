import { Router } from '@angular/router';
import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  BehaviorSubject,
  type Observable,
  catchError,
  map,
  switchMap,
  tap,
  throwError,
} from 'rxjs';
import type { User, Admin } from '../models';
import { LocalStorageService } from './local-storage.service';
import { environment } from '../../environments/environment';
import { BanCheckService } from './ban-check.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_TOKEN_KEY = 'secret_auth_token';

  // Use signals for reactive state
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // Expose readonly signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly errorMessage = this.error.asReadonly();

  private api = inject(ApiService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private banService = inject(BanCheckService)

  // Signals for reactive state management for user
  private localStorageUser =
    this.localStorageService.createStorageSignal<Partial<User>>('user');
  private localStorageToken =
    this.localStorageService.createStorageSignal<string>('auth');
  private sessionStorageUser =
    this.localStorageService.createSessionStorageSignal<Partial<User>>('user');
  private sessionStorageToken =
    this.localStorageService.createSessionStorageSignal<string>('auth');

  // Signals for reactive state management for admin
  private localStorageAdmin =
    this.localStorageService.createStorageSignal<Partial<User>>('admin');
  private sessionStorageAdmin =
    this.localStorageService.createSessionStorageSignal<Partial<User>>('admin');

  private userSubject = new BehaviorSubject<any | null>(this.getStoredUser());

  user$ = this.userSubject.asObservable();

  /**
   * Retrieves the stored user from local or session storage.
   * @returns The stored user or null if no user is found.
   */
  private getStoredUser(): any | null {
    return (
      this.localStorageUser.get() ||
      this.sessionStorageUser.get()
    );
  }

  /**
   * Sets the user data in the appropriate storage (local or session).
   * @param data The user data to store.
   */
  private setStoredUser(data: Partial<User>): void {
    if (this.sessionStorageUser.get()) {
      this.sessionStorageUser.set(data);
    } else if (this.localStorageUser.get()) {
      this.localStorageUser.set(data);
    } else if (this.sessionStorageAdmin.get()) {
      this.sessionStorageAdmin.set(data);
    } else if (this.localStorageAdmin.get()) {
      this.localStorageAdmin.set(data);
    }
  }

  /**
   * Gets the current user from the BehaviorSubject.
   * @returns The current user or null if no user is set.
   */
  getUser(): any | null {
    return this.userSubject.getValue();
  }

  getAdmin(): any | null {
    return this.localStorageAdmin.get() || this.sessionStorageAdmin.get()
  }

  /**
   * Checks if the user is logged in by verifying stored user data.
   * @returns True if the user is logged in.
   */
  isLoggedIn() {
    return this.localStorageUser.get() || this.sessionStorageUser.get();
  }

  /**
   * Checks if an admin is logged in by verifying stored admin data.
   * @returns True if the admin is logged in.
   */
  isAdminLoggedIn() {
    return this.localStorageAdmin.get() || this.sessionStorageAdmin.get();
  }

  /**
   * Registers a new user.
   * @param userData The user data to register.
   * @returns An observable of the registered user.
   */
  registerUser(userData: Partial<User>): Observable<User> {
    this._isLoading.set(true);

    return this.api.get<User[]>('/users').pipe(
      switchMap((users) => {
        // Check if an account with the email already exists
        const existingUser = users.find(
          (user) => user.email === userData.email
        );
        if (existingUser) {
          return throwError(
            () => new Error('An account with this email already exists.')
          );
        }

        // Proceed with registration if email is unique
        return this.api.post<User>('/users', userData);
      }),
      tap((data) => {
        this._isLoading.set(false);
        return data;
      }),
      catchError((error) => {
        this._isLoading.set(false);
        this.error.set(
          error.message || 'Sign up failed! Please try again later.'
        );
        return throwError(
          () => new Error('Sign up failed! Please try again later.')
        );
      })
    );
  }

  /**
   * Logs in a user.
   * @param credentials The user's email and password.
   * @param rememberMe Whether to remember the user for persistent sessions.
   * @returns An observable of the logged-in user data.
   */
  loginUser(
    credentials: {
      email: string;
      password: string;
    },
    rememberMe: boolean
  ): Observable<Partial<User>> {
    this._isLoading.set(true);

    return this.api.get<User[]>(`/users?email=${credentials.email}`).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          throw new Error('User not found!');
        }

        const user = users[0];

        if (user.suspended) {
          throw new Error('Your account has been suspended!');
        }

        // Compare passwords
        if (user.password !== credentials.password) {
          throw new Error('Incorrect password!');
        }

        // Return user data without sensitive information
        return {
          id: user.id,
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          image: user.image || null,
        };
      }),
      tap((userData) => {
        this._isAuthenticated.set(true);
        this._isLoading.set(false);

        if (rememberMe) {
          this.localStorageUser.set(userData);
          this.localStorageToken.set(this.AUTH_TOKEN_KEY);
        } else {
          // Use session storage instead for non-persistent sessions
          this.sessionStorageUser.set(userData);
          this.sessionStorageToken.set(this.AUTH_TOKEN_KEY);
        }

        this.userSubject.next(userData);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        this.error.set(
          error.message || 'Sign in failed! Please try again later.'
        );
        return throwError(
          () => new Error('Sign in failed! Please try again later.')
        );
      })
    );
  }

  /**
   * Logs in an admin.
   * @param credentials The admin's email, password, and pin.
   * @param rememberMe Whether to remember the user for persistent sessions.
   * @returns An observable of the logged-in admin data.
   */
  loginAdmin(
    credentials: {
      email: string;
      password: string;
      pin: string;
    },
    rememberMe: boolean
  ): Observable<Partial<User>> {
    this._isLoading.set(true);

    return this.api.get<User[]>(`/admin?email=${credentials.email}`).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          throw new Error('User not found!');
        }

        const user = users[0];

        if (user.suspended) {
          throw new Error('Your account has been suspended!');
        }

        // Compare passwords
        if (user.password !== credentials.password) {
          throw new Error('Incorrect password!');
        }

        // Compare pin
        if (user.pin !== credentials.pin) {
          throw new Error('Incorrect pin!');
        }

        // Return user data without sensitive information
        return {
          id: user.id,
          name: user.firstName + ' ' + user.lastName,
          email: user.email,
          image: user.image || null,
        };
      }),
      tap((userData) => {
        this._isAuthenticated.set(true);
        this._isLoading.set(false);

        if (rememberMe) {
          this.localStorageAdmin.set(userData);
          this.localStorageToken.set(this.AUTH_TOKEN_KEY);
        } else {
          // Use session storage instead for non-persistent sessions
          this.sessionStorageAdmin.set(userData);
          this.sessionStorageToken.set(this.AUTH_TOKEN_KEY);
        }
      }),
      catchError((error) => {
        this._isLoading.set(false);
        this.error.set(
          error.message || 'Sign in failed! Please try again later.'
        );
        return throwError(
          () => new Error('Sign in failed! Please try again later.')
        );
      })
    );
  }

  /**
   * Logs out the current user and clears all stored data.
   */
  logout(): void {
    this._isAuthenticated.set(false);

    if (this.isAdminLoggedIn()) {
      this.localStorageAdmin.set(null);
      this.localStorageToken.set(null);
      this.sessionStorageAdmin.set(null);
      this.router.navigate(['/admin-sign-in']);
    } else if (this.isLoggedIn()) {
      this.localStorageUser.set(null);
      this.localStorageToken.set(null);
      this.sessionStorageUser.set(null);
      this.sessionStorageToken.set(null);
      this.banService.stop()
      this.router.navigate(['/sign-in']);
    }
  }

  /**
   * Updates the user's profile.
   * @param formData The updated user data.
   * @param endpoint The API endpoint to update the user (default: 'users').
   * @returns An observable of the updated user data.
   */
  updateProfile(
    formData: Partial<User>,
    endpoint = 'users'
  ): Observable<Partial<User>> {
    const user = this.localStorageUser.get() || this.sessionStorageUser.get();

    if (!user?.id) {
      return throwError(() => new Error('User id is missing'));
    }

    this._isLoading.set(true);

    return this.api
      .patch<User>(`/${endpoint}/${user.id}`, formData)
      .pipe(
        map((updatedUser) => {
          return {
            id: updatedUser.id,
            name: updatedUser.firstName + ' ' + updatedUser.lastName,
            email: updatedUser.email,
            image: updatedUser.image || null,
          };
        }),
        tap((userData) => {
          this._isLoading.set(false);
          if (endpoint === 'users') {
            this.localStorageUser.set(userData);
          }
        }),
        catchError((error) => {
          this._isLoading.set(false);
          this.error.set(
            error.message ||
              'User profile update failed! Please try again later.'
          );
          return throwError(
            () =>
              new Error('User profile update failed! Please try again later.')
          );
        })
      );
  }

  /**
   * Updates the user's profile image.
   * @param userId The ID of the user.
   * @param imageFile The image file to upload.
   * @returns An observable of the updated user data.
   */
  updateUserProfileImage(userId: string, imageFile: File): Observable<User> {
    // First upload the file
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('userId', userId);

    return this.api.post<any>('/upload', formData).pipe(
      switchMap((uploadResponse) => {
        // Then update the user record with the image path
        return this.api.patch<User>(`/users/${userId}`, {
          image: uploadResponse.path,
        });
      }),
      tap((updatedUser) => {
        // Update local user data
        const currentUser = this.getStoredUser();

        if (currentUser) {
          const updatedStorageImage = {
            ...currentUser,
            image: updatedUser.image,
          };

          this.setStoredUser(updatedStorageImage);

          // // Update the user subject
          this.userSubject.next(updatedStorageImage);
        }
      })
    );
  }

  /**
   * Updates the user's password.
   * @param currentPassword The current password.
   * @param newPassword The new password.
   * @returns An observable of the updated user data.
   */
  updatePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<Partial<User>> {
    const user = this.localStorageUser.get() || this.sessionStorageUser.get();

    if (!user?.email) {
      return throwError(() => new Error('User email is missing'));
    }

    this._isLoading.set(true);

    return this.api
      .get<User[]>(`/users?email=${user.email}&password=${currentPassword}`)
      .pipe(
        switchMap((users) => {
          if (!users || users.length === 0) {
            return throwError(() => new Error('Current password is incorrect'));
          }
          // Password verified, now update it
          return this.updateProfile({ password: newPassword });
        }),
        tap(() => this._isLoading.set(false)),
        catchError((error) => {
          this._isLoading.set(false);
          this.error.set(error.message || 'Password update failed');
          return throwError(() => error);
        })
      );
  }

  /**
   * Deletes the user's profile.
   * @param password The password for verification.
   * @returns An observable indicating the deletion status.
   */
  deleteProfile(password: string): Observable<void> {
    this._isLoading.set(true);
    const currentUser = this.localStorageUser.get() || this.sessionStorageUser.get()
  
    if (!currentUser?.email) {
      this._isLoading.set(false);
      return throwError(() => new Error('No user is currently logged in.'));
    }
  
    // Filter user by email and password
    return this.api
      .get<User[]>(`/users?email=${encodeURIComponent(currentUser.email)}&password=${encodeURIComponent(password)}`)
      .pipe(
        switchMap((matchedUsers) => {
          const user = matchedUsers[0];
  
          if (!user) {
            throw new Error('Incorrect password. Account deletion canceled.');
          }
  
          // Archive the user
          return this.api.post(`/archived-users`, user).pipe(
            // Then delete the user
            switchMap(() => this.api.delete(`/users/${user.id}`))
          );
        }),
        map(() => undefined),
        tap(() => {
          this._isLoading.set(false);
          this.localStorageUser.set(null);
          this.localStorageToken.set(null);
        }),
        catchError((error) => {
          this._isLoading.set(false);
          this.error.set(
            error.message || 'Account deletion failed! Please try again later.'
          );
          return throwError(
            () => new Error('Account deletion failed! Please try again later.')
          );
        })
      );
  }
  

  /**
   * Fetches user data based on the stored user ID.
   * Used for fetching user data for manage profile page
   * @returns An observable of the user data.
   */
  fetchUserData(): Observable<User> {
    const localUser = this.localStorageUser.get();
    const sessionUser = this.sessionStorageUser.get();

    const user = localUser || sessionUser;

    if (!user?.id) {
      return throwError(() => new Error('No identifier provided!'));
    }

    this._isLoading.set(true);

    // Build query using the available user ID
    const query = `/users/${user.id}`;

    return this.api.get<User | User[]>(query).pipe(
      map((res) => {
        // If queried by email, response is an array
        const user = Array.isArray(res) ? res[0] : res;

        if (!user) {
          throw new Error('User not found!');
        }

        return user;
      }),
      tap(() => {
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        this.error.set(error.message || 'Failed to fetch user data.');
        return throwError(
          () => new Error(error.message || 'Failed to fetch user data.')
        );
      })
    );
  }
}
