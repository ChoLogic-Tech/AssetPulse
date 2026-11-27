// Import React hooks, Inertia usePage, and Lucide icons for the property par stock overview card
import React, { useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Search, Building2 } from 'lucide-react';

// Top 10 property items for the user's assigned property, prioritized by lowest stock-to-par ratio
export function PropertyParStockOverview({
  items = [],
  properties = [],
  propertyId = null,
}) {
  // Read authenticated user from Inertia shared props as a fallback for property assignment
  const { auth } = usePage().props;
  const activePropertyId = propertyId ?? auth?.user?.property_id ?? null;

  // Local search and stock-status filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Resolve the active property's display name from properties list or row data
  const activePropertyName = useMemo(() => {
    if (activePropertyId !== null && activePropertyId !== undefined && String(activePropertyId) !== '') {
      const matchedProp = properties.find((p) => String(p.id) === String(activePropertyId));
      if (matchedProp?.name) {
        return matchedProp.name;
      }

      const matchedRow = items.find((row) => String(row.property_id) === String(activePropertyId));
      if (matchedRow?.property_name) {
        return matchedRow.property_name;
      }

      return `Property #${activePropertyId}`;
    }

    return 'Assigned Property';
  }, [activePropertyId, properties, items]);

  // Scope items to the user's property (when assigned) and apply search and status filters
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const hasAssignedProperty =
      activePropertyId !== null &&
      activePropertyId !== undefined &&
      String(activePropertyId) !== '';

    return items.filter((row) => {
      const matchesUserProperty = hasAssignedProperty
        ? String(row.property_id) === String(activePropertyId)
        : true;

      const matchesSearch =
        !q ||
        row.item_name?.toLowerCase().includes(q) ||
        row.sku?.toLowerCase().includes(q) ||
        row.property_name?.toLowerCase().includes(q) ||
        row.category_name?.toLowerCase().includes(q) ||
        row.rf_num?.toLowerCase().includes(q);

      const matchesStatus = statusFilter
        ? row.status === statusFilter
        : true;

      return matchesUserProperty && matchesSearch && matchesStatus;
    });
  }, [items, activePropertyId, searchQuery, statusFilter]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
      {/* Section title and search / status filter controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Property Par Stock Overview (Top 10)
            </h2>
            <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
              {activePropertyName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing baseline parstock items for {activePropertyName} prioritized by lowest stock-to-par ratio.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search item, SKU, or RF..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600"
            />
          </div>

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-white outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Healthy">Healthy</option>
          </select>
        </div>
      </div>

      {/* Overview table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
            <tr>
              <th className="py-2.5 px-3">Item / SKU</th>
              <th className="py-2.5 px-3">Property</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Stock</th>
              <th className="py-2.5 px-3 text-right">Par</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Latest RF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredItems.length > 0 ? (
              filteredItems.map((row) => {
                const isOut = row.status === 'Out of Stock';
                const isLow = row.status === 'Low Stock';

                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{row.item_name}</div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">
                        {row.sku}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700">
                      {row.property_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {row.category_name}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-900 tabular-nums">
                      {Number(row.qty ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-700 tabular-nums">
                      {Number(row.parstock ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          isOut
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isLow
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isOut
                              ? 'bg-rose-500'
                              : isLow
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {row.rf_num || 'N/A'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="py-6 text-center text-slate-400">
                  No par stock items found for {activePropertyName} with the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}