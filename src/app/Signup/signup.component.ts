import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  signupForm: FormGroup = this.fb.group({
    First_name: ['', [Validators.required, Validators.minLength(2)]],
    Last_name: ['', [Validators.required, Validators.minLength(2)]],
    Email: ['', [Validators.required, Validators.email]],
    Password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;
  showPassword: boolean = false;
  showConfirm: boolean = false;

  // Getters for error display
  get First_name() { return this.signupForm.get('First_name'); }
  get Last_name() { return this.signupForm.get('Last_name'); }
  get Email() { return this.signupForm.get('Email'); }
  get Password() { return this.signupForm.get('Password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('Password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    
    if (password !== confirm) {
      group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  async onSubmit() {
    if (this.signupForm.invalid) {
      this.message = "Please fix the errors in the form.";
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.message = '';
    

    const { confirmPassword, ...signupData } = this.signupForm.value;
    console.log('Sending data:', signupData);

    try {
      const response = await this.authService.register(signupData);
      this.message = response.message || 'Account created successfully!';
      this.messageType = 'success';
      this.signupForm.reset();
      
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      }, 2000);
      
    } catch (error: any) {
      this.isLoading = false;
      this.message = error.error?.message || 'Server error. Please try again.';
      this.messageType = 'error';
    }
  }
}
