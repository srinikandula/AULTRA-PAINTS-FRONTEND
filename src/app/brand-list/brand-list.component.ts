import { Component } from '@angular/core';
import { ApiRequestService } from '../services/api-request.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './brand-list.component.html',
  styleUrls: ['./brand-list.component.css']
})
export class BrandListComponent {
  brands: any[] = [];
  products: any[] = [];
  searchQuery: string = '';
  currentBrand: any = { proId: '', brands: '' };
  errorMessage: string = '';
  isSearching: boolean = false;

  // Pagination variables
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;
  limit: number = 10;
  totalBrands:number = 0;

  constructor(
    private apiRequestService: ApiRequestService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    this.loadBrands();
    this.loadProducts();
  }

  loadBrands(): void {
    const data = { page: this.currentPage, limit: this.limit };
    this.apiRequestService.getAllBrands(data).subscribe({
      next: (response: any) => {
        this.brands = response.brands;
        this.totalBrands = response.pagination.totalBrands;
        this.totalPages = response.pagination.totalPages;
      },
      error: (error) => {
        this.showError('Error fetching brands!');
      }
    });
  }


  loadProducts(): void {
    this.apiRequestService.getProducts({ page: this.currentPage, limit: this.limit }).subscribe(
      (data) => {
        this.products = data.products;  
        this.totalPages = data.pagination.totalPages;  
        this.totalProducts = data.pagination.totalProducts; 
      },
      (error) => {
        this.showError('Error fetching products!');
      }
    );
  }

  // Search brands based on query
  searchBrands(): void {
    if (this.searchQuery.trim() === '') {
      this.loadBrands();  // Load all brands if the search query is empty
      return;
    }

    // Start searching for brands
    this.isSearching = true;
    this.apiRequestService.searchBrandsByName(this.searchQuery, this.currentPage, this.limit).subscribe({
      next: (response: any) => {
        if (response && response.data && response.data.length > 0) {
          this.brands = response.data;  // Brands found based on the search query
          this.totalBrands = response.total;
          this.totalPages = response.pages;
        } else {
          this.brands = [];  // No brands found
        }
      },
      error: (error) => {
        console.error('Error searching brands:', error);
        this.brands = [];
      }
    });
  }
  

  // Add brand: Open the modal
  addBrand(brandModal: any): void {
    this.currentBrand = { proId: '', brands: '' };  
    this.modalService.open(brandModal);  
  }

  // Edit brand: Open the modal with current brand data
  editBrand(brand: any, brandModal: any): void {
    this.currentBrand = { ...brand }; 
    this.modalService.open(brandModal);  
  }


  brandExists(productId: string, brandName: string): boolean {
    return this.brands.some(brand => brand.proId === productId && brand.brands.toLowerCase() === brandName.toLowerCase());
  }

  saveBrand(brandModal: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to save this brand?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it!',
      cancelButtonText: 'No, cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.modalService.dismissAll();
  
        // Check if it's an existing brand (edit case)
        if (!this.currentBrand._id) {
          if (this.brandExists(this.currentBrand.proId, this.currentBrand.brands)) {
            this.showError('Brand already exists for this product!');
            return;  
          }
        }
  
        // Determine the success and error messages based on whether it's an update or a new brand
        const successMessage = this.currentBrand._id ? 'Brand updated successfully!' : 'Brand added successfully!';
        const errorMessage = this.currentBrand._id ? 'Error updating brand!' : 'Error creating brand!';

        const saveRequest = this.currentBrand._id
          ? this.apiRequestService.updateBrand(this.currentBrand._id, this.currentBrand)
          : this.apiRequestService.createBrand(this.currentBrand);
  
        // Call the API to create or update the brand
        saveRequest.subscribe({
          next: () => {
            this.loadBrands();
            this.showSuccess(successMessage);
          },
          error: () => {
            this.showError(errorMessage);
          }
        });
  
        this.currentBrand = { proId: '', brands: '' };
      }
    });
  }
  
  

  // Delete brand
  deleteBrand(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiRequestService.deleteBrand(id).subscribe(() => {
          this.loadBrands();
          Swal.fire('Deleted!', 'Your brand has been deleted.', 'success');
        }, (error) => {
          this.showError('Error deleting brand!');
        });
      }
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadBrands(); 
    }
  }
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadBrands();  
    }
  }

  // Show success alert
  showSuccess(message: string): Promise<any> {
    return Swal.fire({
      icon: 'success',
      title: 'Success',
      text: message,
    });
  }

 
  showError(message: string): Promise<any> {
    return Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
    });
  }
}