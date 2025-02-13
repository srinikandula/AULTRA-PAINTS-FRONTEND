import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbDateStruct, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import {ApiUrlsService} from "../services/api-urls.service";
import {ApiRequestService} from "../services/api-request.service";
import {Router} from "@angular/router";
import Swal from "sweetalert2";

@Component({
  selector: 'app-create-batch',
  standalone: true,
  imports: [FormsModule, CommonModule,NgbDatepickerModule, NgbAlertModule, NgSelectModule,],
  templateUrl: './create-batch.component.html',
  styleUrl: './create-batch.component.css'
})
export class CreateBatchComponent {
    branchName: string = '';
        ProductName: object = {};
    BatchNumber: string = '';
    couponSeriesList: string[] = ['Series A', 'Series B', 'Series C']; // Example data
    creationDate: NgbDateStruct = this.getTodayDate();  // Default value set to today's date
    expiryDate: NgbDateStruct = this.getExpiryDate();   

    BatchNumbers: any[] = [
        // { BatchNumber: '', Brand: {, ProductName: '', Volume: 0, Quantity: 0 }
        {CouponSeries :'', Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0},
        // {BatchNumber: '2', Brand: 'SONY', ProductName: 'TV', Volume: 0, Quantity: 0}
    ];

    volumes: string[] = ['10 LT', '20 LT', '30 LT', '50 LT', '100 LT'];
    branchNames: string[] = ['Dachepally', 'HayatNagar','Kukatpally', 'Pashamylaram', 'Vizag'];
    products: any = [];
    brandData: any = [];
    errorEmptyStr: any = '';


    constructor(private ApiUrls: ApiUrlsService, private ApiRequest: ApiRequestService, private router: Router,) {
    }

    ngOnInit() {
        this.ApiRequest.getCouponSeries(this.ApiUrls.couponSeries).subscribe(
            (data: any[]) => {
                this.couponSeriesList = data.map(series => series.name); // Assuming API returns an array of objects with a 'name' field
            },
            (error: any) => {
                console.error('Error fetching coupon series:', error);
                this.couponSeriesList = [];
            }
        );

        this.ApiRequest.getAll(this.ApiUrls.getAllProducts).subscribe((response: any) => {
            this.products = response;
        })
    }
    getTodayDate(): NgbDateStruct {
        const today = new Date();
        return {
          year: today.getFullYear(),
          month: today.getMonth() + 1, 
          day: today.getDate()
        };
      }
    
