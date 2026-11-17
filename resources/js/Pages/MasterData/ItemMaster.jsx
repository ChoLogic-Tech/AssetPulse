import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, Eye, 
  Package, Tag, Layers, RefreshCw, AlertCircle, AlertTriangle
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { ItemMasterModal } from '@/Components/Modals/ItemMasterModal';
import { toast } from 'sonner';

export default function ItemMaster({ item = [], categories = [], brands = [], models = [] }) {

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      const deletePromise = new Promise((resolve, reject) => {
        router.delete(route('itemmaster.destroy', itemToDelete.id), {
          onStart: () => setIsDeleting(true),
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            setTimeout(() => resolve({ name: itemToDelete.item_name }), 500);
          },
          onError: (errors) => {
            reject(errors);
          },
          onFinish: () => setIsDeleting(false),
        });
      });
 
      toast.promise(deletePromise, {
        loading: 'Deleting item...',
        success: (data) => `Item "${data.name}" successfully deleted.`,
        error: 'Failed to delete item.',
      });
    }
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

  // Comprehensive filter logic for search, category, and brand
  const filteredItems = item.filter(currentItem => {
    const matchesSearch = 
      currentItem.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      currentItem.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === '' || String(currentItem.category_id) === String(selectedCategory);
    const matchesBrand = selectedBrand === '' || String(currentItem.brand_id) === String(selectedBrand);

    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <AuthenticatedLayout pageTitle={["Master Data", "Item Master"]}>
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
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Add New Master Item
            </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
            <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or Item Name..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Category Filter Dropdown */}
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
              >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
              </select>

              {/* Brand Filter Dropdown */}
              <select 
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600"
              >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.name}</option>
                  ))}
              </select>
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
                {filteredItems.length > 0 ? (
                  filteredItems.map((currentItem) => (
                    <tr key={currentItem.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{currentItem.item_name}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        {currentItem.sku}
                        </div>
                    </td>
                    <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {currentItem.category?.name || 'Uncategorized'}
                        </span>
                    </td>
                    <td className="py-3.5 px-4">
                        <div className="font-medium">{currentItem.brand?.name || 'No Brand'}</div>
                        <div className="text-xs text-slate-400">{currentItem.model?.name || 'No Model'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {currentItem.uom}
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
                            onClick={() => handleOpenView(currentItem)}
                            title="View Metadata" 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(currentItem)}
                            title="Edit Master Record" 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-slate-400 text-sm">
                      No items found matching your filters.
                    </td>
                  </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* CRUD Modal Component */}
        <ItemMasterModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mode={modalMode}
            initialData={selectedItem}
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
                    Are you sure you want to remove <span className="font-semibold text-slate-700">"{itemToDelete?.item_name}"</span>? This action cannot be undone.
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