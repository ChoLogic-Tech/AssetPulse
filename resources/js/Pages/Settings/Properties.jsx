import React, { useState } from 'react';
import {
  Building2, Search, Plus,
  Edit3, AlertTriangle, Trash2
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PropertyModal } from '@/Components/Modals/PropertyModal';
import { toast } from 'sonner';

export default function Properties({ properties = [] }) {
  // Search and modal state for properties directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Open modal in create mode
  const handleOpenCreate = () => {
    setSelectedProperty(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Open modal in edit mode with selected property
  const handleOpenEdit = (property) => {
    setSelectedProperty(property);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  // Close create/edit modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProperty(null);
  };

  // Open delete confirmation dialog and clear any previous delete error
  const handleOpenDelete = (property) => {
    setDeleteError('');
    setPropertyToDelete(property);
    setIsDeleteModalOpen(true);
  };

  // Extract a readable error message from Inertia's errors bag
  const resolveDeleteError = (err) => {
    if (Array.isArray(err?.property)) return err.property[0];
    if (typeof err?.property === 'string') return err.property;
    return 'Failed to delete property.';
  };

  // Delete property and show toast promise + inline modal feedback
  const confirmDelete = () => {
    if (!propertyToDelete) return;

    setDeleteError('');
    const targetName = propertyToDelete.name;
    const targetId = propertyToDelete.id;

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(`/settings/properties/${targetId}`, {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setPropertyToDelete(null);
          setDeleteError('');
          resolve({ name: targetName });
        },
        onError: (errors) => {
          const message = resolveDeleteError(errors);
          setDeleteError(message);
          reject(new Error(message));
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting property...',
      success: (data) => `Property "${data.name}" successfully deleted.`,
      error: (err) => err?.message || 'Failed to delete property.',
    });
  };

  // Filter properties by search query
  const filteredProperties = properties.filter((property) =>
    property.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={['Settings', 'Organization', 'Properties & Branches']}>
      <Head title="Properties Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header section with indigo primary create button */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Properties &amp; Remote Branches
            </h1>
            <p className="text-sm text-slate-500">
              Manage company-owned properties, resorts, offices, and operational hubs.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Property
          </button>
        </div>

        {/* Search toolbar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Property Name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Properties directory table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Property / Branch Name</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          {property.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(property)}
                          title="Edit Property"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(property)}
                          title="Delete Property"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="py-8 text-center text-slate-400 text-sm">
                      No properties found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Property create/edit modal */}
        <PropertyModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          mode={modalMode}
          initialData={selectedProperty}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Property</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">
                      &quot;{propertyToDelete?.name}&quot;
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>

                {deleteError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-left text-xs font-medium text-rose-700">
                    {deleteError}
                  </div>
                )}

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteError('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
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