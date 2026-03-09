import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  books = [
    {title: 'Book 1'},
    {title: 'Book 2'},
    {title: 'Book 3'},
    {title: 'Book 4'}
  ];

}