import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { formatDateTime, exportToCSV } from '../utils/formatters';
import { ArrowLeftRight, Search, Download, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';

export const StockLogView: React.FC = () => {
  const { stockMovements } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredMovements = useMemo(() => {
    return stockMovements.filter(m => {
      const matchSearch =
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [stockMovements, searchQuery, typeFilter]);

  const handleExportCSV = () => {
    const headers = [
      'Waktu',
      'Nama Barang',
      'SKU',
      'Tipe Perubahan',
      'Jumlah (Qty)',
      'Stok Awal',
      'Stok Akhir',
      'Alasan / Referensi',
    ];

    const rows = filteredMovements.map(m => [
      formatDateTime(m.date),
      m.productName,
      m.sku,
      m.type.toUpperCase(),
      m.qty,
      m.previousStock,
      m.currentStock,
      m.referenceId ? `${m.reason} (${m.referenceId})` : m.reason,
    ]);

    exportToCSV(`mutasi_stok_barang_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Log Mutasi & Riwayat Stok
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Catatan audit otomatis untuk setiap perubahan stok masuk, penjualan, pembatalan, dan
            penyesuaian barang.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Ekspor Log Mutasi (CSV)
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari barang, SKU, nomor invoice, atau keterangan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              typeFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter('sale')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              typeFilter === 'sale'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Penjualan
          </button>
          <button
            onClick={() => setTypeFilter('in')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              typeFilter === 'in'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Restok Masuk
          </button>
          <button
            onClick={() => setTypeFilter('void')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              typeFilter === 'void'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Batal Transaksi
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-medium">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Barang</th>
                <th className="py-3 px-4 text-center">Tipe</th>
                <th className="py-3 px-4 text-center">Perubahan</th>
                <th className="py-3 px-4 text-center">Stok Sebelum</th>
                <th className="py-3 px-4 text-center">Stok Akhir</th>
                <th className="py-3 px-4">Keterangan / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat mutasi stok.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => {
                  const isPositive = m.qty > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDateTime(m.date)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{m.productName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{m.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                            m.type === 'in'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.type === 'sale'
                              ? 'bg-blue-50 text-blue-700'
                              : m.type === 'void'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.type === 'in'
                            ? 'Masuk'
                            : m.type === 'sale'
                            ? 'Keluar (Jual)'
                            : m.type === 'void'
                            ? 'Retur Batal'
                            : 'Koreksi'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold tabular-nums">
                        <span className={isPositive ? 'text-emerald-600' : 'text-slate-900'}>
                          {isPositive ? `+${m.qty}` : m.qty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums text-slate-500">
                        {m.previousStock}
                      </td>
                      <td className="py-3 px-4 text-center font-mono tabular-nums font-semibold text-slate-900">
                        {m.currentStock}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{m.reason}</div>
                        {m.referenceId && (
                          <div className="text-[10px] font-mono text-slate-400">
                            Ref: {m.referenceId}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
