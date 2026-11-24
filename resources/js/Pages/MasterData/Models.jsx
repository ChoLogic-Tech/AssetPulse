import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  Component, Layers, AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ModelModal } from '@/Components/Modals/ModelModal';
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

export default function Models({ model = [], brands = [], itemmaster = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedModel, setSelectedModel] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Count total items in itemmaster per model_id
  const itemCountByModel = useMemo (() => {
    const list = Array.isArray(itemmaster) ? itemmaster : [];
    return list.reduce((counts, row) => {
      const modelId = row?.model_id ?? row?.model?.id;
      if (modelId !== undefined && modelId !== null && modelId !== '') {
        const key = String(modelId);
        counts[key] = (counts[key] || 0) + 1;
      }
      return counts;
    }, {});
  }, [itemmaster]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedModel(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedModel(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (item) => {
    setSelectedModel(item);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setModelToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!modelToDelete) return;

    const deletedName = modelToDelete.name;

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('models.destroy', modelToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setModelToDelete(null);
          resolve({ name: deletedName });
        },
        onError: (errors) => {
          reject(errors);
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting model...',
      success: (res) => `Model "${res.name}" successfully deleted.`,
      error: 'Failed to delete model.',
    });
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredModels = (Array.isArray(model) ? model : []).filter((item) => {
    const brandName = typeof item.brand === 'string' ? item.brand : item.brand?.name || '';
    return (
      item.name?.toLowerCase().includes(normalizedQuery) ||
      brandName.toLowerCase().includes(normalizedQuery)
    );
  });

  const totalItems = filteredModels.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedModels = filteredModels.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Models']}>
      <Head title="Models" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Component className="w-6 h-6 text-indigo-600" />
              Models Masterlist
            </h1>
            <p className="text-sm text-slate-500">
              Manage hardware specifications and model versions for asset mapping.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Model
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
              placeholder="Search model or brand name..."
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
              Total Models:{' '}
              <span className="text-slate-800 font-bold">{totalItems}</span>
            </div>
          </div>
        </div>

        {/* Models Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Model Name</th>
                  <th className="py-3.5 px-4">Associated Items</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedModels.length > 0 ? (
                  paginatedModels.map((item) => {
                    const associatedCounts = itemCountByModel[String(item.id)] ?? 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          Brand: {item.brand?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <Layers className="w-3 h-3 text-slate-500" />
                          {associatedCounts} {associatedCounts === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-400">
                        {formatDate(item.updated_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenView(item)}
                            title="View Model Details"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Model Record"
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(item)}
                            title="Delete Model"
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
                    <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                      No models found. Click "+ Add New Model" to create one.
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

        {/* Model Modal Component */}
        <ModelModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedModel}
          brands={brands}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Model</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">"{modelToDelete?.name}"</span>?
                    This action cannot be undone.
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