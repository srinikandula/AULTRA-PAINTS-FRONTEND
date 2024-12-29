import { Component, OnInit } from '@angular/core';
import { OrderService } from '../order.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbDatepickerModule, NgbDateStruct, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import {ApiUrlsService} from "../services/api-urls.service";
import {ApiRequestService} from "../services/api-request.service";
import {Router} from "@angular/router";
import Swal from "sweetalert2";

@Component({
    selector: 'app-order',
    standalone: true,
    imports: [FormsModule, CommonModule, NgbDatepickerModule, NgbAlertModule, NgSelectModule],
    templateUrl: './order.component.html',
    styleUrls: ['./order.component.css']
})
export class OrderComponent implements OnInit {
    branchName: string = '';
    ProductName: object = {};
    couponSeriesList: string[] = ['Series A', 'Series B', 'Series C']; // Example data
    creationDate = new Date();
    expiryDate = new Date();

    options = [
        { id: 1, label: 'Option 1' },
        { id: 2, label: 'Option 2' },
        { id: 3, label: 'Option 3' }
    ];

    BatchNumbers: any[] = [
        // { BatchNumber: '', Brand: {, ProductName: '', Volume: 0, Quantity: 0 }
        {BatchNumber: 0, Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0},
        // {BatchNumber: '2', Brand: 'SONY', ProductName: 'TV', Volume: 0, Quantity: 0}
    ];

    volumes: number[] = [10, 20, 30, 50, 100];
    branchNames: string[] = ['Central Hub', 'Main Street', 'Pine Valley', 'Lakeview'];
    products: any = [];
    brandData: any = [];

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


    submitForm() {
        const newBranch = {
            Branch: this.branchName,
            ProductName: this.ProductName,
            CreationDate: this.convertToISODate(this.creationDate),
            ExpiryDate: this.convertToISODate(this.expiryDate),
            BatchNumbers: this.BatchNumbers,
        };
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
                        this.resetForm();
                        this.router.navigate(['dashboard/list']);
                        Swal.fire({icon: 'success', title: 'Success', text: 'Batches created successfully.'});
                    },
                    (error: any) => {
                        console.error('Error creating branch:', error);
                    }
                );
            }
        });
    }

    resetForm() {
        this.branchName = '';
        this.ProductName = {};
        this.creationDate = new Date();
        this.expiryDate = new Date();
        this.BatchNumbers = [{BatchNumber: 0, Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0}];
    }

    convertToISODate(date: any) {
        if (!date) return '';
        return `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }

    addProduct() {
        this.BatchNumbers.push({BatchNumber: 0, Brand: {}, redeemablePoints: 0, value: 0, Volume: '', Quantity: 0});
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
        this.router.navigate(['dashboard/list']);
    }

    getBrandes() {
        this.ApiRequest.getAll(this.ApiUrls.getAllBrandsForSelect + this.ProductName).subscribe((response: any) => {
            console.log(response)
            this.brandData = response;
        })
    }
}