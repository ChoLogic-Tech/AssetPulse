import React, { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, ChevronDown, Search } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

function ScrollableDropdown({
  value,
  onChange,
  options = [],
  getOptionValue = (item) => item.id,
  getOptionLabel = (item) => item.name,
  getOptionSubLabel = null,
  placeholder = 'Select option',
  searchPlaceholder = 'Type to filter...',
  disabled = false,
  hasError = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(
    (item) => String(getOptionValue(item)) === String(value)
  );

  const filteredOptions = options.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const label = String(getOptionLabel(item) ?? '').toLowerCase();
    const subLabel = getOptionSubLabel
      ? String(getOptionSubLabel(item) ?? '').toLowerCase()
      : '';
    return label.includes(q) || subLabel.includes(q);
  });

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) setQuery('');
      return next;
    });
  };

  const handleSelect = (nextVal) => {
    onChange(nextVal);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full px-3 py-2 text-sm text-left border rounded-lg flex items-center justify-between gap-2 outline-none transition ${
          disabled
            ? 'bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed'
            : hasError
            ? 'bg-white text-slate-800 border-red-500 focus:ring-2 focus:ring-red-500/20'
            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
        }`}
      >
        <span className={`truncate ${!selectedOption ? 'text-slate-400' : 'font-medium'}`}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 mt-1.5 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {/* Search Input inside Dropdown */}
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

          {/* Scrollable Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-slate-50 transition ${
                String(value ?? '') === '' ? 'text-indigo-600 font-semibold bg-indigo-50/40' : 'text-slate-500'
              }`}
            >
              <span>{placeholder}</span>
              {String(value ?? '') === '' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const optionVal = getOptionValue(item);
                const isSelected = String(optionVal) === String(value);
                const subLabel = getOptionSubLabel ? getOptionSubLabel(item) : null;

                return (
                  <button
                    key={optionVal}
                    type="button"
                    onClick={() => handleSelect(optionVal)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition ${
                      isSelected ? 'bg-indigo-50/60 text-indigo-700 font-medium' : 'text-slate-700'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{getOptionLabel(item)}</div>
                      {subLabel && (
                        <div className="text-[11px] text-slate-400 truncate">{subLabel}</div>
                      )}
                    </div>
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

export function ItemMasterModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  skus = [],
  unitofmeasures = [],
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
  const uomList = Array.isArray(unitofmeasures) ? unitofmeasures : [];
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
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-visible">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
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
              <ScrollableDropdown
                disabled={isViewOnly}
                value={data.sku_id}
                onChange={(val) => handleFieldChange('sku_id', val)}
                options={skuList}
                getOptionLabel={(skuItem) => skuItem.sku_code}
                getOptionSubLabel={(skuItem) => skuItem.descriptions}
                placeholder="Select SKU"
                searchPlaceholder="Search SKU code or description..."
                hasError={Boolean(errors.sku_id)}
              />
              {errors.sku_id && (
                <p className="text-xs text-red-500 mt-1">{errors.sku_id}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Unit of Measure (UOM) *
              </label>
              <ScrollableDropdown
                disabled={isViewOnly}
                value={data.uom_id}
                onChange={(val) => handleFieldChange('uom_id', val)}
                options={uomList}
                getOptionLabel={(uomItem) => uomItem.name}
                getOptionSubLabel={(uomItem) => uomItem.descriptions}
                placeholder="Select UOM"
                searchPlaceholder="Search UOM..."
                hasError={Boolean(errors.uom_id)}
              />
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
              placeholder="Enter product name..."
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
              <ScrollableDropdown
                disabled={isViewOnly}
                value={data.category_id}
                onChange={(val) => handleFieldChange('category_id', val)}
                options={categoryList}
                getOptionLabel={(category) => category.name}
                placeholder="Select Category"
                searchPlaceholder="Search category..."
              />
            </div>

            {/* Brand Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Brand
              </label>
              <ScrollableDropdown
                disabled={isViewOnly}
                value={data.brand_id}
                onChange={(val) => handleFieldChange('brand_id', val)}
                options={brandList}
                getOptionLabel={(brand) => brand.name}
                placeholder="Select Brand"
                searchPlaceholder="Search brand..."
              />
            </div>

            {/* Model Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Model
              </label>
              <ScrollableDropdown
                disabled={isViewOnly}
                value={data.model_id}
                onChange={(val) => handleFieldChange('model_id', val)}
                options={modelList}
                getOptionLabel={(model) => model.name}
                placeholder="Select Model"
                searchPlaceholder="Search model..."
              />
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