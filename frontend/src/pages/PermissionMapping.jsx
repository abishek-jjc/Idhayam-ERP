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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Dynamic Menu Permission Mapping</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Map sidebar menu visibility dynamically to specific user roles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Permission Mapping
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Permission Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={4} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">ID</th>
                  <th className="p-4">Menu Name</th>
                  <th className="p-4">Target Role</th>
                  <th className="p-4">Permission Type</th>
                  <th className="p-4">Can View?</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {permissions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                      No menu permission mappings found. Add rules to restrict menu access per role.
                    </td>
                  </tr>
                ) : (
                  permissions.map((p) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono text-[11px] text-slate-400">{p.id}</td>
                      <td className="p-4 font-bold text-white">{p.menu_name || p.menu}</td>
                      <td className="p-4 font-semibold text-indigo-300">{p.role_name || p.role || 'All Roles'}</td>
                      <td className="p-4 font-mono text-purple-400">{p.permission}</td>
                      <td className="p-4">
                        <span className={`badge ${p.can_view ? 'badge-active' : 'badge-inactive'}`}>
                          {p.can_view ? 'Allowed' : 'Denied'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                          title="Delete Mapping"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Menu Permission Rule">
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

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="canViewCheck"
              checked={formData.can_view}
              onChange={(e) => setFormData({ ...formData, can_view: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-white/10"
            />
            <label htmlFor="canViewCheck" className="text-xs text-slate-200 cursor-pointer font-semibold">
              Allow menu visibility for this role
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
