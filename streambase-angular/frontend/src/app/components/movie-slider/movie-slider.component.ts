import {
  Component,
  input,
  signal,
  ViewChild,
  type ElementRef,
  type AfterViewInit,
  type OnDestroy,
} from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"

import type { Movie } from "../../core/models"
import { MovieCardComponent } from "../cards/movie-card/movie-card.component";

@Component({
  selector: "app-movie-slider",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MovieCardComponent],
  templateUrl: "./movie-slider.component.html",
  styleUrls: ["./movie-slider.component.scss"],
})
export class MovieSliderComponent implements AfterViewInit, OnDestroy {
  // Inputs
  title = input("")
  movies = input.required<Movie[]>()
  loading = input(false)
  error = input<string | null>(null)

  // State
  scrollPosition = signal(0)
  showLeftArrow = signal(false)
  showRightArrow = signal(true)
  itemWidth = signal(250) // Default width

  // ViewChild
  @ViewChild("sliderContainer") sliderContainer!: ElementRef<HTMLDivElement>

  // Resize observer
  private resizeObserver: ResizeObserver | null = null

  ngAfterViewInit(): void {
    this.calculateItemWidth()

    // Set up resize observer
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateItemWidth()
      this.updateArrowVisibility()
    })

    if (this.sliderContainer?.nativeElement) {
      this.resizeObserver.observe(this.sliderContainer.nativeElement)
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
  }

  calculateItemWidth(): void {
    if (!this.sliderContainer?.nativeElement) return

    const containerWidth = this.sliderContainer.nativeElement.clientWidth
    let itemsPerView = 5.3 // Default for large screens

    if (containerWidth < 600) {
      itemsPerView = 3 // Mobile
    } else if (containerWidth < 960) {
      itemsPerView = 4 // Tablet
    } else if (containerWidth < 1280) {
      itemsPerView = 5 // Small desktop
    }

    const newItemWidth = Math.floor(containerWidth / itemsPerView) - 16 // 16px for gap
    this.itemWidth.set(newItemWidth)
  }

  scrollLeft(): void {
    if (!this.sliderContainer?.nativeElement) return

    const container = this.sliderContainer.nativeElement
    const scrollAmount = this.itemWidth() * 2 // Scroll 2 items at a time
    const newPosition = Math.max(0, this.scrollPosition() - scrollAmount)

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    })

    this.scrollPosition.set(newPosition)
    this.updateArrowVisibility()
  }

  scrollRight(): void {
    if (!this.sliderContainer?.nativeElement) return

    const container = this.sliderContainer.nativeElement
    const scrollAmount = this.itemWidth() * 2 // Scroll 2 items at a time
    const maxScroll = container.scrollWidth - container.clientWidth
    const newPosition = Math.min(maxScroll, this.scrollPosition() + scrollAmount)

    container.scrollTo({
      left: newPosition,
      behavior: "smooth",
    })

    this.scrollPosition.set(newPosition)
    this.updateArrowVisibility()
  }

  updateArrowVisibility(): void {
    if (!this.sliderContainer?.nativeElement) return

    const container = this.sliderContainer.nativeElement
    const maxScroll = container.scrollWidth - container.clientWidth

    this.showLeftArrow.set(this.scrollPosition() > 0)
    this.showRightArrow.set(this.scrollPosition() < maxScroll - 5) // 5px buffer
  }

  onScroll(event: Event): void {
    const container = event.target as HTMLDivElement
    this.scrollPosition.set(container.scrollLeft)
    this.updateArrowVisibility()
  }

  // viewAll(): void {
  //   // This would navigate to a page showing all movies in this category
  //   // Implementation depends on your routing structure
  //   this.router.navigate(["/movies"], { queryParams: { category: this.title() } })
  // }
}

