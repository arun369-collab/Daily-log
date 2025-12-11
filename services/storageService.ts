
import { ProductionRecord, SalesOrder, Customer } from '../types';

const STORAGE_KEY = 'factory_flow_data';
const ORDERS_KEY = 'factory_flow_orders';
const CUSTOMERS_KEY = 'factory_flow_customers';

export const getRecords = (): ProductionRecord[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load records", e);
    return [];
  }
};

export const saveRecord = (record: ProductionRecord): ProductionRecord[] => {
  const current = getRecords();
  const index = current.findIndex(r => r.id === record.id);
  
  let updated: ProductionRecord[];
  
  if (index >= 0) {
    // Update existing record
    updated = [...current];
    updated[index] = record;
  } else {
    // Add new record to top
    updated = [record, ...current];
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteRecord = (id: string): ProductionRecord[] => {
  const current = getRecords();
  const updated = current.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const clearAllRecords = (): ProductionRecord[] => {
  localStorage.removeItem(STORAGE_KEY);
  return [];
};

// --- Sales Order Functions ---

export const getSalesOrders = (): SalesOrder[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load orders", e);
    return [];
  }
};

export const saveSalesOrder = (order: SalesOrder): SalesOrder[] => {
  const current = getSalesOrders();
  const index = current.findIndex(o => o.id === order.id);
  
  let updated: SalesOrder[];

  if (index >= 0) {
    // Update existing order
    updated = [...current];
    updated[index] = order;
  } else {
    // Add new order to top
    updated = [order, ...current];
  }

  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSalesOrder = (id: string): SalesOrder[] => {
  const current = getSalesOrders();
  const updated = current.filter(o => o.id !== id);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteSalesOrders = (ids: string[]): SalesOrder[] => {
  const current = getSalesOrders();
  const idSet = new Set(ids);
  const updated = current.filter(o => !idSet.has(o.id));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
  return updated;
};

// --- Customer Functions ---

export const getCustomers = (): Customer[] => {
  try {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load customers", e);
    return [];
  }
};

export const saveCustomer = (customer: Customer): Customer[] => {
  const current = getCustomers();
  const index = current.findIndex(c => c.mobile === customer.mobile); // Dedup by mobile if editing new, but better by ID
  const idIndex = current.findIndex(c => c.id === customer.id);

  let updated: Customer[];
  if (idIndex >= 0) {
    updated = [...current];
    updated[idIndex] = { ...updated[idIndex], ...customer }; // Update existing
  } else {
    updated = [customer, ...current];
  }
  
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteCustomer = (id: string): Customer[] => {
  const current = getCustomers();
  const updated = current.filter(c => c.id !== id);
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
  return updated;
};

// --- Full State Import/Export for Cloud Sync ---

export const getAllData = () => ({
  records: getRecords(),
  orders: getSalesOrders(),
  customers: getCustomers(),
  timestamp: Date.now()
});

export const importData = (data: any) => {
  if (!data) return;
  if (data.records && Array.isArray(data.records)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.records));
  }
  if (data.orders && Array.isArray(data.orders)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(data.orders));
  }
  if (data.customers && Array.isArray(data.customers)) {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(data.customers));
  }
};
