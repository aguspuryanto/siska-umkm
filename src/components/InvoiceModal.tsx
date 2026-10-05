import React, { useState } from 'react';
import { Transaction, StoreProfile } from '../types';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { Printer, Download, Share2, X, CheckCircle, FileText, Receipt } from 'lucide-react';

interface InvoiceModalProps {
  transaction: Transaction | null;
  storeProfile: StoreProfile;
  isOpen: boolean;
  onClose: () => void;
  onNewTransaction?: () => void;
  showSuccessBanner?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  transaction,
  storeProfile,
  isOpen,
  onClose,
  onNewTransaction,
  showSuccessBanner = false,
}) => {
  const [format, setFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsList = transaction.items
      .map(
        i =>
          `• ${i.productName} (${i.qty}x @${formatRupiah(i.sellingPrice)}) = ${formatRupiah(i.subtotal)}`
      )
      .join('\n');

    const message = `*NOTA PENJUALAN - ${storeProfile.name}*
No. Invoice: ${transaction.invoiceNumber}
Tanggal: ${formatDateTime(transaction.date)}
Kasir: ${transaction.cashierName}
Pelanggan: ${transaction.customerName}
----------------------------------------
${itemsList}
----------------------------------------
Subtotal: ${formatRupiah(transaction.subtotal)}${
      transaction.discount > 0 ? `\nDiskon: -${formatRupiah(transaction.discount)}` : ''
    }
*TOTAL: ${formatRupiah(transaction.total)}*
Metode: ${transaction.paymentMethod.toUpperCase()}
Bayar: ${formatRupiah(transaction.cashPaid)}
Kembali: ${formatRupiah(transaction.change)}
----------------------------------------
_${storeProfile.footerNote}_`;

    let phone = transaction.customerPhone?.replace(/[^0-9]/g, '') || '';
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Invoice {transaction.invoiceNumber}
              </h2>
              <p className="text-xs text-slate-500">
                {formatDateTime(transaction.date)} · Kasir: {transaction.cashierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Banner if freshly checked out */}
        {showSuccessBanner && (
          <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between text-emerald-800 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Transaksi berhasil disimpan! Stok barang telah otomatis terpotong.
              </span>
            </div>
            {transaction.change > 0 && (
              <span className="font-semibold text-emerald-700 font-mono tabular-nums">
                Kembalian: {formatRupiah(transaction.change)}
              </span>
            )}
          </div>
        )}

        {/* Format Selector Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between bg-white border-b border-slate-100">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                format === 'thermal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Struk Kasir (Thermal)
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                format === 'a4'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Invoice Formal (A4)
            </button>
          </div>

          <div className="text-xs text-slate-500">
            Status: <span className="font-medium text-emerald-600 uppercase">Lunas</span>
          </div>
        </div>

        {/* Preview Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/70 flex justify-center">
          {format === 'thermal' ? (
            /* Thermal Receipt 58/80mm preview */
            <div
              id="printable-receipt"
              className="w-full max-w-sm bg-white p-6 shadow-sm border border-slate-200 font-mono text-xs text-slate-800"
            >
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-base text-slate-900 uppercase tracking-tight">
                  {storeProfile.name}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">{storeProfile.slogan}</p>
                <p className="text-[11px] text-slate-500 mt-1">{storeProfile.address}</p>
                <p className="text-[11px] text-slate-500">Telp/WA: {storeProfile.phone}</p>
              </div>

              {/* Meta */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Nota:</span>
                  <span className="font-semibold">{transaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{formatDateTime(transaction.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{transaction.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{transaction.customerName}</span>
                </div>
              </div>

              {/* Itemized list */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-medium text-slate-900">{item.productName}</div>
                    <div className="flex justify-between text-slate-600 tabular-nums">
                      <span>
                        {item.qty} {item.unit} x {formatRupiah(item.sellingPrice)}
                      </span>
                      <span>{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatRupiah(transaction.subtotal)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Diskon:</span>
                    <span className="tabular-nums">-{formatRupiah(transaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOTAL:</span>
                  <span className="tabular-nums">{formatRupiah(transaction.total)}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>Bayar ({transaction.paymentMethod.toUpperCase()}):</span>
                  <span className="tabular-nums">{formatRupiah(transaction.cashPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-900">
                  <span>Kembali:</span>
                  <span className="tabular-nums">{formatRupiah(transaction.change)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 space-y-1 text-[11px] text-slate-500">
                <p className="font-medium text-slate-700">{storeProfile.footerNote}</p>
                <p className="text-[10px] text-slate-400 mt-2">=== Simpan struk ini sebagai bukti pembayaran sah ===</p>
              </div>
            </div>
          ) : (
            /* A4 Formal Invoice Preview */
            <div
              id="printable-invoice"
              className="w-full bg-white p-8 shadow-sm border border-slate-200 text-slate-800 text-xs"
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    {storeProfile.name}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">{storeProfile.slogan}</p>
                  <p className="text-xs text-slate-600 mt-1">{storeProfile.address}</p>
                  <p className="text-xs text-slate-600">WhatsApp/Telp: {storeProfile.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded">
                    FAKTUR PENJUALAN
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-3 font-mono">
                    {transaction.invoiceNumber}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Tanggal: {formatDateTime(transaction.date)}
                  </p>
                </div>
              </div>

              {/* Bill to & Cashier */}
              <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    Ditagihkan Kepada:
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">{transaction.customerName}</p>
                  {transaction.customerPhone && (
                    <p className="text-slate-600">{transaction.customerPhone}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    Kasir Pelayan:
                  </span>
                  <p className="font-semibold text-slate-900 mt-0.5">{transaction.cashierName}</p>
                  <p className="text-slate-600">
                    Metode Bayar: {transaction.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mt-4 text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase font-semibold">
                    <th className="py-2">No</th>
                    <th className="py-2">Barang</th>
                    <th className="py-2 text-right">Harga Satuan</th>
                    <th className="py-2 text-center">Jumlah</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaction.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="font-medium text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.sku}</div>
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums">
                        {formatRupiah(item.sellingPrice)}
                      </td>
                      <td className="py-2.5 text-center font-mono tabular-nums">
                        {item.qty} {item.unit}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Calculations */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(transaction.subtotal)}</span>
                  </div>
                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Potongan Diskon:</span>
                      <span className="font-mono tabular-nums">-{formatRupiah(transaction.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total Tagihan:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(transaction.total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Jumlah Dibayar:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(transaction.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Kembalian:</span>
                    <span className="font-mono tabular-nums">{formatRupiah(transaction.change)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="mt-12 pt-6 border-t border-slate-100 grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="text-slate-500">Penerima / Pembeli</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-800">
                    ( {transaction.customerName} )
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Kasir / Pengelola</p>
                  <div className="h-16"></div>
                  <p className="font-semibold text-slate-800">
                    ( {transaction.cashierName} )
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Cetak Sekarang
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Simpan PDF
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Kirim WhatsApp
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onNewTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onNewTransaction();
                }}
                className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              >
                + Transaksi Baru
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
