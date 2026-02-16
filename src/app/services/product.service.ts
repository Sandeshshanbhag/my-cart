import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Firestore,
  collection,
  collectionData,
} from '@angular/fire/firestore';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private firestore = inject(Firestore);
  private productsCollection = collection(this.firestore, 'products');

  getAllProducts(): Observable<Product[]> {
    return collectionData(this.productsCollection) as Observable<Product[]>;
  }

  searchProducts(query: string): Observable<Product[]> {
    const lowerQuery = query.toLowerCase();
    return this.getAllProducts().pipe(
      map((products) =>
        products.filter(
          (p) =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery)
        )
      )
    );
  }

  getRecommendedProducts(): Observable<Product[]> {
    return this.getAllProducts().pipe(
      map((products) => {
        // Shuffle and pick 8 random products as recommendations
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 8);
      })
    );
  }
}
