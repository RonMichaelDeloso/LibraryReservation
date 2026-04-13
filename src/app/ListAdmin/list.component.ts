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

  reservations: any[] = [];
  adminName: string = 'ADMIN';

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

  searchTerm: string = '';
  currentTab: string = 'All'; 
  unreadCount: number = 0;
  private refreshInterval: any;

  async ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'ADMIN');
    await this.loadAllReservations();
    await this.loadUnreadCount();
    this.cdr.detectChanges();
    
    // Auto refresh every 5 seconds to show changes instantly across devices
    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadAllReservations();
        this.loadUnreadCount();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadAllReservations() {
    try {
      this.reservations = await this.reservationService.getAllReservation();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load reservations:', e);
    }
  }

  get filteredReservations() {
    // Hide Cancelled/Returned records so they delete from the table
    let filtered = this.reservations.filter(r => r.Status !== 'Cancelled');
    
    // Filter by Tab
    if (this.currentTab === 'Reserved') {
      filtered = filtered.filter(r => r.Status === 'Pending');
    } else if (this.currentTab === 'Borrowed') {
      filtered = filtered.filter(r => r.Status === 'Loaned' || r.Status === 'Completed');
    }

    // Filter by Search Term
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
    try {
      await this.reservationService.approveReservation(id);
      console.log('Reservation approved successfully.');
      await this.loadAllReservations();
    } catch (e: any) {
      console.error(e.error?.message || 'Failed to approve');
    }
  }

  async cancelReservation(id: number, type: string) {
    try {
      await this.reservationService.cancelReservation(id);
      console.log(`Successfully marked as ${type}.`);
      await this.loadAllReservations();
    } catch (e: any) {
      console.error(e.error?.message || 'Failed to process request');
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