      getExpiryDate(): NgbDateStruct {
        const expiry = new Date();
        return {
          year: expiry.getFullYear(),
          month: expiry.getMonth() + 1,
          day: expiry.getDate()
        };
      }
      submitForm() {
        const newBranch = {
            Branch: this.branchName,
            ProductName: this.ProductName,
            CreationDate: this.convertToISODate(this.creationDate),
            ExpiryDate: this.convertToISODate(this.expiryDate),
            BatchNumbers: this.BatchNumbers,
            BatchNumber: this.BatchNumber
        };
    
        // Initialize the error message variable
        let errorMessage = '';
    
        // Check if ProductName is an object and has a name property that is a non-empty string
        if (typeof newBranch.ProductName === 'object' && newBranch.ProductName !== null) {
            const productNameValue = (newBranch.ProductName as any).name;
            if (!productNameValue || productNameValue.trim() === '') {
                errorMessage += 'Product Name is required. ';
            }
        }
    
        // Check if Branch is provided
        if (!newBranch.Branch || newBranch.Branch.trim() === '') {
            errorMessage += 'Branch is required. ';
        }
    
        // Check if BatchNumber is provided
        if (!newBranch.BatchNumber || newBranch.BatchNumber.trim() === '') {
            errorMessage += 'Batch Number is required. ';
        }
    
        // Check if CreationDate is provided
        if (!newBranch.CreationDate || newBranch.CreationDate.trim() === '') {
            errorMessage += 'Creation Date is required. ';
        }
    
        // Check if ExpiryDate is provided
        if (!newBranch.ExpiryDate || newBranch.ExpiryDate.trim() === '') {
            errorMessage += 'Expiry Date is required. ';
        }
    
        const lastBatch = newBranch.BatchNumbers[this.BatchNumbers.length - 1];
    
        // Check if Batch's Brand is missing
        if (Object.keys(lastBatch.Brand).length === 0) {
            errorMessage += 'Brand is required. ';
        }
    
        // Check if redeemablePoints is valid (non-zero)
        if (!lastBatch.redeemablePoints || lastBatch.redeemablePoints === 0) {
            errorMessage += 'Redeemable Points cannot be zero. ';
        }
    
        // Check if value is valid (non-zero)
        if (!lastBatch.value || lastBatch.value === 0) {
            errorMessage += 'Value cannot be zero. ';
        }
    
        // Check if Volume is valid (non-zero)
        if (!lastBatch.Volume || lastBatch.Volume === 0) {
            errorMessage += 'Volume cannot be zero. ';
        }
    
        // Check if Quantity is valid (non-zero)
        if (!lastBatch.Quantity || lastBatch.Quantity === 0) {
            errorMessage += 'Quantity cannot be zero. ';
        }
    
        // Check if CouponSeries is valid (non-zero)
        if (!lastBatch.CouponSeries || lastBatch.CouponSeries === 0) {
            errorMessage += 'Coupon Series is required. ';
        }
        
        // If there is any error message, show it and stop the submission
        if (errorMessage) {
            this.errorEmptyStr = errorMessage;
            return;
        }
    
        // Proceed with confirmation and API request if no errors
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to save this Batch?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, save it!',
            cancelButtonText: 'No, cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.ApiRequest.create(this.ApiUrls.createBatch, newBranch).subscribe(
                    (response: any) => {
                        console.log('Branch created successfully:', response.message);
                        this.errorEmptyStr = '';
                        this.resetForm();
                        this.router.navigate(['/batch-list']);
                        Swal.fire({ icon: 'success', title: 'Success', text: 'Batches created successfully.' });
                    },
                    (error: any) => {
                        console.error('Error creating branch:', error);
                        const errorMessage = error && error.error ? error.error : 'An error occurred while creating the batch.';
                
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: errorMessage,  
                        });
                
                        this.errorEmptyStr = error.message;
                    }
                );                
            }
        });
    }
      

    resetForm() {
        this.branchName = '';
        this.ProductName = {};
        this.BatchNumber = '';
        this.creationDate = this.getTodayDate();  // Reset to today's date
        this.expiryDate = this.getExpiryDate();   // Reset to 30 days after today
        this.BatchNumbers = [{Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0, CouponSeries: 0}];
    }

    convertToISODate(date: any) {
        if (!date) return '';
        return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }

    addProduct() {
        // Check if all required fields are filled before pushing a new BatchNumber object
        const lastBatch = this.BatchNumbers[this.BatchNumbers.length - 1];
        if (Object.keys(lastBatch.Brand).length === 0 || !lastBatch.redeemablePoints || !lastBatch.value || !lastBatch.Volume || !lastBatch.Quantity || !lastBatch.CouponSeries) {
            this.errorEmptyStr = 'Please fill all fields for the current batch before adding a new one.';
            return;
        }
        this.BatchNumbers.push({ CouponSeries: 0, Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0 });
    }

    // Delete a product from the products array
    deleteProduct(index: number): void {
        if (this.BatchNumbers.length > 1) {
            this.BatchNumbers.splice(index, 1);
        } else {
            alert('At least one product is required.');
        }
    }

    cancel(): void {
        this.router.navigate(['/batch-list']);
    }

    getBrandes() {
        this.ApiRequest.getAll(this.ApiUrls.getAllBrandsForSelect + this.ProductName).subscribe((response: any) => {
            this.brandData = response;
        })
    }
}


