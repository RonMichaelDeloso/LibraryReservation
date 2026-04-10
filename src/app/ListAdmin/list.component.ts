import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../service/reservation.service';
import { AuthService } from '../service/auth.service';

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
  private cdr = inject(ChangeDetectorRef);

  reservations: any[] = [];
  adminName: string = 'ADMIN';

  searchTerm: string = '';
  currentTab: string = 'All'; // 'All', 'Reserved', 'Borrowed'
  private refreshInterval: any;

  async ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.First_name || 'ADMIN';
    await this.loadAllReservations();
    this.cdr.detectChanges();
    
    // Auto refresh every 5 seconds to show changes instantly across devices
    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadAllReservations();
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
    if(confirm('Approve this reservation and set as Loaned?')) {
      try {
        await this.reservationService.approveReservation(id);
        alert('Reservation approved successfully.');
        await this.loadAllReservations();
      } catch (e: any) {
        alert(e.error?.message || 'Failed to approve');
      }
    }
  }

  async cancelReservation(id: number, type: string) {
    if(confirm(`Are you sure you want to ${type} this book?`)) {
      try {
        await this.reservationService.cancelReservation(id);
        alert(`Successfully marked as ${type}.`);
        await this.loadAllReservations();
      } catch (e: any) {
        alert(e.error?.message || 'Failed to process request');
      }
    }
  }
}