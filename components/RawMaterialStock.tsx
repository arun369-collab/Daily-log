
import React, { useState, useMemo } from 'react';
import { StockTransaction, ViewState } from '../types';
import { getStockTransactions, saveStockTransaction, deleteStockTransaction } from '../services/storageService';
import { syncUp } from '../services/syncService';
import { Layers, Plus, Minus, Search, RefreshCw, History, Trash2, X, Download, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react';

const CALC_START_DATE = '2025-12-01';

interface RMItem {
  id: string;
  name: string;
  openingStock: number;
  unit: string;
  remark: string;
}

const MASTER_RM_LIST: RMItem[] = [
  { id: 'RM1001', name: 'PLAIN WIRE ROD 5.5 mm', openingStock: 27660, unit: 'KGS', remark: 'Per coil 1844 kg' },
  { id: 'RM1002', name: 'PLAIN WIRE ROD 5.5 mm AISI/SAE1006', openingStock: 25574, unit: 'KGS', remark: 'Per coil 1826.26 kg' },
  { id: 'RM1003', name: 'POTASSIUM SODIUM SILICATE (LIQUID)Mix', openingStock: 28420, unit: 'KGS', remark: 'Per drum 290 kg' },
  { id: 'RM1004', name: 'POTASSIUM SILICATE (LIQUID)', openingStock: 18810, unit: 'KGS', remark: 'Per drum 285 kg' },
  { id: 'RM1005', name: 'SODIUM SILICATE (LIQUID)', openingStock: 240, unit: 'KGS', remark: 'Per drum 280 kg' },
  { id: 'RM1006', name: 'CELLULOSE POWDER (Grade-Special)', openingStock: 6750, unit: 'KGS', remark: 'Each bag 25kg' },
  { id: 'RM1007', name: 'FERRO MANGANESE HC', openingStock: 1000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1008', name: 'FERRO MANGANESE LC', openingStock: 2000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1009', name: 'CALCIUM ALGINATE', openingStock: 765, unit: 'KGS', remark: 'Each bag 25/500kg' },
  { id: 'RM1010', name: 'SODIUM CMC', openingStock: 580, unit: 'KGS', remark: 'Each bag 500kg' },
  { id: 'RM1011', name: 'QUARTZ', openingStock: 10000, unit: 'KGS', remark: 'Each bag 50/1000kg' },
  { id: 'RM1012', name: 'POTASH FELDSPAR', openingStock: 6000, unit: 'KGS', remark: 'Each bag 50/1000kg' },
  { id: 'RM1013', name: 'CHINA CLAY', openingStock: 4000, unit: 'KGS', remark: 'Each bag 500/40kg' },
  { id: 'RM1014', name: 'MICA POWDER', openingStock: 7820, unit: 'KGS', remark: 'Each bag 500/40kg' },
  { id: 'RM1015', name: 'IRON POWDER (Grade: 40.29)', openingStock: 5000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1016', name: 'RUTILE SAND', openingStock: 19000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1017', name: 'FERRO SILICON POWDER 45%STABILISED', openingStock: 5000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1018', name: 'ACID GRADE FLUORSPAR', openingStock: 6000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1019', name: 'CALCIUM CARBONATE', openingStock: 2000, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1020', name: 'GRAPHITE POWDER (200)', openingStock: 450, unit: 'KGS', remark: 'Each bag 25kg' },
  { id: 'RM1021', name: 'CALCINED ALUMINA', openingStock: 495, unit: 'KGS', remark: 'Each Bag 500kg' },
  { id: 'RM1022', name: 'BARIUM CARBONATE', openingStock: 1950, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1023', name: 'FERRO TITANIUM', openingStock: 200, unit: 'KGS', remark: 'Each Tin 250kg' },
  { id: 'RM1024', name: 'NICKEL METAL POWDER', openingStock: 400, unit: 'KGS', remark: 'Each Tin 250kg' },
  { id: 'RM1025', name: 'MICACEOUS IRON OXIDE', openingStock: 400, unit: 'KGS', remark: 'Each Bag 500kg' },
  { id: 'RM1026', name: 'NICKEL WIRE - 3.2 X350 MM', openingStock: 0, unit: 'KGS', remark: 'Each Box 25kg' },
  { id: 'RM1027', name: 'NICKEL WIRE - 4.0 X 350MM', openingStock: 100, unit: 'KGS', remark: 'Each Box 25kg' },
  { id: 'RM1028', name: 'NICKEL IRON WIRE - 3.2 X 350MM', openingStock: 175, unit: 'KGS', remark: 'Each Box 25kg' },
  { id: 'RM1029', name: 'NICKEL IRON WIRE - 4.0 X 350MM', openingStock: 411, unit: 'KGS', remark: 'Each Box 25kg' },
  { id: 'RM1030', name: 'FERRO MOLYBDENUM', openingStock: 70, unit: 'KGS', remark: 'Each Tin 50kg' },
  { id: 'RM1031', name: 'CHROMIUM POWDER', openingStock: 90, unit: 'KGS', remark: 'Each Tin 50kg' },
  { id: 'RM1032', name: 'ARABIC GUM POWDER', openingStock: 998, unit: 'KGS', remark: 'Each bag 500kg' },
  { id: 'RM1033', name: 'ELECTROLYTIC MANGANESE', openingStock: 246, unit: 'KGS', remark: 'Each Tin 250kg' },
  { id: 'RM1034', name: 'IRON POWDER (Grade: 40.37)', openingStock: 948, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1035', name: 'MANGANESE CARBONATE', openingStock: 1965, unit: 'KGS', remark: 'Each bag 1000kg' },
  { id: 'RM1036', name: 'CELLULOSE POWDER (Special)', openingStock: 25, unit: 'KGS', remark: 'Each bag 25kg' },
  { id: 'RM1037', name: 'TITANIUM DIOXIDE', openingStock: 1000, unit: 'KGS', remark: 'Each bag 25kg' },
  { id: 'RM1038', name: 'CELLULOSE SPECIAL', openingStock: 50, unit: 'KGS', remark: 'Each bag 25kg' },
];

export const RawMaterialStock: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState<StockTransaction[]>(getStockTransactions());
  const [modalItem, setModalItem] = useState<{ item: RMItem; type: 'INWARD' | 'ISSUE' } | null>(null);
  const [modalQty, setModalQty] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const stockData = useMemo(() => {
    return MASTER_RM_LIST.map(item => {
      const relevantTxns = transactions.filter(t => t.itemId === item.id);
      
      const prevInward = relevantTxns.filter(t => t.date < selectedDate && t.type === 'INWARD').reduce((s, t) => s + t.qty, 0);
      const prevIssue = relevantTxns.filter(t => t.date < selectedDate && t.type === 'ISSUE').reduce((s, t) => s + t.qty, 0);
      const dynamicOpening = item.openingStock + prevInward - prevIssue;

      const dailyInward = relevantTxns.filter(t => t.date === selectedDate && t.type === 'INWARD').reduce((s, t) => s + t.qty, 0);
      const dailyIssue = relevantTxns.filter(t => t.date === selectedDate && t.type === 'ISSUE').reduce((s, t) => s + t.qty, 0);

      return {
        ...item,
        dynamicOpening,
        dailyInward,
        dailyIssue,
        available: dynamicOpening + dailyInward - dailyIssue
      };
    });
  }, [transactions, selectedDate]);

  const filtered = stockData.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.id.includes(searchTerm.toUpperCase())
  );

  const handleSaveTransaction = async () => {
    if (!modalItem || !modalQty) return;
    const txn: StockTransaction = {
      id: crypto.randomUUID(),
      itemId: modalItem.item.id,
      date: modalDate,
      qty: Number(modalQty),
      type: modalItem.type,
      notes: modalNotes
    };
    const updated = saveStockTransaction(txn);
    setTransactions(updated);
    setModalItem(null);
    setModalQty('');
    setModalNotes('');
    
    setIsSyncing(true);
    await syncUp();
    setIsSyncing(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this entry?")) {
      const updated = deleteStockTransaction(id);
      setTransactions(updated);
      await syncUp();
    }
  };

  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const pts = dateStr.split('-');
    const mos = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${pts[2]} ${mos[parseInt(pts[1]) - 1]} ${pts[0]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 p-3 rounded-lg text-slate-700">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Raw Material Stock</h2>
            <p className="text-sm text-gray-500">Opening balances as of 30-Nov-2024</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="Search RM ID or Name..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full outline-none focus:ring-2 focus:ring-slate-500"
             />
           </div>
           <button 
             onClick={() => setShowHistory(true)}
             className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
             title="Transaction Log"
           >
             <History size={20} />
           </button>
           <button 
             onClick={() => { setTransactions(getStockTransactions()); }}
             className="p-2 bg-gray-100 text-gray-700 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors"
           >
             <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-lg border border-gray-300 overflow-hidden relative">
        <div className="bg-[#4f6228] text-white text-center py-2 font-bold text-lg border-b border-gray-400 uppercase tracking-wider">
          Raw Material Daily Stock Report
        </div>
        
        <div className="bg-white border-b border-black flex justify-between items-center px-4 py-2">
          <div className="flex items-center gap-2">
             <button onClick={() => adjustDate(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={20} /></button>
             <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-1 border border-slate-200 rounded font-bold text-slate-800 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                />
             </div>
             <button onClick={() => adjustDate(1)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronRight size={20} /></button>
          </div>
          <div className="bg-yellow-300 border border-black px-4 py-1 font-black text-black text-xs uppercase">
             Report Date: {formatFriendlyDate(selectedDate)}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
               <tr className="text-black uppercase font-bold text-[11px]">
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-left w-16">S.NO</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-left">PRODUCT</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-right w-24">BF Qty<br/><span className="text-[9px] font-normal italic">(Opening)</span></th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-right w-24">INWARD</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-right w-24">ISSUE</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-right w-28 bg-amber-500">AVAILABLE</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-left w-48">REMARKS</th>
                 <th className="bg-[#c4d79b] border border-black px-3 py-2 text-center w-24">ACTION</th>
               </tr>
            </thead>
            <tbody>
               {filtered.map((row) => (
                 <tr key={row.id} className="hover:bg-slate-50 text-[12px] font-semibold text-black">
                    <td className="border border-black px-3 py-1 bg-[#ebf1de] font-mono">{row.id}</td>
                    <td className="border border-black px-3 py-1 bg-[#ebf1de]">{row.name}</td>
                    <td className="border border-black px-3 py-1 bg-[#ebf1de] text-right">{row.dynamicOpening.toLocaleString()}</td>
                    <td className={`border border-black px-3 py-1 bg-[#ebf1de] text-right ${row.dailyInward > 0 ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                      {row.dailyInward > 0 ? `+${row.dailyInward.toLocaleString()}` : '-'}
                    </td>
                    <td className={`border border-black px-3 py-1 bg-[#ebf1de] text-right ${row.dailyIssue > 0 ? 'text-red-700 font-bold' : 'text-gray-400'}`}>
                      {row.dailyIssue > 0 ? `-${row.dailyIssue.toLocaleString()}` : '-'}
                    </td>
                    <td className="border border-black px-3 py-1 bg-[#ebf1de] text-right font-black text-sm">{row.available.toLocaleString()}</td>
                    <td className="border border-black px-3 py-1 bg-[#ebf1de] text-[10px] text-gray-600 italic leading-tight">{row.remark}</td>
                    <td className="border border-black px-3 py-1 bg-[#ebf1de] text-center">
                       <div className="flex justify-center gap-1">
                          <button onClick={() => setModalItem({item: row, type: 'INWARD'})} className="p-1 bg-white border border-slate-300 rounded text-green-600 hover:bg-green-50" title="Add Stock"><Plus size={14}/></button>
                          <button onClick={() => setModalItem({item: row, type: 'ISSUE'})} className="p-1 bg-white border border-slate-300 rounded text-red-600 hover:bg-red-50" title="Issue Material"><Minus size={14}/></button>
                       </div>
                    </td>
                 </tr>
               ))}
               <tr className="bg-yellow-100 font-bold border-t-2 border-black text-black">
                  <td className="border border-black px-3 py-2 text-right" colSpan={2}>Grand Total Activity:</td>
                  <td className="border border-black px-3 py-2 text-right">{filtered.reduce((a, b) => a + b.dynamicOpening, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-green-700">+{filtered.reduce((a, b) => a + b.dailyInward, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-red-700">-{filtered.reduce((a, b) => a + b.dailyIssue, 0).toLocaleString()}</td>
                  <td className="border border-black px-3 py-2 text-right text-lg">{filtered.reduce((a, b) => a + b.available, 0).toLocaleString()}</td>
                  <td className="border border-black" colSpan={2}></td>
               </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {modalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-4 flex justify-between items-center text-white ${modalItem.type === 'INWARD' ? 'bg-green-600' : 'bg-red-600'}`}>
               <h3 className="font-bold flex items-center gap-2">
                 {modalItem.type === 'INWARD' ? <Plus size={20}/> : <Minus size={20}/>}
                 {modalItem.type === 'INWARD' ? 'Material Inward' : 'Material Issue'}
               </h3>
               <button onClick={() => setModalItem(null)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Item</p>
                  <p className="font-bold text-gray-800">{modalItem.item.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{modalItem.item.id}</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity (Kg)</label>
                    <input 
                      type="number"
                      value={modalQty}
                      onChange={e => setModalQty(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none font-bold"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input 
                      type="date"
                      value={modalDate}
                      onChange={e => setModalDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes / Batch Ref</label>
                  <input 
                    type="text"
                    value={modalNotes}
                    onChange={e => setModalNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                    placeholder="e.g. GRN-202, Batch X usage..."
                  />
               </div>
               <button 
                 onClick={handleSaveTransaction}
                 className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${modalItem.type === 'INWARD' ? 'bg-green-600' : 'bg-red-600'}`}
               >
                 Confirm {modalItem.type}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-800 text-white flex justify-between items-center">
               <h3 className="font-bold flex items-center gap-2"><History size={20}/> RM Transaction Log</h3>
               <button onClick={() => setShowHistory(false)}><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
               <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr className="text-gray-500 text-left uppercase text-[10px] font-black">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Item</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3 text-right">Quantity</th>
                      <th className="px-6 py-3">Notes</th>
                      <th className="px-6 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.filter(t => t.itemId.startsWith('RM')).map(t => {
                      const item = MASTER_RM_LIST.find(i => i.id === t.itemId);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                           <td className="px-6 py-3 whitespace-nowrap font-medium">{t.date.split('-').reverse().join('-')}</td>
                           <td className="px-6 py-3">
                              <span className="font-bold text-gray-800">{item?.name || t.itemId}</span>
                              <span className="block text-[10px] text-gray-400">{t.itemId}</span>
                           </td>
                           <td className="px-6 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${t.type === 'INWARD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {t.type}
                              </span>
                           </td>
                           <td className={`px-6 py-3 text-right font-mono font-bold ${t.type === 'INWARD' ? 'text-green-600' : 'text-red-600'}`}>
                              {t.type === 'INWARD' ? '+' : '-'}{t.qty.toLocaleString()}
                           </td>
                           <td className="px-6 py-3 text-gray-500 italic max-w-xs truncate">{t.notes}</td>
                           <td className="px-6 py-3 text-center">
                              <button onClick={() => handleDelete(t.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16}/></button>
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
               {transactions.filter(t => t.itemId.startsWith('RM')).length === 0 && (
                 <div className="py-20 text-center text-gray-400">
                    <AlertCircle size={40} className="mx-auto mb-2 opacity-20"/>
                    <p>No transaction history found.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
