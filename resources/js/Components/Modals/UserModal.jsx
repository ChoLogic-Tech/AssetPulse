import React, { useEffect } from 'react';
import { X, UserPlus, Edit3, Shield, CheckCircle2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';

export function UserModal({ isOpen, onClose, mode = 'create', user = null, roles = [], properties = [], statuses = [] }) {
  if (!isOpen) return null;
  const isEdit = mode === 'edit';

  const { data, setData, post, put, processing, errors, reset } = useForm({
    fname: user?.fname || '',
    lname: user?.lname || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role_id: user?.role_id || '',
    property_id: user?.property_id || '',
    status: user?.status || 1,
  });

  useEffect(() => {
    if (user && isEdit) {
      setData({
        fname: user.fname || '',
        lname: user.lname || '',
        username: user.username || '',
        email: user.email || '',
        password: '', // Kept empty unless updating password
        role_id: user.role_id || '',
        property_id: user.property_id || '',
        status: user.status || 1,
      });
    } else {
      reset();
    }
  }, [user, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEdit) {
      put(route('users.update', user.id), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    } else {
      post(route('users.store'), {
        onSuccess: () => {
          reset();
          onClose();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            {isEdit ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <UserPlus className="w-5 h-5 text-indigo-600" />}
            {isEdit ? 'Update User Account' : 'Register New User'}
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
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">First Name *</label>
              <input
                type="text"
                value={data.fname}
                onChange={(e) => setData('fname', e.target.value)}
                placeholder="John"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                required
              />
              {errors.fname && <span className="text-xs text-rose-500 mt-1 block">{errors.fname}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Last Name *</label>
              <input
                type="text"
                value={data.lname}
                onChange={(e) => setData('lname', e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                required
              />
              {errors.lname && <span className="text-xs text-rose-500 mt-1 block">{errors.lname}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Username *</label>
              <input
                type="text"
                value={data.username}
                onChange={(e) => setData('username', e.target.value)}
                placeholder="johndoe"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                required
              />
              {errors.username && <span className="text-xs text-rose-500 mt-1 block">{errors.username}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                placeholder="john@company.com"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
                required
              />
              {errors.email && <span className="text-xs text-rose-500 mt-1 block">{errors.email}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
              {isEdit ? 'New Password (Leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600"
              required={!isEdit}
            />
            {errors.password && <span className="text-xs text-rose-500 mt-1 block">{errors.password}</span>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Role Scope *</label>
              <select
                value={data.role_id}
                onChange={(e) => setData('role_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                required
              >
                <option value="">Select Role...</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              {errors.role_id && <span className="text-xs text-rose-500 mt-1 block">{errors.role_id}</span>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Primary Property *</label>
              <select
                value={data.property_id}
                onChange={(e) => setData('property_id', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
                required
              >
                <option value="">Select Property...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.property_id && <span className="text-xs text-rose-500 mt-1 block">{errors.property_id}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Account Status *</label>
            <select
              value={data.status}
              onChange={(e) => setData('status', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 bg-white"
              required
            >
              {statuses.length > 0 ? (
                statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
              ) : (
                <>
                  <option value={1}>Active</option>
                  <option value={2}>Inactive</option>
                </>
              )}
            </select>
            {errors.status && <span className="text-xs text-rose-500 mt-1 block">{errors.status}</span>}
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
              {processing ? 'Saving...' : isEdit ? 'Update Account' : 'Create User'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}