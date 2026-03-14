import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-book',
  standalone: true,
  templateUrl: './book.component.html',
  styleUrl: './book.component.scss',
  imports: [RouterLink]
})
export class BookComponent {

  notificationVisible: boolean = true;

  removeNotification() {
    this.notificationVisible = false;
  }

}