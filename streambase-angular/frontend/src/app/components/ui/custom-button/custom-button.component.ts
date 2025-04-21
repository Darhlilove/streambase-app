import { Component, Input, Output, EventEmitter } from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { NgClass } from "@angular/common"

@Component({
  selector: "app-custom-button",
  standalone: true,
  imports: [MatButtonModule, MatIconModule, NgClass],
  templateUrl: "./custom-button.component.html",
  styleUrls: ["./custom-button.component.scss"],
})
export class CustomButtonComponent {
  @Input() text = ""
  @Input() variant: "primary" | "secondary" | "danger" | "success" | "warning" | "info" | "light" | "dark" = "primary"
  @Input() size: "small" | "medium" | "large" = "medium"
  @Input() fullWidth = false
  @Input() disabled = false
  @Input() icon = ""
  @Input() iconPosition: "start" | "end" = "start"
  @Input() type: "button" | "submit" | "reset" = "button"
  @Input() ariaLabel = ""

  @Output() buttonClick = new EventEmitter<MouseEvent>()

  onClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.buttonClick.emit(event)
    }
  }
}

