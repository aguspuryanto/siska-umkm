import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Transaction,
  StockMovement,
  StoreProfile,
  UserAccount,
  CartItem,
  Category,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_STORE_PROFILE,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
} from '../data/initialData';
import { generateInvoiceNumber } from '../utils/formatters';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  transactions: Transaction[];
  stockMovements: StockMovement[];
  storeProfile: StoreProfile;
  currentUser: UserAccount | null;
  users: UserAccount[];
  
  // Auth methods
  login: (email: string, pin: string) => boolean;
  logout: () => void;
  switchUserRole: (role: 'owner' | 'cashier') => void;
  
  // Category methods
  addCategory: (name: string) => Category;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  // Product methods
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => Product;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => boolean;
  restockProduct: (productId: string, addQty: number, reason?: string, supplierDoc?: string) => void;
  
  // Transaction methods
  createTransaction: (data: {
    items: CartItem[];
    customerName: string;
    customerPhone?: string;
    discount: number;
    paymentMethod: 'cash' | 'transfer' | 'qris';
    cashPaid: number;
    notes?: string;
  }) => Transaction;
  voidTransaction: (transactionId: string, reason?: string) => boolean;
  
  // Settings & Data management
  updateStoreProfile: (profile: Partial<StoreProfile>) => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
  resetToDefaultData: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'umkm_pos_products_v1',
  CATEGORIES: 'umkm_pos_categories_v1',
  TRANSACTIONS: 'umkm_pos_transactions_v1',
  STOCK_MOVEMENTS: 'umkm_pos_stock_movements_v1',
  PROFILE: 'umkm_pos_profile_v1',
  CURRENT_USER: 'umkm_pos_current_user_v1',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Stock movements
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STOCK_MOVEMENTS);
      return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
    } catch {
      return INITIAL_STOCK_MOVEMENTS;
    }
  });

  // Store Profile
  const [storeProfile, setStoreProfile] = useState<StoreProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_STORE_PROFILE;
    } catch {
      return INITIAL_STORE_PROFILE;
    }
  });

  // Users
  const [users] = useState<UserAccount[]>(INITIAL_USERS);

  // Current User (default to Owner for seamless demo, can switch anytime)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(storeProfile));
  }, [storeProfile]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  // Auth
  const login = (email: string, pin: string): boolean => {
    const user = users.find(u => (u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === email.toLowerCase()) && u.pin === pin);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUserRole = (role: 'owner' | 'cashier') => {
    const target = users.find(u => u.role === role) || users[0];
    setCurrentUser(target);
  };

  // Category operations
  const addCategory = (name: string): Category => {
    const trimmed = name.trim();
    const existing = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const newCat: Category = {
      id: 'cat-' + Date.now(),
      name: trimmed,
    };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const oldCat = categories.find(c => c.id === id);
    if (!oldCat) return;

    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, name: trimmed } : c))
    );

    // Also update products that have the old category name
    if (oldCat.name !== trimmed) {
      setProducts(prev =>
        prev.map(p => (p.category === oldCat.name ? { ...p, category: trimmed } : p))
      );
    }
  };

  const deleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    if (!catToDelete) return;

    setCategories(prev => prev.filter(c => c.id !== id));

    // Reassign products with deleted category to 'Umum'
    setProducts(prev =>
      prev.map(p => (p.category === catToDelete.name ? { ...p, category: 'Umum' } : p))
    );
  };

  // Product operations
  const addProduct = (productData: Omit<Product, 'id' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: 'prod-' + Date.now(),
      updatedAt: new Date().toISOString(),
    };

    setProducts(prev => [newProduct, ...prev]);

    // Record initial stock movement
    if (newProduct.stock > 0) {
      const movement: StockMovement = {
        id: 'sm-' + Date.now(),
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        type: 'in',
        qty: newProduct.stock,
        previousStock: 0,
        currentStock: newProduct.stock,
        reason: 'Stok Awal Produk Baru',
        date: new Date().toISOString(),
      };
      setStockMovements(prev => [movement, ...prev]);
    }

    return newProduct;
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === updated.id) {
          if (p.stock !== updated.stock) {
            const diff = updated.stock - p.stock;
            const movement: StockMovement = {
              id: 'sm-' + Date.now(),
              productId: updated.id,
              productName: updated.name,
              sku: updated.sku,
              type: diff > 0 ? 'in' : 'adjustment',
              qty: diff,
              previousStock: p.stock,
              currentStock: updated.stock,
              reason: 'Penyesuaian Manual Data Barang',
              date: new Date().toISOString(),
            };
            setStockMovements(m => [movement, ...m]);
          }
          return { ...updated, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string): boolean => {
    setProducts(prev => prev.filter(p => p.id !== id));
    return true;
  };

  const restockProduct = (
    productId: string,
    addQty: number,
    reason = 'Restok Barang Masuk',
    supplierDoc = ''
  ) => {
    if (addQty <= 0) return;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const newStock = p.stock + addQty;
          const movement: StockMovement = {
            id: 'sm-' + Date.now() + Math.random().toString(36).substr(2, 4),
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            type: 'in',
            qty: addQty,
            previousStock: p.stock,
            currentStock: newStock,
            reason: reason || 'Restok Barang Masuk Supplier',
            date: new Date().toISOString(),
            referenceId: supplierDoc || undefined,
          };
          setStockMovements(m => [movement, ...m]);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Transaction operations (Automated stock decrement & Invoice number generation)
  const createTransaction = ({
    items,
    customerName,
    customerPhone,
    discount,
    paymentMethod,
    cashPaid,
    notes,
  }: {
    items: CartItem[];
    customerName: string;
    customerPhone?: string;
    discount: number;
    paymentMethod: 'cash' | 'transfer' | 'qris';
    cashPaid: number;
    notes?: string;
  }): Transaction => {
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    // Calculate today's sequence count
    const todaysTxCount = transactions.filter(t => {
      const d = new Date(t.date);
      return (
        d.getFullYear() === todayYear &&
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate
      );
    }).length;

    const invoiceNumber = generateInvoiceNumber(todaysTxCount + 1, today);

    let subtotal = 0;
    let totalCost = 0;

    const txItems = items.map(item => {
      const itemSubtotal = item.qty * item.price;
      const itemCost = item.qty * item.product.costPrice;
      subtotal += itemSubtotal;
      totalCost += itemCost;

      return {
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        unit: item.product.unit,
        costPrice: item.product.costPrice,
        sellingPrice: item.price,
        qty: item.qty,
        subtotal: itemSubtotal,
      };
    });

    const finalDiscount = Math.min(discount, subtotal);
    const total = Math.max(0, subtotal - finalDiscount);
    const profit = total - totalCost;
    const finalCashPaid = paymentMethod === 'cash' ? Math.max(cashPaid, total) : total;
    const change = paymentMethod === 'cash' ? Math.max(0, finalCashPaid - total) : 0;

    const newTx: Transaction = {
      id: 'tx-' + Date.now(),
      invoiceNumber,
      date: today.toISOString(),
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone?.trim() || undefined,
      items: txItems,
      subtotal,
      discount: finalDiscount,
      tax: 0,
      total,
      totalCost,
      profit,
      paymentMethod,
      cashPaid: finalCashPaid,
      change,
      cashierName: currentUser?.name || 'Kasir',
      status: 'completed',
      notes,
    };

    // 1. Decrement product stocks automatically
    const newStockMovements: StockMovement[] = [];
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const soldItem = items.find(i => i.product.id === prod.id);
        if (soldItem) {
          const newStock = Math.max(0, prod.stock - soldItem.qty);
          newStockMovements.push({
            id: 'sm-' + Date.now() + '-' + prod.id,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'sale',
            qty: -soldItem.qty,
            previousStock: prod.stock,
            currentStock: newStock,
            reason: `Penjualan Kasir (${invoiceNumber})`,
            date: today.toISOString(),
            referenceId: invoiceNumber,
          });
          return {
            ...prod,
            stock: newStock,
            updatedAt: today.toISOString(),
          };
        }
        return prod;
      })
    );

    // 2. Append stock movements
    setStockMovements(prev => [...newStockMovements, ...prev]);

    // 3. Append transaction
    setTransactions(prev => [newTx, ...prev]);

    return newTx;
  };

  const voidTransaction = (transactionId: string, reason = 'Pembatalan Transaksi Kasir'): boolean => {
    const targetTx = transactions.find(t => t.id === transactionId);
    if (!targetTx || targetTx.status === 'voided') return false;

    const nowIso = new Date().toISOString();
    const returnMovements: StockMovement[] = [];

    // Return stock back to inventory
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        const itemToReturn = targetTx.items.find(i => i.productId === prod.id);
        if (itemToReturn) {
          const newStock = prod.stock + itemToReturn.qty;
          returnMovements.push({
            id: 'sm-' + Date.now() + '-' + prod.id,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            type: 'void',
            qty: itemToReturn.qty,
            previousStock: prod.stock,
            currentStock: newStock,
            reason: `Batal Transaksi (${targetTx.invoiceNumber}) - ${reason}`,
            date: nowIso,
            referenceId: targetTx.invoiceNumber,
          });
          return {
            ...prod,
            stock: newStock,
            updatedAt: nowIso,
          };
        }
        return prod;
      })
    );

    setStockMovements(prev => [...returnMovements, ...prev]);

    // Mark as voided
    setTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, status: 'voided' } : t))
    );

    return true;
  };

  const updateStoreProfile = (newProfile: Partial<StoreProfile>) => {
    setStoreProfile(prev => ({ ...prev, ...newProfile }));
  };

  const exportDatabaseJSON = (): string => {
    const data = {
      storeProfile,
      categories,
      products,
      transactions,
      stockMovements,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      }
      if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (data.stockMovements && Array.isArray(data.stockMovements)) {
        setStockMovements(data.stockMovements);
      }
      if (data.storeProfile && typeof data.storeProfile === 'object') {
        setStoreProfile(data.storeProfile);
      }
      return true;
    } catch {
      return false;
    }
  };

  const resetToDefaultData = () => {
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setStoreProfile(INITIAL_STORE_PROFILE);
    setCurrentUser(INITIAL_USERS[0]);
    localStorage.clear();
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        transactions,
        stockMovements,
        storeProfile,
        currentUser,
        users,
        login,
        logout,
        switchUserRole,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        createTransaction,
        voidTransaction,
        updateStoreProfile,
        exportDatabaseJSON,
        importDatabaseJSON,
        resetToDefaultData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
