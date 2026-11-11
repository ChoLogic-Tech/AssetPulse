import React, { useState } from 'react';
import { 
  ArrowDownLeft, Plus, Search, Package, 
  Warehouse as WarehouseIcon, AlertTriangle, ArrowUpRight, CheckCircle2 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { WarehouseStockInModal } from '@/Components/Modals/WarehouseStockInModal';

export default function WarehouseStockIn({ mainInventory = [], items = [], suppliers = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredInventory = mainInventory.filter(record => 
    record.item_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Inventory", "Warehouse", "Warehouse Stock-In"]}>
      <Head title="Central Warehouse Stock-In" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
              Central Warehouse Deliveries & Stock-In
            </h1>
            <p className="text-sm text-slate-500">
              Record incoming purchase orders and vendor shipments to replenish central warehouse par stock levels.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Warehouse Stock-In
          </button>
        </div>

        {/* Search & Filter Bar */}
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
        </div>

        {/* Central Inventory Overview Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Total Dispatched</th>
                  <th className="py-3.5 px-4">Current Warehouse Stock</th>
                  <th className="py-3.5 px-4">Baseline Par Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const isLowStock = record.qty < record.parstock;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{record.item_name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{record.sku}</div>
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
                            record.qty === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {record.qty} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.parstock} units
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No central inventory items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stock-In Modal Component */}
        <WarehouseStockInModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          items={items}
          suppliers={suppliers}
        />

      </div>
    </AuthenticatedLayout>
  );
}