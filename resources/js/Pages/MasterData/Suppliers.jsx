import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  Truck, Layers, AlertTriangle, Phone, Mail,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { SupplierModal } from '@/Components/Modals/SupplierModal';
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

// Style the associated items pill based on whether a supplier has linked items
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

export default function Supplier({ suppliers = [], itemmaster = [] }) {
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Create / Edit / View modal state
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Count masterlist items per supplier_id as a fallback if items_count is not pre-aggregated
  const itemCountBySupplier = useMemo(() => {
    const list = Array.isArray(itemmaster) ? itemmaster : [];
    return list.reduce((counts, row) => {
      const supplierId = row?.supplier_id ?? row?.supplier?.id;
      if (supplierId !== undefined && supplierId !== null && supplierId !== '') {
        const key = String(supplierId);
        counts[key] = (counts[key] || 0) + 1;
      }
      return counts;
    }, {});
  }, [itemmaster]);

  // Helper to resolve associated item count for a single supplier record
  const getSupplierItemCount = (supplier) => {
    if (supplier?.items_count !== undefined && supplier?.items_count !== null) {
      return Number(supplier.items_count) || 0;
    }
    return Number(itemCountBySupplier[String(supplier?.id)] ?? 0);
  };

  // Compute overall associated items across all suppliers (or itemmaster when suppliers lack items_count)
  const overallAssociatedItemsCount = useMemo(() => {
    const vendorList = Array.isArray(suppliers) ? suppliers : [];
    const hasPrecomputedCounts = vendorList.some(
      (s) => s?.items_count !== undefined && s?.items_count !== null
    );

    if (hasPrecomputedCounts) {
      return vendorList.reduce((sum, s) => sum + (Number(s.items_count) || 0), 0);
    }

    if (Array.isArray(itemmaster) && itemmaster.length > 0) {
      return itemmaster.filter((row) => {
        const supplierId = row?.supplier_id ?? row?.supplier?.id;
        return supplierId !== undefined && supplierId !== null && supplierId !== '';
      }).length;
    }

    return Object.values(itemCountBySupplier).reduce((sum, n) => sum + n, 0);
  }, [suppliers, itemmaster, itemCountBySupplier]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  };

  // Delete selected supplier via Inertia and show toast feedback
  const confirmDelete = () => {
    if (!supplierToDelete) return;

    const deletedName = supplierToDelete.name;

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('suppliers.destroy', supplierToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setSupplierToDelete(null);
          resolve({ name: deletedName });
        },
        onError: (errors) => {
          reject(errors);
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting supplier...',
      success: (data) => `Supplier "${data.name}" successfully deleted.`,
      error: 'Failed to delete supplier.',
    });
  };

  // Filter suppliers by company name, contact person, or email
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredVendors = (Array.isArray(suppliers) ? suppliers : []).filter((supplier) =>
    supplier.name?.toLowerCase().includes(normalizedQuery) ||
    supplier.contact_person?.toLowerCase().includes(normalizedQuery) ||
    supplier.email?.toLowerCase().includes(normalizedQuery)
  );

  // Sum associated items across the currently filtered suppliers as well
  const filteredAssociatedItemsCount = useMemo(() => {
    return filteredVendors.reduce((sum, supplier) => sum + getSupplierItemCount(supplier), 0);
  }, [filteredVendors, itemCountBySupplier]);

  const totalItems = filteredVendors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedVendors = filteredVendors.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Vendors & Suppliers']}>
      <Head title="Vendors & Suppliers" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Page header and create action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Truck className="w-6 h-6 text-indigo-600" />
              Vendors & Suppliers Masterlist
            </h1>
            <p className="text-sm text-slate-500">
              Manage hardware providers, procurement partners, and supplier contact directory.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Vendor/Supplier
          </button>
        </div>

        {/* Filter, pagination size, and overall count bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search vendor, contact, or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
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
              Total Vendors:{' '}
              <span className="text-slate-800 font-bold tabular-nums">{totalItems}</span>
            </div>

            {/* Overall associated items count across all suppliers (or filtered subset when searching) */}
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200/80 px-3 py-1 text-xs font-semibold text-indigo-800 tabular-nums">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Overall Associated Items:{' '}
                {(normalizedQuery ? filteredAssociatedItemsCount : overallAssociatedItemsCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Vendors directory table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Vendor / Company</th>
                  <th className="py-3.5 px-4">Contact Information</th>
                  <th className="py-3.5 px-4">Associated Items</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedVendors.length > 0 ? (
                  paginatedVendors.map((supplier) => {
                    const associatedCount = getSupplierItemCount(supplier);
                    const countStyle = getItemCountStyle(associatedCount);

                    return (
                      <tr key={supplier.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{supplier.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{supplier.contact_person}</div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {supplier.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {supplier.phone_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border tabular-nums ${countStyle.badge}`}
                          >
                            <Layers className={`w-3 h-3 ${countStyle.icon}`} />
                            {associatedCount} {associatedCount === 1 ? 'item' : 'items'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {supplier.updated_at}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(supplier)}
                              title="View Vendor Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(supplier)}
                              title="Edit Vendor Record"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(supplier)}
                              title="Delete Vendor"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
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
                    <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                      No vendors found. Click "+ Add New Vendor/Supplier" to create one.
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

        {/* Create / Edit / View supplier modal */}
        <SupplierModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedSupplier}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Vendor</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">"{supplierToDelete?.name}"</span>?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
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