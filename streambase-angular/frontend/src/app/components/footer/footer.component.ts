import { Component, inject } from "@angular/core"
import { MatIconModule } from "@angular/material/icon"
import { ThemeService } from "../../core/services/theme.service"
import { NgClass } from "@angular/common"

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [MatIconModule, NgClass],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  private themeService = inject(ThemeService)
  isDarkMode = this.themeService.darkMode

  currentYear = new Date().getFullYear()

  tmdbLogo = 'tmdb-logo.svg'; // Path to TMDB logo image

  links = [
    'Terms of Service',
    'Privacy Policy',
    'Accessibility',
    'Careers',
    'Advertise with us',
    'Help'
  ];
}

