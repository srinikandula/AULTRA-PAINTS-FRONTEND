// Order statuses recognized by the backend's getOrders endpoint.
export type OrderStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'DISPATCHED'
  | 'IN-PARCEL';

export type FocusSyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// Items as persisted on the backend Order doc (OrderItemSchema). The
// `product` slot is kept for back-compat with the table rendering that
// already reads `o.items[].product.productName`; new code should prefer
// the flattened `productName` / `volume` fields straight off the row.
export type OrderItem = {
  product?:
    | { _id: string; productName?: string; productOfferDescription?: string }
    | string;
  productName?: string;
  productOfferDescription?: string;
  volume?: string;
  quantity: number;
  price?: number; // unit price
  productPrice?: number; // backend's actual field name
  subTotal?: number; // line subtotal (client-derived if absent)
  // Detail-only enrichment from getOrderDetails when the order has been
  // synced to Focus 8 (per-item dispatch comparison vs DC invoice).
  dispatchStatus?: OrderStatus;
  dispatchedQty?: number;
};

export type Order = {
  _id: string;
  // Human-readable order number. Backend persists this as `orderId`; the
  // hook adapter mirrors it into `orderNumber` for source compatibility.
  orderId?: string;
  orderNumber?: string;
  status: OrderStatus;
  // Either the populated dealer document (when populated server-side) or
  // a bare ObjectId string (when not populated). The hook adapter exposes
  // a flat `dealer` view for the table column.
  dealerId?:
    | { _id: string; name: string; dealerCode?: string; mobile?: string }
    | string;
  createdBy?: {
    _id: string;
    name: string;
    mobile?: string;
    accountType?: string;
    dealerCode?: string;
  };
  // Back-compat flat view; populated by the hook from `dealerId` when the
  // server returned a populated document.
  dealer?: { _id: string; name: string; mobile?: string; dealerCode?: string };
  items: OrderItem[];
  // Existing total field used by the list table; back-compat alias for
  // `finalPrice` so older readers keep working.
  totalAmount?: number;
  // Backend's actual price fields.
  totalPrice?: number; // pre-GST subtotal
  gstPrice?: number;
  finalPrice?: number;
  // Optional aliases mirrored by the hook for the detail panel.
  subTotal?: number;
  gst?: number;
  narration?: string;
  // Focus 8 integration fields.
  focusSyncStatus?: FocusSyncStatus;
  focusOrderId?: string | number; // Focus SO voucher number
  focusSyncError?: string;
  focusSyncedAt?: string;
  // Backend stores this as `focusDCInvoiceId: string[]`; mirrored into
  // `dcInvoiceIds` by the hook for readability at the call site.
  focusDCInvoiceId?: string[];
  dcInvoiceIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type OrderListParams = {
  page: number;
  limit: number;
  status?: OrderStatus;
  // Backend filters dealers by code (looked up server-side via User.dealerCode).
  dealerCode?: string;
  // TODO: the SE filter currently uses the SE's mobile number as
  //   `salesExecutiveMobile`. Cross-check with the backend ORDER
  //   controller's actual filter param if SE-scoping ever returns wrong
  //   rows. As of writing, the backend `getOrders` body only reads
  //   page/limit/status/dealerCode, so this is silently ignored.
  salesExecutiveMobile?: string;
};
