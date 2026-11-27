import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

// Named export matching CategoryModal convention across modals
export function PropertyModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
}) {
  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  // Hooks must always run unconditionally before any early return
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: initialData?.name || '',
  });

  // Sync form state whenever the modal opens or target record changes
  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (initialData && (isEdit || isViewOnly)) {
      setData({
        name: initialData.name || '',
      });
    } else {
      reset();
      setData('name', '');
    }
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  // Input border and focus ring styling with validation error state
  const inputClass = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none disabled:bg-slate-50 disabled:text-slate-500 ${
      hasError
        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-600'
        : 'border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600'
    }`;

  // Submit create or update request and show Sonner toast promise feedback
  const handleSubmit = (e) => {
    e.preventDefault();

    const submittedName = data.name;

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post('/settings/properties', {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            reset();
            resolve({ name: submittedName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding property...',
        success: (res) => `Property "${res.name}" successfully created.`,
        error: (err) =>
          err?.name || 'Failed to create property. Please check the form for errors.',
      });
    } else {
      const updatePromise = new Promise((resolve, reject) => {
        put(`/settings/properties/${initialData.id}`, {
          preserveScroll: true,
          onSuccess: () => {
            onClose();
            resolve({ name: submittedName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating property...',
        success: (res) => `Property "${res.name}" successfully updated.`,
        error: 'Failed to update property. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Property'}
            {mode === 'edit' && 'Edit Property Record'}
            {mode === 'view' && 'Property Details'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Modal Form Body */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Property Name *
            </label>
            <input
              type="text"
              disabled={isViewOnly || processing}
              placeholder="e.g. Main Branch, North Wing, etc."
              value={data?.name ?? ''}
              onChange={(e) => setData('name', e.target.value)}
              className={inputClass(Boolean(errors.name))}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processing
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                  ? 'Create Property'
                  : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}