import React, { useState } from 'react';
import { 
  Search, Building2, Tag, 
  Layers, Eye, Package, ShieldAlert, Plus 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PropertyInventoryModal } from '@/Components/Modals/PropertyInventoryModal';

export default function PropertyInventory({ inventory = [], properties = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Filter inventory items based on search query and property filter
  const filteredInventory = inventory.filter(record => {
    const matchesSearch = 
      record.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProperty = selectedPropertyFilter 
      ? String(record.property_id) === String(selectedPropertyFilter) 
      : true;

    return matchesSearch && matchesProperty;
  });

  return (
    <AuthenticatedLayout pageTitle={["Inventory", "Property", "Property Stock Levels"]}>
      <Head title="Property Inventory Overview" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen md:item-center">
      
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-6 h-6 text-indigo-600" />
              Property Stock Monitor
            </h1>
            <p className="text-sm text-slate-500">
              Real-time snapshot of non-serialized bulk items and stock held across properties.
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
              placeholder="Search SKU or Item Name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-64"
            >
              <option value="">All Properties / Branches</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Property Inventory Table (Mapping to property_inventory / vw_property_stock_overview) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Category & Brand</th>
                  <th className="py-3.5 px-4">Current Stock Quantity</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => (
                    <tr key={`${record.property_id}-${record.item_id}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {record.property_name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{record.item_name}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Tag className="w-3 h-3" />
                          {record.sku}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {record.category_name || 'Uncategorized'}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">
                          {record.brand_name || 'Generic'} {record.model_name ? `• ${record.model_name}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          record.current_stock > 0 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {record.current_stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleOpenView(record)}
                          title="View Stock Breakdown" 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No inventory records found matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Component */}
        <PropertyInventoryModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            initialData={selectedItem}
        />
      </div>
    </AuthenticatedLayout>
  );
}