import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, CartItem, Transaction } from '../types';
import { formatRupiah, formatNumber } from '../utils/formatters';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  QrCode,
  Banknote,
  Building,
  User,
  Phone,
  Tag,
} from 'lucide-react';

interface POSViewProps {
  onTransactionComplete: (tx: Transaction) => void;
}

export const POSView: React.FC<POSViewProps> = ({ onTransactionComplete }) => {
  const { products, createTransaction } = useStore();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash');
  const [cashPaidInput, setCashPaidInput] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - (discountAmount || 0));
  }, [subtotal, discountAmount]);

  const cashPaid = useMemo(() => {
    if (paymentMethod !== 'cash') return total;
    const parsed = parseInt(cashPaidInput.replace(/[^0-9]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }, [cashPaidInput, paymentMethod, total]);

  const change = useMemo(() => {
    if (paymentMethod !== 'cash') return 0;
    return Math.max(0, cashPaid - total);
  }, [cashPaid, total, paymentMethod]);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    setErrorNotice(null);
    if (product.stock <= 0) {
      setErrorNotice(`Stok ${product.name} telah habis!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          setErrorNotice(`Stok tidak mencukupi (Tersedia: ${product.stock} ${product.unit})`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * item.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            qty: 1,
            price: product.sellingPrice,
            subtotal: product.sellingPrice,
          },
        ];
      }
    });
  };

  // Adjust quantity
  const handleUpdateQty = (productId: string, delta: number) => {
    setErrorNotice(null);
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.qty + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) {
              setErrorNotice(
                `Stok maksimal untuk ${item.product.name} adalah ${item.product.stock} ${item.product.unit}`
              );
              return item;
            }
            return {
              ...item,
              qty: newQty,
              subtotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove single item
  const handleRemoveItem = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  // Reset cart
  const handleClearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setCashPaidInput('');
    setErrorNotice(null);
  };

  // Preset cash shortcuts
  const handleSetExactCash = () => {
    setCashPaidInput(total.toString());
  };

  const handleAddPresetCash = (amount: number) => {
    setCashPaidInput(amount.toString());
  };

  // Process checkout
  const handleCheckout = () => {
    setErrorNotice(null);
    if (cart.length === 0) {
      setErrorNotice('Keranjang belanja masih kosong!');
      return;
    }

    if (paymentMethod === 'cash' && cashPaid < total) {
      setErrorNotice(
        `Uang pembayaran kurang! Kurang ${formatRupiah(total - cashPaid)}`
      );
      return;
    }

    try {
      const newTx = createTransaction({
        items: cart,
        customerName: customerName.trim() || 'Pelanggan Umum',
        customerPhone: customerPhone.trim() || undefined,
        discount: discountAmount || 0,
        paymentMethod,
        cashPaid: paymentMethod === 'cash' ? cashPaid : total,
      });

      // Clear cart
      handleClearCart();

      // Trigger invoice modal in parent
      onTransactionComplete(newTx);
    } catch (err: unknown) {
      setErrorNotice(err instanceof Error ? err.message : 'Gagal memproses transaksi.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Selection Catalog (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Filter Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama barang atau kode SKU/Barcode..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Semua Kategori ({products.length})
            </button>
            {categories.map(cat => {
              const count = products.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
              Tidak ada produk yang cocok dengan pencarian &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock <= product.minStockAlert && !isOutOfStock;
              const cartQuantity = cart.find(i => i.product.id === product.id)?.qty || 0;

              return (
                <button
                  key={product.id}
                  onClick={() => handleAddToCart(product)}
                  disabled={isOutOfStock}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all group ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-xs cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span>{product.sku}</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          isOutOfStock
                            ? 'text-red-500'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Habis'
                          : `Stok: ${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-medium text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 font-mono tabular-nums">
                      {formatRupiah(product.sellingPrice)}
                    </span>

                    {cartQuantity > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                        {cartQuantity}
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                        <Plus className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Cart & Checkout (5 Cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">Keranjang Kasir</h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              ({cart.reduce((s, i) => s + i.qty, 0)} item)
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              Kosongkan
            </button>
          )}
        </div>

        {/* Error notice */}
        {errorNotice && (
          <div className="bg-red-50 px-4 py-2.5 border-b border-red-100 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 p-2">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada barang di keranjang.</p>
              <p className="text-[11px] text-slate-400">
                Klik produk di sebelah kiri untuk menambah ke transaksi.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="p-2 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {item.product.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {formatRupiah(item.price)} / {item.product.unit}
                  </div>
                </div>

                {/* Qty +/- */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateQty(item.product.id, -1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-7 text-center font-mono font-semibold text-slate-900 tabular-nums text-xs">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => handleUpdateQty(item.product.id, 1)}
                    className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right w-24">
                  <div className="font-semibold text-slate-900 font-mono tabular-nums text-xs">
                    {formatRupiah(item.subtotal)}
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.product.id)}
                    className="text-[10px] text-red-500 hover:text-red-700 transition-colors mt-0.5"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Discount Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                Nama Pembeli
              </label>
              <div className="relative">
                <User className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pelanggan Umum"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">
                No. WhatsApp (opsional)
              </label>
              <div className="relative">
                <Phone className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="0812xxxx"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">
              Potongan Diskon (Rp)
            </label>
            <div className="relative">
              <Tag className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="0"
                placeholder="0"
                value={discountAmount || ''}
                onChange={e => setDiscountAmount(Math.max(0, parseInt(e.target.value || '0', 10)))}
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div>
            <span className="block text-[11px] text-slate-500 mb-1.5">Metode Pembayaran</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                Tunai
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'qris'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                QRIS
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Transfer
              </button>
            </div>
          </div>

          {/* Cash Payment Details */}
          {paymentMethod === 'cash' && (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Nominal Uang Diterima:</span>
                <button
                  type="button"
                  onClick={handleSetExactCash}
                  className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Uang Pas ({formatRupiah(total)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="0"
                  value={cashPaidInput}
                  onChange={e => setCashPaidInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold font-mono text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              {/* Cash Shortcut Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10000, 20000, 50000, 100000, 200000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleAddPresetCash(val)}
                    className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100 font-mono tabular-nums"
                  >
                    {formatNumber(val)}
                  </button>
                ))}
              </div>

              {/* Change preview */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-600">Kembalian:</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    change >= 0 ? 'text-emerald-700' : 'text-red-600'
                  }`}
                >
                  {formatRupiah(change)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Checkout Summary & Pay Button */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Diskon:</span>
                <span className="font-mono tabular-nums">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Total Tagihan:</span>
              <span className="font-mono tabular-nums text-lg text-emerald-700">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-xs ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.99]'
            }`}
          >
            <span>Proses Bayar & Cetak Nota</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
