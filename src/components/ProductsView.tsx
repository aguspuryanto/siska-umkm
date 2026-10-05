import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { formatRupiah, formatNumber, formatDate, exportToCSV } from '../utils/formatters';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  PlusCircle,
  AlertTriangle,
  X,
  Check,
  TrendingUp,
} from 'lucide-react';

interface ProductsViewProps {
  onQuickRestockProduct?: Product | null;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onQuickRestockProduct }) => {
  const { products, addProduct, updateProduct, deleteProduct, restockProduct } = useStore();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(
    onQuickRestockProduct || null
  );
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockReason, setRestockReason] = useState('Pembelian Restok Supplier');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New product form state
  const initialForm = {
    name: '',
    sku: '',
    category: 'Sembako',
    unit: 'pcs',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStockAlert: 5,
    description: '',
  };
  const [formData, setFormData] = useState(initialForm);

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['all', ...list];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;

      let matchStock = true;
      if (stockStatusFilter === 'low') {
        matchStock = p.stock <= p.minStockAlert && p.stock > 0;
      } else if (stockStatusFilter === 'out') {
        matchStock = p.stock === 0;
      }

      return matchSearch && matchCat && matchStock;
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  // Open add modal
  const handleOpenAdd = () => {
    // Generate a default unique SKU suggestion
    const nextSeq = products.length + 1;
    const suggestedSKU = `BRG-${String(nextSeq).padStart(3, '0')}`;
    setFormData({
      ...initialForm,
      sku: suggestedSKU,
    });
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minStockAlert: product.minStockAlert,
      description: product.description || '',
    });
  };

  // Save Add/Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: formData.name.trim(),
        sku: formData.sku.trim() || editingProduct.sku,
        category: formData.category,
        unit: formData.unit,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStockAlert: Number(formData.minStockAlert) || 0,
        description: formData.description,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim() || `BRG-${Date.now().toString().slice(-4)}`,
        category: formData.category,
        unit: formData.unit,
        costPrice: Number(formData.costPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        stock: Number(formData.stock) || 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        description: formData.description,
      });
      setIsAddModalOpen(false);
    }
  };

  // Execute restock
  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingProduct || restockQty <= 0) return;
    restockProduct(restockingProduct.id, Number(restockQty), restockReason);
    setRestockingProduct(null);
    setRestockQty(10);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Nama Barang',
      'Kategori',
      'Satuan',
      'Harga Beli (HPP)',
      'Harga Jual',
      'Margin Laba (Rp)',
      'Margin Laba (%)',
      'Stok Saat Ini',
      'Batas Min Stok',
      'Nilai Aset Modal',
    ];
    const rows = products.map(p => {
      const marginRp = p.sellingPrice - p.costPrice;
      const marginPercent = p.costPrice > 0 ? ((marginRp / p.costPrice) * 100).toFixed(1) : '0';
      const assetVal = p.costPrice * p.stock;
      return [
        p.sku,
        p.name,
        p.category,
        p.unit,
        p.costPrice,
        p.sellingPrice,
        marginRp,
        `${marginPercent}%`,
        p.stock,
        p.minStockAlert,
        assetVal,
      ];
    });

    exportToCSV(`data_stok_barang_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  // Quick margin calculation helper
  const calculateMargin = (cost: number, sell: number) => {
    if (cost <= 0) return { amount: sell, percent: 0 };
    const amount = sell - cost;
    const percent = ((amount / cost) * 100).toFixed(1);
    return { amount, percent };
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Katalog & Manajemen Stok Barang
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola harga beli HPP, harga jual, margin keuntungan, dan kontrol ketersediaan stok
            inventaris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Excel/CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Tambah Barang Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari barang berdasarkan nama atau kode SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock status filter buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setStockStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('low')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockStatusFilter === 'low'
                  ? 'bg-white text-amber-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menipis ({products.filter(p => p.stock <= p.minStockAlert && p.stock > 0).length})
            </button>
            <button
              onClick={() => setStockStatusFilter('out')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                stockStatusFilter === 'out'
                  ? 'bg-white text-red-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Habis ({products.filter(p => p.stock === 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium">
                <th className="py-3 px-4">Barang & SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Beli (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Margin Laba</th>
                <th className="py-3 px-4 text-center">Stok</th>
                <th className="py-3 px-4 text-right">Nilai Modal</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada barang yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const margin = calculateMargin(prod.costPrice, prod.sellingPrice);
                  const isOutOfStock = prod.stock === 0;
                  const isLowStock = prod.stock <= prod.minStockAlert && !isOutOfStock;
                  const totalAsset = prod.costPrice * prod.stock;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{prod.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{prod.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(prod.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(prod.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="font-mono tabular-nums font-medium text-emerald-700">
                          +{margin.percent}%
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                          ({formatRupiah(margin.amount)})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`font-mono font-bold tabular-nums text-xs ${
                              isOutOfStock
                                ? 'text-red-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {prod.stock} {prod.unit}
                          </span>
                          {(isOutOfStock || isLowStock) && (
                            <span
                              title={
                                isOutOfStock
                                  ? 'Stok Habis'
                                  : `Stok Menipis (Batas: ${prod.minStockAlert})`
                              }
                            >
                              <AlertTriangle
                                className={`w-3.5 h-3.5 ${
                                  isOutOfStock ? 'text-red-500' : 'text-amber-500'
                                }`}
                              />
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {prod.minStockAlert}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(totalAsset)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Restok Tambah Barang"
                            onClick={() => {
                              setRestockingProduct(prod);
                              setRestockQty(10);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            title="Edit Data Barang"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            title="Hapus Barang"
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add or Edit Product */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                {editingProduct ? 'Edit Data Barang' : 'Tambah Barang Baru'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">
                    Nama Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beras Ramos 5 kg"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">SKU / Kode</label>
                  <input
                    type="text"
                    placeholder="BRG-001"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Kategori</label>
                  <input
                    type="text"
                    list="category-suggestions"
                    placeholder="Sembako, Minuman, etc."
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                  />
                  <datalist id="category-suggestions">
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Satuan Barang</label>
                  <input
                    type="text"
                    placeholder="pcs, botol, kg, dus, pack"
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Harga Beli HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.costPrice || ''}
                    onChange={e =>
                      setFormData({ ...formData, costPrice: Math.max(0, parseInt(e.target.value || '0', 10)) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Harga Jual Kasir (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.sellingPrice || ''}
                    onChange={e =>
                      setFormData({ ...formData, sellingPrice: Math.max(0, parseInt(e.target.value || '0', 10)) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-slate-400"
                  />
                </div>

                <div className="col-span-2 pt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>Estimasi Keuntungan:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {formatRupiah(formData.sellingPrice - formData.costPrice)} (
                    {formData.costPrice > 0
                      ? (
                          ((formData.sellingPrice - formData.costPrice) / formData.costPrice) *
                          100
                        ).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Jumlah Stok Sekarang
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock || ''}
                    onChange={e =>
                      setFormData({ ...formData, stock: Math.max(0, parseInt(e.target.value || '0', 10)) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">
                    Batas Peringatan Stok Minimum
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="5"
                    value={formData.minStockAlert || ''}
                    onChange={e =>
                      setFormData({ ...formData, minStockAlert: Math.max(0, parseInt(e.target.value || '0', 10)) })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono tabular-nums focus:outline-hidden focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  {editingProduct ? 'Perbarui Barang' : 'Simpan Barang Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Restock */}
      {restockingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-sm text-slate-900">
                Restok Barang Masuk (Tambah Stok)
              </h3>
              <button
                onClick={() => setRestockingProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestock} className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-900 text-sm">
                  {restockingProduct.name}
                </div>
                <div className="flex justify-between text-slate-500 mt-1">
                  <span>SKU: {restockingProduct.sku}</span>
                  <span>
                    Stok Saat Ini:{' '}
                    <strong className="text-slate-900">
                      {restockingProduct.stock} {restockingProduct.unit}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Jumlah Tambahan Masuk ({restockingProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(Math.max(1, parseInt(e.target.value || '1', 10)))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold font-mono focus:outline-hidden focus:border-slate-400"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Stok baru setelah restok:{' '}
                  <strong className="text-emerald-700 font-mono">
                    {restockingProduct.stock + Number(restockQty)} {restockingProduct.unit}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">
                  Keterangan / Nama Supplier
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pembelian Agen Grosir Jaya"
                  value={restockReason}
                  onChange={e => setRestockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">Hapus Barang Ini?</h3>
              <p className="text-xs text-slate-500">
                Barang yang dihapus tidak akan muncul lagi di kasir. Riwayat transaksi sebelumnya
                tetap tersimpan rapi.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteProduct(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
