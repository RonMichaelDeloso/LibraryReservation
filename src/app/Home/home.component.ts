import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { BookService } from '../service/book.service';
import { ReservationService } from '../service/reservation.service';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})
export class HomeComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private bookService = inject(BookService);
  private reservationService = inject(ReservationService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  
  searchTerm: string = '';
  userName: string = 'USER';
  adminId: any;
  books: any[] = [];
  genres: any[] = [];
  selectedGenres: string[] = [];
  isFilterOpen: boolean = false;
  unreadCount: number = 0;
  cartItemIds: Set<number> = new Set();
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
    this.adminId = user?.First_name || 'USER';
    this.userName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'USER');
    
    await this.loadBooks();
    await this.loadGenres();
    await this.loadUnreadCount();
    this.updateCartIds();
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadBooks();
        this.loadUnreadCount();
      }, 3000);
    }
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  async loadBooks() {
    try {
      this.books = await this.bookService.getAllBooks();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load books:', e);
    }
  }

  async loadGenres() {
    try {
      this.genres = await this.bookService.getAllGenres();
      this.cdr.detectChanges();
    } catch (e) {
      console.error('Failed to load genres:', e);
    }
  }

  get filteredBooks() {
    let filtered = this.books;
    
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter(book => 
        this.selectedGenres.some(g => book.Genres?.includes(g))
      );
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(book =>
        book.Title?.toLowerCase().includes(term) ||
        book.Author?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }

  toggleGenre(genre: string) {
    const idx = this.selectedGenres.indexOf(genre);
    if (idx > -1) {
      this.selectedGenres.splice(idx, 1);
    } else {
      this.selectedGenres.push(genre);
    }
  }

  async addToCart(book: any) {
    if (typeof localStorage !== 'undefined') {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      } catch (e) {}
      
      const exists = cart.find((b: any) => b.Book_id === book.Book_id);
      if (exists) {
        console.warn(`"${book.Title}" is already in your cart.`);
        return;
      }

      // Check enforcing 5 items maximum limit
      const userId = this.authService.getUserId();
      let activeCount = 0;
      try {
        const rawRes = await this.reservationService.getReservationsByUser(userId);
        const activeRes = rawRes.filter((res: any) => res.Status === 'Pending' || res.Status === 'Loaned');
        activeCount = activeRes.length;
      } catch (e) {
        console.error('Failed to get user active reservations:', e);
      }

      if (cart.length + activeCount >= 5) {
        alert(`You can only borrow up to 5 books maximum!\n\nYou currently have ${activeCount} active/pending requests and ${cart.length} items in your cart.`);
        return;
      }

      cart.push(book);
      localStorage.setItem('cart', JSON.stringify(cart));
      this.updateCartIds();
      console.log(`"${book.Title}" added to your cart!`);
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

  updateCartIds() {
    if (typeof localStorage !== 'undefined') {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        this.cartItemIds = new Set(cart.map((b: any) => b.Book_id));
      } catch (e) {}
    }
  }
}