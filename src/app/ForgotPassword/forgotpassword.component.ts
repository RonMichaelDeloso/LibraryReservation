import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from 'express';

@Component({
  selector: 'app-forgotpassword',
  standalone: true,
  imports:[CommonModule, ReactiveFormsModule, RouterLink],
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

  

  }
