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

  // Admins or warehouse-capable users can create/assign across any property in the modal
  const canSelectAnyProperty = Boolean(
    user?.can_select_warehouse || user?.role_name === 'Admin' || user?.role_id === 1
  );

  // Default property ID from the authenticated user (used to pre-filter and auto-select dropdown)
  const defaultUserPropertyId =
    user?.property_id !== undefined && user?.property_id !== null
      ? String(user.property_id)
      : '';

  // Search, filter, and pagination state (auto-select user's property on initial load)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState(defaultUserPropertyId);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Sync default property filter once if auth user property arrives after initial mount
  useEffect(() => {
    if (defaultUserPropertyId && selectedPropertyFilter === '') {
      setSelectedPropertyFilter(defaultUserPropertyId);
    }
  }, [defaultUserPropertyId]);

  // Create / Edit / View modal state
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Index locations by ID so asset units can fall back to the location's property_id
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

  // Reset to page 1 whenever filters or page size change
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

  // Modal open/close handlers
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
    setDeleteError('');
    setLocationToDelete(loc);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setLocationToDelete(null);
    setDeleteError('');
  };

  // Pull a readable error message from Inertia validation errors, flash error, or assigned count
  const resolveDeleteError = (errors, page, assignedCount) => {
    const rawLocationError = errors?.location ?? page?.props?.errors?.location;
    if (Array.isArray(rawLocationError) && rawLocationError[0]) return rawLocationError[0];
    if (typeof rawLocationError === 'string' && rawLocationError) return rawLocationError;
    if (page?.props?.flash?.error) return page.props.flash.error;

    if (assignedCount > 0) {
      const assetNoun = assignedCount === 1 ? 'assigned asset' : 'assigned assets';
      return `Cannot delete: ${assignedCount} ${assetNoun} assigned.`;
    }

    return 'Cannot delete this location because it has assigned assets.';
  };

  // Send delete request via Inertia and tie toast + modal error state to the response
  const confirmDelete = () => {
    if (!locationToDelete) return;

    setDeleteError('');
    const targetName = locationToDelete.name;
    const assignedCount = Number(itemCountByLocation[String(locationToDelete.id)] ?? 0);

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('locations.destroy', locationToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: (page) => {
          // Guard against flash or validation errors arriving inside onSuccess
          const errorFlash = page?.props?.flash?.error;
          const rawLocationError = page?.props?.errors?.location;
          const validationError = Array.isArray(rawLocationError)
            ? rawLocationError[0]
            : rawLocationError;
          const errorMsg = errorFlash || validationError;

          if (errorMsg) {
            setDeleteError(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          setIsDeleteModalOpen(false);
          setLocationToDelete(null);
          setDeleteError('');
          resolve({ name: targetName });
        },
        onError: (errors, page) => {
          const message = resolveDeleteError(errors, page, assignedCount);
          setDeleteError(message);
          reject(new Error(message));
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting location...',
      success: (data) => `Location "${data.name}" successfully deleted.`,
      error: (err) =>
        err instanceof Error && err.message
          ? err.message
          : 'Cannot delete this location because it has assigned assets.',
    });
  };

  // Keep all properties accessible in the filter dropdown so users can inspect other property locations
  const filterableProperties = useMemo(() => {
    return Array.isArray(property) ? property : [];
  }, [property]);

  // Scope modal property choices when the user cannot assign to other properties
  const modalProperties = useMemo(() => {
    if (canSelectAnyProperty) return filterableProperties;
    return filterableProperties.filter((p) => String(p.id) === defaultUserPropertyId);
  }, [filterableProperties, canSelectAnyProperty, defaultUserPropertyId]);

  // Apply text search and property dropdown filter (defaults to user's property, allows switching)
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return location.filter((loc) => {
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

      return matchesSearch && matchesProperty;
    });
  }, [location, searchQuery, selectedPropertyFilter]);

  // Summarize total assets for the currently selected property filter or all properties
  const activePropertyAssetSummary = useMemo(() => {
    if (selectedPropertyFilter) {
      const matchedProp = filterableProperties.find(
        (p) => String(p.id) === String(selectedPropertyFilter)
      );
      return {
        label: matchedProp?.name ? `${matchedProp.name} Assets` : 'Property Assets',
        count: Number(assetCountByProperty[String(selectedPropertyFilter)] ?? 0),
      };
    }

    const totalAllPropertyAssets = filterableProperties.reduce(
      (sum, p) => sum + Number(assetCountByProperty[String(p.id)] ?? 0),
      0
    );

    return {
      label: 'All Properties Assets',
      count: totalAllPropertyAssets,
    };
  }, [selectedPropertyFilter, filterableProperties, assetCountByProperty]);

  // Pagination slice calculation
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

  // Singular/plural labels for the delete modal warning badge
  const deleteAssignedCount = locationToDelete
    ? Number(itemCountByLocation[String(locationToDelete.id)] ?? 0)
    : 0;
  const hasAssignedAssets = deleteAssignedCount > 0;
  const assignedAssetNoun = deleteAssignedCount === 1 ? 'assigned asset' : 'assigned assets';

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Locations']}>
      <Head title="Locations" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Page header and create button */}
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

        {/* Search, property filter, page size, and summary counters */}
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

            {/* Property filter defaults to user's property while allowing inspection of any property */}
            <select
              value={selectedPropertyFilter}
              onChange={handlePropertyFilterChange}
              aria-label="Filter locations by property"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Properties</option>
              {filterableProperties.map((prop) => (
                <option key={prop.id} value={String(prop.id)}>
                  {prop.name}
                </option>
              ))}
            </select>
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

            <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-800 tabular-nums">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                {activePropertyAssetSummary.label}:{' '}
                {activePropertyAssetSummary.count.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Locations masterlist table */}
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
                    const countStyle = getItemCountStyle(associatedCount);

                    return (
                      <tr key={loc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{loc.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {/* Show only the assigned property name without repeating property asset totals */}
                          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc.property?.name ?? loc.property_name ?? 'Central / Unassigned'}</span>
                          </div>
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

          {/* Pagination controls */}
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

        {/* Create / Edit / View modal */}
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedLocation}
          properties={modalProperties}
          canSelectAnyProperty={canSelectAnyProperty}
          userPropertyId={defaultUserPropertyId}
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
                    Remove{' '}
                    <span className="font-semibold text-slate-700">"{locationToDelete?.name}"</span>?
                  </p>
                </div>

                {/* Compact warning badge showing only the assigned asset count */}
                {hasAssignedAssets && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 flex items-center justify-between gap-2 text-xs text-amber-900">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
                      <Cpu className="w-3.5 h-3.5" />
                      Assigned Assets
                    </span>
                    <span className="inline-flex items-center rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 tabular-nums">
                      {deleteAssignedCount} {assignedAssetNoun}
                    </span>
                  </div>
                )}

                {/* Concise server validation / deletion error */}
                {deleteError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-left text-xs font-medium text-rose-700">
                    {deleteError}
                  </div>
                )}

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleCloseDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
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