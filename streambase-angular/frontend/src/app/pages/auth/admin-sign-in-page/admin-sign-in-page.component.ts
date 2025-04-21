import { Component, ViewEncapsulation } from '@angular/core';
import { SignInComponent } from "../sign-in/sign-in.component";

@Component({
  selector: 'app-admin-sign-in-page',
  standalone: true,
  imports: [SignInComponent],
  templateUrl: './admin-sign-in-page.component.html',
  styleUrl: './admin-sign-in-page.component.scss'
})
export class AdminSignInPageComponent {

}
