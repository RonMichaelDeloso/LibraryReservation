import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { NotificationService } from '../service/notification.service';
import { ReservationService } from '../service/reservation.service';

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
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  reservations: any[] = [];
  activeReservations: any[] = [];
  userName: string = 'USER';
  unreadCount: number = 0;
  private refreshInterval: any;

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

  async ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'USER');
    await this.loadReservations();
    await this.loadUnreadCount();
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadActiveReservations();
        this.loadUnreadCount();
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

  async loadUnreadCount() {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;
      const notifications = await this.notificationService.getByUser(userId);
      this.unreadCount = notifications.filter((n: any) => !n.is_read).length;
      this.cdr.detectChanges();
    } catch (e) {}
  }

  get hasSelectedItems(): boolean {
    return this.reservations.some(r => r.selected);
  }

  get allSelected(): boolean {
    return this.reservations.length > 0 && this.reservations.every(r => r.selected);
  }

  toggleAll(event: any) {
    const checked = event.target.checked;
    this.reservations.forEach(r => r.selected = checked);
  }

  async cancelReservation(id: number) {
    if (confirm('Cancel this pending request?')) {
      try {
        await this.reservationService.cancelReservation(id);
        console.log('Request cancelled.');
        await this.loadReservations();
      } catch (e: any) {
        console.error(e.error?.message || 'Failed to cancel');
      }
    }
  }

  removeFromCart(book: any) {
    this.reservations = this.reservations.filter(r => r.Book_id !== book.Book_id);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cart', JSON.stringify(this.reservations));
    }
    this.cdr.detectChanges();
  }

  async checkoutItems() {
    const selected = this.reservations.filter(r => r.selected);
    if (selected.length === 0) {
      console.warn("Please select at least one item from the cart.");
      return;
    }

    const activeCount = this.activeReservations.filter(r => r.Status === 'Pending' || r.Status === 'Loaned').length;
    if (activeCount + selected.length > 5) {
      alert(`You can only borrow up to 5 books maximum!\n\nYou currently have ${activeCount} active/pending requests. You can only checkout ${5 - activeCount} more items.`);
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

      console.log(`Successfully requested ${selected.length} items! The admin handles approvals.`);

      const remainingCart = this.reservations.filter(r => !r.selected);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(remainingCart));
      }
      this.reservations = remainingCart;
      await this.loadReservations();

    } catch (e: any) {
      console.error(e.error?.message || 'Failed to checkout some items.');
    }
  }
}