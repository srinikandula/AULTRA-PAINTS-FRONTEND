import { Component, OnInit } from '@angular/core';
import { ApiRequestService } from '../services/api-request.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbPagination, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { Unsubscribable } from '../shared/unsubscribable';
import { Observable, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

interface DealerOption {
  _id: string;
  dealerCode: string;
  name: string;
}

interface SalesExecutiveOption {
  _id: string;
  name: string;
  mobile: string;
}

interface BranchOption {
  iMasterId: number;
  sName: string;
  sCode: string;
}

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbPagination, NgbTypeaheadModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.css',
})
export class OrderListComponent extends Unsubscribable implements OnInit {
  orders: any[] = [];
  currentPage = 1;
  limit = 10;
  totalOrders = 0;
  limitOptions = [5, 10, 20, 50];
  isLoading = false;
  expandedOrderId: string | null = null;

  statusFilter = '';
  dealerCodeFilter = '';
  dealerInput = '';
  dealers: DealerOption[] = [];
  dealersError = '';

  salesExecutiveFilter = '';
  salesExecutiveInput = '';
  salesExecutives: SalesExecutiveOption[] = [];
  salesExecutivesError = '';
  showSalesExecutiveFilter = false;

  branchFilter = 0;
  branchInput = '';
  branches: BranchOption[] = [];
  branchesError = '';

  isRetrying: { [key: string]: boolean } = {};
  retryMessage: { [key: string]: string } = {};

  editModal = { orderId: '', status: '', remarks: '' };
  isSubmittingEdit = false;
  editModalError = '';
  currentUser: any;

  readonly statusOptions = ['PENDING', 'VERIFIED', 'REJECTED', 'DISPATCHED', 'PARTIALLY_DISPATCHED'];

  constructor(private apiRequestService: ApiRequestService, private authService: AuthService) {
    super();
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDealers();
    this.loadBranches();
    const user = this.currentUser;
    const accountType = user?.accountType;
    if (accountType === 'SuperUser' || accountType === 'Admin') {
      this.loadSalesExecutives();
    } else if (accountType === 'SalesExecutive') {
      this.loadJuniorSalesExecutives(user);
    }
    this.loadOrders();
  }

