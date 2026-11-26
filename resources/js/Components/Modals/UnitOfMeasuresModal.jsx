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

function getFirstErrorMessage(err, fallback) {
  if (!err || typeof err !== 'object') return fallback;
  const firstKey = Object.keys(err)[0];
  if (!firstKey) return fallback;
  const val = err[firstKey];
  return Array.isArray(val) ? val[0] : val || fallback;
}

export function UnitOfMeasuresModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
}) {
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    code: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    clearErrors();

    if (mode === 'create') {
      reset();
      return;
    }

    setData({
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description ?? initialData?.descriptions ?? '',
    });
  }, [isOpen, initialData, mode]);

  if (!isOpen) return null;

  const isViewOnly = mode === 'view';
  const isEdit = mode === 'edit';

  const handleFieldChange = (field, value) => {
    const nextValue = field === 'code' ? value.toUpperCase() : value;
    setData(field, nextValue);
    if (errors[field]) {
      clearErrors(field);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isViewOnly || processing) return;

    const submittedName = data.name.trim();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('unitofmeasures.store'), {
          preserveScroll: true,
          onSuccess: () => {
            reset();
            onClose();
            resolve({ name: submittedName });
          },
          onError: (err) => {
            reject(err);
          },
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding unit of measure...',
        success: (res) => `Unit of measure "${res.name}" successfully created.`,
        error: (err) =>
          getFirstErrorMessage(
            err,
            'Failed to create unit of measure. Please check the form for errors.'
          ),
      });
    } else {
      if (!initialData?.id) return;

      const updatePromise = new Promise((resolve, reject) => {
        put(route('unitofmeasures.update', initialData.id), {
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
        loading: 'Updating unit of measure...',
        success: (res) => `Unit of measure "${res.name}" successfully updated.`,
        error: (err) =>
          getFirstErrorMessage(
            err,
            'Failed to update unit of measure. Please check the form for errors.'
          ),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">
            {mode === 'create' && 'Add New Unit of Measure'}
            {isEdit && 'Edit Unit of Measure Record'}
            {isViewOnly && 'Unit of Measure Details'}
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
              Unit Code *
            </label>
            <input
              type="text"
              name="code"
              maxLength={20}
              value={data.code}
              onChange={(e) => handleFieldChange('code', e.target.value)}
              disabled={isViewOnly}
              placeholder="e.g., PC, BOX, SET, UNIT"
              className={`${inputClass(Boolean(errors.code))} font-mono uppercase`}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-600">{errors.code}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Unit Name *
            </label>
            <input
              type="text"
              name="name"
              maxLength={50}
              value={data.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isViewOnly}
              placeholder="e.g., Piece, Box, Set, Unit"
              className={inputClass(Boolean(errors.name))}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              value={data.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isViewOnly}
              placeholder="Optional description for this unit of measure"
              className={inputClass(Boolean(errors.description))}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
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
                  ? 'Create Unit'
                  : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}