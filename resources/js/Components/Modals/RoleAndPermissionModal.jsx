import React, { useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Shield, X } from 'lucide-react';
import { toast } from 'sonner';

export function RoleModal({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  role = null, 
  onSuccessCreate, 
  onSuccessUpdate 
}) {
  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    name: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      clearErrors();
      if (mode === 'edit' && role) {
        setData({
          name: role.name || '',
          description: role.description || '',
        });
      } else {
        reset();
      }
    }
  }, [isOpen, mode, role]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'create') {
      const createPromise = new Promise((resolve, reject) => {
        post(route('roles.store'), {
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
        loading: 'Creating role...',
        success: (res) => `Role "${res.name}" successfully created.`,
        error: 'Failed to create role. Please check the form for errors.',
      });

    } else {
      const updatePromise = new Promise((resolve, reject) => {
        put(route('roles.update', role.id), {
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
        loading: 'Updating role...',
        success: (res) => `Role "${res.name}" successfully updated.`,
        error: 'Failed to update role. Please check the form for errors.',
      });
    }
  };
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">
              {mode === 'create' ? 'Add New Role' : 'Edit Role'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Role Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="e.g. Property Manager, Administrator"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Description / Scope
            </label>
            <textarea
              rows="3"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Describe what access or privileges this role has..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
            {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {processing 
                ? (mode === 'create' ? 'Creating...' : 'Saving...') 
                : (mode === 'create' ? 'Create Role' : 'Save Changes')
              }
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}