import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { ReservationService } from '../service/reservation.service';

@Component({
  selector: 'app-list',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})
export class ListComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  allRecords: any[] = [];
  adminName: string = 'ADMIN';
  showDropdown: boolean = false;
  searchTerm: string = '';
  currentTab: string = 'All';
  unreadCount: number = 0;
  private refreshInterval: any;

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
    this.adminName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'ADMIN');
    await this.loadAllData();
    await this.loadUnreadCount();
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadAllData();
        this.loadUnreadCount();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  async loadAllData() {
    try {
      const reservations = await this.reservationService.getAllReservation();

      // Show Pending and Completed — hide Cancelled (deleted rows auto-disappear)
      this.allRecords = reservations
        .filter((r: any) => r.Status !== 'Cancelled')
        .map((r: any) => ({
          ...r,
          // Completed = book given to student (shows Returned button)
          // Pending  = waiting for admin approval (shows Book Ready + Cancelled)
          recordType: r.Status === 'Completed' ? 'loan' : 'reservation',
          actionId: r.Reserve_id
        }))
        .sort((a: any, b: any) => new Date(a.Due_date).getTime() - new Date(b.Due_date).getTime());

      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  }

  get filteredRecords() {
    let filtered = this.allRecords;

    if (this.currentTab === 'Reserved') {
      filtered = filtered.filter(r => r.Status === 'Pending');
    } else if (this.currentTab === 'Borrowed') {
      filtered = filtered.filter(r => r.Status === 'Completed');
    }

    if (this.searchTerm) {
      const lower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.First_name?.toLowerCase().includes(lower) ||
        r.Last_name?.toLowerCase().includes(lower) ||
        r.Title?.toLowerCase().includes(lower)
      );
    }

    return filtered;
  }

  async approveReservation(id: number) {
    if (!confirm('Mark this book as ready for pickup?')) return;
    try {
      await this.reservationService.approveReservation(id);
      window.location.reload();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to approve reservation.';
      alert(`Error: ${msg}`);
      console.error('Approve reservation error:', e);
    }
  }

  async cancelReservation(id: number, type: string) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      await this.reservationService.cancelReservation(id);
      window.location.reload();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to cancel reservation.';
      alert(`Error: ${msg}`);
      console.error('Cancel reservation error:', e);
    }
  }

  // Mark book as returned — deletes the reservation row and sets book back to Available
  async returnBook(id: number) {
    if (!confirm('Confirm book has been returned?')) return;
    try {
      await this.reservationService.returnReservation(id);
      window.location.reload();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to mark book as returned.';
      alert(`Error: ${msg}`);
      console.error('Return book error:', e);
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
}