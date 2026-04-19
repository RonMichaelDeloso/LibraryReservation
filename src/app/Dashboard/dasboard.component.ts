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
  userName: string = 'User1';
  userEmail: string = 'User1@gmail.com';
  userPicture: string = '';
  selectedFile: File | null = null;
  showDropdown: boolean = false;
  unreadCount: number = 0;
  private refreshInterval: any;

  isEditModalOpen: boolean = false;
  editFirstName: string = '';
  editLastName: string = '';
  editEmail: string = '';
  editPassword: string = '';

  totalBorrowBooks: number = 0;
  currentlyBorrowed: number = 0;
  activeReservations: number = 0;
  overdueReturns: number = 0;
  activeUsers: number = 0;
  totalUsers: number = 0;

  recentActivity: any[] = [];

  chartData = { pending: 0, approved: 0, cancelled: 0, returned: 0 };
  chartBarWidths = { pending: 0, approved: 0, cancelled: 0, returned: 0 };

  monthLabels: string[] = [];
  trendPoints: { x: number; y: number }[] = [];
  trendLinePoints: string = '';
  trendAreaPoints: string = '';
  trendYLabels: number[] = [0, 0, 0, 0];
  trendTotal: number = 0;
  trendPeakMonth: string = '-';
  trendLatest: number = 0;

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
    this.userPicture = this.authService.getImageUrl(user?.ProfilePic, this.userName);

    this.loadUnreadCount();
    this.getTotalUsers();
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
      const [reservations, users, books] = await Promise.all([
        this.reservationService.getAllReservation().catch(() => []),
        this.backendApiService.getAllUsers().catch(() => []),
        this.bookService.getAllBooks().catch(() => [])
      ]);

      const now = new Date();

      this.totalBorrowBooks = books.length;

      this.currentlyBorrowed = reservations.filter((r: any) => r.Status === 'Completed').length;

      const overdueReservations = reservations.filter((r: any) => {
        if (r.Status !== 'Completed') return false;
        const dueDate = new Date(r.Due_date);
        return dueDate < now;
      });
      this.overdueReturns = new Set(overdueReservations.map((r: any) => r.User_id)).size;

      const pendingReservations = reservations.filter((r: any) => r.Status === 'Pending');
      this.activeReservations = new Set(pendingReservations.map((r: any) => r.User_id)).size;

      this.totalUsers = users.length;
      this.activeUsers = Math.max(1, Math.floor(users.length * 0.8));

      this.chartData = {
        pending:   reservations.filter((r: any) => r.Status === 'Pending').length,
        approved:  reservations.filter((r: any) => r.Status === 'Completed').length,
        cancelled: reservations.filter((r: any) => r.Status === 'Cancelled').length,
        returned:  reservations.filter((r: any) => r.Status === 'Returned').length
      };
      const maxBar = Math.max(1, this.chartData.pending, this.chartData.approved, this.chartData.cancelled, this.chartData.returned);
      this.chartBarWidths = {
        pending:   Math.round((this.chartData.pending   / maxBar) * 100),
        approved:  Math.round((this.chartData.approved  / maxBar) * 100),
        cancelled: Math.round((this.chartData.cancelled / maxBar) * 100),
        returned:  Math.round((this.chartData.returned  / maxBar) * 100)
      };

      const monthlyCounts: Record<string, number> = {};
      const shortMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyCounts[`${d.getFullYear()}-${d.getMonth()}`] = 0;
      }
      reservations.forEach((res: any) => {
        const d = new Date(res.Reserve_date || res.Created_at || now);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (key in monthlyCounts) monthlyCounts[key]++;
      });
      const keys = Object.keys(monthlyCounts);
      const counts = keys.map(k => monthlyCounts[k]);
      this.monthLabels = keys.map(k => {
        const [, m] = k.split('-').map(Number);
        return shortMonths[m];
      });
      const maxTrend = Math.max(1, ...counts);
      const chartH = 140, chartTop = 20, xStart = 55, xEnd = 400;
      const step = (xEnd - xStart) / Math.max(1, counts.length - 1);
      this.trendPoints = counts.map((v, i) => ({
        x: Math.round(xStart + i * step),
        y: Math.round(chartTop + chartH - (v / maxTrend) * chartH)
      }));
      this.trendLinePoints = this.trendPoints.map(p => `${p.x},${p.y}`).join(' ');
      const first = this.trendPoints[0];
      const last  = this.trendPoints[this.trendPoints.length - 1];
      this.trendAreaPoints =
        `${first.x},${chartTop + chartH} ` +
        this.trendPoints.map(p => `${p.x},${p.y}`).join(' ') +
        ` ${last.x},${chartTop + chartH}`;
      const step4 = Math.ceil(maxTrend / 4);
      this.trendYLabels = [step4, step4 * 2, step4 * 3, step4 * 4];
      this.trendTotal = counts.reduce((a, b) => a + b, 0);
      const peakIdx = counts.indexOf(Math.max(...counts));
      this.trendPeakMonth = this.monthLabels[peakIdx] ?? '-';
      this.trendLatest = counts[counts.length - 1] ?? 0;

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
          dateBorrowed: r.Reserve_date,
          dueDate: r.Due_date,
          status: displayStatus
        };
      });

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

  async getTotalUsers() {
    try {
      const res = await this.authService.getTotalUsers();
      this.totalUsers = res.total;
    } catch (error) {
      console.error('Failed to fetch total users', error);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async saveProfile() {
    try {
      const formData = new FormData();
      formData.append('User_id', String(this.authService.getUserId()));
      formData.append('First_name', this.editFirstName);
      formData.append('Last_name', this.editLastName);
      formData.append('Email', this.editEmail);

      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      const res = await this.authService.updateProfile(formData);

      const updatedUser = res.user;
      this.userName = updatedUser.Last_name ? `${updatedUser.First_name} ${updatedUser.Last_name}` : updatedUser.First_name;
      this.topbarName = updatedUser.First_name;
      this.userEmail = updatedUser.Email;
      this.userPicture = this.authService.getImageUrl(updatedUser.ProfilePic, this.userName);

      this.closeEditModal();
      this.selectedFile = null;
      alert(res.message || 'Profile updated successfully!');
    } catch (err: any) {
      const errorMsg = err.error?.message || err.message || 'Failed to update profile!';
      alert(`Error: ${errorMsg}`);
      console.error(err);
    }
  }

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
