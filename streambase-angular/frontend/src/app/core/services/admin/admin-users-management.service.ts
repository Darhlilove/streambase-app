import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable, catchError, map, switchMap, throwError } from 'rxjs';
import { User } from '../../models';

@Injectable({
  providedIn: 'root',
})
export class UsersManagementService {
  private api = inject(ApiService);
  private readonly endpoint = '/users';

  /**
   * Fetches all users from the API.
   * @returns An observable containing an array of users.
   */
  fetchUsers(): Observable<any[]> {
    return this.api
      .get<any[]>(this.endpoint)
      .pipe(catchError(this.handleError));
  }

  /**
   * Deletes a user by their ID.
   * @param userId The ID of the user to delete.
   * @returns An observable that completes when the user is deleted.
   */
  deleteUser(userId: string): Observable<any> {
    return this.api.get<User[]>(`/users/${userId}`).pipe(
      switchMap((user) => {
        if (!user) {
          throw new Error('No user found. Account deletion canceled.');
        }

        // Archive the user
        return this.api.post(`/archived-users`, user).pipe(
          // Then delete the user
          switchMap(() => this.api.delete(`/users/${userId}`))
        );
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Suspends a user by updating their `suspended` status to `true`.
   * @param user The user object to suspend.
   * @returns An observable containing the updated user object.
   */
  suspendUser(user: any): Observable<any> {
    const updatedUser = { ...user, suspended: true };
    return this.api
      .patch<any>(`${this.endpoint}/${user.id}`, updatedUser)
      .pipe(catchError(this.handleError));
  }

  /**
   * Reinstates a suspended user by updating their `suspended` status to `null`.
   * @param user The user object to reinstate.
   * @returns An observable containing the updated user object.
   */
  reinstateUser(user: any): Observable<any> {
    const updatedUser = { ...user, suspended: null };
    return this.api
      .patch<any>(`${this.endpoint}/${user.id}`, updatedUser)
      .pipe(catchError(this.handleError));
  }

  /**
   * Promotes a user to admin by updating their `privilege` level to `1`.
   * @param user The user object to promote.
   * @returns An observable containing the updated user object.
   */
  promoteToAdmin(user: any): Observable<any> {
    const newAdmin = { ...user, privilege: '1' };
    return this.api
      .patch<any>(`${this.endpoint}/${user.id}`, newAdmin)
      .pipe(catchError(this.handleError));
  }

  /**
   * Revokes admin privileges from a user by updating their `privilege` level to `null`.
   * @param admin The admin object to revoke.
   * @returns An observable containing the updated admin object.
   */
  revokeAdmin(admin: any): Observable<any> {
    const updatedAdmin = { ...admin, privilege: null };
    return this.api
      .patch<any>(`${this.endpoint}/${admin.id}`, updatedAdmin)
      .pipe(catchError(this.handleError));
  }

  /**
   * Changes the privilege level of an admin user.
   * @param admin The admin object whose privilege level is to be changed.
   * @param newPrivilege The new privilege level to set.
   * @returns An observable containing the updated admin object.
   */
  changePrivilege(admin: any, newPrivilege: string): Observable<any> {
    const updatedAdmin = { ...admin, privilege: newPrivilege };
    return this.api
      .patch<any>(`${this.endpoint}/${admin.id}`, updatedAdmin)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handles errors from the API calls.
   * @param error The error object.
   * @returns An observable that throws an error.
   */
  private handleError(error: any) {
    console.error('UserManagementService error:', error);
    return throwError(() => new Error(error.message || 'Unknown error'));
  }
}
