import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Product } from '../../models/product.model';
import {
  AdminService,
  AdminUser,
  AdminRequest,
} from '../../services/admin.service';
import {
  UserTrackingService,
  TrackedUser,
} from '../../services/user-tracking.service';
import { NotificationService } from '../../services/notification.service';

interface ProductForm {
  title: string;
  price: number | null;
  description: string;
  category: string;
  image: string;
}

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-product.component.html',
  styleUrl: './create-product.component.scss',
})
export class CreateProductComponent implements OnInit {
  private firestore = inject(Firestore);
  private router = inject(Router);
  private auth = inject(Auth);
  private adminService = inject(AdminService);
  private ngZone = inject(NgZone);
  private userTrackingService = inject(UserTrackingService);
  private notificationService = inject(NotificationService);

  activeTab: 'create' | 'my-products' | 'manage-admins' | 'users' = 'create';
  isSuperAdmin = false;

  product: ProductForm = {
    title: '',
    price: null,
    description: '',
    category: '',
    image: '',
  };

  categories = [
    'electronics',
    'clothing',
    'home & kitchen',
    'books',
    'sports & outdoors',
    'beauty',
    'toys & games',
    'iphone',
    'iphone accessories',
    'groceries',
    'automotive',
    'other',
  ];

  submitting = false;
  submitted = false;
  errorMessage = '';
  imagePreviewError = false;

  // My Products
  myProducts: Product[] = [];
  loadingMyProducts = false;

  // Manage Admins
  adminUsers: AdminUser[] = [];
  adminRequests: AdminRequest[] = [];
  loadingAdmins = false;
  removingEmail: string | null = null;
  processingRequestId: string | null = null;

  // Remove Access Modal
  showRemoveModal = false;
  removeTargetAdmin: AdminUser | null = null;
  removeReason = '';
  removeSubmitting = false;

  // Users Tracking
  allUsers: TrackedUser[] = [];
  loadingUsers = false;
  userSearchQuery = '';
  isAdmin = false;

  ngOnInit(): void {
    this.loadMyProducts();
    this.checkSuperAdmin();
  }

  async checkSuperAdmin(): Promise<void> {
    // Wait for auth to be ready
    const email = await new Promise<string | null>((resolve) => {
      const unsub = this.auth.onAuthStateChanged((user) => {
        unsub();
        resolve(user?.email || null);
      });
    });
    if (!email) return;
    this.adminService.isSuperAdmin(email).subscribe((result) => {
      this.ngZone.run(() => {
        this.isSuperAdmin = result;
        if (result) {
          this.loadAdmins();
        }
      });
    });
    this.adminService.isAdmin(email).subscribe((result) => {
      this.ngZone.run(() => {
        this.isAdmin = result;
      });
    });
  }

  switchTab(tab: 'create' | 'my-products' | 'manage-admins' | 'users'): void {
    this.activeTab = tab;
    if (tab === 'my-products') {
      this.loadMyProducts();
    } else if (tab === 'manage-admins') {
      this.loadAdmins();
    } else if (tab === 'users') {
      this.loadUsers();
    }
  }

