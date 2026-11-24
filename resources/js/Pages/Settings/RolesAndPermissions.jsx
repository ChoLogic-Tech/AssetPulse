import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, Plus, Shield,
  Edit3, Trash2, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { RoleModal } from '@/Components/Modals/RoleModal';
import { PermissionModal } from '@/Components/Modals/PermissionModal';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  itemLabel = 'items',
}) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-800">{startItem}</span> to{' '}
        <span className="font-semibold text-slate-800">{endItem}</span> of{' '}
        <span className="font-semibold text-slate-800">{totalItems}</span> {itemLabel}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>

          <span className="px-2 font-medium text-slate-600">
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Roles({ roles = [], permissions = [] }) {
  // Role State
  const [searchRoleQuery, setSearchRoleQuery] = useState('');
  const [rolePage, setRolePage] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState('create');

  // Permission State
  const [searchPermissionQuery, setSearchPermissionQuery] = useState('');
  const [permissionPage, setPermissionPage] = useState(1);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionModalMode, setPermissionModalMode] = useState('create');

  // Delete Confirmation Modal State (supports either 'role' or 'permission')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'role' | 'permission', item: object }
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset page to 1 when search query or list size changes
  useEffect(() => {
    setRolePage(1);
  }, [searchRoleQuery, roles.length]);

  useEffect(() => {
    setPermissionPage(1);
  }, [searchPermissionQuery, permissions.length]);

  // --- Role Handlers ---
  const handleOpenCreateRole = () => {
    setSelectedRole(null);
    setRoleModalMode('create');
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setSelectedRole(role);
    setRoleModalMode('edit');
    setIsRoleModalOpen(true);
  };

  const handleOpenDeleteRole = (role) => {
    setItemToDelete({ type: 'role', item: role });
    setIsDeleteModalOpen(true);
  };

  // --- Permission Handlers ---
  const handleOpenCreatePermission = () => {
    setSelectedPermission(null);
    setPermissionModalMode('create');
    setIsPermissionModalOpen(true);
  };

  const handleOpenEditPermission = (permission) => {
    setSelectedPermission(permission);
    setPermissionModalMode('edit');
    setIsPermissionModalOpen(true);
  };

  const handleOpenDeletePermission = (permission) => {
    setItemToDelete({ type: 'permission', item: permission });
    setIsDeleteModalOpen(true);
  };

  // --- Shared Delete Handler ---
  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    const { type, item } = itemToDelete;
    const isRole = type === 'role';
    const routeName = isRole ? 'roles.destroy' : 'permissions.destroy';
    const label = isRole ? 'Role' : 'Permission';

    const deletePromise = new Promise((resolve, reject) => {
      router.delete(route(routeName, item.id), {
        preserveScroll: true,
        onStart: () => setIsDeleting(true),
        onSuccess: (page) => {
          const errorFlash = page.props.flash?.error;
          setIsDeleteModalOpen(false);
          setItemToDelete(null);

          if (errorFlash) {
            reject(new Error(errorFlash));
          } else {
            resolve({ name: item.name });
          }
        },
        onError: () => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
          reject(new Error(`Failed to delete ${label.toLowerCase()}.`));
        },
        onFinish: () => setIsDeleting(false),
      });
    });

    toast.promise(deletePromise, {
      loading: `Deleting ${label.toLowerCase()}...`,
      success: (data) => `${label} "${data.name}" successfully deleted.`,
      error: (err) =>
        err instanceof Error
          ? err.message
          : isRole
            ? 'Cannot delete this role because it is still assigned to active users.'
            : 'Cannot delete this permission because it is still assigned to roles.',
    });
  };

  // Filtered & Paginated Roles (10 per page)
  const filteredRoles = roles.filter((role) =>
    role.name?.toLowerCase().includes(searchRoleQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchRoleQuery.toLowerCase())
  );
  const totalRolePages = Math.max(1, Math.ceil(filteredRoles.length / ITEMS_PER_PAGE));
  const safeRolePage = Math.min(rolePage, totalRolePages);
  const paginatedRoles = filteredRoles.slice(
    (safeRolePage - 1) * ITEMS_PER_PAGE,
    safeRolePage * ITEMS_PER_PAGE
  );

  // Filtered & Paginated Permissions (10 per page)
  const filteredPermissions = permissions.filter((permission) =>
    permission.name?.toLowerCase().includes(searchPermissionQuery.toLowerCase()) ||
    permission.description?.toLowerCase().includes(searchPermissionQuery.toLowerCase())
  );
  const totalPermissionPages = Math.max(1, Math.ceil(filteredPermissions.length / ITEMS_PER_PAGE));
  const safePermissionPage = Math.min(permissionPage, totalPermissionPages);
  const paginatedPermissions = filteredPermissions.slice(
    (safePermissionPage - 1) * ITEMS_PER_PAGE,
    safePermissionPage * ITEMS_PER_PAGE
  );

  const deletingType = itemToDelete?.type === 'permission' ? 'Permission' : 'Role';

  return (
    <AuthenticatedLayout pageTitle={['Settings', 'User Management', 'Roles & Permissions']}>
      <Head title="Roles & Permissions Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

        {/* Roles Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Roles Management
            </h1>
            <p className="text-sm text-slate-500">
              Configure access scopes, system roles, and role descriptions for authorization.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateRole}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Role
          </button>
        </div>

        {/* Roles Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchRoleQuery}
              onChange={(e) => setSearchRoleQuery(e.target.value)}
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
                {paginatedRoles.length > 0 ? (
                  paginatedRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          {role.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        {role.description || 'No description provided.'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditRole(role)}
                          title="Edit Role"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteRole(role)}
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

          <PaginationBar
            currentPage={safeRolePage}
            totalPages={totalRolePages}
            totalItems={filteredRoles.length}
            perPage={ITEMS_PER_PAGE}
            onPageChange={setRolePage}
            itemLabel="roles"
          />
        </div>

        {/* Permissions Header Section */}
        <div className="flex flex-col pt-8 md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              Permissions Management
            </h2>
            <p className="text-sm text-slate-500">
              Define granular system capabilities that can be assigned to roles.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreatePermission}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Add New Permission
          </button>
        </div>

        {/* Permissions Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchPermissionQuery}
              onChange={(e) => setSearchPermissionQuery(e.target.value)}
              placeholder="Search Permission Name or Description..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Permissions Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Permission Name</th>
                  <th className="py-3.5 px-4">Description / Scope</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedPermissions.length > 0 ? (
                  paginatedPermissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          {permission.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-md">
                        {permission.description || 'No description provided.'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPermission(permission)}
                          title="Edit Permission"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeletePermission(permission)}
                          title="Delete Permission"
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
                      No permissions found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={safePermissionPage}
            totalPages={totalPermissionPages}
            totalItems={filteredPermissions.length}
            perPage={ITEMS_PER_PAGE}
            onPageChange={setPermissionPage}
            itemLabel="permissions"
          />
        </div>

        {/* Role Modal */}
        <RoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          mode={roleModalMode}
          role={selectedRole}
        />

        {/* Permission Modal */}
        <PermissionModal
          isOpen={isPermissionModalOpen}
          onClose={() => setIsPermissionModalOpen(false)}
          mode={permissionModalMode}
          permission={selectedPermission}
        />

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete {deletingType}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Are you sure you want to remove{' '}
                    <span className="font-semibold text-slate-700">"{itemToDelete?.item?.name}"</span>?
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleCloseDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
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