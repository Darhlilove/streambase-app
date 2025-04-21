import {
  Component,
  inject,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { ViewportScroller } from '@angular/common';
import {
  Router,
  ActivatedRoute,
  NavigationEnd,
  RouterOutlet,
} from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { NavigationComponent } from './components/navigation/navigation.component';
import { FooterComponent } from './components/footer/footer.component';
import { filter, map, mergeMap } from 'rxjs/operators';
import { AuthService, UserService } from './core/services';
import { Subscription } from 'rxjs';
import { BanCheckService } from './core/services/ban-check.service';
import { SnackbarComponent } from './components/ui/snackbar/snackbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationComponent,
    FooterComponent,
    SnackbarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'streambase';
  hideHeaderFooter = signal<boolean>(false);
  private userSub!: Subscription;

  private viewportScroller = inject(ViewportScroller);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private banCheckService = inject(BanCheckService);

  constructor() {}

  ngOnInit(): void {
    this.themeService.initTheme();

    // Hide header and footer on auth and not found pages
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.route),
        map((route) => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap((route) => route.data)
      )
      .subscribe((data) => {
        this.hideHeaderFooter.set(data['hideHeaderFooter'] ?? false);

        if (this.hideHeaderFooter()) {
          document.documentElement.style.setProperty(
            '--content-margin-top',
            '0px'
          );
        } else {
          document.documentElement.style.setProperty(
            '--content-margin-top',
            '64px'
          );
        }

        this.viewportScroller.scrollToPosition([0, 0]);
      });

    // Check user ban status
    this.userSub = this.authService.user$.subscribe((user) => {
      if (user) {
        this.userService.fetchUserData().subscribe({});
        this.banCheckService.start(user);
      }
    });
  }

  ngOnDestroy(): void {
    this.userSub.unsubscribe();
    this.banCheckService.stop();
  }
}
