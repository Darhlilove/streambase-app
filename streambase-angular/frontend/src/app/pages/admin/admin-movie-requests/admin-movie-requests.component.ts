// admin-movie-requests.component.ts
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '../../../core/services';
import { AdminMovieService } from '../../../core/services/admin/admin-movie.service';
import { MovieRequest } from '../../../core/models';

@Component({
  selector: 'app-admin-movie-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './admin-movie-requests.component.html',
  styleUrls: ['./admin-movie-requests.component.scss'],
})
export class AdminMovieRequestsComponent implements OnInit {
  requests: any[] = [];
  filteredRequests: any[] = [];
  loading = true;
  activeFilter = 'all';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  page = 0;
  rowsPerPage = 20;
  pageSizeOptions = [20, 50, 100];

  // Table columns
  displayedColumns: string[] = [
    'movieTitle',
    'mediaType',
    'year',
    'requestDate',
    'status',
    'actions',
  ];

  // Header visibility
  hideHeader = false;
  private lastScrollTop = 0;

  private adminMovieService = inject(AdminMovieService);
  private notificationsService = inject(NotificationService);

  ngOnInit(): void {
    this.fetchMovieRequests();
  }

  fetchMovieRequests(): void {
    this.loading = true;
    this.adminMovieService.fetchMovieRequests().subscribe({
      next: (data) => {
        this.requests = data;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching movie requests:', error);
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    if (!this.requests || this.requests.length === 0) {
      this.filteredRequests = [];
      return;
    }

    // Sort by request date
    this.handleSortByRequestDate(this.sortDirection);

    if (this.activeFilter === 'all') {
      this.filteredRequests = [...this.requests];
    } else {
      this.filteredRequests = this.requests.filter(
        (request) => request.status === this.activeFilter
      );
    }
  }

  handleFilter(filter: string): void {
    this.activeFilter = filter;
    this.page = 0; // Reset to first page when filter changes
    this.applyFilter();
  }

  handleApprove(request: any): void {
    this.adminMovieService
      .approveMovieRequest(request.id, request.movieTitle, request.mediaType)
      .subscribe({
        next: () => {
          // Update local state
          const updatedRequest = { ...request, status: 'approved' };
          this.updateRequestInList(updatedRequest);

          // Send notification
          this.notificationsService.sendNotification({
            date: new Date().toISOString(),
            from: 'Admin1',
            to: request.senderId,
            message: `Your request for ${request.movieTitle} was approved. You can now view it on Streambase.`,
            read: false,
          }).subscribe();
        },
        error: (error) => {
          if (error.message === 'Movie not found on TMDB') {
            // Update local state
            // If the movie is not found, the request is declined
            const updatedRequest = { ...request, status: 'declined', reason: 'Movie not found on TMDB' };
            this.updateRequestInList(updatedRequest);

            // Send notification for movie not found
            this.notificationsService.sendNotification({
              date: new Date().toISOString(),
              from: 'Admin1',
              to: request.senderId,
              message: `Sorry! The movie "${request.movieTitle}" was not found. Please check the title and year, and try again.`,
              read: false,
            }).subscribe();
            return;
          }
          console.error('Error approving request:', error.message);
        },
      });
  }

  handleDecline(request: any): void {
    this.adminMovieService.declineMovieRequest(request.id).subscribe({
      next: () => {
        // Update local state
        const updatedRequest = { ...request, status: 'declined' };
        this.updateRequestInList(updatedRequest);

        // Send notification
        this.notificationsService.sendNotification({
          date: new Date().toISOString(),
          from: 'Admin1',
          to: request.senderId,
          message: `Sorry! Your request for ${request.movieTitle} was declined.`,
          read: false,
        }).subscribe();
      },
      error: (error) => {
        console.error('Error declining request:', error);
      },
    });
  }

  updateRequestInList(updatedRequest: any): void {
    this.requests = this.requests.map((r) =>
      r.id === updatedRequest.id ? updatedRequest : r
    );
    this.applyFilter();
  }

  handlePageEvent(event: PageEvent): void {
    this.page = event.pageIndex;
    this.rowsPerPage = event.pageSize;
  }

  handleSortByRequestDate(direction: 'asc' | 'desc'): void {
    this.sortDirection = direction;
    this.filteredRequests = [...this.filteredRequests].sort((a, b) =>
      direction === 'desc'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) +
      ', ' +
      date.toLocaleTimeString('en-US', { hour12: false })
    );
  }

  // Get paginated data for the table
  getPaginatedData(): any[] {
    const startIndex = this.page * this.rowsPerPage;
    return this.filteredRequests.slice(
      startIndex,
      startIndex + this.rowsPerPage
    );
  }

  // Helper function for setting request status
  getStatusLabel(request: MovieRequest): string {
    switch (request.status) {
      case 'pending':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'declined':
        return request.reason ? `Declined - ${request.reason}` : 'Declined';
      default:
        return 'Unknown Status';
    }
  }
  

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.scrollY;

    if (currentScroll > this.lastScrollTop) {
      this.hideHeader = true;
    } else {
      this.hideHeader = false;
    }

    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }
}
