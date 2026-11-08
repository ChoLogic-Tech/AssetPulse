import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, Eye, 
  Package, Tag, Layers, RefreshCw, AlertCircle 
} from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { ItemMasterModal } from '@/Components/Modals/ItemMasterModal';

export default function ItemMaster() {
  // Mock data mapping to item_masterlist + joined relations
  const [items, setItems] = useState([
    {
      id: 1,
      sku: 'SKU-LAP-001',
      item_name: 'Dell Latitude 5440 14" Laptop',
      category_id: 1,
      category_name: 'Laptops',
      brand_id: 2,
      brand_name: 'Dell',
      model_id: 5,
      model_name: 'Latitude 5440',
      unit_of_measure: 'pcs',
      description: 'Standard issue enterprise laptop (Core i7, 16GB RAM, 512GB SSD)',
      updated_at: '2026-11-01 10:30 AM'
    },
    {
      id: 2,
      sku: 'SKU-PER-004',
      item_name: 'Logitech MX Master 3S',
      category_id: 2,
      category_name: 'Peripherals',
      brand_id: 1,
      brand_name: 'Logitech',
      model_id: 12,
      model_name: 'MX Master 3S',
      unit_of_measure: 'pcs',
      description: 'Ergonomic wireless bluetooth mouse',
      updated_at: '2026-10-28 02:15 PM'
    },
    {
      id: 3,
      sku: 'SKU-NET-012',
      item_name: 'Cat6 Ethernet Patch Cable 3M',
      category_id: 3,
      category_name: 'Networking',
      brand_id: null,
      brand_name: 'Generic',
      model_id: null,
      model_name: 'N/A',
      unit_of_measure: 'meters',
      description: 'High-speed gigabit networking cable',
      updated_at: '2026-10-15 08:45 AM'
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'view'

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this item from the catalog masterlist?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AuthenticatedLayout pageTitle={["Master Data", "Item Master"]}>
        <Head title="Item Master" />
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-indigo-600" />
                Item Masterlist Catalog
            </h1>
            <p className="text-sm text-slate-500">
                Define global stock keeping units (SKUs), categories, UOM, and brand references.
            </p>
            </div>
            <button 
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition"
            >
            <Plus className="w-4 h-4" />
            Add New Master Item
            </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3 justify-between items-center shadow-sm">
            <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or Item Name..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
            />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600">
                <option value="">All Categories</option>
                <option value="1">Laptops</option>
                <option value="2">Peripherals</option>
                <option value="3">Networking</option>
            </select>

            <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 bg-white outline-none focus:border-indigo-600">
                <option value="">All Brands</option>
                <option value="1">Logitech</option>
                <option value="2">Dell</option>
            </select>
            </div>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                <tr>
                    <th className="py-3.5 px-4">SKU / Item Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Brand & Model</th>
                    <th className="py-3.5 px-4">UOM</th>
                    <th className="py-3.5 px-4">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.item_name}</div>
                        <div className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3" />
                        {item.sku}
                        </div>
                    </td>
                    <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category_name}
                        </span>
                    </td>
                    <td className="py-3.5 px-4">
                        <div className="font-medium">{item.brand_name}</div>
                        <div className="text-xs text-slate-400">{item.model_name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {item.unit_of_measure}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                        {item.updated_at}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                        <button 
                            onClick={() => handleOpenView(item)}
                            title="View Metadata" 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Master Record" 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-md transition"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(item.id)}
                            title="Delete Record" 
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>

        {/* CRUD Modal Component */}
        <ItemMasterModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            mode={modalMode}
            initialData={selectedItem}
        />
        </div>
    </AuthenticatedLayout>
  );
}