import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-forgotpassword',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgotpassword.component.html',
  styleUrls: ['./forgotpassword.component.scss']
})
export class ForgotpasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  step: number = 1;
  email: string = '';
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirm: boolean = false;
  resendTimer: number = 0;
  private timerInterval: any; // Add this to store interval reference

  // Step 1: Email form
  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Step 2: OTP and Password form
  resetForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordMismatch: true };
  }

  async onSendOTP() {
    if (this.forgotForm.invalid) {
      this.message = "Please enter a valid email.";
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.message = '';
    this.email = this.forgotForm.value.email;

    try {
      const response = await this.authService.forgotPassword(this.email);
      this.message = response.message || 'OTP sent to your email.';
      this.messageType = 'success';
      this.step = 2;
      this.startResendTimer();
    } catch (error: any) {
      this.message = error.error?.message || 'Email not found. Please try again.';
      this.messageType = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  async onResetPassword() {
    if (this.resetForm.invalid) {
      this.message = "Please fill all fields correctly.";
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.message = '';

    try {
      const response = await this.authService.resetPassword(
        this.email,
        this.resetForm.value.otp,
        this.resetForm.value.newPassword
      );
      
      this.message = response.message || 'Password reset successfully!';
      this.messageType = 'success';
      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
      
    } catch (error: any) {
      this.message = error.error?.message || 'Invalid or expired OTP. Please try again.';
      this.messageType = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  async onResendOTP() {
    if (this.resendTimer > 0) return;
    
    this.isLoading = true;
    
    try {
      const response = await this.authService.resendOTP(this.email);
      this.message = 'New OTP sent to your email.';
      this.messageType = 'success';
      this.startResendTimer();
    } catch (error: any) {
      this.message = error.error?.message || 'Failed to resend OTP.';
      this.messageType = 'error';
    } finally {
      this.isLoading = false;
    }
  }

  startResendTimer() {
    this.resendTimer = 60;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerInterval = setInterval(() => {
      if (this.resendTimer > 0) {
        this.resendTimer--;
      }
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  goBack() {
    this.step = 1;
    this.message = '';
    this.resetForm.reset();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.resendTimer = 0;
  }
}