import { Injectable } from '@angular/core';
import {HttpClient, HttpParams, HttpRequest} from "@angular/common/http";
import {ApiUrlsService} from "./api-urls.service";
import {map, Observable} from "rxjs";
import {Branch} from "../order.service";

@Injectable({
  providedIn: 'root'
})
export class ApiRequestService {

  constructor(private http: HttpClient, private ApiUrls: ApiUrlsService) { }

  create(subUrl: any, data: any) {
    return this.http.post(this.ApiUrls.mainUrl + subUrl, data).pipe(map((res: any) => {
      return res;
    }));
  }

  get(subUrl: any, data:any) {
      const params = new HttpParams()
          .set('page', data.page.toString())
          .set('limit', data.limit.toString());
    return this.http.get(this.ApiUrls.mainUrl + subUrl, { params }).pipe(map((res: any) => {
      return res;
    }));
  }

  searchBranch(subUrl: any, batchNumber: any) {
    return this.http.get<any>(this.ApiUrls.mainUrl+ subUrl + '/' +batchNumber).pipe(map((res: any) => {
      return res;
    }));
  }

  getCouponSeries(subUrl: any) {
    return this.http.get<any>(this.ApiUrls.mainUrl + subUrl).pipe(map((res: any) => {
      return res;
    }));
  }




  // Create a new product
  createProduct(data: any) {
    return this.http.post(this.ApiUrls.mainUrl + this.ApiUrls.createProduct, data).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

   // Get all products with pagination
   getProducts(data: any): Observable<any> {
    const params = new HttpParams()
      .set('page', data.page.toString())
      .set('limit', data.limit.toString());

    return this.http.get<any>(this.ApiUrls.mainUrl + this.ApiUrls.getProducts, { params });
  }

  // Get a product by its ID
  getProductById(id: string) {
    return this.http.get(this.ApiUrls.mainUrl + this.ApiUrls.getProductById + '/' + id).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // Update a product by its ID
  updateProduct(id: string, data: any) {
    return this.http.put(this.ApiUrls.mainUrl + this.ApiUrls.updateProduct + '/' + id, data).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // Delete a product by its ID
  deleteProduct(id: string) {
    return this.http.delete(this.ApiUrls.mainUrl + this.ApiUrls.deleteProduct + '/' + id).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

   // Create a new brand
   createBrand(data: any) {
    return this.http.post(this.ApiUrls.mainUrl + this.ApiUrls.createBrand, data).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  getAllBrands(data: any): Observable<any> {
    const params = new HttpParams()
      .set('page', data.page.toString())
      .set('limit', data.limit.toString());

    return this.http.get(this.ApiUrls.mainUrl + this.ApiUrls.getBrands, { params });
  }

  // Get brands by Product ID
  getBrandsByProductId(proId: string) {
    return this.http.get(this.ApiUrls.mainUrl + this.ApiUrls.getBrandsByProductId + '/' + proId).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // Update a brand
  updateBrand(id: string, data: any) {
    return this.http.put(this.ApiUrls.mainUrl + this.ApiUrls.updateBrand + '/' + id, data).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // Delete a brand
  deleteBrand(id: string) {
    return this.http.delete(this.ApiUrls.mainUrl + this.ApiUrls.deleteBrand + '/' + id).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

   // Get all users
   getUsers(page: number, limit: number) {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(this.ApiUrls.mainUrl + this.ApiUrls.getUsers, { params }).pipe(
      map((res: any) => res)
    );
  }

  // Add a new user
  addUser(user: any) {
    return this.http.post(this.ApiUrls.mainUrl + this.ApiUrls.addUser, user).pipe(
      map((res: any) => res)
    );
  }

  // Update an existing user
  updateUser(id: string, user: any) {
    return this.http.put(this.ApiUrls.mainUrl + this.ApiUrls.updateUser + '/' + id, user).pipe(
      map((res: any) => res)
    );
  }

  // Delete a user by ID
  deleteUser(id: string) {
    return this.http.delete(this.ApiUrls.mainUrl + this.ApiUrls.deleteUser + '/' + id).pipe(
      map((res: any) => res)
    );
  }
}


