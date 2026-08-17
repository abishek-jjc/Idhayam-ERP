import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu, Plus, Edit3, Trash2, CheckCircle2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    menu_name: '',
    menu_path: '',
    module_code: 'core',
    menu_icon: 'LayoutDashboard',
    parent_menu: '',
    display_order: 1,
    active: true,
  });

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
          setNotification("Menu updated.");
          setIsModalOpen(false);
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/core/ui-menus/', payload)
        .then(() => {
          setNotification("New menu created.");
          setIsModalOpen(false);
          fetchMenus();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Dynamic Sidebar Menu Management"
        description="Configure navigation menus, ordering, visibility, icons and submenus without altering React source code."
        icon={Menu}
        breadcrumbItems={[
          { label: 'Admin Console', path: '/admin-console' },
          { label: 'Menu Management', path: '#' }
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchMenus}>
              Refresh
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Create New Menu
            </Button>
          </>
        }
      />

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Dynamic Menus Table */}
      <div className="standard-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={5} columns={6} />
          </div>
        ) : (
          <Table headers={['Order', 'Menu Name', 'Path Route', 'Module Code', 'Icon Name', 'Parent Menu', 'Status', { label: 'Actions', align: 'right' }]}>
            {menus.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <EmptyState title="No sidebar menus registered" message="Click 'Create New Menu' to add navigation items." />
                </td>
              </tr>
            ) : (
              menus.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono font-bold text-[#1B4E9B]">#{m.display_order}</td>
                  <td className="font-bold text-[#1F2937]">{m.menu_name}</td>
                  <td className="font-mono text-xs text-[#374151]">{m.menu_path}</td>
                  <td><Badge variant="neutral">{m.module_code}</Badge></td>
                  <td className="font-mono text-[#6B7280]">{m.menu_icon || 'LayoutDashboard'}</td>
                  <td className="text-[#6B7280]">{m.parent_menu_name || 'Top-Level'}</td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(m)}
                      className={`badge ${m.active ? 'badge-success' : 'badge-danger'} flex items-center gap-1 cursor-pointer`}
                    >
                      {m.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {m.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(m)} title="Edit Menu" />
                      <IconButton variant="delete" icon={Trash2} onClick={() => handleDelete(m.id)} title="Delete Menu" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        )}
      </div>

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
              <label className="form-label">Lucide Icon Name</label>
              <input
                type="text"
                value={formData.menu_icon}
                onChange={(e) => setFormData({ ...formData, menu_icon: e.target.value })}
                className="form-input"
                placeholder="e.g., Cpu, Layers, Building2"
              />
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
    </div>
  );
}
