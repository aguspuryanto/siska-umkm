import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Transaction } from '../types';
import { formatRupiah, formatDateTime, exportToCSV } from '../utils/formatters';
import {
  Search,
  Filter,
  Download,
  Eye,
  RotateCcw,
  Calendar,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';

interface TransactionsViewProps {
  onViewInvoice: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onViewInvoice }) => {
  const { transactions, products, categories, voidTransaction } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [voidConfirmTx, setVoidConfirmTx] = useState<Transaction | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    return transactions.filter(tx => {
      const txDate = new Date(tx.date);

      // Date range filter
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate =
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === currentMonth &&
          txDate.getDate() === currentDate;
      } else if (dateFilter === '7days') {
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        matchDate = diffDays <= 7;
      } else if (dateFilter === 'month') {
        matchDate =
          txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
      }

      // Method filter
      const matchMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter;

      // Category filter
      let matchCategory = true;
      if (categoryFilter !== 'all') {
        matchCategory = tx.items.some(item => {
          const p = products.find(prod => prod.id === item.productId);
          return p && p.category === categoryFilter;
        });
      }

      // Search query (invoice number or customer name)
      const matchSearch =
        tx.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.cashierName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchDate && matchMethod && matchCategory && matchSearch;
    });
  }, [transactions, products, dateFilter, methodFilter, categoryFilter, searchQuery]);

  // Aggregate stats for filtered transactions
  const activeTx = filteredTransactions.filter(t => t.status !== 'voided');
  const totalVolume = activeTx.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = activeTx.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalItemsSold = activeTx.reduce(
    (sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0),
    0
  );

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'No. Invoice',
      'Tanggal & Waktu',
      'Nama Pelanggan',
      'Metode Bayar',
      'Kasir',
      'Jumlah Item',
      'Subtotal',
      'Diskon',
      'Total Transaksi',
      'Laba Bersih',
      'Status',
    ];

    const rows = filteredTransactions.map(tx => [
      tx.invoiceNumber,
      formatDateTime(tx.date),
      tx.customerName,
      tx.paymentMethod.toUpperCase(),
      tx.cashierName,
      tx.items.reduce((s, i) => s + i.qty, 0),
      tx.subtotal,
      tx.discount,
      tx.total,
      tx.profit || 0,
      tx.status === 'voided' ? 'Dibatalkan' : 'Selesai',
    ]);

    exportToCSV(`laporan_penjualan_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleExecuteVoid = () => {
    if (!voidConfirmTx) return;
    voidTransaction(voidConfirmTx.id, 'Dibatalkan oleh kasir/owner');
    setVoidConfirmTx(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Riwayat Transaksi Penjualan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar lengkap seluruh nota penjualan, status pembayaran, dan riwayat cetak invoice.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Ekspor Laporan Penjualan (CSV)
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 font-medium">Total Omset (Terfilter)</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatRupiah(totalVolume)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Dari {activeTx.length} transaksi aktif
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 font-medium">Total Estimasi Laba Kotor</span>
          <div className="text-xl font-bold text-teal-700 font-mono tabular-nums mt-1">
            {formatRupiah(totalProfit)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Margin{' '}
            {totalVolume > 0 ? ((totalProfit / totalVolume) * 100).toFixed(1) : 0}% dari
            penjualan
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs text-slate-500 font-medium">Total Volume Unit Terjual</span>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {totalItemsSold} <span className="text-xs font-normal text-slate-500">pcs</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Semua item produk</div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no invoice, pelanggan, atau nama kasir..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date range segmented buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                dateFilter === 'today'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setDateFilter('7days')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                dateFilter === '7days'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDateFilter('month')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                dateFilter === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                dateFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
          </div>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai (Cash)</option>
            <option value="qris">QRIS (Digital)</option>
            <option value="transfer">Transfer Bank</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="all">Semua Kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                Kategori: {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Total Akhir</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isVoided = tx.status === 'voided';
                  const totalItems = tx.items.reduce((s, i) => s + i.qty, 0);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isVoided ? 'bg-red-50/20 opacity-70' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-semibold text-slate-900">
                          {tx.invoiceNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">Kasir: {tx.cashierName}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{tx.customerName}</div>
                        {tx.customerPhone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tx.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">
                        {totalItems} pcs
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500">
                        {formatRupiah(tx.subtotal)}
                        {tx.discount > 0 && (
                          <div className="text-[10px] text-emerald-600">
                            Disc: -{formatRupiah(tx.discount)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="uppercase text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                            isVoided
                              ? 'text-red-700 bg-red-50'
                              : 'text-emerald-700 bg-emerald-50'
                          }`}
                        >
                          {isVoided ? 'Dibatalkan' : 'Selesai'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewInvoice(tx)}
                            title="Lihat / Cetak Struk"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            Cetak
                          </button>
                          {!isVoided && (
                            <button
                              onClick={() => setVoidConfirmTx(tx)}
                              title="Batalkan Transaksi (Kembalikan Stok)"
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Void Modal Confirmation */}
      {voidConfirmTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Batalkan Transaksi {voidConfirmTx.invoiceNumber}?
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh barang dalam nota ini (
                {voidConfirmTx.items.reduce((s, i) => s + i.qty, 0)} unit) akan otomatis
                dikembalikan ke stok toko. Transaksi akan ditandai sebagai Dibatalkan.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setVoidConfirmTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Kembali
              </button>
              <button
                onClick={handleExecuteVoid}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Ya, Batalkan & Kembalikan Stok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
