import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../service/reservation.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-book',
  standalone: true,
  templateUrl: './book.component.html',
  styleUrls: ['./book.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})
export class BookComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  reservations: any[] = [];
  activeReservations: any[] = [];
  userName: string = 'USER';
  private refreshInterval: any;

  async ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.First_name || 'USER';
    await this.loadReservations();
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        // Only refresh the active server reservations, not local cart
        this.loadActiveReservations();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadReservations() {
    if (typeof localStorage !== 'undefined') {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.reservations = cart.map((b: any) => ({ ...b, selected: false }));
        this.cdr.detectChanges();
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }

    await this.loadActiveReservations();
  }

  async loadActiveReservations() {
    try {
      const userId = this.authService.getUserId();
      const rawReservations = await this.reservationService.getReservationsByUser(userId);
      this.activeReservations = rawReservations.filter((res: any) => res.Status !== 'Cancelled');
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load active reservations:', e);
    }
  }

  async cancelReservation(id: number) {
    if (confirm('Cancel this pending request?')) {
      try {
        await this.reservationService.cancelReservation(id);
        alert('Request cancelled.');
        await this.loadReservations();
      } catch (e: any) {
        alert(e.error?.message || 'Failed to cancel');
      }
    }
  }

  async checkoutItems() {
    const selected = this.reservations.filter(r => r.selected);
    if (selected.length === 0) {
      alert("Please select at least one item from the cart.");
      return;
    }

    try {
      const userId = this.authService.getUserId();
      const reserveDate = new Date().toISOString().split('T')[0];
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const dueDate = due.toISOString().split('T')[0];

      for (const book of selected) {
        const payload = {
          User_id: userId,
          Book_id: book.Book_id,
          Reserve_date: reserveDate,
          Due_date: dueDate
        };
        await this.reservationService.createReservation(payload);
      }

      alert(`Successfully requested ${selected.length} items! The admin handles approvals.`);

      const remainingCart = this.reservations.filter(r => !r.selected);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(remainingCart));
      }
      this.reservations = remainingCart;
      await this.loadReservations();

    } catch (e: any) {
      alert(e.error?.message || 'Failed to checkout some items.');
    }
  }
}