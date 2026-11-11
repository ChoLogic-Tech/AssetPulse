import React, { useState } from 'react';
import { 
  Users as UsersIcon, Search, UserPlus, Shield, 
  Building2, Edit3, Trash2, Eye, CheckCircle2, XCircle
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { UserModal } from '@/Components/Modals/UserModal';

export default function Users({ users = [], roles = [], properties = [], statuses = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (userId, userName) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      router.delete(route('users.destroy', userId));
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.fname} ${user.lname}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = selectedRoleFilter 
      ? String(user.role_id) === String(selectedRoleFilter) 
      : true;

    const matchesProperty = selectedPropertyFilter 
      ? String(user.property_id) === String(selectedPropertyFilter) 
      : true;

    return matchesSearch && matchesRole && matchesProperty;
  });

  return (
    <AuthenticatedLayout pageTitle={["Settings", "User Management", "System Accounts"]}>
      <Head title="User Directory" />
      <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-indigo-600" />
              System User Directory
            </h1>
            <p className="text-sm text-slate-500">
              Manage user credentials, assign property scopes, and configure system authorization roles.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Username, or Email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-48"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            <select 
              value={selectedPropertyFilter}
              onChange={(e) => setSelectedPropertyFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600 w-full md:w-56"
            >
              <option value="">All Properties / Branches</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">User Details</th>
                  <th className="py-3.5 px-4">Role & Authorization</th>
                  <th className="py-3.5 px-4">Primary Property</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => {
                    const isActive = String(user.status_name || user.status).toLowerCase().includes('active');

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{user.fname} {user.lname}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-indigo-600">@{user.username}</span>
                            <span>•</span>
                            <span>{user.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Shield className="w-3 h-3 text-indigo-500" />
                            {user.role_name || 'Staff'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {user.property_name || 'Central Office'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {user.status_name || (isActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button 
                            onClick={() => handleOpenEdit(user)}
                            title="Edit User Details" 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id, `${user.fname} ${user.lname}`)}
                            title="Delete Account" 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 text-sm">
                      No user accounts found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Component */}
        <UserModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          mode={modalMode}
          user={selectedUser}
          roles={roles}
          properties={properties}
          statuses={statuses}
        />

      </div>
    </AuthenticatedLayout>
  );
}