import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { BookService } from '../service/book.service';

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
  private cdr = inject(ChangeDetectorRef);
  
  searchTerm: string = '';
  adminName: string = 'ADMIN';

  books: any[] = [];
  genres: any[] = [];
  private refreshInterval: any;
  selectedFile: File | null = null;

  isAddModalOpen = false;
  isEditModalOpen = false;

  newBook = {
    isbn: '',
    Title: '',
    Author: '',
    Genre_id: [] as number[]
  };

  editBookData = {
    Book_id: 0,
    isbn: '',
    Title: '',
    Author: '',
    Status: ''
  };

  async ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.First_name || 'ADMIN';
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
    } catch (e) {
      console.error('Failed to load genres:', e);
    }
  }

  get filteredBooks() {
    if (!this.searchTerm) return this.books;
    return this.books.filter(book =>
      book.Title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      book.Author?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  openAddBookModal() {
    this.newBook = {
      isbn: '',
      Title: '',
      Author: '',
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
      formData.append('Genre_id', JSON.stringify(this.newBook.Genre_id));
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }
      
      await this.bookService.addBook(formData);
      alert('Book added successfully');
      this.closeAddModal();
      this.loadBooks();
    } catch(e: any) {
      alert(e.error?.message || 'Failed to add book');
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
      formData.append('Status', this.editBookData.Status);
      if (this.selectedFile) {
        formData.append('image', this.selectedFile);
      }
      
      await this.bookService.updateBook(this.editBookData.Book_id, formData);
      alert('Book updated successfully');
      this.closeEditModal();
      this.loadBooks();
    } catch(e: any) {
      alert(e.error?.message || 'Failed to update book');
    }
  }

  async deleteBook(id: number) {
    if (confirm('Are you sure you want to delete this book?')) {
      try {
        await this.bookService.deleteBook(id);
        alert('Book deleted successfully');
        this.loadBooks();
      } catch (e: any) {
        alert(e.error?.message || 'Failed to delete book');
      }
    }
  }
}