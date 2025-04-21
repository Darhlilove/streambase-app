import { Component, computed, input, inject, signal } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatCardModule } from "@angular/material/card"
import { MatIconModule } from "@angular/material/icon"
import { MatButtonModule } from "@angular/material/button"
import { MatTooltipModule } from "@angular/material/tooltip"
import { MatBadgeModule } from "@angular/material/badge"
import { Router } from "@angular/router"

import type { Movie } from "../../../core/models"
import { CardIconsComponent } from "../../movie-card-icons/movie-card-icon.component"
import { AuthService } from "../../../core/services/auth.service"

@Component({
  selector: "app-casts-card",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  templateUrl: "./casts-card.component.html",
  styleUrls: ["./casts-card.component.scss"],
})
export class CastsCardComponent {

  // Inputs
  cast = input.required<any>()

  // State
  isHovered = signal(false)
  imageError = signal(false)

  // Methods
  onImageError(): void {
    this.imageError.set(true)
  }

  onMouseEnter(): void {
    this.isHovered.set(true)
  }

  onMouseLeave(): void {
    this.isHovered.set(false)
  }
}
