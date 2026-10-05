import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Store, Lock, Key, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, users, storeProfile } = useStore();
  const [selectedUserEmail, setSelectedUserEmail] = useState(users[0].email);
  const [pin, setPin] = useState(users[0].pin);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const ok = login(selectedUserEmail, pin);
    if (!ok) {
      setErrorMessage('PIN atau akun salah! Silakan coba lagi.');
    }
  };

  const handleQuickLogin = (email: string, userPin: string) => {
    login(email, userPin);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Store className="w-6 h-6" />
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {storeProfile.name}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Sistem Pencatatan Penjualan & Stok Barang UMKM
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {/* Quick Demo Login Switcher */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Pilih Akun Demo Cepat
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email, u.pin)}
                  className="p-3 text-left border rounded-xl hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group"
                >
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">
                    {u.name.split(' ')[0]}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 capitalize">
                    {u.role === 'owner' ? 'Pemilik (Full)' : 'Kasir Toko'}
                  </div>
                  <div className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span>Masuk Cepat</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400">Atau masuk dengan PIN</span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Pilih Nama Pengguna
              </label>
              <select
                value={selectedUserEmail}
                onChange={e => {
                  setSelectedUserEmail(e.target.value);
                  const found = users.find(u => u.email === e.target.value);
                  if (found) setPin(found.pin);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-400"
              >
                {users.map(u => (
                  <option key={u.id} value={u.email}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">PIN Keamanan</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Masukkan 4 digit PIN"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:outline-hidden focus:border-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            >
              Masuk ke Sistem Kasir
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Sistem Kasir & Inventaris UMKM · Data tersimpan lokal di browser
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
