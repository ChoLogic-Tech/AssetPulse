import React, { useState } from 'react';
import { 
  Plus, Search, Building2, Tag, 
  ArrowDownLeft, FileText, Calendar 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { StockInModal } from '@/Components/Modals/StockInModal';

export default function PropertyStockIn({ stockIns = [], properties = [], items = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockIn, setSelectedStockIn] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'view'

  const handleOpenCreate = () => {
    setSelectedStockIn(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenView = (record) => {
    setSelectedStockIn(record);
    setModalMode('view');
    setIsModalOpen(true);
  };

  // Filter local stock-in logs based on search query
  const filteredStockIns = stockIns.filter(record => 
    record.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.po_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Inventory", "Property", "Local Purchase / Stock-In"]}>
      <Head title="Property Stock-In Logs" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-indigo-600" />
              Property Stock-In & Local Purchases
            </h1>
            <p className="text-sm text-slate-500">
              Record local vendor deliveries and branch purchases directly into property inventory balances.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
             New Property Stock-In
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, Item, or PO Number..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          {/* <div className="flex items-center gap-2 w-full md:w-auto">
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600">
              <option value="">All Properties</option>
              {properties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div> */}
        </div>

        {/* Stock-In Table (Mapping to stock_in_logs schema) */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Item Details (Masterlist)</th>
                  <th className="py-3.5 px-4">Quantity Added</th>
                  <th className="py-3.5 px-4">PO / Invoice Ref</th>
                  <th className="py-3.5 px-4">Received Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStockIns.length > 0 ? (
                  filteredStockIns.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {record.property_name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Supplier: <span className="text-slate-600">{record.supplier_name || 'N/A'}</span>
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          +{record.quantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        <div>{record.po_number || 'No PO'}</div>
                        <div className="text-slate-400">{record.invoice_number || 'No Invoice'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {record.received_date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button 
                          onClick={() => handleOpenView(record)}
                          title="View Delivery Details" 
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                      No stock-in records found. Click "Log New Stock-In" to add a local purchase.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Component for Create & View */}
        <StockInModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mode={modalMode}
            initialData={selectedStockIn}
            properties={properties}
            items={items}
        />
      </div>
    </AuthenticatedLayout>
  );
}