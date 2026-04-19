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
  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);
  private backendApiService = inject(apiService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  // ── User / UI state ──────────────────────────────────────────────────────
  topbarName: string = 'Ron Michel Deloso';
  userName: string = 'Ron Michel Deloso';
  userEmail: string = '';
  userPicture: string = '';
  selectedFile: File | null = null;
  showDropdown: boolean = false;
  unreadCount: number = 0;
  private refreshInterval: any;

  // ── Profile modal ─────────────────────────────────────────────────────────
  isEditModalOpen: boolean = false;
  editFirstName: string = '';
  editLastName: string = '';
  editEmail: string = '';

  // ── Stat cards ────────────────────────────────────────────────────────────
  totalBorrowBooks: number = 0;   // total books in catalogue
  currentlyBorrowed: number = 0;  // reservations with Status = 'Completed'
  activeReservations: number = 0; // unique students with Status = 'Pending'
  overdueReturns: number = 0;     // unique students with Completed + overdue
  activeUsers: number = 0;
  totalUsers: number = 0;

  // ── Chart board ───────────────────────────────────────────────────────────
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

  // ── Password modal ────────────────────────────────────────────────────────
  isPasswordModalOpen: boolean = false;
  newPassword: string = '';
  confirmPassword: string = '';

  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit() {
    const user = this.authService.getUser();
    if (user?.First_name) {
      this.topbarName = user.First_name;
      this.userName = user.Last_name ? `${user.First_name} ${user.Last_name}` : user.First_name;
      this.editFirstName = user.First_name;
      this.editLastName = user.Last_name || '';
    }
    if (user?.Email) {
      this.userEmail = user.Email;
      this.editEmail = user.Email;
    }
    this.userPicture = this.authService.getImageUrl(user?.ProfilePic ?? null, this.userName);

    this.loadUnreadCount();
    this.loadDashboardData();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadUnreadCount();
        this.loadDashboardData();
      }, 10000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  // ── Data loaders ──────────────────────────────────────────────────────────

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
      // Parallel fetch: reservations, books, users
      const [reservations, books, users] = await Promise.all([
        this.reservationService.getAllReservation().catch(() => []),
        this.bookService.getAllBooks().catch(() => []),
        this.backendApiService.getAllUsers().catch(() => [])
      ]);

      const now = new Date();

      // ── Stat cards ────────────────────────────────────────────────────────
      // Total books in the catalogue
      this.totalBorrowBooks = books.length;

      // Currently borrowed = reservations approved (Status = 'Completed')
      this.currentlyBorrowed = reservations.filter(
        (r: any) => r.Status === 'Completed'
      ).length;

      // Students with overdue = Completed reservations past Due_date (unique users)
      const overdueSet = new Set(
        reservations
          .filter((r: any) => r.Status === 'Completed' && r.Due_date && new Date(r.Due_date) < now)
          .map((r: any) => r.User_id)
      );
      this.overdueReturns = overdueSet.size;

      // Students actively reserving = unique users with Pending status
      const pendingSet = new Set(
        reservations.filter((r: any) => r.Status === 'Pending').map((r: any) => r.User_id)
      );
      this.activeReservations = pendingSet.size;

      // Users
      this.totalUsers = users.length;
      this.activeUsers = users.filter((u: any) => u.status === 'Active').length || Math.max(1, Math.floor(users.length * 0.8));

      // ── Chart: status breakdown ───────────────────────────────────────────
      this.chartData = {
        pending: reservations.filter((r: any) => r.Status === 'Pending').length,
        approved: reservations.filter((r: any) => r.Status === 'Completed').length,
        cancelled: reservations.filter((r: any) => r.Status === 'Cancelled').length,
        returned: reservations.filter((r: any) => r.Status === 'Returned').length
      };
      const maxBar = Math.max(1, ...Object.values(this.chartData));
      this.chartBarWidths = {
        pending: Math.round((this.chartData.pending / maxBar) * 100),
        approved: Math.round((this.chartData.approved / maxBar) * 100),
        cancelled: Math.round((this.chartData.cancelled / maxBar) * 100),
        returned: Math.round((this.chartData.returned / maxBar) * 100)
      };

      // ── Chart: monthly trend (last 6 months) ─────────────────────────────
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyCounts: Record<string, number> = {};

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyCounts[`${d.getFullYear()}-${d.getMonth()}`] = 0;
      }

      // Reserve_date is the actual DB field name from the reservation table
      reservations.forEach((r: any) => {
        const dateStr = r.Reserve_date || r.Created_at;
        if (!dateStr) return;
        const d = new Date(dateStr);
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
      const last = this.trendPoints[this.trendPoints.length - 1];
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

      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  toggleDropdown() { this.showDropdown = !this.showDropdown; }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  openEditModal() { this.isEditModalOpen = true; }
  closeEditModal() { this.isEditModalOpen = false; }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  async saveProfile() {
    try {
      const formData = new FormData();
      formData.append('User_id', String(this.authService.getUserId()));
      formData.append('First_name', this.editFirstName);
      formData.append('Last_name', this.editLastName);
      formData.append('Email', this.editEmail);
      if (this.selectedFile) formData.append('image', this.selectedFile);

      const res = await this.authService.updateProfile(formData);
      const u = res.user ?? { First_name: this.editFirstName, Last_name: this.editLastName, Email: this.editEmail };

      this.userName = u.Last_name ? `${u.First_name} ${u.Last_name}` : u.First_name;
      this.topbarName = u.First_name;
      this.userEmail = u.Email;
      this.userPicture = this.authService.getImageUrl(u.ProfilePic ?? null, this.userName);

      this.closeEditModal();
      this.selectedFile = null;
      alert(res.message || 'Profile updated successfully!');
    } catch (err: any) {
      alert(`Error: ${err?.error?.message || err?.message || 'Failed to update profile!'}`);
      console.error(err);
    }
  }

  openPasswordModal() {
    this.isPasswordModalOpen = true;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  closePasswordModal() { this.isPasswordModalOpen = false; }

  async submitPasswordChange() {
    if (!this.newPassword) { alert('Please enter a new password.'); return; }
    if (this.newPassword !== this.confirmPassword) { alert('Passwords do not match!'); return; }
    if (this.newPassword.length < 6) { alert('Password must be at least 6 characters.'); return; }
    try {
      await this.authService.resetPasswordDirect(this.userEmail, this.newPassword);
      alert('Password updated successfully!');
      this.closePasswordModal();
    } catch {
      alert('Failed to update password.');
    }
  }
}
