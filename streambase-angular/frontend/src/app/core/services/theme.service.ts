import { Injectable, inject, signal } from "@angular/core"
import { DOCUMENT } from "@angular/common"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private document = inject(DOCUMENT)

  // Theme state
  darkMode = signal<boolean>(true)

  toggleDarkMode(): void {
    this.darkMode.update((current) => !current)
    this.applyTheme(this.darkMode())
    localStorage.setItem("darkMode", this.darkMode() ? "true" : "false")
  }

  public isDarkModeEnabled(): boolean {
    const savedPreference = localStorage.getItem("darkMode")
    if (savedPreference) {
      return savedPreference === "true"
    }

    return true
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      this.document.body.classList.add("dark-theme")
      this.document.body.classList.remove("light-theme")
    } else {
      this.document.body.classList.add("light-theme")
      this.document.body.classList.remove("dark-theme")
    }
  }

  initTheme(): void {
    // This method applies the saved theme on application startup
    this.applyTheme(this.darkMode());
  }
}

