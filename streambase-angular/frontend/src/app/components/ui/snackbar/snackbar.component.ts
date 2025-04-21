import { Component } from '@angular/core';
import { SnackbarService, SnackbarMessage } from './../../../core/services';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule, NgIf,  MatIcon],
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss']
})
export class SnackbarComponent {
  message: SnackbarMessage | null = null;
  timeout: any;

  constructor(private snackbar: SnackbarService) {
    this.snackbar.message$.subscribe((msg) => {
      this.message = msg;

      if (this.timeout) clearTimeout(this.timeout);
      if (msg) {
        this.timeout = setTimeout(() => this.dismiss(), 3000);
      }
    });
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'info': return 'info';
      case 'warn': return 'warning';
      case 'error': return 'error';
      default: return 'notifications';
    }
  }

  dismiss(): void {
    this.message = null;
  }
}
