import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { ChangeDetectorRef, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-adprofile',
  standalone: true,
  templateUrl: './Adprofile.component.html',
  styleUrls: ['./Adprofile.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})

export class AdprofileComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  topbarName: string = 'User1';
  userName: string = 'Ron Michael Deloso';
  userEmail: string = 'Ron.MichelDeloso@gmail.com';
  userRole: string = '';
  showDropdown: boolean = false;
  unreadCount: number = 0;
  private refreshInterval: any;

  // Edit Modal State
  isEditModalOpen: boolean = false;
  editFirstName: string = '';
  editLastName: string = '';
  editEmail: string = '';
  editPassword: string = '';

  // Password Modal State
  isPasswordModalOpen: boolean = false;
  newPassword: string = '';
  confirmPassword: string = '';

  // Admin Invite State
  inviteEmail: string = '';
  inviteSuccess: boolean = false;
  inviteError: string = '';

  ngOnInit() {
    const user = this.authService.getUser();
    if (user && user.First_name) {
      this.topbarName = user.First_name;
      this.userName = user.Last_name ? `${user.First_name} ${user.Last_name}` : user.First_name;
      this.editFirstName = user.First_name;
      this.editLastName = user.Last_name || '';
    }
    if (user && user.Email) {
      this.userEmail = user.Email;
      this.editEmail = user.Email;
    }

    this.userRole = this.authService.getRole() || 'Admin';

    this.loadUnreadCount();
    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadUnreadCount();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadUnreadCount() {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;
      const notifications = await this.notificationService.getByUser(userId);
      this.unreadCount = notifications.filter((n: any) => !n.is_read).length;
      this.cdr.detectChanges();
    } catch (e) {}
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  openEditModal() {
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  async saveProfile() {
    try {
      const userId = this.authService.getUserId();
      await this.authService.updateProfile(userId, {
        First_name: this.editFirstName,
        Last_name: this.editLastName,
        Email: this.editEmail
      });

      this.userName = this.editLastName ? `${this.editFirstName} ${this.editLastName}` : this.editFirstName;
      this.topbarName = this.editFirstName;
      this.userEmail = this.editEmail;

      this.closeEditModal();
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  }

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
  }

  async submitPasswordChange() {
    if (!this.newPassword) return;
    if (this.newPassword !== this.confirmPassword) return;
    if (this.newPassword.length < 6) return;

    try {
      await this.authService.resetPasswordDirect(this.userEmail, this.newPassword);
      this.closePasswordModal();
    } catch (error) {
      console.error('Failed to update password:', error);
    }
  }

  async sendAdminInvite() {
    this.inviteSuccess = false;
    this.inviteError = '';

    if (!this.inviteEmail) {
      this.inviteError = 'Please enter an email address.';
      return;
    }

    try {
      await this.authService.sendAdminInvite(this.inviteEmail);
      this.inviteSuccess = true;
      this.inviteEmail = '';
      setTimeout(() => { this.inviteSuccess = false; }, 4000);
    } catch (err: any) {
      this.inviteError = err?.error?.message || 'Failed to send invite.';
      setTimeout(() => { this.inviteError = ''; }, 4000);
    }
  }
}