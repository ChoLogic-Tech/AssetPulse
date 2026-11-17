import React, { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function ModelModal({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  initialData = null, 
  brands = [] 
}) {
  if (!isOpen) return null;

  const isViewOnly = mode === 'view';

  // Use Inertia's useForm hook for managing model name and brand_id
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: initialData?.name || '',
    brand_id: initialData?.brand_id || '',
  });

  // Local state for brand text search and dropdown visibility
  const [brandSearch, setBrandSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Sync initial data when modal opens/changes
  useEffect(() => {
    if (initialData) {
      setData({
        name: initialData.name || '',
        brand_id: initialData.brand_id || '',
      });
      const matchedBrand = brands.find(b => b.id === initialData.brand_id);
      setBrandSearch(matchedBrand ? matchedBrand.name : '');
    } else {
      reset();
      setBrandSearch('');
    }
  }, [isOpen, initialData]);

  // Filter brands only when the user has typed something
  const filteredBrands = brandSearch.trim() === '' 
    ? [] 
    : brands.filter((b) =>
        b.name.toLowerCase().includes(brandSearch.toLowerCase())
      );

  const handleSelectBrand = (brand) => {
    setData('brand_id', brand.id);
    setBrandSearch(brand.name);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Prevent submission if brand_id is empty (user typed but didn't click a dropdown option)
    if (!data.brand_id) {
      toast.error('Please select a valid brand from the suggestion list.');
      return;
    }

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('models.store'), {
          onSuccess: () => {
            onClose();
            setTimeout(() => resolve({ name: data.name }), 500);
            reset();
            setBrandSearch(''); // Reset local brand search input too
          },
          onError: (errors) => {
            reject(errors);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding model...',
        success: (res) => `Model "${res.name}" successfully created.`,
        error: 'Failed to create model. Please check the form for errors.',
      });

    } else {
      const updatePromise = new Promise((resolve, reject) => {
        put(route('models.update', initialData.id), {
          onSuccess: () => {
            onClose();
            resolve({ name: data.name });
          },
          onError: (errors) => {
            reject(errors);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating model...',
        success: (res) => `Model "${res.name}" successfully updated.`,
        error: 'Failed to update model. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Model'}
            {mode === 'edit' && 'Edit Model Record'}
            {mode === 'view' && 'Model Details'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Model Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="e.g. KX-TS500MX, SG300-28P, CBS350-24T-4G"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Autocomplete Brand Input Section */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Brand *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="Type to search for a brand e.g. Cisco, Dell..."
              value={brandSearch}
              onChange={(e) => {
                setBrandSearch(e.target.value);
                setShowSuggestions(true);
                setData('brand_id', ''); // Reset ID until a valid suggestion is chosen
              }}
              // Removed onFocus so suggestions only appear while typing
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />

            {/* Dropdown Suggestions Box */}
            {showSuggestions && !isViewOnly && filteredBrands.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <li
                    key={brand.id}
                    onClick={() => handleSelectBrand(brand)}
                    className="px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition"
                  >
                    {brand.name}
                  </li>
                ))}
              </ul>
            )}

            {errors.brand_id && <p className="text-xs text-rose-600 mt-1">{errors.brand_id}</p>}
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
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {processing 
                  ? (mode === 'create' ? 'Creating...' : 'Saving...') 
                  : (mode === 'create' ? 'Save Model' : 'Save Changes')
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}