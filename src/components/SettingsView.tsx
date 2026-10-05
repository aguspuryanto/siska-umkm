import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { StoreProfile } from '../types';
import {
  Settings,
  Store,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Shield,
  Key,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    storeProfile,
    updateStoreProfile,
    currentUser,
    users,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDefaultData,
  } = useStore();

  const [formData, setFormData] = useState<StoreProfile>({ ...storeProfile });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_pos_umkm_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        setImportStatus('Data berhasil dipulihkan dari file cadangan!');
      } else {
        setImportStatus('Gagal memulihkan: Format file JSON tidak valid.');
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Pengaturan Toko & Profil Usaha
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan identitas bisnis UMKM Anda, informasi struk/invoice, dan kelola cadangan data.
        </p>
      </div>

      {/* Store Profile Form */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Identitas Toko di Struk & Nota</h2>
          </div>
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md">
              <CheckCircle className="w-3.5 h-3.5" />
              Perubahan berhasil disimpan!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Nama Toko / Usaha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Slogan / Deskripsi Singkat
              </label>
              <input
                type="text"
                value={formData.slogan}
                onChange={e => setFormData({ ...formData, slogan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                No. WhatsApp / Telepon Toko
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Nama Pemilik (Owner)
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Alamat Lengkap Toko
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Catatan Kaki Struk (Footer Note)
            </label>
            <textarea
              rows={2}
              value={formData.footerNote}
              onChange={e => setFormData({ ...formData, footerNote: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Teks ini dicetak di bagian paling bawah struk kasir thermal maupun nota A4.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Identitas Toko
            </button>
          </div>
        </form>
      </div>

      {/* User Accounts Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Hak Akses & Pengguna Sistem</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem menyediakan akun Owner (akses penuh) dan Kasir untuk operasional harian.
          </p>
        </div>

        <div className="p-6 divide-y divide-slate-100 text-xs">
          {users.map(u => (
            <div key={u.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  <span>{u.name}</span>
                  {currentUser?.id === u.id && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                      Aktif Sedang Masuk
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Email: {u.email} · Peran:{' '}
                  <span className="font-medium text-slate-700 capitalize">{u.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded text-[11px]">
                  PIN: {u.pin}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-900">Cadangan & Pemulihan Data</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data toko Anda tersimpan aman di browser (LocalStorage). Anda dapat mengunduh salinan
            cadangan file JSON kapan saja untuk disimpan di komputer atau dipindahkan ke perangkat
            lain.
          </p>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Cadangkan Data (Backup)</h3>
                <p className="text-slate-500 text-[11px] mt-1">
                  Unduh seluruh data produk, riwayat transaksi kasir, log stok, dan profil toko ke
                  format file JSON.
                </p>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Cadangan JSON
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Pulihkan Data (Restore)</h3>
                <p className="text-slate-500 text-[11px] mt-1">
                  Upload file cadangan JSON yang pernah Anda unduh sebelumnya untuk mengembalikan
                  seluruh data toko.
                </p>
              </div>
              <label className="mt-4 flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Pilih File Cadangan
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-slate-900">Reset ke Data Contoh (Demo Awal)</h4>
              <p className="text-slate-500 text-[11px]">
                Mengembalikan barang dan transaksi ke data awal default untuk keperluan demonstrasi.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin mereset seluruh data ke contoh demo awal?')) {
                  resetToDefaultData();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
