import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:3000/api/auth'; 

  public async register(data: {
    First_name: string;
    Last_name: string;
    Email: string;
    Password: string;
  }) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/register`, data)
    );
  }

  public async login(data: {
    Email: string;
    Password: string;
  }) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/login`, data)
    )
  }

  // Forgot Password - Step 1: Verify email exists
  public async verifyEmail(email: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/verify-email`, { Email: email })
    );
  }

  // Forgot Password - Step 2: Reset password directly (no OTP)
  public async resetPasswordDirect(email: string, newPassword: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/reset-direct`, {
        Email: email,
        NewPassword: newPassword
      })
    );
  }

  public saveSession(response: any) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', response.token);
      localStorage.setItem('role', response.role);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('user_id', response.user.id.toString());
    }
    console.log('Session saved - Role:', response.role);
    console.log('Session saved - User:', response.user);
  }

  public getUser() {
    if (typeof localStorage !== 'undefined') {
      return JSON.parse(localStorage.getItem('user') || '{}');
    }
    return {};
  }

  public getUserId(): number {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('user_id') || '0');
    }
    return 0;
  }

  public getRole(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }

  public isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  public isLoggedIn(): boolean {
    if (typeof localStorage !== 'undefined') {
      return !!localStorage.getItem('token');
    }
    return false;
  }

  public logout() {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }
}