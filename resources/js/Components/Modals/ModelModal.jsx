import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle2, ChevronDown } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function ModelModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  brands = [],
}) {
  const isViewOnly = mode === 'view';

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    brand_id: '',
  });

  const [brandSearch, setBrandSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const brandDropdownRef = useRef(null);

  const brandList = Array.isArray(brands) ? brands : [];

  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (initialData) {
      setData({
        name: initialData.name ?? '',
        brand_id: initialData.brand_id ?? '',
      });
      const matchedBrand = brandList.find(
        (b) => String(b.id) === String(initialData.brand_id)
      );
      setBrandSearch(matchedBrand ? matchedBrand.name : '');
    } else {
      reset();
      setBrandSearch('');
    }
    setShowSuggestions(false);
  }, [isOpen, initialData, mode]);

  useEffect(() => {
    if (!showSuggestions) return;

    const handleOutsideClick = (e) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSuggestions]);

  if (!isOpen) return null;

  const query = brandSearch.trim().toLowerCase();
  const matchedExactBrand = brandList.find(
    (b) => b.name.toLowerCase() === query && String(b.id) === String(data.brand_id)
  );

  const filteredBrands =
    !query || matchedExactBrand
      ? brandList
      : brandList.filter((b) => b.name.toLowerCase().includes(query));

  const handleSelectBrand = (brand) => {
    setData('brand_id', brand.id);
    setBrandSearch(brand.name);
    if (errors.brand_id) {
      clearErrors('brand_id');
    }
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    if (!data.brand_id) {
      toast.error('Please select a valid brand from the dropdown list.');
      return;
    }

    const modelName = data.name.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('models.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            setBrandSearch('');
            onClose();
            setTimeout(() => resolve({ name: modelName }), 500);
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding model...',
        success: (res) => `Model "${res.name}" successfully created.`,
        error: 'Failed to create model. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('models.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: modelName });
          },
          onError: (err) => {
            reject(err);
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
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-visible">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 rounded-t-xl flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Model'}
            {mode === 'edit' && 'Edit Model Record'}
            {mode === 'view' && 'Model Details'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Model Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="e.g. KX-TS500MX, SG300-28P, CBS350-24T-4G"
              value={data.name}
              onChange={(e) => {
                setData('name', e.target.value);
                if (errors.name) clearErrors('name');
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          {/* Scrollable Searchable Brand Dropdown */}
          <div ref={brandDropdownRef} className="relative">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Brand *
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={isViewOnly}
                placeholder="Click or type to search a brand e.g. Cisco, Dell..."
                value={brandSearch}
                onFocus={() => {
                  if (!isViewOnly) setShowSuggestions(true);
                }}
                onChange={(e) => {
                  setBrandSearch(e.target.value);
                  setShowSuggestions(true);
                  setData('brand_id', '');
                  if (errors.brand_id) clearErrors('brand_id');
                }}
                className="w-full pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
              {!isViewOnly && (
                <button
                  type="button"
                  onClick={() => setShowSuggestions((prev) => !prev)}
                  aria-label="Toggle brand dropdown"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-150 ${
                      showSuggestions ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}
            </div>

            {showSuggestions && !isViewOnly && (
              <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto divide-y divide-slate-50">
                {filteredBrands.length > 0 ? (
                  filteredBrands.map((brand) => {
                    const isSelected = String(brand.id) === String(data.brand_id);
                    return (
                      <li
                        key={brand.id}
                        onClick={() => handleSelectBrand(brand)}
                        className={`px-4 py-2 text-sm flex items-center justify-between cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50/70 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        <span>{brand.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </li>
                    );
                  })
                ) : (
                  <li className="px-4 py-3 text-xs text-slate-400 text-center">
                    No matching brands found.
                  </li>
                )}
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
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processing
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                  ? 'Save Model'
                  : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}