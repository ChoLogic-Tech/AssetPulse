import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  MapPin, Building2, AlertTriangle, Cpu, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { LocationModal } from '@/Components/Modals/LocationModal';
import { toast } from 'sonner';

// Build pagination page numbers with ellipsis for larger lists
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

// Style count badges depending on whether there are linked assets
function getItemCountStyle(count) {
  if (count > 0) {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: 'text-emerald-600',
    };
  }

  return {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'text-rose-500',
  };
}

export default function Locations({ location = [], property = [], serializeasset = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  // Admins or warehouse-capable users can view/filter across all properties
  const canSelectAnyProperty = Boolean(
    user?.can_select_warehouse || user?.role_name === 'Admin' || user?.role_id === 1
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState(
    canSelectAnyProperty ? '' : String(user?.property_id ?? '')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Map location_id -> location record so we can resolve property_id if missing on an asset row
  const locationById = useMemo(() => {
    const list = Array.isArray(location) ? location : [];
    return list.reduce((map, loc) => {
      if (loc?.id !== undefined && loc?.id !== null) {
        map[String(loc.id)] = loc;
      }
      return map;
    }, {});
  }, [location]);

  // Count serialized asset units per location_id and per property_id
  const { itemCountByLocation, assetCountByProperty } = useMemo(() => {
    const list = Array.isArray(serializeasset) ? serializeasset : [];
    const byLocation = {};
    const byProperty = {};

    list.forEach((row) => {
      const unit = row?.asset_units ?? row;
      const locId = unit?.location_id;
      const locRecord = locId !== undefined && locId !== null ? locationById[String(locId)] : null;
      const propId = unit?.property_id ?? locRecord?.property_id;

      if (locId !== undefined && locId !== null && String(locId) !== '') {
        const locKey = String(locId);
        byLocation[locKey] = (byLocation[locKey] || 0) + 1;
      }

      if (propId !== undefined && propId !== null && String(propId) !== '') {
        const propKey = String(propId);
        byProperty[propKey] = (byProperty[propKey] || 0) + 1;
      }
    });

    return { itemCountByLocation: byLocation, assetCountByProperty: byProperty };
  }, [serializeasset, locationById]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePropertyFilterChange = (e) => {
    setSelectedPropertyFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedLocation(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setSelectedLocation(loc);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (loc) => {
    setSelectedLocation(loc);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (loc) => {
    setLocationToDelete(loc);
    setIsDeleteModalOpen(true);
  };

  // Delete selected location via Inertia and display toast feedback
  const confirmDelete = () => {
    if (!locationToDelete) return;

    const targetName = locationToDelete.name;
    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('locations.destroy', locationToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setLocationToDelete(null);
          setTimeout(() => resolve({ name: targetName }), 300);
        },
        onError: (errors) => {
          reject(errors);
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting location...',
      success: (data) => `Location "${data.name}" successfully deleted.`,
      error: 'Failed to delete location.',
    });
  };

  // Restrict available properties to user's assigned property unless permitted to view all
  const visibleProperties = useMemo(() => {
    if (canSelectAnyProperty) return property;
    return property.filter((p) => String(p.id) === String(user?.property_id));
  }, [property, canSelectAnyProperty, user?.property_id]);

  // Filter locations by user property scope, search text, and selected property filter
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return location.filter((loc) => {
      const matchesUserScope = canSelectAnyProperty
        ? true
        : String(loc.property_id) === String(user?.property_id);

      const locationName = (loc.name ?? '').toLowerCase();
      const propertyName = (
        loc.property?.name ??
        loc.property_name ??
        'Central / Unassigned'
      ).toLowerCase();

      const matchesSearch =
        !query ||
        locationName.includes(query) ||
        propertyName.includes(query);

      const matchesProperty =
        selectedPropertyFilter === ''
          ? true
          : selectedPropertyFilter === 'unassigned'
          ? loc.property_id == null
          : String(loc.property_id) === String(selectedPropertyFilter);

      return matchesUserScope && matchesSearch && matchesProperty;
    });
  }, [location, canSelectAnyProperty, user?.property_id, searchQuery, selectedPropertyFilter]);

  // Compute total assets assigned to the active property filter (or across visible properties)
  const activePropertyAssetSummary = useMemo(() => {
    if (selectedPropertyFilter) {
      const matchedProp = visibleProperties.find(
        (p) => String(p.id) === String(selectedPropertyFilter)
      );
      return {
        label: matchedProp?.name ? `${matchedProp.name} Assets` : 'Property Assets',
        count: Number(assetCountByProperty[String(selectedPropertyFilter)] ?? 0),
      };
    }

    const totalVisiblePropertyAssets = visibleProperties.reduce(
      (sum, p) => sum + Number(assetCountByProperty[String(p.id)] ?? 0),
      0
    );

    return {
      label: canSelectAnyProperty ? 'All Properties Assets' : 'Your Property Assets',
      count: totalVisiblePropertyAssets,
    };
  }, [selectedPropertyFilter, visibleProperties, assetCountByProperty, canSelectAnyProperty]);

  const totalItems = filteredLocations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Locations']}>
      <Head title="Locations" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Page header and create action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-600" />
              Locations &amp; Perimeter Masterlist
            </h1>
            <p className="text-sm text-slate-500">
              Manage branch-specific storage rooms, zones, and perimeter locations for serialized assets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Location
          </button>
        </div>

        {/* Filter, search, and property asset count bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClearSearch();
                  }
                }}
                placeholder="Search location or property..."
                className="w-full pl-9 pr-8 py-2 text-sm text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search query"
                  className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {canSelectAnyProperty && (
              <select
                value={selectedPropertyFilter}
                onChange={handlePropertyFilterChange}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 cursor-pointer"
              >
                <option value="">All Properties</option>
                {visibleProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium">
            <label className="inline-flex items-center gap-2">
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

            <div>
              Total Locations:{' '}
              <span className="text-slate-800 font-bold tabular-nums">{totalItems}</span>
            </div>

            {/* Total serialized assets assigned to the selected/scoped property */}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-800 tabular-nums">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {activePropertyAssetSummary.label}:{' '}
                {activePropertyAssetSummary.count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Locations table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Property</th>
                  <th className="py-3.5 px-4">Assigned Assets</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedLocations.length > 0 ? (
                  paginatedLocations.map((loc) => {
                    const associatedCount = itemCountByLocation[String(loc.id)] ?? 0;
                    const propertyTotalAssets =
                      loc.property_id !== null && loc.property_id !== undefined
                        ? Number(assetCountByProperty[String(loc.property_id)] ?? 0)
                        : null;
                    const countStyle = getItemCountStyle(associatedCount);

                    return (
                      <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{loc.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc.property?.name ?? loc.property_name ?? 'Central / Unassigned'}</span>
                          </div>
                          {propertyTotalAssets !== null && (
                            <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                              {propertyTotalAssets.toLocaleString()}{' '}
                              {propertyTotalAssets === 1 ? 'asset' : 'assets'} in property
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums ${countStyle.badge}`}
                          >
                            <Cpu className={`w-3 h-3 ${countStyle.icon}`} />
                            {associatedCount} {associatedCount === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(loc)}
                              title="View Location Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(loc)}
                              title="Edit Location Record"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(loc)}
                              title="Delete Location"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                      No locations found. Click "+ Add New Location" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
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
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
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
                      className={`min-w-[32px] px-2.5 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
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
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create / Edit / View location modal */}
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedLocation}
          properties={visibleProperties}
          canSelectAnyProperty={canSelectAnyProperty}
          userPropertyId={user?.property_id ?? ''}
        />

        {/* Delete confirmation modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Location</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">"{locationToDelete?.name}"</span>? This action
                    cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}