import React, { useState } from 'react';
import { 
  Search, Package, Tag, Layers, Eye, 
  Warehouse as WarehouseIcon, AlertTriangle, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { WarehouseItemModal } from '@/Components/Modals/WarehouseItemModal';

export default function Warehouse({ mainInventory = [], categories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Filter central warehouse items by search and category
  const filteredInventory = mainInventory.filter(record => {
    const matchesSearch = 
      record.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.rf_num?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategoryFilter 
      ? String(record.category_id) === String(selectedCategoryFilter) 
      : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <AuthenticatedLayout pageTitle={["Inventory", "Warehouse", "Central Stock Monitor"]}>
      <Head title="Central Warehouse Stock" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <WarehouseIcon className="w-6 h-6 text-indigo-600" />
              Central Warehouse Stock Monitor
            </h1>
            <p className="text-sm text-slate-500">
              Manage core warehouse stock levels, par stock baselines, total stock-ins, and releases.
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, Item Name, or RF..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-64"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Warehouse Inventory Table (Mapping to main_inventory) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details (Masterlist)</th>
                  <th className="py-3.5 px-4">RF Reference</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Total Dispatched</th>
                  <th className="py-3.5 px-4">Current Warehouse Stock</th>
                  <th className="py-3.5 px-4">Baseline Par Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const isLowStock = record.qty < record.parstock;
                    const isOutOfStock = record.qty === 0;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{record.item_name}</div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            {record.sku}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            +{record.stockin}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-amber-600">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            -{record.stockout}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {record.qty} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.parstock} units
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button 
                            onClick={() => handleOpenView(record)}
                            title="View Stock Details" 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 text-sm">
                      No central warehouse inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal Component */}
        <WarehouseItemModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={selectedItem}
        />
      </div>
    </AuthenticatedLayout>
  );
}