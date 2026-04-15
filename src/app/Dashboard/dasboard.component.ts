import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { BookService } from '../service/book.service';
import { ReservationService } from '../service/reservation.service';
import { apiService } from '../service/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dasboard.component.html',
  styleUrls: ['./dasboard.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})

export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  topbarName: string = 'User1';
  userName: string = 'Ron Michael Deloso';
  userEmail: string = 'Ron.MichelDeloso@gmail.com';
  showDropdown: boolean = false;
  unreadCount: number = 0;
  private refreshInterval: any;

  // Edit Modal State
  isEditModalOpen: boolean = false;
  editFirstName: string = '';
  editLastName: string = '';
  editEmail: string = '';
  editPassword: string = '';

  // Dashboard Stats
  totalBorrowBooks: number = 0;
  currentlyBorrowed: number = 0;
  activeReservations: number = 0;
  overdueReturns: number = 0;
  activeUsers: number = 0;
  totalUsers: number = 0;

  // Recent Activity
  recentActivity: any[] = [];

  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);
  private backendApiService = inject(apiService);

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

    this.loadUnreadCount();
    this.loadDashboardData();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadUnreadCount();
        this.loadDashboardData();
      }, 5000);
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
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  }

  async loadDashboardData() {
    try {
      // Fetch data in parallel
      const [reservations, users, books] = await Promise.all([
        this.reservationService.getAllReservation().catch(() => []),
        this.backendApiService.getAllUsers().catch(() => []),
        this.bookService.getAllBooks().catch(() => [])
      ]);

      const now = new Date();

      // Total Books in the catalog
      this.totalBorrowBooks = books.length;
      
      this.currentlyBorrowed = reservations.filter((r: any) => r.Status === 'Completed').length;
      
      // Unique students with Overdue books
      const overdueReservations = reservations.filter((r: any) => {
        if (r.Status !== 'Completed') return false;
        const dueDate = new Date(r.Due_date);
        return dueDate < now;
      });
      this.overdueReturns = new Set(overdueReservations.map((r: any) => r.User_id)).size;

      // Unique students with Active Reservations
      const pendingReservations = reservations.filter((r: any) => r.Status === 'Pending');
      this.activeReservations = new Set(pendingReservations.map((r: any) => r.User_id)).size;

      this.totalUsers = users.length;
      
      // Number of unique users actively interacting with the library (have records)
      this.activeUsers = new Set(reservations.map((r: any) => r.User_id)).size;

      // Prepare recent activity table
      const mappedActivity = reservations.map((r: any) => {
        let displayStatus = 'Active';
        if (r.Status === 'Returned') {
            displayStatus = 'Returned';
        } else if (r.Status === 'Cancelled') {
            displayStatus = 'Cancelled';
        } else if (r.Status === 'Pending') {
            displayStatus = 'Pending';
        } else if (r.Status === 'Completed') {
            const dueDate = new Date(r.Due_date);
            displayStatus = dueDate < now ? 'Overdue' : 'Active';
        }
        
        return {
            id: r.Reserve_id,
            bookId: r.Book_id,
            bookTitle: r.Title || 'Unknown Book',
            borrower: r.First_name ? `${r.First_name} ${r.Last_name || ''}` : 'Unknown User',
            dateBorrowed: r.Reserve_date, // Reserve date acts as the initiation date
            dueDate: r.Due_date,
            status: displayStatus
        };
      });

      // Sort by latest reserve date and grab top 5
      this.recentActivity = mappedActivity
        .sort((a: any, b: any) => new Date(b.dateBorrowed).getTime() - new Date(a.dateBorrowed).getTime())
        .slice(0, 5);

      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load dashboard statistics', e);
    }
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
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile!');
      console.error(err);
    }
  }

  // Password Modal Logic
  isPasswordModalOpen: boolean = false;
  newPassword: string = '';
  confirmPassword: string = '';

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  closePasswordModal() {
    this.isPasswordModalOpen = false;
  }

  async submitPasswordChange() {
    if (!this.newPassword) {
      alert("Please enter a new password.");
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (this.newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      await this.authService.resetPasswordDirect(this.userEmail, this.newPassword);
      alert("Password logically updated successfully!");
      this.closePasswordModal();
    } catch (error) {
      alert("Failed to update password across the server.");
    }
  }

}