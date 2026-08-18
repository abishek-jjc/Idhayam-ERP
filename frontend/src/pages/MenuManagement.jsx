import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu, Plus, Edit3, Trash2, CheckCircle2, Eye, EyeOff, RefreshCw, Network } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import WhereUsedModal from '../components/ui/WhereUsedModal';

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  // Where Used Modal state
  const [whereUsedState, setWhereUsedState] = useState({ isOpen: false, itemId: '', itemName: '' });

  const [formData, setFormData] = useState({
    menu_name: '',
    menu_path: '',
    module_code: 'core',
    page_key: 'dashboard',
    menu_icon: 'LayoutDashboard',
    parent_menu: '',
    display_order: 1,
    active: true,
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const handleBulkDeleteMenus = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected menu item(s)?`)) return;
    try {
      for (const id of selectedIds) {
        await axios.delete(`http://127.0.0.1:8000/api/core/ui-menus/${id}/`);
      }
      setSelectedIds([]);
      fetchMenus();
    } catch (err) { alert("Bulk delete failed: " + err.message); }
  };

  const fetchMenus = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/core/ui-menus/')
      .then(res => setMenus(res.data?.results || res.data || []))
      .catch(err => console.error("Error fetching UI menus:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      menu_name: '',
      menu_path: '',
      module_code: 'core',
      page_key: 'dashboard',
      menu_icon: 'LayoutDashboard',
      parent_menu: '',
      display_order: menus.length + 1,
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      menu_name: item.menu_name,
      menu_path: item.menu_path,
      module_code: item.module_code,
      page_key: item.page_key || item.module_code,
      menu_icon: item.menu_icon || 'LayoutDashboard',
      parent_menu: item.parent_menu || '',
      display_order: item.display_order || 0,
      active: item.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this sidebar menu item?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-menus/${id}/`)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Menu item deleted.");
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleToggleActive = (item) => {
    axios.patch(`http://127.0.0.1:8000/api/core/ui-menus/${item.id}/`, {
      active: !item.active
    })
      .then(() => {
        window.dispatchEvent(new Event('erp_ui_metadata_updated'));
        setNotification(`Menu '${item.menu_name}' ${!item.active ? 'Activated' : 'Deactivated'}.`);
        fetchMenus();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Toggle failed: " + err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parent_menu: formData.parent_menu || null
    };

    if (editingId) {
      axios.put(`http://127.0.0.1:8000/api/core/ui-menus/${editingId}/`, payload)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Menu configuration updated.");
          setIsModalOpen(false);
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-menus/', payload)
        .then(() => {
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("New menu configuration created.");
          setIsModalOpen(false);
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Container */}
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <Menu className="w-5 h-5" />
            </span>
            <h1 className="page-title">Dynamic Sidebar Menu Management</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure navigation menus, ordering, visibility, icons and submenus without altering React source code.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchMenus}>
            Refresh
          </Button>
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Create New Menu
          </Button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Main Table Content */}
      {loading ? (
        <SkeletonLoader rows={6} columns={7} />
      ) : menus.length === 0 ? (
        <EmptyState
          title="No Dynamic Menus Found"
          description="Initialize your navigation structure by creating your first dynamic menu."
          actionText="Create Menu"
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {selectedIds.length > 0 && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between mb-3 animate-fade-in">
              <span className="text-xs font-bold text-[#1B4E9B]">
                {selectedIds.length} menu item(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds([])} className="text-xs text-[#6B7280] hover:text-[#1F2937] font-semibold underline px-2">
                  Clear Selection
                </button>
                <Button variant="danger" icon={Trash2} onClick={handleBulkDeleteMenus}>
                  Delete Selected ({selectedIds.length})
                </Button>
              </div>
            </div>
          )}

          <div className="table-container">
            <Table>
              <thead>
                <tr>
                  <th className="th-cell w-10 text-center">
                    <input
                      type="checkbox"
                      checked={menus.length > 0 && menus.every(m => selectedIds.includes(m.id))}
                      onChange={() => {
                        if (menus.every(m => selectedIds.includes(m.id))) {
                          setSelectedIds([]);
                        } else {
                          setSelectedIds(menus.map(m => m.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                    />
                  </th>
                  <th className="th-cell">Order</th>
                  <th className="th-cell">Menu Name</th>
                  <th className="th-cell">Path Route</th>
                  <th className="th-cell">Module Code</th>
                  <th className="th-cell">ERP Page</th>
                  <th className="th-cell">Icon Name</th>
                  <th className="th-cell">Parent Menu</th>
                  <th className="th-cell">Status</th>
                  <th className="th-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {menus.map((item) => (
                  <tr key={item.id} className={`table-row-hover ${selectedIds.includes(item.id) ? 'bg-[#F0F9FF]' : ''}`}>
                    <td className="td-cell text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => {
                          if (selectedIds.includes(item.id)) setSelectedIds(selectedIds.filter(i => i !== item.id));
                          else setSelectedIds([...selectedIds, item.id]);
                        }}
                        className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                      />
                    </td>
                    <td className="td-cell font-mono text-[#4B5563] text-xs">#{item.display_order}</td>
                    <td className="td-cell font-semibold text-[#1F2937]">{item.menu_name}</td>
                    <td className="td-cell text-xs font-mono text-[#2563EB]">{item.menu_path}</td>
                    <td className="td-cell">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#F3F4F6] text-[#374151]">
                        {item.module_code}
                      </span>
                    </td>
                    <td className="td-cell text-xs font-mono text-[#6B7280]">{item.page_key || item.module_code}</td>
                    <td className="td-cell text-xs text-[#6B7280] font-mono">{item.menu_icon || 'LayoutDashboard'}</td>
                    <td className="td-cell text-xs text-[#6B7280]">
                      {item.parent_menu ? menus.find(m => m.id === item.parent_menu)?.menu_name || 'Submenu' : 'Top-Level'}
                    </td>
                    <td className="td-cell">
                      <button onClick={() => handleToggleActive(item)} title="Click to toggle status">
                        {item.active ? (
                          <Badge variant="success" icon={Eye}>Active</Badge>
                        ) : (
                          <Badge variant="danger" icon={EyeOff}>Disabled</Badge>
                        )}
                      </button>
                    </td>
                    <td className="td-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          icon={Network}
                          variant="secondary"
                          size="sm"
                          title="Where Used & Impact"
                          onClick={() => setWhereUsedState({ isOpen: true, itemId: item.id, itemName: item.menu_name })}
                        />
                        <IconButton
                          icon={Edit3}
                          variant="primary"
                          size="sm"
                          title="Edit Menu"
                          onClick={() => handleOpenEdit(item)}
                        />
                        <IconButton
                          icon={Trash2}
                          variant="danger"
                          size="sm"
                          title="Delete Menu"
                          onClick={() => handleDelete(item.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {/* Add / Edit Menu Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Sidebar Menu" : "Create Sidebar Menu"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Menu Name *</label>
              <input
                type="text"
                value={formData.menu_name}
                onChange={(e) => setFormData({ ...formData, menu_name: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., Inventory Ledger"
              />
            </div>
            <div>
              <label className="form-label">Menu Path (Route) *</label>
              <input
                type="text"
                value={formData.menu_path}
                onChange={(e) => setFormData({ ...formData, menu_path: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., /inventory-ledger"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Module Code *</label>
              <input
                type="text"
                value={formData.module_code}
                onChange={(e) => setFormData({ ...formData, module_code: e.target.value })}
                className="form-input"
                required
                placeholder="e.g., process_engine"
              />
            </div>
            <div>
              <label className="form-label">Actual ERP Page *</label>
              <select
                value={formData.page_key}
                onChange={(e) => setFormData({ ...formData, page_key: e.target.value })}
                className="form-input"
                required
              >
                <option value="dashboard">Executive Dashboard</option>
                <option value="user_page">User Portal</option>
                <option value="admin">Admin Console</option>
                <option value="structural_masters">Structural Masters</option>
                <option value="dynamic_masters">Dynamic Masters (EAV)</option>
                <option value="process_engine">Process Engine</option>
                <option value="workflow">Workflow & Approvals</option>
                <option value="journal">Journal & Stock Ledger</option>
                <option value="process_attribute_values">Process Attribute Values</option>
                <option value="process_links">Process Links</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Lucide Icon Name</label>
              <input
                type="text"
                value={formData.menu_icon}
                onChange={(e) => setFormData({ ...formData, menu_icon: e.target.value })}
                className="form-input"
                placeholder="e.g., Cpu, Layers, Building2"
              />
            </div>
            <div>
              <p className="form-label">Routing Behavior</p>
              <p className="text-xs text-[#6B7280] pt-2">The route can change freely; this page binding keeps the same real ERP screen connected.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Display Order *</label>
              <input
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Parent Menu</label>
              <select
                value={formData.parent_menu}
                onChange={(e) => setFormData({ ...formData, parent_menu: e.target.value })}
                className="form-input"
              >
                <option value="">None (Top-Level Menu)</option>
                {menus.filter(m => m.id !== editingId).map(m => (
                  <option key={m.id} value={m.id}>{m.menu_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeMenuCheck"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="activeMenuCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Enable menu in Sidebar navigation
            </label>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? "Update Menu" : "Create Menu"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Where Used Modal */}
      <WhereUsedModal
        isOpen={whereUsedState.isOpen}
        onClose={() => setWhereUsedState({ ...whereUsedState, isOpen: false })}
        configType="menu"
        itemId={whereUsedState.itemId}
        itemName={whereUsedState.itemName}
      />
    </div>
  );
}
