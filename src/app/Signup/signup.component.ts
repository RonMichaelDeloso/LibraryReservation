import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  signupForm: FormGroup;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      studentId: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('confirmPassword')?.value;

    if (password !== confirm) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  get username() { return this.signupForm.get('username'); }
  get email() { return this.signupForm.get('email'); }
  get studentId() { return this.signupForm.get('studentId'); }
  get password() { return this.signupForm.get('password'); }
  get confirmPassword() { return this.signupForm.get('confirmPassword'); }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.message = "Please fix the errors in the form.";
      this.messageType = 'error';
      return;
    }

    this.isLoading = true;
    this.message = '';
    const signupData = { ...this.signupForm.value };
    delete signupData.confirmPassword;
    
    this.http.post('http://localhost:3000/api/signup', signupData)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.message = res.message || "Account created successfully!";
          this.messageType = 'success';
          this.signupForm.reset();
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },

        error: (err) => {
          this.isLoading = false;
          console.error('Signup error', err);
          this.message = err.error?.message || 'Server error. Please try again.';
          this.messageType = 'error';
        }
      });
  }
}
