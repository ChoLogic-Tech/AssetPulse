export function ItemMasterModal({ isOpen, onClose, mode = 'create', initialData = null }) {
    if (!isOpen) return null;
  
    const isViewOnly = mode === 'view';
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl overflow-hidden">
          {/* Modal Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-semibold text-slate-800">
              {mode === 'create' && 'Add Master Item Catalog Record'}
              {mode === 'edit' && 'Edit Catalog Master Record'}
              {mode === 'view' && 'Item Master Record Details'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
              &times;
            </button>
          </div>
  
          {/* Modal Form Body */}
          <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  disabled={isViewOnly}
                  placeholder="e.g. SKU-LAP-001"
                  defaultValue={initialData?.sku || ''}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  required
                />
              </div>
  
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Unit of Measure (UOM) *
                </label>
                <input
                  type="text"
                  disabled={isViewOnly}
                  placeholder="e.g. pcs, box, meters, set"
                  defaultValue={initialData?.unit_of_measure || 'pcs'}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                  required
                />
              </div>
            </div>
  
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Item Name *
              </label>
              <input
                type="text"
                disabled={isViewOnly}
                placeholder="e.g. Dell Latitude 5440 14 Laptop"
                defaultValue={initialData?.item_name || ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                required
              />
            </div>
  
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Category
                </label>
                <select 
                  disabled={isViewOnly}
                  defaultValue={initialData?.category_id || ''}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Category</option>
                  <option value="1">Laptops</option>
                  <option value="2">Peripherals</option>
                  <option value="3">Networking</option>
                </select>
              </div>
  
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Brand
                </label>
                <select 
                  disabled={isViewOnly}
                  defaultValue={initialData?.brand_id || ''}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Brand</option>
                  <option value="1">Logitech</option>
                  <option value="2">Dell</option>
                </select>
              </div>
  
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Model
                </label>
                <select 
                  disabled={isViewOnly}
                  defaultValue={initialData?.model_id || ''}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
                >
                  <option value="">Select Model</option>
                  <option value="5">Latitude 5440</option>
                  <option value="12">MX Master 3S</option>
                </select>
              </div>
            </div>
  
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Specification Description
              </label>
              <textarea
                rows="3"
                disabled={isViewOnly}
                placeholder="Enter item specs, extended descriptions, or standard notes..."
                defaultValue={initialData?.description || ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none disabled:bg-slate-50 disabled:text-slate-500"
              ></textarea>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                >
                  {mode === 'create' ? 'Save' : 'Update Changes'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }