import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, style, animate, transition } from '@angular/animations';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1000ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('slideUpFade', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('1000ms ease-out', style({ transform: 'translateY(0)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class NotFoundComponent implements OnInit {

  private router = inject(Router);
  showButton = signal(false);

  ngOnInit(): void {
    setTimeout(() => {
      this.showButton.set(true);
    }, 2000);
  }

  handleRedirect(): void {
    this.router.navigate(['/']);
  }
}
