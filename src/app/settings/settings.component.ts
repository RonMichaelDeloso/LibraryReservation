import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, Router } from "@angular/router";
import { CommonModule } from '@angular/common';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  imports: [RouterLink, CommonModule]
})

export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  topbarName: string = 'User1';
  userName: string = 'Ron Michael Deloso';
  userEmail: string = 'Ron.MichelDeloso@gmail.com';
  showDropdown: boolean = false;

  ngOnInit() {
    const user = this.authService.getUser();
    if (user && user.First_name) {
      this.topbarName = user.First_name;
      this.userName = user.Last_name ? `${user.First_name} ${user.Last_name}` : user.First_name;
    }
    if (user && user.Email) {
      this.userEmail = user.Email;
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }

  changePassword() {
    alert('Change password feature coming soon.');
  }

  saveChanges() {
    alert('Your changes have been saved.');
  }

}