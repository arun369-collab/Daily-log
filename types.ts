
export interface ProductionRecord {
  id: string;
  date: string;
  productName: string;
  batchNo: string;
  size: string;
  weightKg: number;
  rejectedKg: number;
  duplesPkt: number;
  cartonCtn: number;
  notes: string;
  timestamp: number;
  isReturn?: boolean; // True if this is a sales return/material return from customer
  isDispatch?: boolean; // True if this is a manual dispatch entry (temporary)
}

export interface DailySummary {
  totalWeight: number;
  totalRejected: number;
  rejectionRate: number;
  batchesProcessed: number;
}

export interface SalesOrderItem {
  productId: string;
  productName: string; // e.g. SPARKWELD 6013
  size: string;        // e.g. 3.2 x 350
  quantityCtn: number;
  calculatedWeightKg: number;
  pricePerKg: number;
  itemValue: number; // calculatedWeightKg * pricePerKg
  assignedBatch?: string; // Admin assigned batch for delivery
}

export interface SalesOrder {
  id: string;
  orderDate: string;
  salesPerson: string;
  
  // Customer Details
  customerName: string;
  mobileNumber: string;
  email: string;
  city: string;
  mapLink: string;
  
  // PO Details
  poNumber: string;
  poFileName?: string; 
  poFileData?: string; // Base64 Data URL for the file
  
  // Order Data
  items: SalesOrderItem[];
  totalWeightKg: number;
  
  // Financials
  subTotal: number;
  vatAmount: number; // 15%
  grandTotal: number;
  
  status: 'Pending' | 'Processing' | 'Dispatched' | 'Delivered';
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  mapLink: string;
  
  // Order History
  orderHistory?: string[];
}

export interface PackingStockItem {
  id: string; // e.g., PD1001
  itemNo: string; // e.g., 101458CD004
  name: string;
  openingStock: number; // BF Qty
  unit: 'PCS' | 'KG';
  remark?: string;
  lowStockThreshold?: number;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  date: string;
  qty: number;
  type: 'INWARD' | 'ADJUSTMENT';
  notes?: string;
}

export type ViewState = 'dashboard' | 'entry' | 'history' | 'batches' | 'dispatch' | 'settings' | 'ledger_sheet' | 'sales_entry' | 'sales_dashboard' | 'customers' | 'packing_stock' | 'analytics' | 'finished_goods' | 'customer_behaviour';

export type UserRole = 'admin' | 'yadav' | 'sales';
