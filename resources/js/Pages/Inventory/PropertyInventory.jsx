// Import React hooks, icons, Inertia layout/head/usePage, and the details + parstock modal
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Tag,
  Building2,
  ArrowDownLeft,
  Cpu,
  Eye,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { PropertyItemModal } from '@/Components/Modals/PropertyItemModal';

// Read UOM label from joined columns with fallback to 'Unit'
const getRawUom = (record) =>
  record?.uom_name || record?.uom || record?.uom_code || 'Unit';

// Singularize or pluralize UOM text cleanly based on quantity count
const pluralizeUom = (label, count) => {
  const clean = String(label || 'Unit').trim();
  if (!clean) return 'Units';
  if (Math.abs(Number(count)) === 1) return clean;

  const isAllUpper = clean === clean.toUpperCase() && /[A-Z]/.test(clean);
  const lower = clean.toLowerCase();

  // Keep words already ending in 's' unchanged (except 'ss', 'box', 'pcs')
  if (
    lower.endsWith('s') &&
    !lower.endsWith('ss') &&
    !['box', 'pcs'].includes(lower)
  ) {
    return clean;
  }

  // Add 'es' for sibilant endings
  if (
    lower.endsWith('x') ||
    lower.endsWith('z') ||
    lower.endsWith('ch') ||
    lower.endsWith('sh') ||
    lower.endsWith('ss')
  ) {
    return isAllUpper ? `${clean}ES` : `${clean}es`;
  }

  // Add 's' for words ending in 'ce'
  if (lower.endsWith('ce')) {
    return isAllUpper ? `${clean}S` : `${clean}s`;
  }

  // Default plural form
  return isAllUpper ? `${clean}S` : `${clean}s`;
};

// Format a count together with its singular or plural UOM label
const formatCountWithUom = (count, record) => {
  const num = Number(count ?? 0);
  const baseLabel = getRawUom(record);
  return `${num.toLocaleString()} ${pluralizeUom(baseLabel, num)}`;
};

// Property inventory monitor page showing stock, parstock targets, and RF history
export default function PropertyInventory({
  propertyInventory = [],
  properties = [],
  categories = [],
  userPropertyId = null,
}) {
  // Read logged-in user's assigned property from Inertia shared auth props (or explicit prop)
  const { auth } = usePage().props;
  const assignedPropertyId = userPropertyId ?? auth?.user?.property_id ?? '';
  const initialPropertyFilter =
    assignedPropertyId !== null && assignedPropertyId !== undefined
      ? String(assignedPropertyId)
      : '';

  // Search and dropdown filter state (defaults to user's property while allowing manual changes)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState(initialPropertyFilter);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('');

  // Apply user's property automatically if it becomes available after initial mount
  useEffect(() => {
    if (!selectedPropertyFilter && initialPropertyFilter) {
      setSelectedPropertyFilter(initialPropertyFilter);
    }
  }, [initialPropertyFilter, selectedPropertyFilter]);

  // Modal state for viewing item details and updating baseline parstock
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Open details & parstock modal for the selected row
  const handleOpenDetailsModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Close modal and clear selected item
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // Filter rows by search text, property filter, and category filter
  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return propertyInventory.filter((record) => {
      const prevRf = record.previous_rf_num ?? '';
      const uomLabel = getRawUom(record);

      const matchesSearch =
        !q ||
        record.item_name?.toLowerCase().includes(q) ||
        record.sku?.toLowerCase().includes(q) ||
        record.property_name?.toLowerCase().includes(q) ||
        record.rf_num?.toLowerCase().includes(q) ||
        String(prevRf).toLowerCase().includes(q) ||
        uomLabel.toLowerCase().includes(q);

      const matchesProperty = selectedPropertyFilter
        ? String(record.property_id) === String(selectedPropertyFilter)
        : true;

      const matchesCategory = selectedCategoryFilter
        ? String(record.category_id) === String(selectedCategoryFilter)
        : true;

      return matchesSearch && matchesProperty && matchesCategory;
    });
  }, [propertyInventory, searchQuery, selectedPropertyFilter, selectedCategoryFilter]);

  return (
    <AuthenticatedLayout pageTitle={['Inventory', 'Properties', 'Property Stock Monitor']}>
      <Head title="Property Stock Monitor" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Property Stock Monitor
            </h1>
            <p className="text-sm text-slate-500">
              View stock quantities, base parstock targets, and latest/previous RF numbers across properties.
            </p>
          </div>
        </div>

        {/* Search bar and property/category filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, Property, Item, or RF..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
            <select
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full sm:w-52 cursor-pointer"
            >
              <option value="">All Properties</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full sm:w-52 cursor-pointer"
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

        {/* Property stock table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Item Details (Masterlist)</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Previous RF #</th>
                  <th className="py-3.5 px-4">RF #</th>
                  <th className="py-3.5 px-4">Total Stock-In</th>
                  <th className="py-3.5 px-4">Base Parstock</th>
                  <th className="py-3.5 px-4">Current Property Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((record) => {
                    const qty = Number(record.qty ?? 0);
                    const parstock = Number(record.parstock ?? 0);
                    const serializedCount = Number(record.serialized_count ?? 0);
                    // Mark low stock when a parstock target (> 0) exists and current qty is below it
                    const isBelowParstock = parstock > 0 && qty < parstock;

                    return (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{record.item_name}</div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {record.sku}
                            </span>
                            {serializedCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-indigo-600 font-sans font-medium">
                                <Cpu className="w-3 h-3" />
                                {serializedCount} serialized
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                          {record.property_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {record.previous_rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-800 font-medium">
                          {record.rf_num || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-emerald-600">
                          <div className="flex items-center gap-1">
                            <ArrowDownLeft className="w-3.5 h-3.5" />+
                            {Number(record.stockin ?? 0).toLocaleString()}
                          </div>
                        </td>
                        {/* Display baseline parstock target */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700 tabular-nums">
                          {parstock > 0 ? formatCountWithUom(parstock, record) : 'Not set'}
                        </td>
                        {/* Current property stock badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${
                              qty === 0 || isBelowParstock
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {formatCountWithUom(qty, record)}
                          </span>
                        </td>
                        {/* Single Details action opening PropertyItemModal to view details and update baseline parstock */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetailsModal(record)}
                            title="View Property Stock Details & Baseline Par Stock"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 text-sm">
                      No property inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item details and baseline parstock modal */}
        <PropertyItemModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialData={selectedItem}
        />
      </div>
    </AuthenticatedLayout>
  );
}