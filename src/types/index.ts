export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;    // Harga Beli (HPP)
  sellingPrice: number; // Harga Jual
  stock: number;        // Stok saat ini
  minStockAlert: number;// Batas minimum stok peringatan
  description?: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  price: number;
  subtotal: number;
}

export interface TransactionItem {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  qty: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalCost: number;     // Total HPP for profit calculation
  profit: number;        // Total profit (total - totalCost)
  paymentMethod: 'cash' | 'transfer' | 'qris';
  cashPaid: number;
  change: number;
  cashierName: string;
  status: 'completed' | 'voided';
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'in' | 'out' | 'sale' | 'adjustment' | 'void';
  qty: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  date: string;
  referenceId?: string; // invoice or supplier doc
}

export interface StoreProfile {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  footerNote: string;
  ownerName: string;
}

export interface UserAccount {
  id: string;
  name: string;
  role: 'owner' | 'cashier';
  email: string;
  pin: string;
}
