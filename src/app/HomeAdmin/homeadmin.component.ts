import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-home',
  templateUrl: './homeadmin.component.html',
  styleUrls: ['./homeadmin.component.scss'],
  imports: [RouterLink]
})
export class HomeAdminComponent {

  books = [
    {title: 'Book 1'},
    {title: 'Book 2'},
    {title: 'Book 3'},
    {title: 'Book 4'}
  ];

}