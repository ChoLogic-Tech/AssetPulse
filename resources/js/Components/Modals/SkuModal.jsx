import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

const inputClass = (hasError) =>
  `w-full px-3 py-2 text-sm border rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
    hasError
      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-600'
      : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
  }`;

export function SkuModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
}) {
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    sku_code: '',
    descriptions: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (mode === 'create') {
      reset();
      return;
    }

    setData({
      sku_code: initialData?.sku_code || '',
      descriptions: initialData?.descriptions || '',
    });
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const handleFieldChange = (field, value) => {
    setData(field, value);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    const submittedCode = data.sku_code.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('skus.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            onClose();
            resolve({ sku_code: submittedCode });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding SKU...',
        success: (res) => `SKU "${res.sku_code}" successfully created.`,
        error: (err) => err?.sku_code || 'Failed to create SKU. Please check the form for errors.',
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('skus.update', initialData.id), {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ sku_code: submittedCode });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating SKU...',
        success: (res) => `SKU "${res.sku_code}" successfully updated.`,
        error: (err) => err?.sku_code || 'Failed to update SKU. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New SKU'}
            {mode === 'edit' && 'Edit SKU Record'}
            {mode === 'view' && 'SKU Details'}
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
              SKU Code *
            </label>
            <input
              type="text"
              name="sku_code"
              value={data.sku_code}
              onChange={(e) => handleFieldChange('sku_code', e.target.value.toUpperCase())}
              disabled={isViewOnly}
              placeholder="e.g., NET-SW-CIS-24P, LS-HAR-PCB"
              className={inputClass(Boolean(errors.sku_code))}
            />
            {!isViewOnly && (
              <p className="mt-1 text-xs text-slate-500">
                Enter a unique SKU code—for example, using a{' '}
                <span className="font-medium text-slate-700">Type-Brand-Model</span> format such as{' '}
                <span className="font-mono text-slate-700">NET-SW-CIS-24P</span>.
              </p>
            )}
            {errors.sku_code && (
              <p className="mt-1 text-xs text-red-600">{errors.sku_code}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Description
            </label>
            <textarea
              name="descriptions"
              rows="3"
              value={data.descriptions}
              onChange={(e) => handleFieldChange('descriptions', e.target.value)}
              disabled={isViewOnly}
              placeholder="Optional description for this SKU"
              className={inputClass(Boolean(errors.descriptions))}
            />
            {errors.descriptions && (
              <p className="mt-1 text-xs text-red-600">{errors.descriptions}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
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
                  ? 'Create SKU'
                  : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}