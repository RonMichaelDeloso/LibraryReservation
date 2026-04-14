import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { BookService } from '../service/book.service';
import { LoanService } from '../service/loan.services';
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
  private loanService = inject(LoanService);
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
      const [loans, reservations, users] = await Promise.all([
        this.loanService.getAllLoans().catch(() => []),
        this.reservationService.getAllReservation().catch(() => []),
        this.backendApiService.getAllUsers().catch(() => [])
      ]);

      this.totalBorrowBooks = loans.length;
      
      const now = new Date();

      this.currentlyBorrowed = loans.filter((loan: any) => !loan.Return_date).length;
      this.overdueReturns = loans.filter((loan: any) => {
        if (loan.Return_date) return false;
        const dueDate = new Date(loan.Due_date);
        return dueDate < now;
      }).length;

      this.activeReservations = reservations.filter((res: any) => res.Status === 'Pending' || res.Status === 'Approved').length;

      this.totalUsers = users.length;
      this.activeUsers = Math.max(1, Math.floor(users.length * 0.8)); // Mock active users based on total if not available, ensuring at least current user is active

      // Prepare recent activity table (combining loans)
      const mappedLoans = loans.map((loan: any) => {
        let status = 'Active';
        if (loan.Return_date) {
            status = 'Returned';
        } else {
            const dueDate = new Date(loan.Due_date);
            if (dueDate < now) status = 'Overdue';
        }
        
        return {
            id: loan.Loan_id || loan.id,
            bookId: loan.Book_id,
            bookTitle: loan.Book?.Title || 'Unknown Book',
            borrower: loan.User?.First_name ? `${loan.User.First_name} ${loan.User.Last_name || ''}` : 'Unknown User',
            dateBorrowed: loan.Borrow_date,
            dueDate: loan.Due_date,
            status: status
        };
      });

      // Sort by latest borrow date
      this.recentActivity = mappedLoans.sort((a: any, b: any) => new Date(b.dateBorrowed).getTime() - new Date(a.dateBorrowed).getTime()).slice(0, 5);

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