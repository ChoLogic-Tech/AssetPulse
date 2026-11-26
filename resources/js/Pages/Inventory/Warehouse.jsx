import React, { useState } from 'react';
import {
  Search,
  Tag,
  SlidersHorizontal,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { WarehouseItemModal } from '@/Components/Modals/WarehouseItemModal';

const getRawUom = (record) => record?.uom_name || record?.uom || record?.uom_code || 'Unit';

const pluralizeUom = (label, count) => {
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';
  if (Math.abs(Number(count)) === 1) return clean;

  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  // Already plural
  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  // Words ending in x, s, z, ch, sh -> add es
  if (
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('ss')
  ) {
    return isAllUpper ? `${clean}ES` : `${clean}es`;
  }

  // Words like "piece" -> "pieces"
  if (lower.endsWith('ce')) {
    return isAllUpper ? `${clean}S` : `${clean}s`;
  }

  return isAllUpper ? `${clean}S` : `${clean}s`;
};

const formatCountWithUom = (count, record) => {
  const num = Number(count ?? 0);
  const baseLabel = getRawUom(record);
  return `${num.toLocaleString()} ${pluralizeUom(baseLabel, num)}`;
};

export default function Warehouse({ mainInventory = [], categories = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenParStockModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const filteredInventory = mainInventory.filter((record) => {
    const q = searchQuery.toLowerCase();
    const prevRf = record.previous_rf_num ?? record.prf_num ?? '';
    const uomLabel = getRawUom(record);
    const matchesSearch =
      !q ||
      record.item_name?.toLowerCase().includes(q) ||
      record.sku?.toLowerCase().includes(q) ||
      record.rf_num?.toLowerCase().includes(q) ||
      String(prevRf).toLowerCase().includes(q) ||
      uomLabel.toLowerCase().includes(q);

    const matchesCategory = selectedCategoryFilter
      ? String(record.category_id) === String(selectedCategoryFilter)
      : true;

    return matchesSearch && matchesCategory;
  });

  return (
    <AuthenticatedLayout pageTitle={['Inventory', 'Warehouse', 'Central Stock Monitor']}>
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
              View central warehouse stock levels and update baseline par stock thresholds.
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
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
                  <th className="py-3.5 px-4">Previous RF #</th>
                  <th className="py-3.5 px-4">RF #</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Total Stock-Out</th>
                  <th className="py-3.5 px-4">Current Warehouse Stock</th>
                  <th className="py-3.5 px-4">Baseline Par Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const qty = Number(record.qty ?? 0);
                    const parstock = Number(record.parstock ?? 0);
                    const isLowStock = qty < parstock;
                    const isOutOfStock = qty === 0;
                    const previousRf = record.previous_rf_num ?? record.prf_num;

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
                          {previousRf || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <ArrowDownLeft className="w-3.5 h-3.5" />+{record.stockin ?? 0}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-amber-600">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />-{record.stockout ?? 0}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isOutOfStock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {isLowStock && <AlertTriangle className="w-3 h-3" />}
                            {formatCountWithUom(qty, record)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {parstock > 0 ? (
                            formatCountWithUom(parstock, record)
                          ) : (
                            <span className="text-slate-400">Not set</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenParStockModal(record)}
                            title="Update Baseline Par Stock"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            Set Par Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-sm">
                      No central warehouse inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Par Stock Update Modal */}
        <WarehouseItemModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialData={selectedItem}
        />
      </div>
    </AuthenticatedLayout>
  );
}