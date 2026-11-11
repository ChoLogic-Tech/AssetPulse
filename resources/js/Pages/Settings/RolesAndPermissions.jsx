import React, { useState } from 'react';
import { 
  ShieldCheck, Search, Plus, Shield, 
  Edit3, Trash2, AlertTriangle, Loader2 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { RoleModal } from '@/Components/Modals/RoleAndPermissionModal';
import { toast } from 'sonner';

export default function Roles({ roles = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');

  // Delete Confirmation Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role) => {
    setSelectedRole(role);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenDelete = (role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      // 1. Wrap the router.delete request in a native Promise
      const deletePromise = new Promise((resolve, reject) => {
        router.delete(route('roles.destroy', roleToDelete.id), {
          onStart: () => setIsDeleting(true),
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setRoleToDelete(null);
            // Resolve with data that can be used in success message
            setTimeout (() => resolve({ name: roleToDelete.name }), 500);
          },
          onError: (errors) => {
            reject(errors);
          },
          onFinish: () => setIsDeleting(false),
        });
      });

      // 2. Pass the promise into Sonner's toast.promise
      toast.promise(deletePromise, {
        loading: 'Deleting role...',
        success: (data) => `Role "${data.name}" successfully deleted.`,
        error: 'Failed to delete role. It may be assigned to active users.',
      });
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Settings", "User Management", "Roles & Permissions"]}>
      <Head title="Roles Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Roles & Authorization Management
            </h1>
            <p className="text-sm text-slate-500">
              Configure access scopes, system roles, and permission descriptions for administrative tracking.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Role
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Role Name or Description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Role Name</th>
                  <th className="py-3.5 px-4">Description / Scope</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRoles.length > 0 ? (
                  filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          {role.name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">ID: #{role.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        {role.description || 'No description provided.'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button 
                          onClick={() => handleOpenEdit(role)}
                          title="Edit Role" 
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(role)}
                          title="Delete Role" 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-8 text-center text-slate-400 text-sm">
                      No roles found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Modal Component with Sonner callbacks */}
        <RoleModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          role={selectedRole}
          onSuccessCreate={() => toast.success('Role successfully created.')}
          onSuccessUpdate={() => toast.success('Role successfully updated.')}
        />

        {/* Custom Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Role</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove <span className="font-semibold text-slate-700">"{roleToDelete?.name}"</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthenticatedLayout>
  );
}