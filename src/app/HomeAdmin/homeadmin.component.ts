import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { BookService } from '../service/book.service';
import { NotificationService } from '../service/notification.service';

@Component({
  selector: 'app-homeadmin',
  standalone: true,
  templateUrl: './homeadmin.component.html',
  styleUrls: ['./homeadmin.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})
export class HomeAdminComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private bookService = inject(BookService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  searchTerm: string = '';
  adminName: string = 'ADMIN';
  userPicture: string = '';
  selectedGenres: string[] = [];
  isFilterOpen: boolean = false;

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

  books: any[] = [];
  genres: any[] = [];
  unreadCount: number = 0;
  private refreshInterval: any;
  selectedFile: File | null = null;

  isAddModalOpen = false;
  isEditModalOpen = false;

  newBook = {
    isbn: '',
    Title: '',
    Author: '',
    Description: '',
    Genre_id: [] as number[]
  };

  editBookData = {
    Book_id: 0,
    isbn: '',
    Title: '',
    Author: '',
    Description: '',
    Status: ''
  };

  async ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.Last_name ? `${user.First_name} ${user.Last_name}` : (user?.First_name || 'ADMIN');
    if (user && user.ProfilePic) {
      this.userPicture = this.authService.getImageUrl(user.ProfilePic);
    }
    await this.loadBooks();
    await this.loadGenres();
    await this.loadUnreadCount();
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

  openAddBookModal() {
    this.newBook = {
      isbn: '',
      Title: '',
      Author: '',
      Description: '',
      Genre_id: []
    };
    this.isAddModalOpen = true;
  }

  closeAddModal() {
    this.isAddModalOpen = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async submitAddBook() {
    try {
      const formData = new FormData();
      formData.append('User_id', String(this.authService.getUserId()));
      formData.append('isbn', this.newBook.isbn);
      formData.append('Title', this.newBook.Title);
      formData.append('Author', this.newBook.Author);
      if (this.newBook.Description) formData.append('Description', this.newBook.Description);
      formData.append('Genre_id', JSON.stringify(this.newBook.Genre_id));
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      await this.bookService.addBook(formData);
      console.log('Book added successfully');
      this.closeAddModal();
      this.loadBooks();
    } catch (e: any) {
      console.error(e.error?.message || 'Failed to add book');
    }
  }

  toggleGenreSelection(genreId: number) {
    const index = this.newBook.Genre_id.indexOf(genreId);
    if (index > -1) {
      this.newBook.Genre_id.splice(index, 1);
    } else {
      this.newBook.Genre_id.push(genreId);
    }
  }

  editBook(book: any) {
    this.editBookData = {
      Book_id: book.Book_id,
      isbn: book.isbn,
      Title: book.Title,
      Author: book.Author,
      Description: book.discription || '',
      Status: book.Status
    };
    this.selectedFile = null;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedFile = null;
  }

  async submitEditBook() {
    try {
      const formData = new FormData();
      formData.append('isbn', this.editBookData.isbn);
      formData.append('Title', this.editBookData.Title);
      formData.append('Author', this.editBookData.Author);
      if (this.editBookData.Description) formData.append('Description', this.editBookData.Description);
      formData.append('Status', this.editBookData.Status);
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }

      await this.bookService.updateBook(this.editBookData.Book_id, formData);
      console.log('Book updated successfully');
      this.closeEditModal();
      this.loadBooks();
    } catch (e: any) {
      console.error(e.error?.message || 'Failed to update book');
    }
  }

  async deleteBook(id: number) {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await this.bookService.deleteBook(id);
        console.log('Book deleted successfully');
        this.loadBooks();
      } catch (e: any) {
        console.error(e.error?.message || 'Failed to delete book');
      }
    }
  }

  async loadUnreadCount() {
    try {
      const userId = this.authService.getUserId();
      if (!userId) return;
      const notifications = await this.notificationService.getByUser(userId);
      this.unreadCount = notifications.filter((n: any) => !n.is_read).length;
      this.cdr.detectChanges();
    } catch (e) { }
  }
}