  loadDealers(): void {
    this.apiRequestService.getOrderDealers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dealers) => { this.dealers = dealers; },
        error: () => { this.dealersError = 'Could not load dealer list'; },
      });
  }

  loadBranches(): void {
    this.apiRequestService.getFocusBranches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.branches = response?.warehouses || response?.branches || [];
        },
        error: () => { this.branchesError = 'Could not load branch list'; },
      });
  }

  loadSalesExecutives(): void {
    this.apiRequestService.getAllSalesExecutives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.salesExecutives = res?.data ?? [];
          this.showSalesExecutiveFilter = this.salesExecutives.length > 0;
        },
        error: () => { this.salesExecutivesError = 'Could not load sales executive list'; },
      });
  }

  loadJuniorSalesExecutives(currentUser: any): void {
    this.apiRequestService.getJuniorSalesExecutives()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const juniors: SalesExecutiveOption[] = res?.data ?? [];
          if (juniors.length > 0) {
            // Prepend self so the Senior SE can also filter to only their own dealers
            this.salesExecutives = [
              { _id: currentUser.id || '', name: `${currentUser.name} (Me)`, mobile: currentUser.mobile },
              ...juniors,
            ];
            this.showSalesExecutiveFilter = true;
          }
        },
        error: () => { this.salesExecutivesError = 'Could not load junior sales executive list'; },
      });
  }

  loadOrders(): void {
    this.isLoading = true;
    const filters = {
      status: this.statusFilter || undefined,
      dealerCode: this.dealerCodeFilter || undefined,
      salesExecutiveMobile: this.salesExecutiveFilter || undefined,
      branchId: this.branchFilter || undefined,
    };
    this.apiRequestService.getAllOrders(this.currentPage, this.limit, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.orders = response.orders;
          this.totalOrders = response.total;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });
  }

  toggleExpand(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  getBadgeClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VERIFIED':   return 'bg-primary';
      case 'PENDING':    return 'bg-warning text-dark';
      case 'REJECTED':   return 'bg-danger';
      case 'DISPATCHED': return 'bg-success';
      case 'PARTIALLY_DISPATCHED':  return 'bg-info text-dark';
      default:           return 'bg-secondary';
    }
  }

  getFocusBadgeClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'SUCCESS': return 'bg-success';
      case 'FAILED':  return 'bg-danger';
      default:        return 'bg-warning text-dark';
    }
  }

  retryFocusSync(event: Event, order: any): void {
    event.stopPropagation();
    if (this.isRetrying[order.orderId]) return;
    this.isRetrying[order.orderId] = true;
    this.retryMessage[order.orderId] = '';
    this.apiRequestService.retryFocusSync(order.orderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          order.focusSyncStatus = 'PENDING';
          this.retryMessage[order.orderId] = 'Retry initiated';
          this.isRetrying[order.orderId] = false;
        },
        error: (err: any) => {
          this.retryMessage[order.orderId] = err?.error?.message || 'Retry failed';
          this.isRetrying[order.orderId] = false;
        },
      });
  }

  itemSubtotal(item: any): number {
    return (item.productPrice || 0) * (item.quantity || 0);
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  // ng-bootstrap typeahead source
  dealerSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      map((term) => {
        const t = (term || '').trim().toLowerCase();
        const list = !t ? this.dealers : this.dealers.filter(
          (d) =>
            d.dealerCode.toLowerCase().includes(t) ||
            (d.name || '').toLowerCase().includes(t)
        );
        return list.slice(0, 10);
      })
    );

  dealerFormatter = (d: DealerOption | string): string =>
    typeof d === 'string' ? d : `${d.dealerCode} — ${d.name}`;

  branchSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      map((term) => {
        const t = (term || '').trim().toLowerCase();
        return t ? this.branches.filter(b =>
          b.sName.toLowerCase().includes(t) ||
          b.sCode.toLowerCase().includes(t)
        ).slice(0, 10)
        : this.branches.slice(0, 10);
      })
    );

  branchFormatter = (b: BranchOption | string): string =>
    typeof b === 'string' ? b : `${b.sCode} — ${b.sName}`;

  onDealerSelect(event: any): void {
    const d = event.item as DealerOption;
    this.dealerCodeFilter = d.dealerCode;
    this.dealerInput = this.dealerFormatter(d);
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  onDealerInputChange(value: string): void {
    // Keep `dealerCodeFilter` in sync with the visible input. If the user edits
    // the text away from the formatted selection (or clears it), drop the filter.
    const matchesSelection =
      !!this.dealerCodeFilter &&
      value === this.dealers
        .filter((d) => d.dealerCode === this.dealerCodeFilter)
        .map(this.dealerFormatter)[0];

    if (!matchesSelection && this.dealerCodeFilter) {
      this.dealerCodeFilter = '';
      this.currentPage = 1;
      this.expandedOrderId = null;
      this.loadOrders();
    }
  }

  salesExecutiveSearch = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      map((term) => {
        const t = (term || '').trim().toLowerCase();
        const list = !t ? this.salesExecutives : this.salesExecutives.filter(
          (se) =>
            (se.name || '').toLowerCase().includes(t) ||
            (se.mobile || '').toLowerCase().includes(t)
        );
        return list.slice(0, 10);
      })
    );

  salesExecutiveFormatter = (se: SalesExecutiveOption | string): string =>
    typeof se === 'string' ? se : `${se.name} — ${se.mobile}`;

  onSalesExecutiveSelect(event: any): void {
    const se = event.item as SalesExecutiveOption;
    this.salesExecutiveFilter = se.mobile;
    this.salesExecutiveInput = this.salesExecutiveFormatter(se);
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  onSalesExecutiveInputChange(value: string): void {
    const matchesSelection =
      !!this.salesExecutiveFilter &&
      value === this.salesExecutives
        .filter((se) => se.mobile === this.salesExecutiveFilter)
        .map(this.salesExecutiveFormatter)[0];

    if (!matchesSelection && this.salesExecutiveFilter) {
      this.salesExecutiveFilter = '';
      this.currentPage = 1;
      this.expandedOrderId = null;
      this.loadOrders();
    }
  }

  onBranchSelect(event: any): void {
    const b = event.item as BranchOption;
    this.branchFilter = b.iMasterId;
    this.branchInput = this.branchFormatter(b);
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  onBranchInputChange(value: string): void {
    const matchesSelection =
      !!this.branchFilter &&
      value === this.branches
        .filter(b => b.iMasterId === this.branchFilter)
        .map(this.branchFormatter)[0];

    if (!matchesSelection && this.branchFilter) {
      this.branchFilter = 0;
      this.currentPage = 1;
      this.expandedOrderId = null;
      this.loadOrders();
    }
  }

  clearFilters(): void {
    if (!this.statusFilter && !this.dealerCodeFilter && !this.salesExecutiveFilter && !this.branchFilter) return;
    this.statusFilter = '';
    this.dealerCodeFilter = '';
    this.dealerInput = '';
    this.salesExecutiveFilter = '';
    this.salesExecutiveInput = '';
    this.branchFilter = 0;
    this.branchInput = '';
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  hasActiveFilters(): boolean {
    return !!this.statusFilter || !!this.dealerCodeFilter || !!this.salesExecutiveFilter || !!this.branchFilter;
  }

  handlePageChange(page: number): void {
    this.currentPage = page;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  handleLimitChange(): void {
    this.currentPage = 1;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  canEditOrder(): boolean {
    return ['ProductionManager', 'SuperUser'].includes(this.currentUser?.accountType);
  }

  openEditModal(order: any): void {
    this.editModal = { orderId: order.orderId, status: 'DISPATCHED', remarks: '' };
    this.editModalError = '';
    this.isSubmittingEdit = false;
  }

  submitOrderStatusUpdate(): void {
    if (!this.editModal.status) {
      this.editModalError = 'Please select a status';
      return;
    }
    this.isSubmittingEdit = true;
    this.editModalError = '';
    this.apiRequestService.updateOrderStatusManual(
      this.editModal.orderId,
      this.editModal.status,
      this.editModal.remarks
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isSubmittingEdit = false;
          if (response?.success) {
            this.loadOrders();
            // Close modal (using Bootstrap)
            const modal = document.getElementById('editOrderModal') as any;
            if (modal) {
              const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal);
              bsModal?.hide();
            }
          } else {
            this.editModalError = response?.message || 'Failed to update order status';
          }
        },
        error: (err) => {
          this.isSubmittingEdit = false;
          this.editModalError = err?.error?.message || 'Error updating order status';
        }
      });
  }
}
