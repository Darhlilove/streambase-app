import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  type Observable,
  Subject,
  catchError,
  forkJoin,
  interval,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import type { Notification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private api = inject(ApiService);

  // Signals for reactive state management
  private notifications = signal<Notification[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);

  private stopPolling$ = new Subject<void>();

  // Polling function to fetch notifications at defined interval
  fetchNotifications(userId: string, pollingInterval: number): void {
    this.loading.set(true);

    // Fetch notifications immediately
  this.api.get<Notification[]>(`/notifications?to=${userId}`)
  .pipe(
    tap((fetchedNotifications) => {
      const currentNotifications = this.notifications();

      // Sort the fetched notifications by date in descending order
      const sortedNotifications = fetchedNotifications.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Check if there is a difference between the current and fetched notifications
      const hasChanges =
        sortedNotifications.length !== currentNotifications.length ||
        sortedNotifications.some(
          (newNotification, index) =>
            newNotification.id !== currentNotifications[index]?.id ||
            newNotification.read !== currentNotifications[index]?.read
        );

      if (hasChanges) {
        this.notifications.set(sortedNotifications); // Update only if there are changes
      }

      this.loading.set(false);
    }),
    catchError((error) => {
      this.loading.set(false);
      this.error.set(error.message || 'Failed to fetch notifications');
      return of([]);
    })
  )
  .subscribe();

    interval(pollingInterval)
      .pipe(
        takeUntil(this.stopPolling$),
        switchMap(() =>
          this.api.get<Notification[]>(`/notifications?to=${userId}`).pipe(
            tap((fetchedNotifications) => {
              const currentNotifications = this.notifications();

              // Sort the fetched notifications by date in descending order
            const sortedNotifications = fetchedNotifications.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            // Check if there is a difference between the current and fetched notifications
            const hasChanges =
              sortedNotifications.length !== currentNotifications.length ||
              sortedNotifications.some(
                (newNotification, index) =>
                  newNotification.id !== currentNotifications[index]?.id ||
                  newNotification.read !== currentNotifications[index]?.read
              );;

              if (hasChanges) {
                this.notifications.set(fetchedNotifications); // Update only if there are changes
              }
            }),
            catchError((error) => {
              this.loading.set(false);
              this.error.set(error.message || 'Failed to fetch notifications');
              return of([]);
            })
          )
        )
      )
      .subscribe();
  }

  // Stop polling
  stopFetchingNotifications(): void {
    this.stopPolling$.next();
    this.stopPolling$.complete();
    this.stopPolling$ = new Subject<void>();
  }

  getNotifications() {
    return this.notifications.asReadonly();
  }

  // Send a notification
  sendNotification(
    notificationData: Partial<Notification>
  ): Observable<Notification> {
    if (
      !notificationData ||
      !notificationData.to ||
      !notificationData.message
    ) {
      this.error.set('Invalid notification data');
      return throwError(() => new Error('Invalid notification data'));
    }

    this.loading.set(true);

    return this.api.post<Notification>('/notifications', notificationData).pipe(
      tap(() => {
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to send notification');
        return throwError(() => error);
      })
    );
  }

  // Mark a notification as read
  markAsRead(notificationId: string): Observable<Notification[]> {
    this.loading.set(true);

    return this.api
      .patch<Notification>(`/notifications/${notificationId}`, { read: true })
      .pipe(
        map(() => {
          // Update the notification in the notifications signal
          const currentNotifications = this.notifications();
          const updatedNotifications = currentNotifications.map(
            (notification) =>
              notification.id === notificationId
                ? { ...notification, read: true }
                : notification
          );

          this.notifications.set(updatedNotifications);
          this.loading.set(false);
          return updatedNotifications;
        }),
        catchError((error) => {
          this.loading.set(false);
          this.error.set(
            error.message || 'Failed to mark notification as read'
          );
          throw error;
        })
      );
  }

  markAllAsRead(): Observable<Notification[]> {
    const current = this.notifications();
    const unread = current.filter((n) => !n.read);
  
    if (unread.length === 0) return of(current);
  
    this.loading.set(true);
  
    const updateRequests = unread.map((notification) =>
      this.api.patch<Notification>(`/notifications/${notification.id}`, {
        read: true,
      })
    );
  
    return forkJoin(updateRequests).pipe(
      tap((updatedNotifications) => {
        const updatedMap = new Map(updatedNotifications.map((n) => [n.id, n]));
  
        const newState = current.map((n) =>
          updatedMap.has(n.id) ? { ...n, read: true } : n
        );
  
        this.notifications.set(newState);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to mark all as read');
        throw error;
      })
    );
  }  
}
