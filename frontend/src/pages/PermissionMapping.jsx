import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function PermissionMapping() {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [formData, setFormData] = useState({
    menu: '',
    role: '',
    permission: 'view',
    can_view: true,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/core/ui-menu-permissions/'),
      axios.get('http://127.0.0.1:8000/api/core/roles/'),
      axios.get('http://127.0.0.1:8000/api/core/ui-menus/')
    ])
      .then(([permRes, roleRes, menuRes]) => {
        setPermissions(permRes.data?.results || permRes.data || []);
        setRoles(roleRes.data?.results || roleRes.data || []);
        setMenus(menuRes.data?.results || menuRes.data || []);
      })
      .catch(err => console.error("Error fetching permissions:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      menu: menus[0]?.id || '',
      role: roles[0]?.id || '',
      permission: 'view',
      can_view: true,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this menu permission rule?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-menu-permissions/${id}/`)
        .then(() => {
          setNotification("Permission mapping removed.");
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/api/core/ui-menu-permissions/', formData)
      .then(() => {
        setNotification("Menu permission mapping created.");
        setIsModalOpen(false);
        fetchData();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Creation failed: " + err.message));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="page-title">Dynamic Menu Permission Mapping</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Map sidebar menu visibility dynamically to specific user roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Permission Mapping
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Permission Table */}
      <div className="standard-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={4} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Menu Name</th>
                  <th>Target Role</th>
                  <th>Permission Type</th>
                  <th>Can View?</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#6B7280] italic">
                      No menu permission mappings found. Add rules to restrict menu access per role.
                    </td>
                  </tr>
                ) : (
                  permissions.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-[#6B7280]">{p.id}</td>
                      <td className="font-bold text-[#1F2937]">{p.menu_name || p.menu}</td>
                      <td className="font-semibold text-[#1B4E9B]">{p.role_name || p.role || 'All Roles'}</td>
                      <td className="font-mono text-xs text-[#374151]">{p.permission}</td>
                      <td>
                        <span className={`badge ${p.can_view ? 'badge-success' : 'badge-danger'}`}>
                          {p.can_view ? 'Allowed' : 'Denied'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="btn-action-delete"
                          title="Delete Mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title="Add Menu Permission Rule">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Target Sidebar Menu *</label>
            <select
              value={formData.menu}
              onChange={(e) => setFormData({ ...formData, menu: e.target.value })}
              className="form-input"
              required
            >
              {menus.map(m => (
                <option key={m.id} value={m.id}>{m.menu_name} ({m.menu_path})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">User Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="form-input"
              required
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="canViewCheck"
              checked={formData.can_view}
              onChange={(e) => setFormData({ ...formData, can_view: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="canViewCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Allow menu visibility for this role
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
