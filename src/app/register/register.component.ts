import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {ApiRequestService} from "../services/api-request.service";
import {ApiUrlsService} from "../services/api-urls.service";
import Swal from 'sweetalert2';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name: string = '';
  email: string = '';
  mobile: string = '';
  password: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private authService: AuthService, private apiService: ApiRequestService, private ApiUrls: ApiUrlsService) {}

  register() {
    this.apiService.create(this.ApiUrls.register, { name: this.name, mobile: this.mobile, email: this.email, password: this.password }).subscribe({
      next: (response) => {
        console.log('Registration successful:', response.message);
        this.successMessage = 'Registration successful! You can now log in.';
        this.errorMessage = ''; 
        
        // SweetAlert for success
        Swal.fire({
          title: 'Success!',
          text: response.message || 'Registration successful! You can now log in.',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        console.error('Registration error:', error);
        if (error.status === 400) {
          this.errorMessage = error.error.message || 'User already exists';
        } else {
          this.errorMessage = 'An error occurred, please try again';
        }
        this.successMessage = ''; 
  
        // SweetAlert for error
        Swal.fire({
          title: 'Error!',
          text: this.errorMessage || 'An error occurred. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }
}  