import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { getCustomers, saveCustomer, deleteCustomer } from '../services/storageService';
import { Users, Search, Plus, MapPin, Phone, Mail, Trash2, Edit2, Save, X } from 'lucide-react';

export const CustomerDatabase: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [mapLink, setMapLink] = useState('');

  useEffect(() => {
    setCustomers(getCustomers());
  }, []);

  const handleEdit = (c: Customer) => {
    setName(c.name);
    setMobile(c.mobile);
    setEmail(c.email);
    setCity(c.city);
    setMapLink(c.mapLink);
    setEditingId(c.id);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setName('');
    setMobile('');
    setEmail('');
    setCity('');
    setMapLink('');
    setEditingId(null);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: editingId || crypto.randomUUID(),
      name,
      mobile,
      email,
      city,
      mapLink
    };
    
    const updated = saveCustomer(newCustomer);
    setCustomers(updated);
    setIsEditing(false);
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Delete this customer?")) {
      const updated = deleteCustomer(id);
      setCustomers(updated);
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm)
  );

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-200" /> {editingId ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-blue-100 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input type="text" required value={mobile} onChange={e => setMobile(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input type="text" required value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location</label>
              <input type="url" value={mapLink} onChange={e => setMapLink(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
             <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
             <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
               <Save size={18} /> Save Customer
             </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
          <Users size={24} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-gray-800">Customer Database</h2>
          <p className="text-sm text-gray-500">{customers.length} registered clients</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            <Plus size={18} /> Add New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">{c.name}</h3>
            <div className="space-y-2 text-sm text-gray-600 mt-3">
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {c.mobile}</div>
              {c.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {c.email}</div>}
              <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /> {c.city}</div>
            </div>
            {c.mapLink && (
              <a href={c.mapLink} target="_blank" rel="noreferrer" className="block mt-4 text-xs font-medium text-blue-600 hover:underline">
                View Delivery Location
              </a>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
};