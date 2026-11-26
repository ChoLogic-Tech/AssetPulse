import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Tag,
  Building2,
  Eye,
  Pencil,
  Cpu,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { AssetUnitModal } from '@/Components/Modals/AssetUnitModal';

const STATUS_OPTIONS = [
  'Available',
  'Deployed',
  'Under Repair',
  'Damage',
  'Back Load (Iloilo)',
  'Decommissioned',
];

const STATUS_STYLES = {
  Available: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Deployed: {
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    dot: 'bg-sky-500',
  },
  'Under Repair': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Damage: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  'Back Load (Iloilo)': {
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    dot: 'bg-violet-500',
  },
  Decommissioned: {
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    dot: 'bg-slate-400',
  },
};

const DEFAULT_STATUS_STYLE = {
  badge: 'bg-slate-50 text-slate-700 border-slate-200',
  dot: 'bg-slate-400',
};

function getStatusStyle(status) {
  return STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
}

function resolveAssetSku(record, skuList = [], itemList = []) {
  if (!record || typeof record !== 'object') return '';

  if (typeof record.sku_code === 'string' && record.sku_code.trim()) {
    return record.sku_code.trim();
  }
  if (typeof record.sku === 'string' && record.sku.trim()) {
    return record.sku.trim();
  }

  const matchedItem = Array.isArray(itemList)
    ? itemList.find((item) => item && String(item.id) === String(record.item_id))
    : null;

  if (matchedItem) {
    if (typeof matchedItem.sku_code === 'string' && matchedItem.sku_code.trim()) {
      return matchedItem.sku_code.trim();
    }
    if (typeof matchedItem.sku === 'string' && matchedItem.sku.trim()) {
      return matchedItem.sku.trim();
    }
  }

  const matchedSku = Array.isArray(skuList)
    ? skuList.find(
        (s) =>
          s &&
          ((record.item_id != null &&
            ((s.item_id != null && String(s.item_id) === String(record.item_id)) ||
              (s.item_masterlist_id != null &&
                String(s.item_masterlist_id) === String(record.item_id)))) ||
            (matchedItem?.sku_id != null && s.id != null && String(s.id) === String(matchedItem.sku_id)) ||
            (record.sku_id != null && s.id != null && String(s.id) === String(record.sku_id)))
      )
    : null;

  return matchedSku?.sku_code ? String(matchedSku.sku_code).trim() : '';
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

export default function AssetUnits({
  assetUnits = [],
  properties = [],
  items = [],
  skus = [],
  locations = [],
  suppliers = [],
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  const safeAssetUnits = Array.isArray(assetUnits) ? assetUnits : [];
  const safeProperties = Array.isArray(properties) ? properties : [];
  const safeSkus = Array.isArray(skus) ? skus : [];
  const safeItems = Array.isArray(items) ? items : [];
  const safeLocations = Array.isArray(locations) ? locations : [];
  const safeSuppliers = Array.isArray(suppliers) ? suppliers : [];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePropertyFilterChange = (e) => {
    setSelectedPropertyFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setSelectedStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenView = (asset) => {
    setSelectedAsset(asset);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredAssets = safeAssetUnits.filter((record) => {
    const skuValue = resolveAssetSku(record, safeSkus, safeItems);
    const matchesSearch =
      !normalizedQuery ||
      record.serial_number?.toLowerCase().includes(normalizedQuery) ||
      record.item_name?.toLowerCase().includes(normalizedQuery) ||
      skuValue.toLowerCase().includes(normalizedQuery);

    const matchesProperty = selectedPropertyFilter
      ? selectedPropertyFilter === 'warehouse'
        ? record.property_id == null
        : String(record.property_id) === String(selectedPropertyFilter)
      : true;

    const statusValue = record.status ?? record.asset_status;
    const matchesStatus = selectedStatusFilter
      ? statusValue === selectedStatusFilter
      : true;

    return matchesSearch && matchesProperty && matchesStatus;
  });

  const totalItems = filteredAssets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Serialized Asset Units']}>
      <Head title="Asset Units Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-indigo-600" />
              Serialized Asset Directory
            </h1>
            <p className="text-sm text-slate-500">
              Track physical individual hardware units, serial numbers, custody, and deployment lifecycle.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Register New Serialized Asset
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search Serial Number, Item, or SKU..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <select
              value={selectedPropertyFilter}
              onChange={handlePropertyFilterChange}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
            >
              <option value="">All Locations / Properties</option>
              <option value="warehouse">Central Warehouse</option>
              {safeProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={handleStatusFilterChange}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-slate-500 font-medium pl-1">
              <span>Show</span>
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </label>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Serial Number / SKU</th>
                  <th className="py-3.5 px-4">Catalog Item & Specs</th>
                  <th className="py-3.5 px-4">Current Custody</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedAssets.length > 0 ? (
                  paginatedAssets.map((asset) => {
                    const statusValue = asset.status ?? asset.asset_status ?? 'Available';
                    const statusStyle = getStatusStyle(statusValue);
                    const skuValue = resolveAssetSku(asset, safeSkus, safeItems);
                    const brandValue = asset.brand_name ?? asset.brand;
                    const modelValue = asset.model_name ?? asset.model;
                    const propertyValue =
                      asset.property_name ?? asset.current_property ?? 'Central Warehouse';
                    const locationValue = asset.location_name ?? asset.room_location;

                    return (
                      <tr key={asset.id ?? asset.asset_id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-slate-900">
                            {asset.serial_number}
                          </div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            {skuValue || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{asset.item_name}</div>
                          <div className="text-xs text-slate-500">
                            {brandValue} {modelValue ? `• ${modelValue}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {propertyValue}
                          </div>
                          {locationValue && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {locationValue}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.badge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {statusValue}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {asset.date_received
                            ? new Date(asset.date_received).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(asset)}
                              title="View Asset Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(asset)}
                              title="Edit Asset Unit"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                      No serialized assets found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalItems > 0 && (
            <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-800">{startIndex + 1}</span> to{' '}
                <span className="font-semibold text-slate-800">{endIndex}</span> of{' '}
                <span className="font-semibold text-slate-800">{totalItems}</span> entries
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev
                </button>

                {pageNumbers.map((page, index) =>
                  page === '...' ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 py-1.5 text-slate-400 select-none"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] px-2.5 py-1.5 rounded-lg border font-medium transition ${
                        currentPage === page
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <AssetUnitModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          initialData={selectedAsset}
          items={safeItems}
          skus={safeSkus}
          properties={safeProperties}
          locations={safeLocations}
          suppliers={safeSuppliers}
        />
      </div>
    </AuthenticatedLayout>
  );
}