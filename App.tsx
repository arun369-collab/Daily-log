
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Factory, 
  Archive,
  Truck,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Users,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import { ViewState, ProductionRecord, UserRole, SalesOrder } from './types';
import { getRecords, saveRecord, deleteRecord, getSalesOrders, saveSalesOrder, deleteSalesOrder, deleteSalesOrders } from './services/storageService';
import { syncUp, syncDown, isSyncEnabled } from './services/syncService';
import { Dashboard } from './components/Dashboard';
import { DataEntry } from './components/DataEntry';
import { BatchRegistry } from './components/BatchRegistry';
import { DispatchAssistant } from './components/DispatchAssistant';
import { ExportTools } from './components/ExportTools';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { LedgerSheet } from './components/LedgerSheet';
import { SalesEntry } from './components/SalesEntry';
import { SalesDashboard } from './components/SalesDashboard';
import { CustomerDatabase } from './components/CustomerDatabase';
import { PackingStock } from './components/PackingStock';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [username, setUsername] = useState<string>('Admin'); 
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Data States
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  
  // Sales States
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Check session storage for existing auth
    const storedAuth = sessionStorage.getItem('factory_flow_auth');
    const storedRole = sessionStorage.getItem('factory_flow_role') as UserRole;
    const storedUser = sessionStorage.getItem('factory_flow_username');
    
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      if (storedRole) {
        setUserRole(storedRole);
        if (storedUser) setUsername(storedUser);
        if (storedRole === 'yadav') setView('entry');
        else if (storedRole === 'sales') setView('sales_dashboard');
      }
    }
    
    // Initial Load & Sync
    loadData();
    if (isSyncEnabled()) {
      handleSyncDown();
    }
  }, []);

  const loadData = () => {
    setRecords(getRecords());
    setSalesOrders(getSalesOrders());
  };

  const handleSyncDown = async () => {
    if (syncStatus === 'syncing') return;
    setSyncStatus('syncing');
    const success = await syncDown();
    if (success) {
      loadData(); // Reload from storage after import
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const triggerSyncUp = async () => {
    setSyncStatus('syncing');
    await syncUp(); // Fire and forget mostly, but we show status
    setSyncStatus('success');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleLogin = (role: UserRole, name: string = 'User') => {
    sessionStorage.setItem('factory_flow_auth', 'true');
    sessionStorage.setItem('factory_flow_role', role);
    sessionStorage.setItem('factory_flow_username', name);
    setUserRole(role);
    setUsername(name);
    setIsAuthenticated(true);
    
    if (role === 'yadav') setView('entry');
    else if (role === 'sales') setView('sales_dashboard');
    else setView('dashboard');
    
    // Attempt sync on login
    if (isSyncEnabled()) handleSyncDown();
  };

  const handleLogout = () => {
    sessionStorage.removeItem('factory_flow_auth');
    sessionStorage.removeItem('factory_flow_role');
    sessionStorage.removeItem('factory_flow_username');
    setIsAuthenticated(false);
    setView('dashboard');
    setUserRole('admin');
    setUsername('Admin');
  };

  // --- Production Record Handlers ---
  const handleSave = (record: ProductionRecord) => {
    const updated = saveRecord(record);
    setRecords(updated);
    setView('dashboard');
    setEditingRecord(null);
    triggerSyncUp();
  };

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    setView('entry');
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Are you sure you want to delete this record?")) {
      const updated = deleteRecord(id);
      setRecords(updated);
      triggerSyncUp();
    }
  };

  // --- Sales Order Handlers ---
  const handleSaveOrder = (order: SalesOrder) => {
    const updated = saveSalesOrder(order);
    setSalesOrders(updated);
    // Stay on view (SalesEntry handles close)
    setEditingOrder(null);
    triggerSyncUp();
  };

  const handleEditOrder = (order: SalesOrder | null) => {
    setEditingOrder(order);
    setView('sales_entry');
  };
  
  // Refresh orders from local storage or trigger sync if needed
  const refreshOrders = (shouldSyncUp = false) => {
    setSalesOrders(getSalesOrders());
    // If this refresh is triggered by a data mutation (delete/update status), we sync UP.
    // If it's a manual refresh button, we might want to sync DOWN (but for now let's keep it safe).
    if (shouldSyncUp) {
      triggerSyncUp();
    }
  };
  
  // Special handler for manual refresh button that pulls data
  const handleManualRefresh = () => {
    setSalesOrders(getSalesOrders());
    if (isSyncEnabled()) handleSyncDown();
  };

  const NavItem = ({ target, icon: Icon, label }: { target: ViewState, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => {
        setView(target);
        setEditingRecord(null);
        setEditingOrder(null);
      }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all ${
        view === target 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  const MobileNavIcon = ({ target, icon: Icon, label }: { target: ViewState, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => {
        setView(target);
        setEditingRecord(null);
        setEditingOrder(null);
      }}
      className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
        view === target ? 'text-blue-600' : 'text-gray-400'
      }`}
    >
      <Icon size={view === target ? 24 : 22} strokeWidth={view === target ? 2.5 : 2} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  // Sync Indicator Component
  const SyncIndicator = () => {
    if (!isSyncEnabled()) return null;
    return (
      <button 
        onClick={handleSyncDown}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
           syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
           syncStatus === 'success' ? 'bg-green-100 text-green-700' :
           syncStatus === 'error' ? 'bg-red-100 text-red-700' :
           'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title="Sync with Cloud"
      >
        {syncStatus === 'syncing' ? (
           <RefreshCw size={14} className="animate-spin" />
        ) : syncStatus === 'success' ? (
           <CheckCircle size={14} />
        ) : syncStatus === 'error' ? (
           <AlertCircle size={14} />
        ) : (
           <Cloud size={14} />
        )}
        <span className="hidden md:inline">
          {syncStatus === 'syncing' ? 'Syncing...' : 
           syncStatus === 'success' ? 'Synced' : 
           syncStatus === 'error' ? 'Failed' : 'Sync'}
        </span>
      </button>
    );
  };

  // If not authenticated, show Login screen
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Permission Check Helper
  const canAccess = (feature: ViewState) => {
    if (userRole === 'admin') return true;
    if (userRole === 'yadav') return ['dashboard', 'entry', 'ledger_sheet', 'packing_stock'].includes(feature);
    if (userRole === 'sales') return ['sales_dashboard', 'sales_entry', 'customers'].includes(feature);
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f3f4f6] print:bg-white print:block print:h-auto print:min-h-0 print:overflow-visible">
      
      {/* Mobile Top Header */}
      <div className="md:hidden bg-white shadow-sm px-4 py-3 flex justify-between items-center sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-lg">
          <Factory className="text-blue-600" /> FactoryFlow
        </div>
        <div className="flex items-center gap-2">
           <SyncIndicator />
           {userRole === 'admin' ? (
            <button 
              onClick={() => setView('settings')}
              className={`p-2 rounded-full ${view === 'settings' ? 'bg-gray-100 text-blue-600' : 'text-gray-500'}`}
            >
              <SettingsIcon size={24} />
            </button>
          ) : (
            <button 
              onClick={handleLogout}
              className="p-2 rounded-full text-red-500 bg-red-50"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex sticky top-0 h-screen w-64 bg-white border-r border-gray-200 p-6 flex-col z-10 print:hidden">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-2xl mb-10 px-2">
          <Factory size={28} /> 
          <span>FactoryFlow</span>
        </div>

        <nav className="space-y-2 flex-1">
          {canAccess('dashboard') && <NavItem target="dashboard" icon={LayoutDashboard} label="Dashboard" />}
          {canAccess('entry') && <NavItem target="entry" icon={PlusCircle} label="Add Ledger Entry" />}
          {canAccess('ledger_sheet') && <NavItem target="ledger_sheet" icon={FileText} label="Daily Report" />}
          
          {canAccess('packing_stock') && <NavItem target="packing_stock" icon={Package} label="Packing Stock" />}
          {canAccess('batches') && <NavItem target="batches" icon={Archive} label="Batch Registry" />}
          {canAccess('dispatch') && <NavItem target="dispatch" icon={Truck} label="Dispatch Helper" />}
          {canAccess('history') && <NavItem target="history" icon={History} label="History" />}

          {/* Sales Links */}
          {(canAccess('sales_dashboard') || canAccess('customers')) && (
            <div className="pt-4 mt-4 border-t border-gray-100">
               <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">Sales</p>
               {canAccess('sales_dashboard') && <NavItem target="sales_dashboard" icon={ShoppingBag} label="My Orders" />}
               {canAccess('sales_entry') && <NavItem target="sales_entry" icon={ShoppingCart} label="New Order" />}
               {canAccess('customers') && <NavItem target="customers" icon={Users} label="Customers" />}
            </div>
          )}
        </nav>

        <div className="pt-4 mt-auto border-t border-gray-100 space-y-2">
           <div className="px-4 py-2 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
             <span>User: {username}</span>
             <SyncIndicator />
           </div>
           
           {canAccess('settings') && <NavItem target="settings" icon={SettingsIcon} label="Settings" />}
           
           <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all text-red-500 hover:bg-red-50"
           >
             <LogOut size={20} />
             <span className="font-medium">Logout</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden pb-24 md:pb-8 print:p-0 print:overflow-visible">
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:mb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {view === 'dashboard' && 'Daily Summary'}
              {view === 'entry' && (editingRecord ? 'Edit Ledger Entry' : 'New Ledger Entry')}
              {view === 'packing_stock' && 'Packing Material Stock'}
              {view === 'batches' && 'Batch Registry'}
              {view === 'ledger_sheet' && 'Daily Ledger Report'}
              {view === 'dispatch' && 'Dispatch Priority (FIFO)'}
              {view === 'history' && 'Ledger History'}
              {view === 'settings' && 'App Configuration'}
              {view === 'sales_dashboard' && 'Sales Dashboard'}
              {view === 'sales_entry' && (editingOrder ? 'Edit Order' : 'New Sales Order')}
              {view === 'customers' && 'Customer Database'}
            </h1>
            <p className="text-gray-500 text-sm mt-1 print:hidden hidden md:block">
              Welcome, <span className="capitalize font-semibold">{username}</span>.
            </p>
          </div>
          
          {userRole === 'admin' && (view === 'history' || view === 'batches' || view === 'dispatch') && (
            <ExportTools records={records} />
          )}
        </header>

        <div className="max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard records={records} />}
          
          {view === 'entry' && (
            <DataEntry 
              key={editingRecord ? editingRecord.id : 'new'} 
              onSave={handleSave} 
              onCancel={() => { setView('dashboard'); setEditingRecord(null); }} 
              initialData={editingRecord}
            />
          )}

          {canAccess('packing_stock') && view === 'packing_stock' && <PackingStock records={records} />}

          {canAccess('batches') && view === 'batches' && <BatchRegistry records={records} />}
          
          {canAccess('ledger_sheet') && view === 'ledger_sheet' && <LedgerSheet records={records} />}
          
          {canAccess('dispatch') && view === 'dispatch' && <DispatchAssistant records={records} />}

          {canAccess('settings') && view === 'settings' && <Settings onLogout={handleLogout} />}

          {canAccess('sales_dashboard') && view === 'sales_dashboard' && (
            <SalesDashboard 
              orders={salesOrders} 
              productionRecords={records}
              onEditOrder={handleEditOrder}
              userRole={userRole}
              onRefreshData={() => refreshOrders(true)}
              onManualRefresh={handleManualRefresh}
            />
          )}

          {canAccess('sales_entry') && view === 'sales_entry' && (
             <SalesEntry 
               key={editingOrder ? editingOrder.id : 'new-order'}
               onSave={handleSaveOrder} 
               onCancel={() => { setView('sales_dashboard'); setEditingOrder(null); }} 
               salesPersonName={username}
               userRole={userRole}
               initialOrder={editingOrder}
             />
          )}

          {canAccess('customers') && view === 'customers' && <CustomerDatabase />}

          {canAccess('history') && view === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 print:bg-gray-100 print:text-black">
                    <tr>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Date</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Batch No</th>
                      <th className="px-4 py-4 font-medium whitespace-nowrap">Product</th>
                      <th className="px-4 py-4 font-medium text-right whitespace-nowrap">Weight</th>
                      <th className="px-4 py-4 font-medium text-right whitespace-nowrap print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors print:hover:bg-transparent">
                        <td className="px-4 py-4 whitespace-nowrap">{r.date}</td>
                        <td className="px-4 py-4 font-mono text-xs text-gray-600 font-bold">{r.batchNo}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 line-clamp-1">{r.productName}</div>
                          <div className="text-xs text-gray-500">{r.size}</div>
                        </td>
                        <td className="px-4 py-4 text-right font-mono text-blue-600 print:text-black">{r.weightKg.toFixed(2)}</td>
                        <td className="px-4 py-4 text-center print:hidden">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(r)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            >
                              <SettingsIcon size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(r.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                              <LogOut size={16} className="rotate-180" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 h-16 px-2 flex justify-between items-center print:hidden safe-area-pb">
         
         {(userRole === 'admin' || userRole === 'yadav') && (
           <>
             <MobileNavIcon target="dashboard" icon={LayoutDashboard} label="Home" />
             
             {userRole === 'admin' && <MobileNavIcon target="sales_dashboard" icon={ShoppingBag} label="Orders" />}
             {userRole === 'yadav' && <MobileNavIcon target="ledger_sheet" icon={FileText} label="Report" />}
             
             <div className="relative -top-6">
                <button 
                  onClick={() => { setView('entry'); setEditingRecord(null); }}
                  className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-600/40 flex items-center justify-center transform active:scale-95 transition-transform"
                >
                  <Plus size={32} />
                </button>
             </div>
    
             {userRole === 'admin' && <MobileNavIcon target="packing_stock" icon={Package} label="Stock" />}
             {userRole === 'yadav' && <MobileNavIcon target="batches" icon={Archive} label="Batches" />}

             {canAccess('history') && <MobileNavIcon target="history" icon={History} label="History" />}
           </>
         )}

         {userRole === 'sales' && (
           <>
              <MobileNavIcon target="sales_dashboard" icon={ShoppingBag} label="Orders" />
              <MobileNavIcon target="customers" icon={Users} label="Clients" />
              <div className="relative -top-6 mx-auto">
                <button 
                  onClick={() => setView('sales_entry')}
                  className="bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-600/40 flex items-center justify-center transform active:scale-95 transition-transform"
                >
                  <Plus size={32} />
                </button>
             </div>
             <div className="w-8"></div>
           </>
         )}
      </nav>
    </div>
  );
}

export default App;
