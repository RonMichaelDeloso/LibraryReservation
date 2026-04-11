import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { BookService } from '../service/book.service';
import { ReservationService } from '../service/reservation.service';

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
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  
  searchTerm: string = '';
  userName: string = 'USER';
  adminId: any;
  books: any[] = [];
  genres: any[] = [];
  selectedGenres: string[] = [];
  isFilterOpen: boolean = false;
  private refreshInterval: any;

  async ngOnInit() {
    const user = this.authService.getUser();
    this.adminId = user?.First_name || 'USER';
    this.userName = this.adminId;
    
    await this.loadBooks();
    await this.loadGenres();
    this.cdr.detectChanges();

    if (typeof window !== 'undefined') {
      this.refreshInterval = setInterval(() => {
        this.loadBooks();
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

  addToCart(book: any) {
    if (typeof localStorage !== 'undefined') {
      let cart = [];
      try {
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
      } catch (e) {}
      
      const exists = cart.find((b: any) => b.Book_id === book.Book_id);
      if (!exists) {
        cart.push(book);
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log(`"${book.Title}" added to your cart!`);
      } else {
        console.warn(`"${book.Title}" is already in your cart.`);
      }
    }
  }
}