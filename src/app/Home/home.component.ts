import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterLink]
})
export class HomeComponent implements OnInit {
borrowBook(_t27: any) {
throw new Error('Method not implemented.');
}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  private authService = inject(AuthService);
  
  searchTerm: string = '';
  userName: string = 'USER';
 books = [
    {
      title: 'The Life and Works of Jose Rizal',
      edition: '2nd Edition',
      author: 'Rhodilyn Wars-Olbas, Aaron Abel Mallari',
      status: 'Available'
    },
    {
      title: 'Noli Me Tangere',
      edition: '1st Edition',
      author: 'Jose Rizal',
      status: 'Available'
    },
    {
      title: 'El Filibusterismo',
      edition: '1st Edition',
      author: 'Jose Rizal',
      status: 'Borrowed'
    },
    {
      title: '21 Lessons for the 21st Century',
      edition: '1st Edition',
      author: 'Yuval Noah Harari',
      status: 'Available'
    }
  ];

}