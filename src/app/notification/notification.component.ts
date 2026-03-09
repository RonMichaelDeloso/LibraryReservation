import { Component } from '@angular/core';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss'
})
export class NotificationComponent {

  notificationVisible: boolean = true;

  removeNotification() {
    this.notificationVisible = false;
  }

}