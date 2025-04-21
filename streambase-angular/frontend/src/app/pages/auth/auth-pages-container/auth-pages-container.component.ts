import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-pages-container',
  standalone: true,
  imports: [],
  templateUrl: './auth-pages-container.component.html',
  styleUrl: './auth-pages-container.component.scss'
})
export class AuthPagesContainerComponent {
  private authService = inject(AuthService)
  private router = inject(Router)
  isLoggedIn = computed(() => this.authService.isLoggedIn())

  navigateToHome(){
    if(this.isLoggedIn()){
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
