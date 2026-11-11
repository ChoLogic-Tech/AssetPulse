
import React, { useEffect } from 'react';
import { X, Building2, Edit3, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function PropertyModal({ isOpen, onClose, mode = 'create', property = null }) {
  if (!isOpen) return null;
  const isEdit = mode === 'edit';

  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: property?.name || '',
  });

  useEffect(() => {
    if (property && isEdit) {
      setData({
        name: property.name || '',
      });
    } else {
      reset();
    }
  }, [property, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      put(route('properties.update', property.id), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    } else {
      post(route('properties.store'), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {isEdit ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Building2 className="w-5 h-5 text-indigo-600" />}
            {isEdit ? 'Update Property Branch' : 'Register New Property'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Property / Branch Name *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="e.g. Boracay Resort & Hotel"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
              required
            />
            {errors.name && <span className="text-xs text-rose-500 mt-1 block">{errors.name}</span>}
          </div>

          {/* Action Footer */}
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
              {processing ? 'Saving...' : isEdit ? 'Update Property' : 'Save Property'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}