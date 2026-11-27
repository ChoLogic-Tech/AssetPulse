import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  Plus,
  Search,
  Building2,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PropertyStockInModal } from '@/Components/Modals/PropertyStockInModal';

// Read UOM label from joined columns
const getRawUom = (record) =>
  record?.uom_name || record?.uom || record?.uom_code || 'Unit';

// Singularize or pluralize UOM label based on count
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

export default function PropertyStockIn({
  propertyInventory = [],
  stockIns = { data: [] },
  items = [],
  assetUnits = [],
  suppliers = [],
  properties = [],
  locations = [],
  lastSuppliers = {},
  filters = { search: '', property_id: '' },
}) {
  // Read logged-in user's property_id from shared Inertia props
  const { auth } = usePage().props;
  const userPropertyId = auth?.user?.property_id ?? '';

  const [searchQuery, setSearchQuery] = useState(filters?.search ?? '');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState(
    filters?.property_id ? String(filters.property_id) : ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter property inventory rows by search query and property filter
  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return propertyInventory.filter((record) => {
      const matchesProperty = selectedPropertyFilter
        ? String(record.property_id) === String(selectedPropertyFilter)
        : true;

      if (!matchesProperty) return false;
      if (!q) return true;

      const uomLabel = getRawUom(record);
      return (
        record.item_name?.toLowerCase().includes(q) ||
        record.sku?.toLowerCase().includes(q) ||
        record.property_name?.toLowerCase().includes(q) ||
        record.rf_num?.toLowerCase().includes(q) ||
        record.previous_rf_num?.toLowerCase().includes(q) ||
        uomLabel.toLowerCase().includes(q)
      );
    });
  }, [propertyInventory, searchQuery, selectedPropertyFilter]);

  return (
    <AuthenticatedLayout pageTitle={['Inventory', 'Properties', 'Property Stock-In']}>
      <Head title="Property Stock-In" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Page header and create button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ArrowDownLeft className="w-6 h-6 text-emerald-600" />
              Property Deliveries &amp; Stock-In
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Record direct stock-ins for specific properties and track latest and previous RF references.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Property Stock-In
          </button>
        </div>

        {/* Search input and property filter dropdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center shadow-xs">
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, Property, RF #, or Item Name..."
                className="w-full pl-9 pr-4 py-2 text-sm text-slate-900 border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white outline-none focus:border-indigo-600 w-full sm:w-56 cursor-pointer"
            >
              <option value="">All Properties</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-medium text-slate-500">
            Showing <strong className="text-slate-800 tabular-nums">{filteredInventory.length}</strong> property stock{' '}
            {filteredInventory.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {/* Property stock table showing Previous RF #, RF #, Total Stock-In, and Current Stock */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item &amp; Property</th>
                  <th className="py-3.5 px-4">Previous RF #</th>
                  <th className="py-3.5 px-4">RF #</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Current Property Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const qty = Number(record.qty ?? 0);

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{record.item_name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">{record.sku}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {record.property_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.previous_rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700 font-medium">
                          {record.rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-semibold text-emerald-700 tabular-nums">
                          <div className="flex items-center gap-1">
                            <ArrowDownLeft className="w-3.5 h-3.5" />+
                            {Number(record.stockin ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                              qty === 0
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
                    <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                      No property stock-in records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pass defaultPropertyId so the modal locks to the user's assigned property */}
        <PropertyStockInModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          defaultPropertyId={userPropertyId}
          items={items}
          assetUnits={assetUnits}
          suppliers={suppliers}
          properties={properties}
          locations={locations}
          recentStockIns={stockIns?.data ?? []}
          lastSuppliers={lastSuppliers}
        />
      </div>
    </AuthenticatedLayout>
  );
}