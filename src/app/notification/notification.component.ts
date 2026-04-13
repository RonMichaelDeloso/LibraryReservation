import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { NotificationService } from '../service/notification.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  imports: [RouterLink, CommonModule]
})
export class NotificationComponent implements OnInit, OnDestroy {
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  notifications: any[] = [];
  userName: string = 'USER';
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
    this.userName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'USER');
    await this.loadNotifications();

    // Poll every 5 seconds for new notifications
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
      this.notifications = await this.notificationService.getByUser(userId);
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.is_read).length;
  }

  // × button — permanently delete from DB and remove from view
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

  // 👑 Accept Admin Invite
  async acceptInvite(notif: any) {
    if (!confirm('Are you sure you want to join as Admin? You will be logged out and need to re-login.')) return;
    try {
      const userId = this.authService.getUserId();
      await this.authService.acceptAdminInvite(notif.Notification_id, userId);
      // Update local session role to Admin
      const user = this.authService.getUser();
      user.Role_id = 2;
      localStorage.setItem('user', JSON.stringify(user));
      alert('Congratulations! You are now an Admin. Please log in again.');
      this.authService.logout();
      this.router.navigate(['/login']);
    } catch (e: any) {
      alert(e?.error?.message || 'Failed to accept invite.');
    }
  }

  // Clear all — permanently delete all for this user
  async clearAll() {
    try {
      const userId = this.authService.getUserId();
      await this.notificationService.deleteAll(userId);
      this.notifications = [];
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to clear notifications:', e);
    }
  }
}