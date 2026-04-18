import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  step: number = 1; // 1: Request Email, 2: Enter OTP & New Password
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirm: boolean = false;

  // Form for Step 1
  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Form for Step 2
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

  async onRequestOTP() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    try {
      const { email } = this.emailForm.value;
      await this.authService.requestOTP(email);
      this.message = 'OTP sent to your email! Please check your inbox.';
      this.messageType = 'success';
      this.step = 2;
    } catch (error: any) {
      console.error("Forgot pass error:", error);
      this.message = '';
      if (error?.status === 404) {
        this.emailForm.get('email')?.setErrors({ serverError: "Email not found." });
      } else if (error?.error?.message) {
        this.message = error.error.message;
      } else {
        this.message = 'Failed to send OTP. Please try again.';
      }
      this.messageType = 'error';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onResetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.message = '';

    const { email } = this.emailForm.value;
    const { otp, newPassword } = this.resetForm.value;

    try {
      await this.authService.resetPasswordWithOTP(email, otp, newPassword);
      this.message = 'Password reset successfully! Redirecting to login...';
      this.messageType = 'success';

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error: any) {
      console.error("Reset pass error:", error);
      this.message = '';
      if (error?.status === 400) {
        this.resetForm.get('otp')?.setErrors({ serverError: "Invalid or expired OTP." });
      } else if (error?.error?.message) {
        this.message = error.error.message;
      } else {
        this.message = 'Error resetting password. Try again.';
      }
      this.messageType = 'error';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}