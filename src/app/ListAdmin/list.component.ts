import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-book',
  standalone: true,
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
  imports: [RouterLink]
})
export class ListComponent {

  notificationVisible: boolean = true;

  removeNotification() {
    this.notificationVisible = false;
  }

}