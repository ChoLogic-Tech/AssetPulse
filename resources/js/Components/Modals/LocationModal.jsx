import React, { useEffect } from 'react';
import { X, MapPin, Edit3, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

export function LocationModal({
  isOpen,
  onClose,
  mode = 'create',
  initialData = null,
  properties = [],
  canSelectAnyProperty = false,
  userPropertyId = '',
}) {
  const isEdit = mode === 'edit';
  const isView = mode === 'view';

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    property_id: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    clearErrors();

    if ((isEdit || isView) && initialData) {
      setData({
        name: initialData.name ?? '',
        property_id: initialData.property_id ?? '',
      });
    } else {
      setData({
        name: '',
        property_id: canSelectAnyProperty
          ? (properties[0]?.id ?? '')
          : (userPropertyId ?? ''),
      });
    }
  }, [isOpen, mode, initialData, canSelectAnyProperty, userPropertyId]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const submittedName = data.name;

    if (!isEdit) {
      const createPromise = new Promise((resolve, reject) => {
        post(route('locations.store'), {
          onSuccess: () => {
            onClose();
            reset();
            resolve({ name: submittedName });
          },
          onError: (err) => reject(err),
        });
      });

      toast.promise(createPromise, {
        loading: 'Adding location...',
        success: (res) => `Location "${res.name}" successfully created.`,
        error: 'Failed to create location. Please check the form for errors.',
      });
    } else {
      const updatePromise = new Promise((resolve, reject) => {
        put(route('locations.update', initialData.id), {
          onSuccess: () => {
            onClose();
            resolve({ name: submittedName });
          },
          onError: (err) => reject(err),
        });
      });

      toast.promise(updatePromise, {
        loading: 'Updating location...',
        success: (res) => `Location "${res.name}" successfully updated.`,
        error: 'Failed to update location. Please check the form for errors.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {isEdit ? (
              <Edit3 className="w-5 h-5 text-indigo-600" />
            ) : (
              <MapPin className="w-5 h-5 text-indigo-600" />
            )}
            {isView
              ? 'Location Details'
              : isEdit
              ? 'Update Location'
              : 'Add New Location'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isView ? (
          <div className="p-6 space-y-4 text-sm text-slate-600">
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Location / Room Name</span>
              <span className="font-semibold text-slate-900 text-base">{initialData?.name}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 uppercase font-semibold">Property / Branch</span>
              <span className="font-medium text-slate-800">
                {initialData?.property_name || 'Central / Unassigned'}
              </span>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Property / Branch *
              </label>
              <select
                value={data.property_id}
                onChange={(e) => setData('property_id', e.target.value)}
                disabled={!canSelectAnyProperty}
                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white ${
                  !canSelectAnyProperty ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : ''
                }`}
                required={canSelectAnyProperty}
              >
                {canSelectAnyProperty && <option value="">Central / Unassigned</option>}
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
              {errors.property_id && <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Location / Storage Room Name *
              </label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="e.g. Server Room, North Perimeter Gate, Housekeeping Closet"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                required
              />
              {errors.name && <span className="text-xs text-rose-500 mt-1 block">{errors.name}</span>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processing ? 'Saving...' : isEdit ? 'Update Location' : 'Save Location'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}