import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-homeadmin',
  standalone: true,
  templateUrl: './homeadmin.component.html',
  styleUrls: ['./homeadmin.component.scss'],
  imports: [RouterLink, CommonModule, FormsModule]
})
export class HomeAdminComponent implements OnInit {
  private authService = inject(AuthService);
  
  searchTerm: string = '';
  adminName: string = 'ADMIN';

  books = [
    {
      id: 1,
      title: 'The Life and Works of Jose Rizal',
      edition: '2nd Edition',
      author: 'Rhodilyn Wars-Olbas, Aaron Abel Mallari',
      status: 'Available'
    },
    {
      id: 2,
      title: 'Noli Me Tangere',
      edition: '1st Edition',
      author: 'Jose Rizal',
      status: 'Available'
    },
    {
      id: 3,
      title: 'El Filibusterismo',
      edition: '1st Edition',
      author: 'Jose Rizal',
      status: 'Available'
    },
    {
      id: 4,
      title: '21 Lessons for the 21st Century',
      edition: '1st Edition',
      author: 'Yuval Noah Harari',
      status: 'Available'
    }
  ];

  ngOnInit() {
    const user = this.authService.getUser();
    this.adminName = user?.First_name || 'ADMIN';
  }

  get filteredBooks() {
    if (!this.searchTerm) return this.books;
    return this.books.filter(book =>
      book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  editBook(book: any) {
    console.log('Edit:', book);
    alert(`Edit book: ${book.title}`);
  }

  deleteBook(id: number) {
    if (confirm('Are you sure you want to delete this book?')) {
      this.books = this.books.filter(b => b.id !== id);
      alert('Book deleted successfully');
    }
  }

  openAddBookModal() {
    alert('Open Add Book Modal');
  }
}