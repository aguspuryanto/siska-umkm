import React from 'react';
import { useStore } from '../context/StoreContext';
import { ShoppingCart, LayoutDashboard, Package, Clock, ArrowLeftRight, Settings, LogOut, User } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, onOpenNewSale }) => {
  const { storeProfile, currentUser, logout, switchUserRole } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir Penjualan', icon: ShoppingCart },
    { id: 'products', label: 'Data Barang', icon: Package },
    { id: 'transactions', label: 'Riwayat Transaksi', icon: Clock },
    { id: 'stock', label: 'Mutasi Stok', icon: ArrowLeftRight },
    { id: 'settings', label: 'Pengaturan Toko', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => onTabChange('dashboard')}
            className="text-left group cursor-pointer focus:outline-hidden"
          >
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
              {storeProfile.name}
            </span>
          </button>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2.5">
            {currentTab !== 'pos' && (
              <button
                onClick={onOpenNewSale}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Buka Kasir
              </button>
            )}

            {/* User switcher & status */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
              <div className="px-2 py-1 text-slate-700 font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="max-w-[100px] truncate">{currentUser?.name.split(' ')[0]}</span>
                <span className="text-[10px] text-slate-400">({currentUser?.role === 'owner' ? 'Owner' : 'Kasir'})</span>
              </div>

              <button
                title="Ganti Peran Kasir / Owner"
                onClick={() => switchUserRole(currentUser?.role === 'owner' ? 'cashier' : 'owner')}
                className="px-1.5 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors text-[10px] font-medium"
              >
                Ganti
              </button>

              <button
                title="Keluar"
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-200 rounded transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
