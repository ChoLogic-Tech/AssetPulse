import React, { useState } from 'react';
import { 
  Plus, Search, Edit2, Trash2, Eye, 
  FolderTree, Layers, AlertTriangle 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { CategoryModal } from '@/Components/Modals/CategoryModal';
import { toast } from 'sonner'

export default function Categories({ category = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (category) => {
    setCategoryToDelete(category);
    setIsDeleteModalOpen(true);
  };

  const handleOpenView = (category) => {
    setSelectedCategory(category);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      // 1. Wrap the router.delete request in a native Promise
      const deletePromise = new Promise((resolve, reject) => {
        router.delete(route('categories.destroy', categoryToDelete.id), {
          onStart: () => setIsDeleting(true),
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
            // Resolve with data that can be used in success message
            setTimeout (() => resolve({ name: categoryToDelete.name }), 500);
          },
          onError: (errors) => {
            reject(errors);
          },
          onFinish: () => setIsDeleting(false),
        });
      });

      // 2. Pass the promise into Sonner's toast.promise
      toast.promise(deletePromise, {
        loading: 'Deleting category...',
        success: (data) => `Category "${data.name}" successfully deleted.`,
        error: 'Failed to delete category.',
      });
    }
  };

  const filteredCategories = category.filter(category => 
    category.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Master Data", "Categories"]}>
        <Head title="Categories" />
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FolderTree className="w-6 h-6 text-indigo-600" />
                Categories Masterlist
            </h1>
            <p className="text-sm text-slate-500">
                Manage hardware classifications and asset categories for catalog definitions.
            </p>
            </div>
            <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Add New Category
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
                placeholder="Search category name..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            </div>
            
            <div className="text-sm text-slate-500 font-medium">
              Total Categories: <span className="text-slate-800 font-bold">{filteredCategories.length}</span>
            </div>
        </div>

        {/* Categories Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                    <th className="py-3.5 px-4">Category Name</th>
                    <th className="py-3.5 px-4">Associated Items</th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{category.name}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: #{category.id}</div>
                        </td>
                        <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              <Layers className="w-3 h-3 text-slate-500" />
                              {category.items_count || 0} items
                            </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                            {category.updated_at}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                            <button 
                                onClick={() => handleOpenView(category)}
                                title="View Category Details" 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleOpenEdit(category)}
                                title="Edit Category Record" 
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleOpenDelete(category)}
                                title="Delete Category" 
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
                        <td colSpan="4" className="py-8 text-center text-slate-400 text-sm">
                            No categories found. Click "+ Add New Category" to create one.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        </div>

        {/* Category Modal Component */}
        <CategoryModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mode={modalMode}
            initialData={selectedCategory}
            onSuccessCreate={() => toast.success('Category successfully created.')}
            onSuccessUpdate={() => toast.success('Category successflly updated.')}
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
                  <h3 className="text-lg font-bold text-slate-900">Delete Category</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove <span className="font-semibold text-slate-700">"{categoryToDelete?.name}"</span>? This action cannot be undone.
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