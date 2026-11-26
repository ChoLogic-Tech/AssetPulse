import React, { useEffect, useRef, useState } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye,
  Package, Tag, AlertTriangle, ChevronLeft, ChevronRight,
  ChevronDown, Check
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ItemMasterModal } from '@/Components/Modals/ItemMasterModal';
import { toast } from 'sonner';

const CATEGORY_PALETTE = [
  'bg-sky-50 text-sky-700 border-sky-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
];

const UNCATEGORIZED_BADGE_CLASS = 'bg-rose-50 text-rose-700 border-rose-200';

function getCategoryBadgeClass(categoryName, categoryId) {
  const normalizedName = String(categoryName ?? '').trim();
  if (!normalizedName || normalizedName.toLowerCase() === 'uncategorized') {
    return UNCATEGORIZED_BADGE_CLASS;
  }

  const key = String(categoryId ?? normalizedName);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }

  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
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

function ScrollableFilterDropdown({
  value,
  onChange,
  options = [],
  allLabel = 'All Options',
  searchPlaceholder = 'Type to filter...',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const optionList = Array.isArray(options) ? options : [];
  const selectedOption = optionList.find((opt) => String(opt.id) === String(value));

  const filteredOptions = optionList.filter((opt) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return String(opt.name ?? '').toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 10);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={dropdownRef} className="relative min-w-[165px]">
      <button
        type="button"
        onClick={() =>
          setIsOpen((prev) => {
            const next = !prev;
            if (!next) setQuery('');
            return next;
          })
        }
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white hover:border-slate-300 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 flex items-center justify-between gap-2 transition"
      >
        <span className="truncate font-medium text-slate-600">
          {selectedOption ? selectedOption.name : allLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 mt-1.5 w-60 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-50 transition ${
                String(value ?? '') === ''
                  ? 'text-indigo-600 font-semibold bg-indigo-50/50'
                  : 'text-slate-600'
              }`}
            >
              <span>{allLabel}</span>
              {String(value ?? '') === '' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition ${
                      isSelected ? 'bg-indigo-50/60 text-indigo-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{opt.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">
                No matching options found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemMaster({ item = [], unitofmeasures =[], skus = [], categories = [], brands = [], models = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (nextCategory) => {
    setSelectedCategory(nextCategory);
    setCurrentPage(1);
  };

  const handleBrandChange = (nextBrand) => {
    setSelectedBrand(nextBrand);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrand('');
    setCurrentPage(1);
  };

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (currentItem) => {
    setSelectedItem(currentItem);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (currentItem) => {
    setSelectedItem(currentItem);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const deletedName = itemToDelete.item_name;

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route('itemmaster.destroy', itemToDelete.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          setTimeout(() => resolve({ name: deletedName }), 500);
        },
        onError: (errors) => {
          reject(errors);
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: 'Deleting item...',
      success: (res) => `Item "${res.name}" successfully deleted.`,
      error: 'Failed to delete item.',
    });
  };

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

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = (Array.isArray(item) ? item : []).filter((currentItem) => {
    const skuCode =
      typeof currentItem.sku === 'string'
        ? currentItem.sku
        : currentItem.sku?.sku_code ?? '';

    const matchesSearch =
      !normalizedQuery ||
      currentItem.item_name?.toLowerCase().includes(normalizedQuery) ||
      skuCode.toLowerCase().includes(normalizedQuery);

    const matchesCategory =
      selectedCategory === '' || String(currentItem.category_id) === String(selectedCategory);
    const matchesBrand =
      selectedBrand === '' || String(currentItem.brand_id) === String(selectedBrand);

    return matchesSearch && matchesCategory && matchesBrand;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const hasActiveFilters =
    normalizedQuery.length > 0 || selectedCategory !== '' || selectedBrand !== '';

  return (
    <AuthenticatedLayout pageTitle={['Master Data', 'Item Master']}>
      <Head title="Item Master" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              Item Masterlist Catalog
            </h1>
            <p className="text-sm text-slate-500">
              Define global stock keeping units (SKUs), categories, UOM, and brand references.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Master Item
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm overflow-visible">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search SKU or Item Name..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            {/* Scrollable Category Filter Dropdown */}
            <ScrollableFilterDropdown
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categories}
              allLabel="All Categories"
              searchPlaceholder="Search category..."
            />

            {/* Scrollable Brand Filter Dropdown */}
            <ScrollableFilterDropdown
              value={selectedBrand}
              onChange={handleBrandChange}
              options={brands}
              allLabel="All Brands"
              searchPlaceholder="Search brand..."
            />

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

        {/* Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">SKU / Item Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Brand & Model</th>
                  <th className="py-3.5 px-4">UOM</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((currentItem) => {
                    const skuDisplay =
                      typeof currentItem.sku === 'string'
                        ? currentItem.sku
                        : currentItem.sku?.sku_code ?? 'N/A';
                    const categoryLabel = currentItem.category?.name || 'Uncategorized';
                    const categoryBadgeClass = getCategoryBadgeClass(
                      categoryLabel,
                      currentItem.category_id ?? currentItem.category?.id
                    );

                    return (
                      <tr key={currentItem.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{currentItem.item_name}</div>
                          <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Tag className="w-3 h-3" />
                            {skuDisplay}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${categoryBadgeClass}`}
                          >
                            {categoryLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium">{currentItem.brand?.name || 'No Brand'}</div>
                          <div className="text-xs text-slate-400">{currentItem.model?.name || 'No Model'}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                          {currentItem.uom?.name}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate" title={currentItem.description}>
                          {currentItem.description || 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {formatDate(currentItem.updated_at)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenView(currentItem)}
                              title="View Metadata"
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(currentItem)}
                              title="Edit Master Record"
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItemToDelete(currentItem);
                                setIsDeleteModalOpen(true);
                              }}
                              title="Delete Record"
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
                    <td colSpan="7" className="text-center py-8 text-slate-400 text-sm">
                      <div>
                        {hasActiveFilters
                          ? 'No items found matching your filters.'
                          : 'No items found. Click "+ Add New Master Item" to create one.'}
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                        >
                          Reset filters
                        </button>
                      )}
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

        {/* CRUD Modal Component */}
        <ItemMasterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          initialData={selectedItem}
          skus={skus}
          unitofmeasures={unitofmeasures}
          categories={categories}
          brands={brands}
          models={models}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Item Record</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">"{itemToDelete?.item_name}"</span>? This
                    action cannot be undone.
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