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

  // Invite confirmation modal state
  pendingInviteNotif: any = null;
  inviteAccepting: boolean = false;
  inviteAccepted: boolean = false;

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
      // Auto-mark all as read so the sidebar badge clears
      const unread = this.notifications.filter(n => !n.is_read);
      if (unread.length > 0) {
        await this.notificationService.markAllAsRead(userId);
        this.notifications = this.notifications.map(n => ({ ...n, is_read: 1 }));
        this.cdr.detectChanges();
      }
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

  // Show confirmation modal before accepting
  openInviteConfirm(notif: any) {
    this.pendingInviteNotif = notif;
    this.inviteAccepted = false;
  }

  closeInviteConfirm() {
    this.pendingInviteNotif = null;
    this.inviteAccepting = false;
  }

  // 👑 Accept Admin Invite
  async confirmAcceptInvite() {
    if (!this.pendingInviteNotif) return;
    this.inviteAccepting = true;
    try {
      const userId = this.authService.getUserId();
      await this.authService.acceptAdminInvite(this.pendingInviteNotif.Notification_id, userId);
      this.inviteAccepted = true;
      this.inviteAccepting = false;
      // After 2.5s, log out and redirect to login
      setTimeout(() => {
        this.authService.logout();
        this.router.navigate(['/login']);
      }, 2500);
    } catch (e: any) {
      this.inviteAccepting = false;
      console.error('Failed to accept invite:', e);
    }
  }

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