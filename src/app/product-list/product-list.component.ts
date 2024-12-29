import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../services/api-request.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2'; 

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  currentProduct: any = { name: '' };

  // Pagination variables
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;
  limit: number = 10;

  constructor(private apiService: ApiRequestService, private modalService: NgbModal) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.apiService.getProducts({ page: this.currentPage, limit: this.limit }).subscribe(
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

  // Open modal for adding a new product
  addProduct(content: any): void {
    this.currentProduct = { name: '' };  
    this.modalService.open(content, { size: 'lg' });
  }

  saveProduct(): void {
    const productExists = this.products.some(product => product.name.toLowerCase() === this.currentProduct.name.toLowerCase());
    
    if (productExists) {
      this.showError('Product with this name already exists!');
      return; 
    }
  
    if (this.currentProduct._id) {
      this.apiService.updateProduct(this.currentProduct._id, this.currentProduct).subscribe(
        (data) => {
          this.loadProducts();
          this.showSuccess('Product updated successfully!');
        },
        (error) => {
          this.showError('Error updating product!');
        }
      );
    } else {
      this.apiService.createProduct(this.currentProduct).subscribe(
        (data) => {
          this.loadProducts();
          this.showSuccess('Product added successfully!');
        },
        (error) => {
          this.showError('Error creating product!');
        }
      );
    }
  }  

  editProduct(product: any, content: any): void {
    this.currentProduct = { ...product };  
    this.modalService.open(content, { size: 'lg' });
  }

  // Delete a product by ID
  deleteProduct(id: string): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, keep it'
    }).then((result) => {
      if (result.isConfirmed) {
        this.apiService.deleteProduct(id).subscribe(
          (data) => {
            this.loadProducts();
            Swal.fire('Deleted!', 'The product has been deleted.', 'success');
          },
          (error) => {
            this.showError('Error deleting product!');
          }
        );
      }
    });
  }

  
   nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts(); 
    }
  }
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();  
    }
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
}
