import React, { useState, useEffect, useMemo } from 'react';
import { ProductionRecord } from '../types';
import { Save, XCircle, Package, Info } from 'lucide-react';
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
    if (!weightKg || !ctnWeight || !pktWeight) return null;
    
    // Calculate theoretical counts based on weight
    const rawCtn = Number(weightKg) / ctnWeight;
    const rawPkt = Number(weightKg) / pktWeight;
    
    return {
      ctn: rawCtn, // e.g. 10.5
      pkt: rawPkt, // e.g. 42
      fullCtn: Math.floor(rawCtn),
      remainderPkts: Math.round((Number(weightKg) % ctnWeight) / pktWeight)
    };
  }, [weightKg, ctnWeight, pktWeight]);

  // Form Validation Logic
  const isFormValid = useMemo(() => {
    return (
      date !== '' &&
      selectedFamily !== '' &&
      selectedType !== '' &&
      batchNo.trim() !== '' &&
      selectedSize !== '' &&
      weightKg !== '' &&
      rejectedKg !== '' &&
      duplesPkt !== '' &&
      cartonCtn !== ''
    );
  }, [date, selectedFamily, selectedType, batchNo, selectedSize, weightKg, rejectedKg, duplesPkt, cartonCtn]);

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
      rejectedKg: Number(rejectedKg),
      duplesPkt: Number(duplesPkt),
      cartonCtn: Number(cartonCtn),
      notes: notes,
      timestamp: initialData ? initialData.timestamp : Date.now()
    };

    onSave(newRecord);
  };

  const families = getFamilies();
  const availableTypes = selectedFamily ? getTypesForFamily(selectedFamily) : [];

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-blue-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          {initialData ? 'Edit Ledger Entry' : 'New Ledger Entry'}
        </h2>
        <p className="text-blue-100 text-sm">
          {initialData ? `Updating record for ${initialData.batchNo}` : "Enter production data from Yadav's ledger"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* 1. Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* 2. Product Name (Family & Type) */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="block text-xs font-bold text-gray-50 uppercase mb-2">Product Name</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                value={selectedFamily}
                onChange={(e) => {
                  setSelectedFamily(e.target.value);
                  setSelectedType('');
                  setSelectedSize('');
                }}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
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
            <div className="mt-2 text-xs text-blue-600 font-medium px-1">
              Selected: {activeDef.displayName}
            </div>
          )}
        </div>

        {/* 3. Batch No & 4. Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
            <input
              type="text"
              required
              placeholder="e.g. B-001"
              value={batchNo}
              onChange={(e) => setBatchNo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              disabled={!activeDef}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight in Kgs</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-800"
              />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejected in Kgs</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rejectedKg}
                onChange={(e) => setRejectedKg(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              />
           </div>
        </div>

        {/* 7. Duples & 8. Carton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duples (PKT)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={duplesPkt}
                  onChange={(e) => setDuplesPkt(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                 {activeDef && duplesPkt !== '' && (
                    <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                      Inside CTN
                    </div>
                  )}
              </div>
              {/* Tentative Pkt Display */}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                />
              </div>
               {/* Tentative CTN Display */}
               {suggestions && (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 font-medium animate-pulse">
                  <Info size={12} />
                  <span>Est: {suggestions.ctn.toFixed(1)} CTN</span>
                </div>
              )}
           </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-blue-600/20' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            <Save size={18} />
            {initialData ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};
