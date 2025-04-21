import type { Routes } from '@angular/router';
import { UserAuthGuard } from './core/guards/user-auth.guard';
import { AdminUserAuthGuard } from './core/guards/admin-user-auth.guard';
import { AdminAuthGuard } from './core/guards/admin-auth.guard';
import { AuthRedirectGuard } from './core/guards/auth-redirect.guard';

import { ProfileComponent } from './pages/user/manage-profile/manage-profile.component';
import { SignUpComponent } from './pages/auth/sign-up/sign-up.component';
import { SignInComponent } from './pages/auth/sign-in/sign-in.component';
import { MovieDetailComponent } from './pages/user/movie-detail/movie-detail.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { MyListsComponent } from './pages/user/movie-lists/my-lists.component';
import { MovieRequestComponent } from './pages/user/movie-request/movie-request.component';
import { CommunityComponent } from './pages/user/community/community.component';
import { AdminSignInPageComponent } from './pages/auth/admin-sign-in-page/admin-sign-in-page.component';

export const routes: Routes = [
  // User routes
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./pages/guest/guest.component').then((m) => m.GuestComponent),
    canActivate: [AuthRedirectGuard],
    title: 'Streambase - All Your Favourite Movies in One Place',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/user/user-home/user-home.component').then(
        (m) => m.UserHomeComponent
      ),
    canActivate: [UserAuthGuard],
    title: 'Home | Streambase',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [UserAuthGuard],
    title: 'Profile | Streambase',
  },
  {
    path: 'my-lists',
    component: MyListsComponent,
    canActivate: [UserAuthGuard],
    title: 'My Lists | Streambase',
  },
  {
    path: 'community',
    component: CommunityComponent,
    canActivate: [UserAuthGuard],
    title: 'Community | Streambase',
  },
  {
    path: 'request-movie',
    component: MovieRequestComponent,
    canActivate: [UserAuthGuard],
    title: 'Movie Request | Streambase',
  },
  {
    path: 'sign-up',
    component: SignUpComponent,
    canActivate: [AuthRedirectGuard],
    data: { hideHeaderFooter: true },
    title: 'Sign Up | Streambase',
  },
  {
    path: 'sign-in',
    component: SignInComponent,
    canActivate: [AuthRedirectGuard],
    data: { hideHeaderFooter: true },
    title: 'Sign In | Streambase',
  },

  // Admin routes
  {
    path: 'admin-sign-in',
    component: AdminSignInPageComponent,
    canActivate: [AuthRedirectGuard],
    data: { hideHeaderFooter: true },
    title: 'Admin Sign In | Streambase',
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin/admin-dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
    canActivate: [AdminAuthGuard],
    title: 'Admin Dashboard | Streambase',
  },
  {
    path: 'admin-users-management',
    loadComponent: () =>
      import(
        './pages/admin/admin-user-management/admin-users-management.component'
      ).then((m) => m.AdminUsersManagementComponent),
    canActivate: [AdminAuthGuard],
    title: 'Admin User Management | Streambase',
  },
  {
    path: 'admin-movie-requests',
    loadComponent: () =>
      import(
        './pages/admin/admin-movie-requests/admin-movie-requests.component'
      ).then((m) => m.AdminMovieRequestsComponent),
    canActivate: [AdminAuthGuard],
    title: 'Admin Movie Requests | Streambase',
  },

  // Admin and User routes
  {
    path: 'watch/:id',
    component: MovieDetailComponent,
    canActivate: [AdminUserAuthGuard],
    title: 'Streambase',
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: { hideHeaderFooter: true },
  },
];
