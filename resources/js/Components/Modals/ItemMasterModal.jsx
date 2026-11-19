import React, { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function ItemMasterModal({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  initialData = null,
  categories = [],
  brands = [],
  models = []
}) {
  if (!isOpen) return null;
  
  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  // 1. Create a ref for the textarea
  const textareaRef = useRef(null);

  const { data, setData, post, put, processing, errors, reset } = useForm({
    sku: initialData?.sku || '',
    uom: initialData?.uom || '',
    item_name: initialData?.item_name || '',
    category_id: initialData?.category_id || '',
    brand_id: initialData?.brand_id || '',
    model_id: initialData?.model_id || '',
    description: initialData?.description || '',
  });

  // 2. Helper function to adjust height automatically
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height to recalculate properly
      textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  };

  // Adjust height whenever description data changes (e.g., when initialData loads)
  useEffect(() => {
    adjustHeight();
  }, [data.description]);
    
  useEffect(() => {
    if (initialData && (isEdit || isViewOnly)) {
      setData({
        sku: initialData.sku || '',
        uom: initialData.uom || '',
        item_name: initialData.item_name || '',
        category_id: initialData.category_id || '',
        brand_id: initialData.brand_id || '',
        model_id: initialData.model_id || '',
        description: initialData.description || '',
      });
    } else {
      reset();
    }
  }, [isOpen, initialData, mode]);
    
  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('itemmaster.store'), {
          onSuccess: () => {
            onClose();
            setTimeout(() => resolve({ name: data.item_name }), 500);
            reset();
          },
          onError: (errors) => {
            reject(errors);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding item...',
        success: (res) => `Item "${res.name}" successfully created.`,
        error: 'Failed to create item. Please check the form for errors.',
      });

    } else {
      const updatePromise = new Promise((resolve, reject) => {
        put(route('itemmaster.update', initialData.id), {
          onSuccess: () => {
            onClose();
            resolve({ name: data.item_name });
          },
          onError: (errors) => {
            reject(errors);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating item...',
        success: (res) => `Item "${res.name}" successfully updated.`,
        error: 'Failed to update item. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add Master Item Catalog Record'}
            {mode === 'edit' && 'Edit Catalog Master Record'}
            {mode === 'view' && 'Item Master Record Details'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                disabled={isViewOnly}
                placeholder="e.g. SKU-LAP-001"
                value={data.sku}
                onChange={(e) => setData('sku', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Unit of Measure (UOM) *
              </label>
              <input
                type="text"
                disabled={isViewOnly}
                placeholder="e.g. pcs, box, meters, set"
                value={data.uom}
                onChange={(e) => setData('uom', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
              {errors.uom && <p className="text-xs text-red-500 mt-1">{errors.uom}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Item Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              value={data.item_name}
              onChange={(e) => setData('item_name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
            {errors.item_name && <p className="text-xs text-red-500 mt-1">{errors.item_name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Category
              </label>
              <select 
                disabled={isViewOnly}
                value={data.category_id}
                onChange={(e) => setData('category_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Brand
              </label>
              <select 
                disabled={isViewOnly}
                value={data.brand_id}
                onChange={(e) => setData('brand_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Model
              </label>
              <select 
                disabled={isViewOnly}
                value={data.model_id}
                onChange={(e) => setData('model_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Specification Description
            </label>
            <textarea
              ref={textareaRef}
              rows="3"
              disabled={isViewOnly}
              placeholder="Enter item specs, extended descriptions, or standard notes..."
              value={data.description}
              onChange={(e) => {
                setData('description', e.target.value);
                adjustHeight();
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500 resize-none overflow-hidden"
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processing 
                ? (mode === 'create' ? 'Creating...' : 'Saving...') 
                : (mode === 'create' ? 'Create Item' : 'Save Changes')
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}