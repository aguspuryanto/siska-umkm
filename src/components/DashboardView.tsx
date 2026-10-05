import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatDateTime, formatNumber } from '../utils/formatters';
import { Product, Transaction } from '../types';
import {
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  PlusCircle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigatePOS: () => void;
  onNavigateProducts: () => void;
  onViewInvoice: (tx: Transaction) => void;
  onRestockProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigatePOS,
  onNavigateProducts,
  onViewInvoice,
  onRestockProduct,
}) => {
  const { products, transactions } = useStore();
  const [chartMetric, setChartMetric] = useState<'sales' | 'profit'>('sales');

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // Transactions calculations
  const activeTx = transactions.filter(t => t.status !== 'voided');

  // Today
  const todayTx = activeTx.filter(t => {
    const d = new Date(t.date);
    return (
      d.getFullYear() === currentYear &&
      d.getMonth() === currentMonth &&
      d.getDate() === currentDate
    );
  });
  const todaySales = todayTx.reduce((sum, t) => sum + t.total, 0);
  const todayProfit = todayTx.reduce((sum, t) => sum + (t.profit || 0), 0);

  // This month
  const thisMonthTx = activeTx.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const monthSales = thisMonthTx.reduce((sum, t) => sum + t.total, 0);
  const monthProfit = thisMonthTx.reduce((sum, t) => sum + (t.profit || 0), 0);

  // Inventory stats
  const totalStockAssets = products.reduce((sum, p) => sum + p.costPrice * p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  // 7-day sales breakdown
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dayTx = activeTx.filter(t => {
      const td = new Date(t.date);
      return (
        td.getFullYear() === d.getFullYear() &&
        td.getMonth() === d.getMonth() &&
        td.getDate() === d.getDate()
      );
    });

    const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d);
    const dayTotal = dayTx.reduce((sum, t) => sum + t.total, 0);
    const dayProfit = dayTx.reduce((sum, t) => sum + (t.profit || 0), 0);
    const count = dayTx.length;

    return {
      date: d,
      label: dayName,
      sales: dayTotal,
      profit: dayProfit,
      count,
    };
  });

  const maxChartVal = Math.max(
    ...last7Days.map(d => (chartMetric === 'sales' ? d.sales : d.profit)),
    100000
  );

  // Best selling products (Barang Terlaris)
  const productSalesMap: Record<
    string,
    { name: string; sku: string; qty: number; revenue: number }
  > = {};

  activeTx.forEach(tx => {
    tx.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: item.productName,
          sku: item.sku,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].qty += item.qty;
      productSalesMap[item.productId].revenue += item.subtotal;
    });
  });

  const topSelling = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxTopQty = topSelling.length > 0 ? topSelling[0].qty : 1;

  // Recent 5 transactions
  const recentTransactions = [...transactions].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Start */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Ringkasan Usaha Hari Ini
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data transaksi, performa omset, dan ketersediaan stok barang ter-update secara otomatis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigatePOS}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
          >
            <ShoppingCart className="w-4 h-4" />
            Mulai Transaksi Baru (Kasir)
          </button>
          <button
            onClick={onNavigateProducts}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Package className="w-4 h-4" />
            Kelola Stok
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Penjualan Hari Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Penjualan Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatRupiah(todaySales)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 font-mono tabular-nums">
                {todayTx.length}
              </span>{' '}
              transaksi berhasil
            </div>
          </div>
        </div>

        {/* Metric 2: Estimasi Laba Hari Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Laba Bersih Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-teal-700 font-mono tabular-nums">
              {formatRupiah(todayProfit)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Margin:{' '}
              <span className="font-semibold text-teal-600 font-mono tabular-nums">
                {todaySales > 0 ? ((todayProfit / todaySales) * 100).toFixed(1) : 0}%
              </span>{' '}
              dari omset
            </div>
          </div>
        </div>

        {/* Metric 3: Penjualan Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Omset Bulan Ini</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatRupiah(monthSales)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Est. Laba:{' '}
              <span className="font-semibold text-blue-600 font-mono tabular-nums">
                {formatRupiah(monthProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 4: Total Nilai Aset Stok */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Nilai Aset Stok Barang</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
              {formatRupiah(totalStockAssets)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Total{' '}
              <span className="font-semibold text-slate-700 font-mono tabular-nums">
                {products.length}
              </span>{' '}
              jenis item barang
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Alert Banner (if any) */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-amber-900">
                  Perhatian: {lowStockProducts.length} Barang Mendekati Batas Minimum Stok
                </h3>
                <p className="text-xs text-amber-800/80 mt-0.5">
                  Segera pesan ulang ke supplier agar tidak kehabisan barang dagangan saat jam ramai.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lowStockProducts.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      onClick={() => onRestockProduct(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-900 bg-white border border-amber-300 rounded hover:bg-amber-100/50 transition-colors"
                    >
                      <span>{item.name}</span>
                      <span className="font-mono text-amber-700 font-semibold tabular-nums">
                        (Sisa: {item.stock} {item.unit})
                      </span>
                      <PlusCircle className="w-3 h-3 text-amber-700" />
                    </button>
                  ))}
                  {lowStockProducts.length > 4 && (
                    <button
                      onClick={onNavigateProducts}
                      className="text-xs text-amber-900 underline hover:text-amber-950 font-medium py-1 px-2"
                    >
                      + {lowStockProducts.length - 4} lainnya
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onNavigateProducts}
              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              Lihat Semua Stok
            </button>
          </div>
        </div>
      )}

      {/* Mid Section: 7-day Sales Bar Chart & Best Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Grafik Penjualan 7 Hari Terakhir
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Analisis pergerakan transaksi dan laba kotor harian
              </p>
            </div>

            {/* Toggle metric */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setChartMetric('sales')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartMetric === 'sales'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Omset
              </button>
              <button
                onClick={() => setChartMetric('profit')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  chartMetric === 'profit'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Laba Kotor
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="py-6">
            <div className="flex items-end justify-between gap-3 h-48 pt-6">
              {last7Days.map((day, idx) => {
                const currentVal = chartMetric === 'sales' ? day.sales : day.profit;
                const percentage = maxChartVal > 0 ? (currentVal / maxChartVal) * 100 : 0;
                const barHeight = Math.max(percentage, 4);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 text-center pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded shadow whitespace-nowrap font-mono tabular-nums">
                        {formatRupiah(currentVal)}
                        <div className="text-slate-400">{day.count} transaksi</div>
                      </div>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-md relative flex items-end justify-center overflow-hidden h-36">
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          chartMetric === 'sales'
                            ? 'bg-emerald-600 group-hover:bg-emerald-500'
                            : 'bg-teal-600 group-hover:bg-teal-500'
                        }`}
                      />
                    </div>

                    {/* Date label */}
                    <span className="text-[11px] font-medium text-slate-500 mt-2 truncate w-full text-center">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-sm ${
                    chartMetric === 'sales' ? 'bg-emerald-600' : 'bg-teal-600'
                  }`}
                />
                <span>{chartMetric === 'sales' ? 'Total Omset' : 'Estimasi Laba Kotor'}</span>
              </div>
            </div>
            <span>Diperbarui otomatis secara real-time</span>
          </div>
        </div>

        {/* Top Selling Items (1 Col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Barang Terlaris</h2>
                <p className="text-xs text-slate-500 mt-0.5">Top produk paling sering dibeli</p>
              </div>
              <span className="text-[11px] text-slate-400 uppercase font-medium">Berdasarkan Qty</span>
            </div>

            <div className="mt-4 space-y-4">
              {topSelling.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada data transaksi penjualan.
                </div>
              ) : (
                topSelling.map((item, idx) => {
                  const percent = Math.round((item.qty / maxTopQty) * 100);
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-slate-400 text-[11px] w-4">{idx + 1}.</span>
                          <span className="font-medium text-slate-900 truncate">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-700 shrink-0 font-mono tabular-nums">
                          {formatNumber(item.qty)} terjual
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="bg-emerald-600 h-full rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                        <span>SKU: {item.sku}</span>
                        <span>Total: {formatRupiah(item.revenue)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateProducts}
              className="w-full py-1.5 text-xs text-center font-medium text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Lihat Analisis Semua Produk →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Transaksi Terbaru</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              5 transaksi kasir terakhir yang tercatat di sistem
            </p>
          </div>
          <button
            onClick={() => onNavigatePOS()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            + Buat Transaksi
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium">
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Total Transaksi</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map(tx => {
                const isVoided = tx.status === 'voided';
                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {tx.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{formatDateTime(tx.date)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{tx.customerName}</td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-600">
                      {tx.items.reduce((s, i) => s + i.qty, 0)} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
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
                      <button
                        onClick={() => onViewInvoice(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        Invoice / Struk
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
