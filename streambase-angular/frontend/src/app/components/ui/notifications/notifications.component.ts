import {
  Component,
  inject,
  computed,
  effect,
  OnDestroy,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService } from '../../../core/services';
import type { Notification } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  animations: [
    trigger('badgePulse', [
      state(
        'active',
        style({
          transform: 'scale(1)',
        })
      ),
      transition('void => active', [
        style({ transform: 'scale(0)' }),
        animate('300ms ease-out'),
      ]),
      transition('active => void', [
        animate('300ms ease-in', style({ transform: 'scale(0)' })),
      ]),
      transition('* => pulse', [
        animate('300ms ease-in-out', style({ transform: 'scale(1.5)' })),
        animate('300ms ease-in-out', style({ transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class NotificationsComponent implements OnDestroy {
  private notificationService = inject(NotificationService);

  
  notifications = input.required<Notification[]>();
  loggedIn = input.required<boolean>();
  user = input.required<any>();

  /** States */
  badgeState = 'active';

  /** Previous notifications count for comparison
   * This is used to trigger the pulse animation when the count increases
   * It is initialized to 0 to avoid triggering the animation on the first load
   * when there are no notifications
   */
  private previousNotificationsCount = 0;

  constructor() {
    /** Set up an effect to watch for changes in the unread count */
    effect(() => {
      const currentCount = this.unreadNotificationsCount();

      /** Check if count has increased from previous value */
      /** If the count has increased and it's not the first load, trigger pulse animation */
      if (
        currentCount > this.previousNotificationsCount &&
        this.previousNotificationsCount !== 0
      ) {
        this.pulseAnimation();
      }

      /** Update previous count for next comparison */
      this.previousNotificationsCount = currentCount;
    });
  }

  pulseAnimation() {
    this.badgeState = 'pulse';
    setTimeout(() => {
      this.badgeState = 'active';
    }, 600);
  }

  unreadNotificationsCount = computed(() => {
    return (
      this.notifications()?.filter((notification) => !notification.read)
        .length || 0
    );
  });

  markAllNotificationsAsRead(event: Event): void {
    event.stopPropagation();
    if (!this.loggedIn()) return;

    const user = this.user();
    const userId = user?.id;

    if (!userId) return;

    this.notificationService.markAllAsRead().subscribe();
  }

  markNotificationAsRead(notification: Notification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id).subscribe();
  }

  ngOnDestroy(): void {
    this.notificationService.stopFetchingNotifications();
  }
}
