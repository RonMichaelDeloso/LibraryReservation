import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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
  imports: [RouterLink, CommonModule, FormsModule],
})
export class BookComponent implements OnInit, OnDestroy {
  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  reservations: any[] = [];
  activeReservations: any[] = [];
  userName = 'USER';
  unreadCount = 0;
  showDropdown = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  toastVisible = false;

  private refreshInterval: any;
  private toastTimer: any;


  async ngOnInit() {
    const user = this.authService.getUser();
    this.userName = user?.Last_name
      ? `${user.First_name} ${user.Last_name}`
      : user?.First_name || 'USER';

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
    clearInterval(this.refreshInterval);
    clearTimeout(this.toastTimer);
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
      // Show Pending and Ongoing — hide only Cancelled
      this.activeReservations = rawReservations
        .filter((r: any) => r.Status !== 'Cancelled')
        .map((r: any) => ({ ...r, uniqueId: `res_${r.Reserve_id}` }));

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
    } catch (e) {
      console.error('Failed to load unread count:', e);
    }
  }

  // ─── Computed Properties ──────────────────────────────────────────────────

  get hasSelectedItems(): boolean {
    return this.reservations.some(r => r.selected);
  }

  get allSelected(): boolean {
    return this.reservations.length > 0 && this.reservations.every(r => r.selected);
  }

  // ─── UI Actions ───────────────────────────────────────────────────────────

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.reservations.forEach(r => (r.selected = checked));
  }

  // ─── Cart Actions ─────────────────────────────────────────────────────────

  removeFromCart(bookId: string | number) {
    const updated = this.reservations.filter(r => String(r.Book_id) !== String(bookId));
    this.saveCart(updated);
    window.location.reload();
  }

  async cancelReservation(id: number) {
    if (!confirm('Cancel this pending request?')) return;
    try {
      await this.reservationService.cancelReservation(id);
      window.location.reload();
    } catch (e: any) {
      const msg = e?.error?.message || e?.message || 'Failed to cancel. Please try again.';
      this.showToast(msg, 'error');
      console.error('Cancel error:', e);
    }
  }

  async checkoutItems() {
    const selected = this.reservations.filter(r => r.selected);
    if (selected.length === 0) return;

    const activeCount = this.activeReservations.filter(
      r => r.Status === 'Pending' || r.Status === 'Completed'
    ).length;

    if (activeCount + selected.length > 5) {
      this.showToast(
        `You can only borrow up to 5 books! You have ${activeCount} active request(s). You can add ${5 - activeCount} more.`,
        'error'
      );
      return;
    }

    const userId = this.authService.getUserId();
    const reserveDate = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueDate = due.toISOString().split('T')[0];

    let successCount = 0;
    const successfulBookIds = new Set<string>();

    for (const book of selected) {
      try {
        await this.reservationService.createReservation({
          User_id: userId,
          Book_id: book.Book_id,
          Reserve_date: reserveDate,
          Due_date: dueDate,
        });
        successCount++;
        successfulBookIds.add(String(book.Book_id));
      } catch (e: any) {
        console.error(`Failed to checkout "${book.Title}":`, e.error?.message || e);
      }
    }

    if (successCount > 0) {
      // Remove successfully checked-out books from localStorage cart
      const remaining = this.reservations.filter(
        r => !successfulBookIds.has(String(r.Book_id))
      );
      this.saveCart(remaining);
      // Reload page so Angular reads fresh localStorage → cart is empty, pending shows new items
      window.location.reload();
    } else {
      this.showToast('Could not check out. Books may already be reserved or unavailable.', 'error');
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private saveCart(items: any[]) {
    if (typeof localStorage === 'undefined') return;
    const toSave = items.map(({ selected: _s, ...rest }: any) => rest);
    localStorage.setItem('cart', JSON.stringify(toSave));
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastVisible = true;
    this.cdr.detectChanges();
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 3500);
  }
}
