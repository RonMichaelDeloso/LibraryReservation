import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
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
  private router = inject(Router);

  notifications: any[] = [];
  userName: string = 'ADMIN';
  private refreshInterval: any;

  showDropdown: boolean = false;

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  async ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'ADMIN');
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
      // Auto-mark all as read so the sidebar badge clears
      const unread = this.notifications.filter((n: any) => !n.is_read);
      if (unread.length > 0) {
        await this.notificationService.markAllAsRead(userId);
        this.notifications = this.notifications.map((n: any) => ({ ...n, is_read: 1 }));
        this.cdr.detectChanges();
      }
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  /** True when the notification is about a pending book reservation (but not cancelled) */
  isPendingNotif(notif: any): boolean {
    const msg: string = notif.Message?.toLowerCase() || '';
    if (msg.includes('cancel')) {
      return false;
    }
    return msg.includes('pending') || msg.includes('reserved') || msg.includes('reservation') || msg.includes('requested a book') || msg.includes('book request');
  }

  /** Navigate to List page when a pending notification is clicked */
  handleNotifClick(notif: any, event: MouseEvent) {
    if (this.isPendingNotif(notif)) {
      this.router.navigate(['/list']);
    }
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
