import { Component, input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [],
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  baseUrl = environment.API_URL;
  user = input.required<any>()
  size = input(32);
}
