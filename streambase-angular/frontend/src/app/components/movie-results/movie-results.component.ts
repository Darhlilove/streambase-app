import { Component, inject, input, signal } from '@angular/core';
import { Movie } from '../../core/models';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services';
import { Router } from 'express';

@Component({
  selector: 'app-movie-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-results.component.html',
  styleUrl: './movie-results.component.scss'
})
export class MovieResultsComponent {
  movie = input.required<Movie>();

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://dummyimage.com/48x60/757575/757575.png';
  }
}