  // ---- Manage Admins ----
  async loadAdmins(): Promise<void> {
    this.loadingAdmins = true;
    try {
      const [admins, requests] = await Promise.all([
        this.adminService.getAllAdmins(),
        this.adminService.getAdminRequests(),
      ]);
      this.adminUsers = admins;
      this.adminRequests = requests;
      // Sort: superAdmins first, then by email
      this.adminUsers.sort((a, b) => {
        if (a.role === 'superAdmin' && b.role !== 'superAdmin') return -1;
        if (a.role !== 'superAdmin' && b.role === 'superAdmin') return 1;
        return a.email.localeCompare(b.email);
      });
      // Sort requests by newest first
      this.adminRequests.sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );
    } catch (error) {
      console.error('Failed to load admins:', error);
    } finally {
      this.loadingAdmins = false;
    }
  }

  openRemoveModal(admin: AdminUser): void {
    if (admin.role === 'superAdmin') return;
    this.removeTargetAdmin = admin;
    this.removeReason = '';
    this.showRemoveModal = true;
  }

  closeRemoveModal(): void {
    this.showRemoveModal = false;
    this.removeTargetAdmin = null;
    this.removeReason = '';
  }

  async confirmRemoveAdmin(): Promise<void> {
    if (!this.removeTargetAdmin || !this.removeReason.trim()) return;

    this.removeSubmitting = true;
    this.removingEmail = this.removeTargetAdmin.email;
    try {
      const targetEmail = this.removeTargetAdmin.email;
      await this.adminService.removeAdmin(
        targetEmail,
        this.removeReason.trim()
      );
      this.adminUsers = this.adminUsers.filter(
        (a) => a.email !== targetEmail
      );
      // Send notification to the removed admin
      await this.notificationService.addNotification(
        targetEmail,
        'admin_removed',
        'Admin Access Revoked',
        `Your admin access has been removed. Reason: ${this.removeReason.trim()}`
      );
      this.closeRemoveModal();
    } catch (error) {
      console.error('Failed to remove admin:', error);
    } finally {
      this.removeSubmitting = false;
      this.removingEmail = null;
    }
  }

  async approveRequest(request: AdminRequest): Promise<void> {
    this.processingRequestId = request.id;
    try {
      await this.adminService.approveRequest(request);
      this.adminRequests = this.adminRequests.filter((r) => r.id !== request.id);
      // Refresh admin list
      this.adminUsers = await this.adminService.getAllAdmins();
      // Send notification to the user
      await this.notificationService.addNotification(
        request.userEmail,
        'admin_approved',
        'Admin Access Approved! 🎉',
        'Your request for admin access has been approved. You can now create and manage products.'
      );
    } catch (error) {
      console.error('Failed to approve request:', error);
    } finally {
      this.processingRequestId = null;
    }
  }

  async rejectRequest(request: AdminRequest): Promise<void> {
    this.processingRequestId = request.id;
    try {
      await this.adminService.rejectRequest(request.id);
      this.adminRequests = this.adminRequests.filter((r) => r.id !== request.id);
      // Send notification to the user
      await this.notificationService.addNotification(
        request.userEmail,
        'admin_rejected',
        'Admin Request Declined',
        'Your request for admin access has been declined. Contact the super admin for more details.'
      );
    } catch (error) {
      console.error('Failed to reject request:', error);
    } finally {
      this.processingRequestId = null;
    }
  }

  async loadMyProducts(): Promise<void> {
    const email = this.auth.currentUser?.email;
    if (!email) return;

    this.loadingMyProducts = true;
    try {
      const productsRef = collection(this.firestore, 'products');
      const q = query(productsRef, where('createdBy', '==', email));
      const snapshot = await getDocs(q);
      this.myProducts = snapshot.docs.map((doc) => doc.data() as Product);
      // Sort by id descending (newest first)
      this.myProducts.sort((a, b) => (b.id || 0) - (a.id || 0));
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      this.loadingMyProducts = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) return;

    this.submitting = true;
    this.errorMessage = '';

    try {
      const email = this.auth.currentUser?.email || '';

      // Generate next ID
      const productsRef = collection(this.firestore, 'products');
      const allDocs = await getDocs(productsRef);
      let maxId = 0;
      allDocs.forEach((doc) => {
        const data = doc.data();
        if (data['id'] && data['id'] > maxId) {
          maxId = data['id'];
        }
      });

      const newProduct = {
        id: maxId + 1,
        title: this.product.title.trim(),
        price: this.product.price,
        description: this.product.description.trim(),
        category: this.product.category,
        image: this.product.image.trim(),
        rating: {
          rate: 0,
          count: 0,
        },
        createdBy: email,
      };

      await addDoc(productsRef, newProduct);
      this.submitted = true;

      // Refresh my products list
      this.loadMyProducts();

      setTimeout(() => {
        this.resetForm();
        this.submitted = false;
      }, 3000);
    } catch (error) {
      console.error('Failed to create product:', error);
      this.errorMessage = 'Failed to create product. Please try again.';
    } finally {
      this.submitting = false;
    }
  }

  isFormValid(): boolean {
    return (
      !!this.product.title.trim() &&
      this.product.price !== null &&
      this.product.price > 0 &&
      !!this.product.description.trim() &&
      !!this.product.category &&
      !!this.product.image.trim()
    );
  }

  resetForm(): void {
    this.product = {
      title: '',
      price: null,
      description: '',
      category: '',
      image: '',
    };
    this.imagePreviewError = false;
  }

  // Delete product
  deletingId: number | null = null;

  async deleteProduct(product: Product): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${product.title}"?`)) return;

    this.deletingId = product.id;
    try {
      const productsRef = collection(this.firestore, 'products');
      const q = query(productsRef, where('id', '==', product.id));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(this.firestore, 'products', d.id)));
      await Promise.all(deletePromises);
      this.myProducts = this.myProducts.filter((p) => p.id !== product.id);
    } catch (error) {
      console.error('Failed to delete product:', error);
      this.errorMessage = 'Failed to delete product. Please try again.';
    } finally {
      this.deletingId = null;
    }
  }

  onImageError(): void {
    this.imagePreviewError = true;
  }

  onImageLoad(): void {
    this.imagePreviewError = false;
  }

  // ---- Users Tracking ----
  async loadUsers(): Promise<void> {
    this.loadingUsers = true;
    try {
      this.allUsers = await this.userTrackingService.getAllUsers();
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      this.ngZone.run(() => {
        this.loadingUsers = false;
      });
    }
  }

  get filteredUsers(): TrackedUser[] {
    if (!this.userSearchQuery.trim()) {
      return this.allUsers;
    }
    const q = this.userSearchQuery.toLowerCase();
    return this.allUsers.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }

  get totalLogins(): number {
    return this.allUsers.reduce((sum, u) => sum + u.loginCount, 0);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
