import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { ProductsView } from './components/ProductsView';
import { TransactionsView } from './components/TransactionsView';
import { StockLogView } from './components/StockLogView';
import { SettingsView } from './components/SettingsView';
import { InvoiceModal } from './components/InvoiceModal';
import { AuthView } from './components/AuthView';
import { Transaction, Product } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, storeProfile } = useStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Invoice modal state
  const [activeInvoiceTx, setActiveInvoiceTx] = useState<Transaction | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  // Quick restock product passthrough
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);

  if (!currentUser) {
    return <AuthView />;
  }

  const handleTransactionComplete = (newTx: Transaction) => {
    setActiveInvoiceTx(newTx);
    setShowSuccessBanner(true);
    setIsInvoiceModalOpen(true);
  };

  const handleViewInvoice = (tx: Transaction) => {
    setActiveInvoiceTx(tx);
    setShowSuccessBanner(false);
    setIsInvoiceModalOpen(true);
  };

  const handleTriggerQuickRestock = (product: Product) => {
    setQuickRestockProduct(product);
    setCurrentTab('products');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onTabChange={tab => {
          setCurrentTab(tab);
          setQuickRestockProduct(null);
        }}
        onOpenNewSale={() => {
          setCurrentTab('pos');
          setQuickRestockProduct(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigatePOS={() => setCurrentTab('pos')}
            onNavigateProducts={() => setCurrentTab('products')}
            onViewInvoice={handleViewInvoice}
            onRestockProduct={handleTriggerQuickRestock}
          />
        )}

        {currentTab === 'pos' && (
          <POSView onTransactionComplete={handleTransactionComplete} />
        )}

        {currentTab === 'products' && (
          <ProductsView onQuickRestockProduct={quickRestockProduct} />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView onViewInvoice={handleViewInvoice} />
        )}

        {currentTab === 'stock' && <StockLogView />}

        {currentTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div>
            © {new Date().getFullYear()} {storeProfile.name} · Solusi Pembukuan & Kasir UMKM
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="hover:text-slate-600 transition-colors"
            >
              Ringkasan
            </button>
            <button
              onClick={() => setCurrentTab('pos')}
              className="hover:text-slate-600 transition-colors"
            >
              Kasir
            </button>
            <button
              onClick={() => setCurrentTab('products')}
              className="hover:text-slate-600 transition-colors"
            >
              Stok Barang
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className="hover:text-slate-600 transition-colors"
            >
              Pengaturan
            </button>
          </div>
        </div>
      </footer>

      {/* Invoice / Struk Modal */}
      <InvoiceModal
        transaction={activeInvoiceTx}
        storeProfile={storeProfile}
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setShowSuccessBanner(false);
        }}
        onNewTransaction={() => {
          setIsInvoiceModalOpen(false);
          setCurrentTab('pos');
        }}
        showSuccessBanner={showSuccessBanner}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}
