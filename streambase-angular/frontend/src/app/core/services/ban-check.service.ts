import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription, switchMap, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class BanCheckService {
  private intervalSub: Subscription | null = null;
  private api = inject(ApiService);
  private router = inject(Router);

  start(user: any): void {
    this.stop();

    if (!user) return;

    this.intervalSub = interval(5000)
      .pipe(
        switchMap(() =>
          this.api.get<User>(`/users/${user.id}`, environment.API_URL).pipe(
            catchError((err) => {
              console.error('Error checking ban status:', err);
              return of(null);
            })
          )
        )
      )
      .subscribe((updatedUser) => {
        if (updatedUser?.suspended) {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          alert('Your account has been suspended. You have been logged out.');
          this.router.navigate(['/login']);
        }
      });
  }

  stop(): void {
    this.intervalSub?.unsubscribe();
    this.intervalSub = null;
  }
}
