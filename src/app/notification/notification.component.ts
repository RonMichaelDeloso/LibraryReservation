import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']  ,
  imports: [RouterLink]
})
export class NotificationComponent {

  notificationVisible: boolean = true;

  removeNotification() {
    this.notificationVisible = false;
  }

}