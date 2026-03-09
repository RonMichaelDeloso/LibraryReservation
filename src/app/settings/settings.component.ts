import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [RouterLink]
})

export class SettingsComponent {

  userName: string = 'Ron Michael Deloso';
  userEmail: string = 'Ron.MichaelDeloso@gmail.com';

  changePassword() {
    alert('Change password feature coming soon.');
  }

  saveChanges() {
    alert('Your changes have been saved.');
  }

}