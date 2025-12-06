
import React, { useState, useEffect, useMemo } from 'react';
import { SalesOrder, SalesOrderItem, Customer, UserRole } from '../types';
import { Save, User, MapPin, Mail, Phone, FileText, Upload, Plus, Trash2, ShoppingCart, Package, Info, AlertCircle, CheckCircle, MessageCircle, ArrowRight, Search, Copy, Share2, X } from 'lucide-react';
import { getFamilies, getTypesForFamily, getProductDef, ProductDefinition } from '../data/products';
import { getCustomers, saveCustomer } from '../services/storageService';
import { POPreview } from './POPreview';

interface SalesEntryProps {
  onSave: (order: SalesOrder) => void;
  onCancel: () => void;
  salesPersonName: string;
  userRole: UserRole;
}

export const SalesEntry: React.FC<SalesEntryProps> = ({ onSave, onCancel, salesPersonName, userRole }) => {
  // --- Customer & PO State ---
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [mapLink, setMapLink] = useState('');
  const [poNumber, setPoNumber] = useState('');
  
  // File Upload State
  const [poFileName, setPoFileName] = useState('');
  const [poFileData, setPoFileData] = useState<string | null>(null);
  
  // Admin on-behalf state
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(salesPersonName);

  // Customer Lookup
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerName || customerName.length < 2) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase()));
  }, [customerName, customers]);

  const handleSelectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setMobile(c.mobile);
    setEmail(c.email);
    setCity(c.city);
    setMapLink(c.mapLink);
    setShowCustomerResults(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 500KB Limit check
      if (file.size > 500 * 1024) {
        alert("File size too large. Please upload a file smaller than 500KB.");
        return;
      }

      setPoFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPoFileData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Product Selection State ---
  const [selectedFamily, setSelectedFamily] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantityKg, setQuantityKg] = useState<number | ''>('');
  const [pricePerKg, setPricePerKg] = useState<number | ''>(''); // New Price Input
  
  // --- Active Product Def ---
  const [activeDef, setActiveDef] = useState<ProductDefinition | undefined>(undefined);
  const [ctnWeight, setCtnWeight] = useState<number>(0);

  // --- Cart State ---
  const [cartItems, setCartItems] = useState<SalesOrderItem[]>([]);

  // --- Submission State ---
  const [submittedOrder, setSubmittedOrder] = useState<SalesOrder | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Update Active Definition
  useEffect(() => {
    if (selectedFamily && selectedType) {
      const def = getProductDef(selectedFamily, selectedType);
      setActiveDef(def);
      if (def && !def.sizes.includes(selectedSize)) {
        setSelectedSize('');
      }
    } else {
      setActiveDef(undefined);
    }
  }, [selectedFamily, selectedType, selectedSize]);

  // Update Carton Weight when Size changes
  useEffect(() => {
    if (activeDef && selectedSize) {
      setCtnWeight(activeDef.getCtnWeight(selectedSize));
    } else {
      setCtnWeight(0);
    }
  }, [activeDef, selectedSize]);

  // 6013 Batch Logic (Weight based)
  const batchHint = useMemo(() => {
    if (selectedFamily === '6013' && quantityKg && activeDef && ctnWeight) {
       // 6013 requires multiple of 16 cartons.
       // 16 Cartons weight = 16 * ctnWeight
       // Typically 6013 ctnWeight is 16kg. So 16 * 16 = 256kg batch.
       
       const batchWeight = 16 * ctnWeight; 
       const enteredWeight = Number(quantityKg);
       
       if (enteredWeight % batchWeight !== 0) {
         const nearestBatch = Math.round(enteredWeight / batchWeight) * batchWeight;
         const suggested = nearestBatch === 0 ? batchWeight : nearestBatch;
         return {
           isInvalid: true,
           message: `6013 orders should be multiples of 16 CTN (${batchWeight} Kg). Nearest standard batch: ${suggested} Kg`
         };
       }
    }
    return null;
  }, [selectedFamily, quantityKg, activeDef, ctnWeight]);

  const handleAddItem = () => {
    if (!activeDef || !selectedSize || !quantityKg || !ctnWeight || !pricePerKg) return;

    // Calculate Cartons from Weight
    const calculatedCtn = Number((Number(quantityKg) / ctnWeight).toFixed(2));
    const weightVal = Number(quantityKg);
    const priceVal = Number(pricePerKg);

    const newItem: SalesOrderItem = {
      productId: crypto.randomUUID(),
      productName: activeDef.displayName,
      size: selectedSize,
      quantityCtn: calculatedCtn,
      calculatedWeightKg: weightVal,
      pricePerKg: priceVal,
      itemValue: weightVal * priceVal
    };

    setCartItems([...cartItems, newItem]);
    
    // Reset selection
    setQuantityKg('');
    setPricePerKg('');
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(cartItems.filter(i => i.productId !== id));
  };

  // Financial Calculations
  const subTotal = useMemo(() => cartItems.reduce((acc, i) => acc + i.itemValue, 0), [cartItems]);
  const vatAmount = useMemo(() => subTotal * 0.15, [subTotal]);
  const grandTotal = useMemo(() => subTotal + vatAmount, [subTotal, vatAmount]);

  const handleSubmit = () => {
    if (cartItems.length === 0 || !customerName) return;

    const newOrder: SalesOrder = {
      id: crypto.randomUUID(),
      orderDate: new Date().toISOString().split('T')[0],
      salesPerson: userRole === 'admin' ? selectedSalesPerson : salesPersonName,
      customerName,
      mobileNumber: mobile,
      email,
      city,
      mapLink,
      poNumber: poNumber || 'N/A',
      poFileName: poFileName || undefined,
      poFileData: poFileData || undefined,
      items: cartItems,
      totalWeightKg: cartItems.reduce((sum, item) => sum + item.calculatedWeightKg, 0),
      subTotal: subTotal,
      vatAmount: vatAmount,
      grandTotal: grandTotal,
      status: 'Pending'
    };

    // Auto-save customer if new or updated
    const customerRecord: Customer = {
      id: crypto.randomUUID(), 
      name: customerName,
      mobile: mobile,
      email: email,
      city: city,
      mapLink: mapLink
    };
    saveCustomer(customerRecord);

    onSave(newOrder);
    setSubmittedOrder(newOrder);
  };

  // --- WHATSAPP TEXT GENERATION (NO PRICE) ---
  const generateShareText = (order: SalesOrder) => {
    let text = `*Sales Order Details* 📦\n`;
    text += `Customer: ${order.customerName}\n`;
    text += `Mobile: ${order.mobileNumber}\n`;
    text += `Sales Person: ${order.salesPerson}\n`;
    text += `City: ${order.city}\n`;
    if(order.mapLink) text += `📍 ${order.mapLink}\n`;
    text += `PO No: ${order.poNumber}\n`;
    if(order.poFileName) text += `PO File: ${order.poFileName} (See Attachment)\n`;
    
    text += `\n*Items:* \n`;
    order.items.forEach(item => {
       text += `- ${item.productName} (${item.size}): ${item.quantityCtn} CTN (${item.calculatedWeightKg} Kg)\n`;
    });
    
    text += `\n*Total Weight:* ${order.totalWeightKg.toLocaleString()} Kg`;
    // NOTE: Price is intentionally excluded from this text
    return text;
  };

  const handleCopyToClipboard = () => {
    if (!submittedOrder) return;
    const text = generateShareText(submittedOrder);
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleShare = async () => {
    if (!submittedOrder) return;
    const text = generateShareText(submittedOrder);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'New Sales Order',
          text: text,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  const handleWhatsApp = () => {
    if (!submittedOrder) return;
    const text = generateShareText(submittedOrder);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // --- SUCCESS POPUP ---
  if (submittedOrder) {
    const shareText = generateShareText(submittedOrder);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div className="bg-green-600 p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="text-green-600 w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">Order Placed!</h2>
            <p className="text-green-100">The order has been successfully recorded.</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {shareText}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleCopyToClipboard}
                className={`py-2 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  copyFeedback ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {copyFeedback ? <CheckCircle size={18} /> : <Copy size={18} />}
                {copyFeedback ? 'Copied' : 'Copy Text'}
              </button>
              
              <button 
                onClick={handleShare}
                className="py-2 px-4 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Share2 size={18} /> Share
              </button>
            </div>

            <button 
              onClick={handleWhatsApp}
              className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all"
            >
              <MessageCircle size={20} /> Share via WhatsApp
            </button>
            
            <div className="flex gap-2">
               <button 
                  onClick={() => setSubmittedOrder(null)} 
                  className="hidden" 
               />
               <POPreview order={submittedOrder} onClose={onCancel} isDialog={true} />
            </div>

            <button 
              onClick={onCancel} 
              className="w-full py-3 mt-2 text-gray-500 hover:text-gray-800 font-medium transition-colors"
            >
              Close & Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 pb-20 md:pb-0">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="text-indigo-200" /> New Sales Order
          </h2>
          <p className="text-indigo-100 text-sm">Enter customer and product details</p>
        </div>
        {userRole === 'admin' && (
           <div className="bg-indigo-700 px-3 py-1 rounded-lg border border-indigo-500">
             <label className="text-xs text-indigo-300 block">Sales Person</label>
             <select 
               value={selectedSalesPerson}
               onChange={(e) => setSelectedSalesPerson(e.target.value)}
               className="bg-transparent text-white font-bold outline-none text-sm"
             >
               <option value="Admin">Admin</option>
               <option value="Asim">Asim</option>
             </select>
           </div>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Customer & PO */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
               <User size={18} /> Customer Details
             </h3>
             
             {/* Customer Lookup */}
             <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search existing customer or type new name..."
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowCustomerResults(true);
                  }}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {showCustomerResults && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                      >
                        <div className="font-bold text-gray-800">{c.name}</div>
                        <div className="text-xs text-gray-500">{c.city} • {c.mobile}</div>
                      </button>
                    ))}
                  </div>
                )}
             </div>

             <div className="space-y-3">
               <div className="relative">
                 <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" placeholder="Mobile Number" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
               </div>
               <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
               </div>
               <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="text" placeholder="City / Delivery Area" value={city} onChange={e => setCity(e.target.value)} className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
               </div>
               <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input type="url" placeholder="Delivery Location URL (Optional)" value={mapLink} onChange={e => setMapLink(e.target.value)} className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg text-sm" />
               </div>
             </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
             <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
               <FileText size={18} /> PO Details
             </h3>
             <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="PO Number" 
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                />
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.png" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                  <p className="text-xs text-gray-500">
                    {poFileName ? `Selected: ${poFileName}` : 'Click to upload PO (PDF/Image)'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Max 500KB</p>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Product & Cart */}
        <div className="space-y-6 flex flex-col h-full">
           <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-sm">
             <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
               <Package size={18} /> Add Items
             </h3>
             
             <div className="grid grid-cols-2 gap-3 mb-3">
               <select 
                 value={selectedFamily}
                 onChange={e => { setSelectedFamily(e.target.value); setSelectedType(''); setSelectedSize(''); }}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
               >
                 <option value="">Select Family</option>
                 {getFamilies().map(f => <option key={f} value={f}>{f}</option>)}
               </select>

               <select 
                 value={selectedType}
                 onChange={e => setSelectedType(e.target.value)}
                 disabled={!selectedFamily}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
               >
                 <option value="">Type</option>
                 {selectedFamily && getTypesForFamily(selectedFamily).map(t => (
                   <option key={t.type} value={t.type}>{t.type}</option>
                 ))}
               </select>
             </div>

             <div className="mb-3">
               <select 
                 value={selectedSize}
                 onChange={e => setSelectedSize(e.target.value)}
                 disabled={!activeDef}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
               >
                 <option value="">Select Size</option>
                 {activeDef?.sizes.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-3">
               <div className="relative">
                 <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Qty (Kg)</label>
                 <input 
                   type="number" 
                   value={quantityKg}
                   onChange={e => setQuantityKg(e.target.value === '' ? '' : Number(e.target.value))}
                   placeholder="0.00"
                   className={`w-full px-3 py-2 border rounded-lg text-sm font-bold ${batchHint?.isInvalid ? 'border-amber-500 focus:ring-amber-500' : 'border-gray-300 focus:ring-indigo-500'}`}
                 />
                 {activeDef && quantityKg && ctnWeight && (
                    <div className="absolute right-3 top-8 text-xs font-medium text-gray-400">
                      = {(Number(quantityKg) / ctnWeight).toFixed(2)} CTN
                    </div>
                 )}
               </div>
               
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Price (SAR/Kg)</label>
                  <input 
                    type="number"
                    step="0.01" 
                    value={pricePerKg}
                    onChange={e => setPricePerKg(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold focus:ring-indigo-500"
                  />
               </div>
             </div>
             
             <button 
                onClick={handleAddItem}
                disabled={!selectedSize || !quantityKg || !pricePerKg}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add to Order
              </button>
             
             {/* 6013 Batch Warning */}
             {batchHint && (
               <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 flex items-start gap-2">
                 <Info size={14} className="mt-0.5 flex-shrink-0" />
                 <span>{batchHint.message}</span>
               </div>
             )}
           </div>

           {/* Order Cart */}
           <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 flex flex-col overflow-hidden">
             <div className="p-3 bg-gray-100 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                <span>Current Order</span>
                <span>{cartItems.length} Items</span>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {cartItems.map(item => (
                  <div key={item.productId} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group">
                    <div>
                      <div className="font-bold text-gray-800 text-sm">{item.productName}</div>
                      <div className="text-xs text-gray-500">{item.size}</div>
                      <div className="text-xs font-mono mt-1 text-indigo-600">
                        {item.quantityCtn} CTN • {item.calculatedWeightKg} Kg • {item.pricePerKg.toFixed(2)}/kg
                      </div>
                    </div>
                    <div className="text-right">
                       <span className="block font-bold text-gray-800 text-sm">{item.itemValue.toLocaleString()}</span>
                       <button 
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 mt-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {cartItems.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <ShoppingCart size={40} />
                    <p className="text-sm mt-2">Cart is empty</p>
                  </div>
                )}
             </div>
             
             <div className="p-4 bg-white border-t border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <span>SAR {subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>VAT (15%)</span>
                  <span>SAR {vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-indigo-700 text-lg pt-2 border-t border-gray-100">
                  <span>Total</span>
                  <span>SAR {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button onClick={onCancel} className="px-4 py-3 rounded-lg text-gray-500 hover:bg-gray-100 font-medium">
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={cartItems.length === 0 || !customerName}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Place Order <ArrowRight size={18} />
                  </button>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
