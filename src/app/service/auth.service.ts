import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth'; 

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

  public saveSession(response: any) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('role', response.role);
    localStorage.setItem('user', JSON.stringify(response.user)); // Changed 'User' to 'user' (lowercase)
    localStorage.setItem('user_id', response.user.id.toString()); // Added for easy access
    console.log('Session saved - Role:', response.role);
    console.log('Session saved - User:', response.user);
  }

  public getUser() {
    return JSON.parse(localStorage.getItem('user') || '{}'); // Now matches 'user'
  }

  public getUserId(): number {
    return parseInt(localStorage.getItem('user_id') || '0');
  }

  public getRole(): string | null {
    return localStorage.getItem('role');
  }

  public isAdmin(): boolean {
    return this.getRole() === 'Admin';
  }

  public isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  public logout() {
    localStorage.clear();
  }
}