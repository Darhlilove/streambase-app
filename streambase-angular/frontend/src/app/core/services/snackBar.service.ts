
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SnackbarType = 'success' | 'info' | 'warn' | 'error';

export interface SnackbarMessage {
  text: string;
  type: SnackbarType;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private _message$ = new BehaviorSubject<SnackbarMessage | null>(null);
  readonly message$ = this._message$.asObservable();

  show(text: string, type: SnackbarType = 'info') {
    this._message$.next({ text, type });

    setTimeout(() => this._message$.next(null), 3000); // Auto dismiss
  }
}
