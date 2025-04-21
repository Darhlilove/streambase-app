import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  isBrowser = typeof window !== 'undefined';

  // Generic method to get an item from localStorage
  getItem<T>(key: string): T | null {
    try {
      if (this.isBrowser) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }

      return null;
    } catch (error) {
      console.error('Error parsing stored value:', error);
      return null;
    }
  }

  // Generic method to set an item in localStorage
  setItem(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error storing value:', error);
    }
  }

  // Remove an item from localStorage
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing value:', error);
    }
  }

  // Create a signal that stays in sync with localStorage
  createStorageSignal<T>(key: string, initialValue: T | null = null) {
    // Initialize with value from localStorage or initialValue
    const value = this.getItem<T>(key) ?? initialValue;
    const storageSignal = signal<T | null>(value);

    // Listen for storage events to keep the signal in sync
    if (this.isBrowser) {
      window.addEventListener('storage', (event) => {
        if (event.key === key) {
          try {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null;
            storageSignal.set(newValue);
          } catch (error) {
            console.error('Error parsing stored value:', error);
          }
        }
      });
    }

    // Return a wrapped signal that updates localStorage when set
    return {
      get: () => storageSignal(),
      set: (newValue: T | null) => {
        if (newValue === null) {
          this.removeItem(key);
        } else {
          this.setItem(key, newValue);
        }
        storageSignal.set(newValue);
      },
      asReadonly: () => storageSignal.asReadonly(),
    };
  }

  createSessionStorageSignal<T>(key: string, initialValue: T | null = null) {
    // Load value from sessionStorage or use initial value
    const stored = this.isBrowser
      ? sessionStorage.getItem(key)
      : null;
    const parsed = stored ? JSON.parse(stored) : null;
    const value = parsed ?? initialValue;

    const storageSignal = signal<T | null>(value);

    // Sync signal on sessionStorage changes from other tabs/windows
    if (this.isBrowser) {
      window.addEventListener('storage', (event) => {
        if (event.storageArea === sessionStorage && event.key === key) {
          try {
            const newValue = event.newValue ? JSON.parse(event.newValue) : null;
            storageSignal.set(newValue);
          } catch (err) {
            console.error('SessionStorage parse error:', err);
          }
        }
      });
    }

    return {
      get: () => storageSignal(),
      set: (newValue: T | null) => {
        if (newValue === null) {
          sessionStorage.removeItem(key);
        } else {
          sessionStorage.setItem(key, JSON.stringify(newValue));
        }
        storageSignal.set(newValue);
      },
      asReadonly: () => storageSignal.asReadonly(),
    };
  }
}
