import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    Email: ['', [Validators.required, Validators.email]], 
    Password: ['', Validators.required] 
  });

  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;
  showPassword: boolean = false;

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    try {
      const response = await this.authService.login(this.loginForm.value);
      
      this.authService.saveSession(response);
      
      this.message = response.message || 'Login successful!';
      this.messageType = 'success';
      
      setTimeout(() => {
        if (response.role === 'Admin') {
        this.router.navigate(['/adhome']); // Admin goes to admin home
      } else {
        this.router.navigate(['/home']); // Student goes to user home
      }
      }, 2000);
      
    } catch (error: any) {
      this.isLoading = false;
      console.error("Login catch error: ", error);
      
      this.message = ''; // clear global message by default

      if (error?.status === 401) {
        this.loginForm.get('Password')?.setErrors({ serverError: "Incorrect password." });
      } else if (error?.status === 404) {
        this.loginForm.get('Email')?.setErrors({ serverError: "Email not found." });
      } else if (error?.error?.message) {
        this.message = error.error.message;
      } else {
        this.message = 'Login failed. Please try again.';
      }
      this.messageType = 'error';
      this.cdr.detectChanges();
    }
  }
}