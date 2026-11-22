import React, { useEffect, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function ItemMasterModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  skus = [],
  uoms = [],
  categories = [],
  brands = [],
  models = [],
}) {
  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const textareaRef = useRef(null);

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    sku_id: '',
    uom_id: '',
    item_name: '',
    category_id: '',
    brand_id: '',
    model_id: '',
    description: '',
  });

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [data.description, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (initialData && (isEdit || isViewOnly)) {
      setData({
        sku_id: initialData.sku_id ?? '',
        uom_id: initialData.uom_id ?? '',
        item_name: initialData.item_name ?? '',
        category_id: initialData.category_id ?? '',
        brand_id: initialData.brand_id ?? '',
        model_id: initialData.model_id ?? '',
        description: initialData.description ?? '',
      });
    } else {
      reset();
    }
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const skuList = Array.isArray(skus) ? skus : [];
  const uomList = Array.isArray(uoms) ? uoms : [];
  const categoryList = Array.isArray(categories) ? categories : [];
  const brandList = Array.isArray(brands) ? brands : [];
  const modelList = Array.isArray(models) ? models : [];

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    const itemName = data.item_name.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('itemmaster.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            onClose();
            resolve({ name: itemName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding item...',
        success: (res) => `Item "${res.name}" successfully created.`,
        error: 'Failed to create item. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('itemmaster.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: itemName });
          },
          onError: (err) => {
            reject(err);
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
            {isEdit && 'Edit Catalog Master Record'}
            {isViewOnly && 'Item Master Record Details'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                SKU (Stock Keeping Unit) *
              </label>
              <select
                disabled={isViewOnly}
                value={data.sku_id}
                onChange={(e) => handleFieldChange('sku_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select SKU</option>
                {skuList.map((skuItem) => (
                  <option key={skuItem.id} value={skuItem.id}>
                    {skuItem.sku_code}
                  </option>
                ))}
              </select>
              {errors.sku_id && (
                <p className="text-xs text-red-500 mt-1">{errors.sku_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Unit of Measure (UOM) *
              </label>
              <select
                disabled={isViewOnly}
                value={data.uom_id}
                onChange={(e) => handleFieldChange('uom_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select UOM</option>
                {uomList.map((uomItem) => (
                  <option key={uomItem.id} value={uomItem.id}>
                    {uomItem.name}
                  </option>
                ))}
              </select>
              {errors.uom_id && (
                <p className="text-xs text-red-500 mt-1">{errors.uom_id}</p>
              )}
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
              onChange={(e) => handleFieldChange('item_name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
            {errors.item_name && (
              <p className="text-xs text-red-500 mt-1">{errors.item_name}</p>
            )}
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
                onChange={(e) => handleFieldChange('category_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Category</option>
                {categoryList.map((category) => (
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
                onChange={(e) => handleFieldChange('brand_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Brand</option>
                {brandList.map((brand) => (
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
                onChange={(e) => handleFieldChange('model_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select Model</option>
                {modelList.map((model) => (
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
                handleFieldChange('description', e.target.value);
                adjustHeight();
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500 resize-none overflow-hidden"
            />
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
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                  ? 'Create Item'
                  : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}