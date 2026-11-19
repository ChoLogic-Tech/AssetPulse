import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function BrandModal({ isOpen, onClose, mode = 'create', initialData = null }) {
  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const isEdit = mode == 'edit';

  const { data, setData, post, put, processing, errors, reset } = useForm({
        name: initialData?.name,
      });

    useEffect(() => {
      if (initialData && (isEdit || isViewOnly)) {
        setData({
          name: initialData.name || '',
        });
      } else {
        reset();
      }
    }, [isOpen, initialData, mode]);

    const handleSubmit = (e) => {
      e.preventDefault();
  
      if (mode === 'create') {
        const createPromise = new Promise((resolve, reject) => {
          post(route('brands.store'), {
            onSuccess: () => {
              onClose();
              setTimeout (() => resolve({ name: data.name }), 500); // Pulls name directly from form state
              reset();
            },
            onError: (errors) => {
              reject(errors);
            },
          });
        });
  
        toast.promise(createPromise, {
          loading: 'Adding brand...',
          success: (res) => `Brand "${res.name}" successfully created.`,
          error: 'Failed to create brand. Please check the form for errors.',
        });
  
      } else {
        const updatePromise = new Promise((resolve, reject) => {
          put(route('brands.update', initialData.id), {
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
          loading: 'Updating brand...',
          success: (res) => `Category "${res.name}" successfully updated.`,
          error: 'Failed to update brand. Please check the form for errors.',
        });
      }
    };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Brand'}
            {mode === 'edit' && 'Edit Brand Record'}
            {mode === 'view' && 'Brand Details'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="flex flex-col p-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Brand Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly}
              placeholder="e.g. Cisco, Dell, Kingston, etc."
              value = {data?.name}
              onChange={(e) => setData('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              required
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
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
                  ? (mode === 'create' ? 'Creating...' : 'Saving...')
                  : (mode === 'create' ? 'Create Brand' : 'Save Changes')
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}