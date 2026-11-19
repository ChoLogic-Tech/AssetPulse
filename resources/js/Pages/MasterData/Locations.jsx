import React, { useMemo, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  MapPin, Building2, AlertTriangle, Cpu
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { LocationModal } from '@/Components/Modals/LocationModal';
import { toast } from 'sonner';

export default function Locations({ locations = [], properties = [] }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  const canSelectAnyProperty = Boolean(
    user?.can_select_warehouse || user?.role_name === 'Admin' || user?.role_id === 1
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState(
    canSelectAnyProperty ? '' : String(user?.property_id ?? '')
  );
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const confirmDelete = () => {
    if (!locationToDelete) return;

    const targetName = locationToDelete.name;
    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('locations.destroy', locationToDelete.id), {
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

  const visibleProperties = useMemo(() => {
    if (canSelectAnyProperty) return properties;
    return properties.filter((p) => String(p.id) === String(user?.property_id));
  }, [properties, canSelectAnyProperty, user?.property_id]);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesUserScope = canSelectAnyProperty
        ? true
        : String(loc.property_id) === String(user?.property_id);

      const matchesSearch =
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.property_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProperty =
        selectedPropertyFilter === ''
          ? true
          : selectedPropertyFilter === 'unassigned'
          ? loc.property_id == null
          : String(loc.property_id) === String(selectedPropertyFilter);

      return matchesUserScope && matchesSearch && matchesProperty;
    });
  }, [locations, canSelectAnyProperty, user?.property_id, searchQuery, selectedPropertyFilter]);

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Locations']}>
      <Head title="Locations" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-indigo-600" />
              Locations & Perimeter Masterlist
            </h1>
            <p className="text-sm text-slate-500">
              Manage branch-specific storage rooms, zones, and perimeter locations for serialized assets.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Location
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location or property..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {canSelectAnyProperty && (
              <select
                value={selectedPropertyFilter}
                onChange={(e) => setSelectedPropertyFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
              >
                <option value="">All Properties / Branches</option>
                <option value="unassigned">Central / Unassigned Rooms</option>
                {visibleProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-sm text-slate-500 font-medium">
            Total Locations: <span className="text-slate-800 font-bold">{filteredLocations.length}</span>
          </div>
        </div>

        {/* Locations Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Location / Room Name</th>
                  <th className="py-3.5 px-4">Property / Branch</th>
                  <th className="py-3.5 px-4">Assigned Assets</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{loc.name}</div>
                        <div className="text-xs text-slate-400 font-mono">ID: #{loc.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {loc.property_name || 'Central / Unassigned'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Cpu className="w-3 h-3 text-slate-500" />
                          {loc.asset_units_count ?? 0} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {loc.updated_at || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenView(loc)}
                            title="View Location Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(loc)}
                            title="Edit Location Record"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(loc)}
                            title="Delete Location"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No locations found. Click "+ Add New Location" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Modal Component */}
        <LocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedLocation}
          properties={visibleProperties}
          canSelectAnyProperty={canSelectAnyProperty}
          userPropertyId={user?.property_id ?? ''}
        />

        {/* Custom Delete Confirmation Modal */}
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
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
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