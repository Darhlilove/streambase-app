import {
  Component,
  inject,
  computed,
  signal,
  effect,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';

import { NotificationService } from '../../core/services';
import { AuthService } from '../../core/services/auth.service';
import { MovieSearchBarComponent } from '../movie-search-bar/movie-search-bar.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { NotificationsComponent } from '../ui/notifications/notifications.component';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MovieSearchBarComponent,
    UserAvatarComponent,
    NotificationsComponent,
  ],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
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
export class NavigationComponent implements OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  /** States */
  currentUser = signal<any>(null);
  isUser = computed(() => !!this.authService.isLoggedIn());
  isAdmin = computed(() => !!this.authService.isAdminLoggedIn());
  notifications = computed(() => this.notificationService.getNotifications());
  badgeState = 'active';

  /** Polling interval for fetching notifications */
  private pollingInterval = 10000; // 10 seconds

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if(this.isUser()){
        this.currentUser.set(user);
      }

      if(this.isAdmin()){
        this.currentUser.set(this.authService.getAdmin())
      }

      const currentUser = this.currentUser()
      if (currentUser) {
        const userId = currentUser.id;
        this.notificationService.fetchNotifications(
          userId,
          this.pollingInterval
        );
      }
    });
  }

  /** Methods */
  logout(): void {
    this.authService.logout();
  }

  navigateToProfile(): void {
    if (this.isUser()) {
      this.router.navigate(['/profile']);
    } else if (this.isAdmin()) {
      this.router.navigate(['/admin-profile']);
    }

    return;
  }

  navigateToSignIn(): void {
    this.router.navigate(['/sign-in']);
  }

  navigateToHome() {
    if (this.isAdmin()) {
      this.router.navigate(['/admin-dashboard']);
    } else if (this.isUser()) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
    return;
  }

  navigateToSignUp() {
    this.router.navigate(['/sign-up']);
  }

  ngOnDestroy(): void {
    this.notificationService.stopFetchingNotifications();
  }
}
