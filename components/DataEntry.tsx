
import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord } from '../types';
import { Save, XCircle, Package, Info, Layers, RotateCcw, Truck } from 'lucide-react';
import { getFamilies, getTypesForFamily, getProductDef, ProductDefinition, PRODUCT_CATALOG } from '../data/products';

interface DataEntryProps {
  onSave: (record: ProductionRecord) => void;
  onCancel: () => void;
  initialData?: ProductionRecord | null;
}

export const DataEntry: React.FC<DataEntryProps> = ({ onSave, onCancel, initialData }) => {
  // Selection States
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // Data States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchNo, setBatchNo] = useState('');
  const [rejectedKg, setRejectedKg] = useState<number | ''>('');
  const [duplesPkt, setDuplesPkt] = useState<number | ''>('');
  const [cartonCtn, setCartonCtn] = useState<number | ''>('');
  const [weightKg, setWeightKg] = useState<number | ''>(''); // Good Production Weight
  const [notes, setNotes] = useState('');
  const [entryType, setEntryType] = useState<'production' | 'return' | 'dispatch'>('production');

  // Derived Product Definition
  const [activeDef, setActiveDef] = useState<ProductDefinition | undefined>(undefined);
  const [pktWeight, setPktWeight] = useState<number>(0);
  const [ctnWeight, setCtnWeight] = useState<number>(0);
  const [pktsPerCtn, setPktsPerCtn] = useState<number>(0);

  // Initialize form if editing
  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setBatchNo(initialData.batchNo);
      setRejectedKg(initialData.rejectedKg);
      setDuplesPkt(initialData.duplesPkt);
      setCartonCtn(initialData.cartonCtn);
      setWeightKg(initialData.weightKg);
      setNotes(initialData.notes);
      
      if (initialData.isDispatch) setEntryType('dispatch');
      else if (initialData.isReturn) setEntryType('return');
      else setEntryType('production');

      // Reverse lookup for product definition
      const def = PRODUCT_CATALOG.find(p => p.displayName === initialData.productName);
      if (def) {
        setSelectedFamily(def.family);
        setSelectedType(def.type);
        setSelectedSize(initialData.size);
      }
    }
  }, [initialData]);

  // Update Active Definition when Family/Type changes
  useEffect(() => {
    if (selectedFamily && selectedType) {
      const def = getProductDef(selectedFamily, selectedType);
      setActiveDef(def);
      
      if (def && !def.sizes.includes(selectedSize) && !initialData) {
        setSelectedSize('');
      }
    } else {
      setActiveDef(undefined);
    }
  }, [selectedFamily, selectedType, selectedSize, initialData]);

  // Update Unit Weights when Size changes
  useEffect(() => {
    if (activeDef && selectedSize) {
      const pWeight = activeDef.getPktWeight(selectedSize);
      const cWeight = activeDef.getCtnWeight(selectedSize);
      setPktWeight(pWeight);
      setCtnWeight(cWeight);
      setPktsPerCtn(cWeight / pWeight);
    } else {
      setPktWeight(0);
      setCtnWeight(0);
      setPktsPerCtn(0);
    }
  }, [activeDef, selectedSize]);

  // Tentative Calculations (Analysis only, does not set state)
  const suggestions = useMemo(() => {
    if (!weightKg || !ctnWeight || !pktWeight || entryType !== 'production') return null;
    
    // Calculate theoretical counts based on weight
    const rawCtn = Number(weightKg) / ctnWeight;
    const rawPkt = Number(weightKg) / pktWeight;
    const palletCount = Number(weightKg) / 1000;
    
    return {
      ctn: rawCtn, // e.g. 10.5
      pkt: rawPkt, // e.g. 42
      pallet: palletCount,
      fullCtn: Math.floor(rawCtn),
      remainderPkts: Math.round((Number(weightKg) % ctnWeight) / pktWeight)
    };
  }, [weightKg, ctnWeight, pktWeight, entryType]);

  // Form Validation Logic
  const isFormValid = useMemo(() => {
    const commonValid = date !== '' &&
      selectedFamily !== '' &&
      selectedType !== '' &&
      batchNo.trim() !== '' &&
      selectedSize !== '' &&
      weightKg !== '';
      
    if (entryType === 'dispatch' || entryType === 'return') return commonValid;
    return commonValid && cartonCtn !== '' && rejectedKg !== '' && duplesPkt !== '';
  }, [date, selectedFamily, selectedType, batchNo, selectedSize, weightKg, rejectedKg, duplesPkt, cartonCtn, entryType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !activeDef) return;

    const newRecord: ProductionRecord = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      date,
      productName: activeDef.displayName,
      batchNo: batchNo.toUpperCase(),
      size: selectedSize,
      weightKg: Number(weightKg),
      rejectedKg: (entryType === 'dispatch' || entryType === 'return') ? (Number(rejectedKg) || 0) : Number(rejectedKg),
      duplesPkt: (entryType === 'dispatch' || entryType === 'return') ? 0 : Number(duplesPkt),
      cartonCtn: (entryType === 'dispatch' || entryType === 'return') ? 0 : Number(cartonCtn),
      notes: notes,
      timestamp: initialData ? initialData.timestamp : Date.now(),
      isReturn: entryType === 'return',
      isDispatch: entryType === 'dispatch'
    };

    onSave(newRecord);
  };

  const families = getFamilies();
  const availableTypes = selectedFamily ? getTypesForFamily(selectedFamily) : [];

  const themeClass = entryType === 'dispatch' ? 'bg-red-600' : entryType === 'return' ? 'bg-orange-600' : 'bg-blue-600';
  const textMutedClass = entryType === 'dispatch' ? 'text-red-100' : entryType === 'return' ? 'text-orange-100' : 'text-blue-100';

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className={`${themeClass} px-6 py-4 transition-colors duration-300`}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-auto">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {entryType === 'dispatch' ? (
                    <><Truck className="text-red-200" /> {initialData ? 'Edit Dispatch' : 'Manual Dispatch'}</>
                  ) : entryType === 'return' ? (
                    <><RotateCcw className="text-orange-200" /> {initialData ? 'Edit Return' : 'New Sales Return'}</>
                  ) : (
                    <>{initialData ? 'Edit Ledger Entry' : 'New Ledger Entry'}</>
                  )}
                </h2>
                <p className={`${textMutedClass} text-sm`}>
                  {entryType === 'dispatch' ? "Record out-going stock to customer" : entryType === 'return' ? "Record material returned by customer" : "Enter daily production data"}
                </p>
            </div>
            
            {/* Multi-Tab Toggle Switch */}
            <div className="flex items-center gap-1 bg-white/20 p-1 rounded-lg backdrop-blur-sm w-full md:w-auto">
                <button
                    type="button"
                    onClick={() => setEntryType('production')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                        entryType === 'production' 
                        ? 'bg-white text-blue-700 shadow-sm' 
                        : 'text-white hover:bg-white/10'
                    }`}
                >
                    Production
                </button>
                <button
                    type="button"
                    onClick={() => setEntryType('return')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                        entryType === 'return' 
                        ? 'bg-white text-orange-700 shadow-sm' 
                        : 'text-white hover:bg-white/10'
                    }`}
                >
                    Return
                </button>
                <button
                    type="button"
                    onClick={() => setEntryType('dispatch')}
                    className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                        entryType === 'dispatch' 
                        ? 'bg-white text-red-700 shadow-sm' 
                        : 'text-white hover:bg-white/10'
                    }`}
                >
                    Dispatch
                </button>
            </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* 1. Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entryType === 'dispatch' ? 'Dispatch Date' : entryType === 'return' ? 'Return Date' : 'Production Date'}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
            />
          </div>
        </div>

        {/* 2. Product Name (Family & Type) */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Selection</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                value={selectedFamily}
                onChange={(e) => {
                  setSelectedFamily(e.target.value);
                  setSelectedType('');
                  setSelectedSize('');
                }}
                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 outline-none ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
              >
                <option value="">Select Family</option>
                {families.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                disabled={!selectedFamily}
                className={`w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
              >
                <option value="">Select Type</option>
                {availableTypes.map(def => (
                  <option key={def.type} value={def.type}>
                    {def.type} {def.containerColor ? `(${def.containerColor})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {activeDef && (
            <div className={`mt-2 text-xs font-medium px-1 ${entryType === 'dispatch' ? 'text-red-600' : entryType === 'return' ? 'text-orange-600' : 'text-blue-600'}`}>
              Item: {activeDef.displayName}
            </div>
          )}
        </div>

        {/* 3. Batch No & 4. Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {entryType === 'dispatch' ? 'Batch / INV No' : 'Batch No'}
            </label>
            <input
              type="text"
              required
              placeholder={entryType === 'dispatch' ? 'e.g. INV-101' : 'e.g. B-001'}
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none uppercase ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!activeDef}
              className={`w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-400 ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
            >
              <option value="">Select Size</option>
              {activeDef?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {activeDef && selectedSize && (
               <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Package size={12} />
                  <span>1 CTN = {pktsPerCtn} PKT</span>
                  <span>({ctnWeight}kg/CTN)</span>
               </div>
            )}
          </div>
        </div>

        {/* 5. Weight & 6. Rejected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 {entryType === 'dispatch' ? "Dispatch Weight (Kgs)" : entryType === 'return' ? "Returned Good Weight (Kgs)" : "Good Weight (Kgs)"}
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none font-bold text-gray-800 ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-green-500'}`}
                />
                {suggestions && (
                  <div className="absolute right-3 top-2.5 flex items-center gap-1 text-xs text-gray-400 font-bold bg-gray-50 px-2 py-0.5 rounded">
                    <Layers size={12} />
                    <span>≈ {suggestions.pallet.toFixed(2)} Pallets</span>
                  </div>
                )}
              </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 {entryType === 'return' ? "Returned as Rejected (Kgs)" : entryType === 'dispatch' ? "Deducted Rejected (Optional Kgs)" : "Rejected in Kgs"}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rejectedKg}
                onChange={(e) => setRejectedKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-red-500'}`}
              />
           </div>
        </div>

        {/* 7. Duples & 8. Carton - Hidden for Dispatch and Return */}
        {entryType === 'production' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duples (PKT)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={duplesPkt}
                    onChange={(e) => setDuplesPkt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none focus:ring-blue-500"
                  />
                </div>
                {suggestions && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 font-medium animate-pulse">
                    <Info size={12} />
                    <span>Est: {suggestions.pkt.toFixed(0)} PKT (Total)</span>
                  </div>
                )}
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carton (CTN)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={cartonCtn}
                    onChange={(e) => setCartonCtn(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none focus:ring-blue-500 font-semibold"
                  />
                </div>
                 {suggestions && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 font-medium animate-pulse">
                    <Info size={12} />
                    <span>Est: {suggestions.ctn.toFixed(1)} CTN</span>
                  </div>
                )}
             </div>
          </div>
        )}

        {/* Info Box for Dispatch/Return */}
        {entryType !== 'production' && (
           <div className={`p-3 rounded-lg border text-xs font-medium flex items-center gap-2 ${entryType === 'dispatch' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
              {entryType === 'dispatch' ? <Truck size={16} /> : <RotateCcw size={16} />}
              <span>
                {entryType === 'dispatch' 
                  ? "Deducts weight from Finished Goods. No material packing needed." 
                  : "Adds weight back to Finished Goods. No material packing needed."}
              </span>
           </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {entryType === 'dispatch' ? 'Customer / Destination' : 'Remarks'}
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none ${entryType === 'dispatch' ? 'focus:ring-red-500' : entryType === 'return' ? 'focus:ring-orange-500' : 'focus:ring-blue-500'}`}
            placeholder={entryType === 'dispatch' ? "e.g. Al-Nassr Construction Co." : entryType === 'return' ? "Reason for return..." : ""}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-2 transition-colors"
          >
            <XCircle size={18} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all ${
              isFormValid 
                ? entryType === 'dispatch'
                   ? 'bg-red-600 text-white hover:bg-red-700 hover:scale-105 shadow-red-600/20'
                   : entryType === 'return' 
                      ? 'bg-orange-600 text-white hover:bg-orange-700 hover:scale-105 shadow-orange-600/20' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-600/20'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            <Save size={18} />
            {initialData ? 'Update Entry' : (entryType === 'dispatch' ? 'Save Dispatch' : entryType === 'return' ? 'Save Return' : 'Save Entry')}
          </button>
        </div>
      </form>
    </div>
  );
};
