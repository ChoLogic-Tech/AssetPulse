import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  Ruler, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { UnitOfMeasuresModal } from '@/Components/Modals/UnitOfMeasuresModal';
import { toast } from 'sonner';

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

export default function UnitOfMeasures({ unitofmeasure = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedUom, setSelectedUom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uomToDelete, setUomToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedUom(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (oum) => {
    setSelectedUom(oum);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (oum) => {
    setUomToDelete(oum);
    setIsDeleteModalOpen(true);
  };

  const handleOpenView = (oum) => {
    setSelectedUom(oum);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!uomToDelete) return;

    const deletedName = uomToDelete.name;

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('unitofmeasures.destroy', uomToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setUomToDelete(null);
          resolve({ name: deletedName });
        },
        onError: (errors) => {
          reject(errors);
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting unit of measure...',
      success: (res) => `Unit of measure "${res.name}" successfully deleted.`,
      error: (err) => {
        if (err && typeof err === 'object') {
          const firstKey = Object.keys(err)[0];
          const msg = firstKey ? err[firstKey] : null;
          if (Array.isArray(msg)) return msg[0];
          if (typeof msg === 'string') return msg;
        }
        return 'Failed to delete unit of measure.';
      },
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const uomList = Array.isArray(unitofmeasure) ? unitofmeasure : [];

  const filteredUoms = uomList.filter((oum) => {
    const desc = oum.description ?? oum.descriptions ?? '';
    return (
      oum.name?.toLowerCase().includes(normalizedQuery) ||
      desc.toLowerCase().includes(normalizedQuery)
    );
  });

  const totalItems = filteredUoms.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedUoms = filteredUoms.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Units of Measure']}>
      <Head title="Units of Measure" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Ruler className="w-6 h-6 text-indigo-600" />
              Units of Measure Masterlist
            </h1>
            <p className="text-sm text-slate-500">
              Manage standardized units of measure (e.g., PCS, BOX, UNIT) used for item master records.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Unit of Measure
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
              placeholder="Search unit name or description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
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
              Total Units:{' '}
              <span className="text-slate-800 font-bold">{totalItems}</span>
            </div>
          </div>
        </div>

        {/* UOM Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Unit Name</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUoms.length > 0 ? (
                  paginatedUoms.map((item) => {
                    const desc = item.description ?? item.descriptions ?? '';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 font-mono">{item.name}</div>
                          <div className="text-xs text-slate-400 font-mono">ID: #{item.id}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          {desc || <span className="text-slate-400 italic">No description</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(item)}
                              title="View Unit Details"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Unit Record"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(item)}
                              title="Delete Unit"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
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
                    <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">
                      No units of measure found. Click "+ Add New Unit of Measure" to create one.
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

        {/* UOM Modal Component */}
        <UnitOfMeasuresModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedUom}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Unit of Measure</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700 font-mono">
                      "{uomToDelete?.name}"
                    </span>
                    ? This action cannot be undone.
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