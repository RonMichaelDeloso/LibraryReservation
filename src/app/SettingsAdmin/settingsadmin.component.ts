import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settingsadmin.component.html',
  styleUrls: ['./settingsadmin.component.scss'],
  imports: [RouterLink]
})

export class SettingsadminComponent {

  userName: string = 'Ron Michael Deloso';
  userEmail: string = 'Ron.MichaelDeloso@gmail.com';

  changePassword() {
    console.log('Change password feature coming soon.');
  }

  saveChanges() {
    console.log('Your changes have been saved.');
  }

}