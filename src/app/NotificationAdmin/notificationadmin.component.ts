import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notificationadmin.component.html',
  styleUrls: ['./notificationadmin.component.scss']  ,
  imports: [RouterLink]
})
export class NotificationAdminComponent {

  notificationVisible: boolean = true;

  removeNotification() {
    this.notificationVisible = false;
  }

}