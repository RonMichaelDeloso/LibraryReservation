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

  public async verifyEmail(email: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/verify-email`, { Email: email })
    );
  }

  public async resetPasswordDirect(email: string, newPassword: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/reset-direct`, {
        Email: email,
        NewPassword: newPassword
      })
    );
  }

  // Forgot Password - Step 1: Request OTP
  public async requestOTP(email: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/request-otp`, { Email: email })
    );
  }

  // Forgot Password - Step 2: Reset with OTP
  public async resetPasswordWithOTP(email: string, otp: string, newPassword: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/reset-password-otp`, {
        Email: email,
        OTP_code: otp,
        NewPassword: newPassword
      })
    );
  }


  // Update User Profile
  public async updateProfile(payload: FormData) {
    const res = await lastValueFrom(
      this.http.put<any>(`${this.apiUrl}/update-profile`, payload)
    );
    console.log('Update Profile Response:', res);
    
    if (typeof localStorage !== 'undefined' && res.user) {
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  }

  public getImageUrl(path: string | null, name: string = 'User'): string {
    if (!path || path === 'null') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=512`; 
    }
    return `http://127.0.0.1:3000/${path}`;
  }

  // Send Admin Invite (sends notification to student)
  public async sendAdminInvite(email: string) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/invite-admin`, { Email: email })
    );
  }

  public async acceptAdminInvite(notificationId: number, userId: number) {
    return lastValueFrom(
      this.http.post<any>(`${this.apiUrl}/accept-invite`, { Notification_id: notificationId, User_id: userId })
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

  public async getTotalUsers() {
    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/total-users`)
    );
  }
}