import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { type Observable, catchError, map, tap, switchMap, EMPTY } from 'rxjs';
import type { Review, Reply } from '../models/review.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private api = inject(ApiService);
  private authService = inject(AuthService);

  // Signals for reactive state management
  private reviews = signal<Review[]>([]);
  private loading = signal<boolean>(false);
  private error = signal<string | null>(null);
  private currrentUser = computed(() => this.authService.getUser());

  // Fetch all reviews
  fetchReviews(movieId: String): Observable<Review[]> {
    this.loading.set(true);

    return this.api
      .get<Review[]>(`/reviews?movieId=${movieId}`)
      .pipe(
        tap((reviews) => {
          const sortedReviews = reviews.sort((a, b) => {
            if (
              a.user.email === this.currrentUser()?.email &&
              b.user.email !== this.currrentUser()?.email
            )
              return -1;
            if (
              a.user.email !== this.currrentUser()?.email &&
              b.user.email === this.currrentUser()?.email
            )
              return 1;
            return 0;
          });
          this.reviews.set(sortedReviews);
          this.loading.set(false);
        }),
        catchError((error) => {
          this.loading.set(false);
          this.error.set(error.message || 'Failed to fetch reviews');
          console.log('Network error: ', error);
          return [];
        })
      );
  }

  // Add or update a review
  postOrUpdateReview(
    reviewData: Partial<Review>,
    reviewId?: string,
    isFlag: boolean = false
  ): Observable<Review> {
    this.loading.set(true);

    const timestamp = new Date().toISOString();
    const udaptedReview = isFlag 
    ? {
      ...reviewData
    }
    : {
      ...reviewData,
      updatedAt: timestamp,
    };

    const newReview = {
      ...reviewData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let request: Observable<Review>;

    if (reviewId) {
      // Update existing review
      request = this.api.patch<Review>(
        `/reviews/${reviewId}`,
        udaptedReview
      );
    } else {
      // Add new review
      request = this.api.post<Review>('/reviews', newReview);
    }

    return request.pipe(
      tap((review) => {
        // Update the reviews signal
        const currentReviews = this.reviews();

        if (reviewId) {
          // Replace the existing review
          const updatedReviews = currentReviews.map((r) =>
            r.id === reviewId ? review : r
          );
          const sortedReviews = updatedReviews.sort((a, b) => {
            if (
              a.user.email === this.currrentUser()?.email &&
              b.user.email !== this.currrentUser()?.email
            )
              return -1;
            if (
              a.user.email !== this.currrentUser()?.email &&
              b.user.email === this.currrentUser()?.email
            )
              return 1;
            return 0;
          });
          this.reviews.set(sortedReviews);
        } else {
          // Add the new review
          this.reviews.set([review, ...currentReviews]);
        }

        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to add or update review');
        throw error;
      })
    );
  }

  // Generate a unique reply ID
  generateReplyId(): string {
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const random = Math.random().toString(36).substring(2, 10); // 8-char random string
    return `reply_${timestamp}_${random}`;
  }

  // Add or update a reply to an existing review
  postOrUpdateReply(
    replyData: Partial<Reply>,
    reviewId: string,
    replyId?: string,
    isFlag: boolean = false
  ): Observable<Review> {
    this.loading.set(true);
  
    const timestamp = new Date().toISOString();
    const updatedReply = isFlag 
    ? {
      ...replyData
    }
    : {
      ...replyData,
      updatedAt: timestamp
    }
    const newReply = {
      ...replyData,
      replyId: this.generateReplyId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  
    return this.api.get<Review>(`/reviews/${reviewId}`).pipe(
      map((review) => {
        const replies = review.replies || [];
        let updatedReplies: Reply[];
  
        if (replyId) {
          // Update existing reply
          updatedReplies = replies.map((r) =>
            r.replyId === replyId ? { ...r, ...updatedReply } : r
          );
        } else {
          // Add new reply
          updatedReplies = [newReply as Reply, ...replies];
        }
  
        return { ...review, replies: updatedReplies };
      }),
      switchMap((updatedReview) =>
        this.api.patch<Review>(`/reviews/${reviewId}`, updatedReview)
      ),
      tap((updatedReview) => {
        const currentReviews = this.reviews();
        const updatedReviews = currentReviews.map((r) =>
          r.id === reviewId ? updatedReview : r
        );
        this.reviews.set(updatedReviews);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to add or update reply');
        throw error;
      })
    );
  }
  

  deleteReview(reviewId: string): Observable<void> {
    this.loading.set(true);

    return this.api.delete<void>(`/reviews/${reviewId}`).pipe(
      tap(() => {
        const updatedReviews = this.reviews().filter((r) => r.id !== reviewId);
        const sortedReviews = updatedReviews.sort((a, b) => {
          if (
            a.user.email === this.currrentUser()?.email &&
            b.user.email !== this.currrentUser()?.email
          )
            return -1;
          if (
            a.user.email !== this.currrentUser()?.email &&
            b.user.email === this.currrentUser()?.email
          )
            return 1;
          return 0;
        });
        this.reviews.set(sortedReviews);
        this.loading.set(false);
      }),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to delete review');
        console.log('Network error: ', error);
        return EMPTY;
      })
    );
  }

  deleteReply(reviewId: string, replyId: string): Observable<void> {
    this.loading.set(true);
  
    return this.api.get<Review>(`/reviews/${reviewId}`).pipe(
      switchMap((review) => {
        const updatedReplies = review.replies.filter((r) => r.replyId !== replyId);
        const updatedReview: Review = {
          ...review,
          replies: updatedReplies
        };
  
        return this.api.patch<Review>(`/reviews/${reviewId}`, updatedReview);
      }),
      tap((updatedReview) => {
        const updatedReviews = this.reviews().map((r) =>
          r.id === reviewId ? updatedReview : r
        );
  
        const sortedReviews = updatedReviews.sort((a, b) => {
          const currentUserEmail = this.currrentUser()?.email;
          if (a.user.email === currentUserEmail && b.user.email !== currentUserEmail) return -1;
          if (a.user.email !== currentUserEmail && b.user.email === currentUserEmail) return 1;
          return 0;
        });
  
        this.reviews.set(sortedReviews);
        this.loading.set(false);
      }),
      map(() => void 0),
      catchError((error) => {
        this.loading.set(false);
        this.error.set(error.message || 'Failed to delete reply');
        console.error('Network error:', error);
        return EMPTY;
      })
    );
  }  

  getReviews(): Review[] {
    return this.reviews();
  }

  getLoading(): boolean {
    return this.loading();
  }

  getError(): string | null {
    return this.error();
  }
  
}
