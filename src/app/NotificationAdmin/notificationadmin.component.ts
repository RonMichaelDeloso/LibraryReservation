import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { NotificationService } from '../service/notification.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notificationadmin.component.html',
  styleUrls: ['./notificationadmin.component.scss'],
  imports: [RouterLink, CommonModule]
})
export class NotificationAdminComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  notifications: any[] = [];
  userName: string = 'ADMIN';
  private refreshInterval: any;

  async ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.First_name || 'ADMIN';
    await this.loadNotifications();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadNotifications();
      }, 5000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  async loadNotifications() {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;
      this.notifications = await this.notificationService.getByUser(userId);
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  async dismiss(notif: any) {
    try {
      await this.notificationService.deleteNotification(notif.Notification_id);
      this.notifications = this.notifications.filter(
        n => n.Notification_id !== notif.Notification_id
      );
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  }

  async clearAll() {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;
      await this.notificationService.deleteAll(userId);
      this.notifications = [];
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  }
}