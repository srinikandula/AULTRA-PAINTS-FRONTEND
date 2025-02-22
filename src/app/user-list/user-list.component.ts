import {Component, OnInit, ViewChild} from '@angular/core';
import Swal from 'sweetalert2';
import {NgbModal, NgbPagination} from '@ng-bootstrap/ng-bootstrap';
import {ApiRequestService} from '../services/api-request.service';
import {CommonModule} from '@angular/common';
import {FormsModule, NgForm} from '@angular/forms';
import {Router} from "@angular/router";
import { RouterModule } from '@angular/router';
import {ApiUrlsService} from "../services/api-urls.service";
import {isArray} from "node:util";
import {AuthService} from "../services/auth.service";
import { UnverifiedUsersComponent } from '../unverified-users/unverified-users.component';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, FormsModule, NgbPagination,RouterModule, UnverifiedUsersComponent],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
    @ViewChild('userForm', { static: false }) userForm!: NgForm;

    users: any[] = [];
    loginUser: any = {};
    currentUser: any = {
        name: '',
        mobile: '',
        accountType: 'P'
    };
    // currentUser.accountType = 'Painter';
    page: number = 1;
    limit: number = 10;
    searchQuery: string = '';
    currentPage: number = 1;
    totalPages: number = 1;
    submitted = false; // To track the form submission
    selectedAccountType: string = 'All';

    // Mobile number validation pattern (10 digits)
    mobilePattern = '^[0-9]{10}$';
    limitOptions: number[] = [10, 20, 50, 100];
    userId: any = '';
    currentUserResetPasswordForm: any = {};
    accountTypes: Array<any> = [
        {id: 'Painter', name: 'Painter'},
        {id: 'Contractor', name: 'Contractor'},
        {id: 'Dealer', name: 'Dealer'},
        {id: 'SuperUser', name: 'Super User'},
    ];
    errorsAddUser: string[] = [];  
    errorsEditUser: string[] = []; 
    currentTab: string = 'users'; 

    constructor(private apiService: ApiRequestService, private modalService: NgbModal,
                private router: Router, private apiUrls: ApiUrlsService, private AuthService: AuthService) {
        this.loginUser = this.AuthService.currentUserValue;
    }

    ngOnInit(): void {
        this.loadUsers();
    }

    // Load users
    loadUsers(): void {
        this.page = this.currentPage;
        // Call API with selected account type and search query
        this.apiService.getUsers(this.page, this.limit, this.searchQuery, this.selectedAccountType).subscribe(
          (response) => {
            this.users = response.data;
            this.totalPages = response.pages; // Assuming response returns pages
          },
          (error) => {
            console.error('Error fetching users:', error);
          }
        );
    }
    

     // Switch between 'users' and 'unverified' tabs
     switchTab(tab: string): void {
        this.currentTab = tab;
        if (tab === 'users') {
            this.loadUsers();
        }
    }

    toggleUserStatus(userId: string, currentStatus: string, event: any): void {
        const currentSwitchState = event.target.checked;
        const action = currentSwitchState ? 'active' : 'inactive';
    
        Swal.fire({
            title: `Are you sure you want to mark this user as ${action}?`,
            text: `You are about to mark this user as ${action}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, mark as ${action}`,
            cancelButtonText: 'No, keep it',
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiService.toggleUserStatus(userId, action).subscribe(
                    (response) => {
                        const user = response.user;
                        const userName = user ? user.name : 'User';
                        Swal.fire('Success', `${userName} has been successfully marked as ${action}.`, 'success');
    
                        event.target.checked = action === 'active';
    
                        const updatedUser = this.users.find(u => u._id === userId);
                        if (updatedUser) {
                            updatedUser.status = action;
                        }
                    },
                    (error) => {
                        Swal.fire('Error', 'Failed to toggle user status', 'error');
                        event.target.checked = !currentSwitchState;
                        console.error('Error toggling user status:', error);
                    }
                );
            } else {
                // Refresh users' data when the user clicks "No, keep it"
                this.loadUsers();
            }
        });
    }
    

    addUser(userModal: any): void {
        // Reset the currentUser object to a fresh, empty form state
        this.currentUser = { name: '', mobile: '', password: '', accountType: 'Painter' };
    
        // Clear any previous errors and submitted flag
        this.errorsAddUser = [];
        this.submitted = false; // Reset the submitted flag so the form can show validation errors when it's opened
    
        // Open the modal
        this.modalService.open(userModal, { size: 'md' });
    }

    editUser(user: any, content: any): void {
        this.errorsEditUser = [];
        this.currentUser = {...user};
        this.modalService.open(content, {size: 'md'});
    }

    submitForm(modal: any): void {
        this.submitted = true; // Mark the form as submitted
        
        // Check if the form is valid
        if (this.userForm.valid) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to save this user?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, save it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Proceed with the user addition
                    this.apiService.addUser(this.currentUser).subscribe(
                        (data) => {
                            this.loadUsers();
                            this.showSuccess('User added successfully!');
                            this.currentUser = {}; 
                            this.errorsAddUser = [];
                            modal.close();
                        },
                        (error) => {
                            if (error?.errors && error.errors.length > 0) {
                                this.errorsAddUser = error.errors;
                            } else {
                                this.showError('Error adding user!');
                            }
                        }
                    );
                }
            });
        } 
    }

    updateUser(modal: any, userForm: any): void {
        this.submitted = true; // Mark the form as submitted
        
        // Check if the form is valid
        if (userForm.valid) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to save these changes?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, save it!',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Proceed with updating the user
                    this.apiService.updateUser(this.currentUser._id, this.currentUser).subscribe(
                        (data) => {
                            this.loadUsers();
                            this.showSuccess('User updated successfully!');
                            this.errorsEditUser = [];
                            modal.close(); 
    
                            // Optional: If the logged-in user updates their own account type
                            if (this.loginUser.id === this.currentUser._id) {
                                let timerInterval: any;
                                let countdown = 5;
                                Swal.fire({
                                    title: 'Success',
                                    html: `Your account type has changed. You will be logged out in <b>${countdown}</b> seconds.`,
                                    icon: 'success',
                                    timer: countdown * 1000,
                                    timerProgressBar: true,
                                    showConfirmButton: false,
                                    didOpen: () => {
                                        // Update countdown every second
                                        timerInterval = setInterval(() => {
                                            countdown--;
                                            const bElement = Swal.getHtmlContainer()?.querySelector('b');
                                            if (bElement) {
                                                bElement.textContent = countdown.toString();
                                            }
                                        }, 1000);
                                    },
                                    willClose: () => {
                                        clearInterval(timerInterval);
                                    },
                                }).then(() => {
                                    // Log the user out after successful update and refresh the page
                                    this.currentUser = {};
                                    this.AuthService.logOut();
                                    window.location.reload();
                                    this.router.navigate(['/login']);
                                });
                            }
                        },
                        (error) => {
                            if (error?.errors && error.errors.length > 0) {
                                this.errorsEditUser = error.errors;
                            } else {
                                this.showError('Error updating user!');
                            }
                        }
                    );
                }
            });
        } 
    }    


    deleteUser(id: string): void {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, keep it'
        }).then((result) => {
            if (result.isConfirmed) {
                this.apiService.deleteUser(id).subscribe(
                    (data) => {
                        this.loadUsers();
                        Swal.fire('Deleted!', 'The user has been deleted.', 'success');
                    },
                    (error) => {
                        this.showError('Error deleting user!');
                    }
                );
            }
        });
    }

    showSuccess(message: string): void {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
        });
    }

    showError(message: string): void {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
        });
    }

    showRedeemedPoints(_id: any) {
        this.router.navigate(['/transactions'], {queryParams: {userId: _id}});
    }

    handlePageChange($event: number) {
        this.currentPage = $event;
        this.loadUsers();
    }

    handleLimitChange() {
        this.currentPage = 1;
        this.loadUsers();
    }

    resetPasswordModalOpen(user: any, content: any): void {
        this.userId = user._id;
        this.modalService.open(content, {size: 'sm'});
    }

    resetPassword(modal: any, form: any): void {
        console.log(form.value.newPassword, form.value.confirmNewPassword)
        if (form.invalid) {
            this.showError('Please fill in all the required fields correctly.');
            return;
        }

        const payload = {
            _id: this.userId,
            password: form.value.newPassword,
            confirmPassword: form.value.confirmNewPassword
        };

        this.apiService.post(this.apiUrls.resetPassword, payload).subscribe((data: any) => {
                this.showSuccess('Password reset successfully!');
                modal.close();
            }, (error: any) => {
                if (error.error && error.error[0] === 'Password and Confirm Password do not match') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Password and Confirm Password do not match',
                        text: 'Please fill in the correct password and confirm password.',
                    });
                } else {
                    this.showError('Error resetting password!');
                }
            }
        );
    }


}
