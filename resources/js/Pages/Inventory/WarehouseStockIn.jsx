import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  ArrowUpRight,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { WarehouseStockInModal } from '@/Components/Modals/WarehouseStockInModal';

const getRawUom = (record) =>
  record?.uom_name || record?.uom || record?.uom_code || 'Unit';

const pluralizeUom = (label, count) => {
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';
  if (Math.abs(Number(count)) === 1) return clean;

  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  if (
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('ss')
  ) {
    return isAllUpper ? `${clean}ES` : `${clean}es`;
  }

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

export default function WarehouseStockIn({
  mainInventory = [],
  stockIns = { data: [] },
  items = [],
  suppliers = [],
  lastSuppliers = {},
  filters = { search: '' },
}) {
  const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return mainInventory;

    return mainInventory.filter((record) => {
      const uomLabel = getRawUom(record);
      return (
        record.item_name?.toLowerCase().includes(q) ||
        record.sku?.toLowerCase().includes(q) ||
        record.rf_num?.toLowerCase().includes(q) ||
        uomLabel.toLowerCase().includes(q)
      );
    });
  }, [mainInventory, searchQuery]);

  return (
    <AuthenticatedLayout pageTitle={['Inventory', 'Warehouse', 'Warehouse Stock-In']}>
      <Head title="Central Warehouse Stock-In" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
              Central Warehouse Deliveries &amp; Stock-In
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Record incoming purchase orders and supplier deliveries to replenish central warehouse stock.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Warehouse Stock-In
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center shadow-xs">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, RF #, or Item Name..."
              className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800 tabular-nums">{filteredInventory.length}</strong> central warehouse{' '}
            {filteredInventory.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Total Dispatched</th>
                  <th className="py-3.5 px-4">Current Warehouse Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const qty = Number(record.qty ?? 0);
                    const parstock = Number(record.parstock ?? 0);
                    const isBelowPar = qty < parstock;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{record.item_name}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {record.sku} {record.rf_num ? `• RF: ${record.rf_num}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-emerald-700 tabular-nums">
                          <div className="flex items-center gap-1">
                            <ArrowDownLeft className="w-3.5 h-3.5" />+
                            {Number(record.stockin ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-amber-700 tabular-nums">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />-
                            {Number(record.stockout ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                              qty === 0 || isBelowPar
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {formatCountWithUom(qty, record)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                      No central warehouse items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <WarehouseStockInModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          items={items}
          suppliers={suppliers}
          recentStockIns={stockIns?.data ?? []}
          lastSuppliers={lastSuppliers}
        />
      </div>
    </AuthenticatedLayout>
  );
}