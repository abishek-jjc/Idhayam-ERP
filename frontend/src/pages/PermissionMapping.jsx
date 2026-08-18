import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CoreAPI, ProcessEngineAPI, MastersAPI } from '../api';
import {
  ShieldCheck, Plus, Trash2, CheckCircle2, RefreshCw, Edit3, Eye,
  Lock, KeyRound, Layers, Check, X, SlidersHorizontal
} from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import IconButton from '../components/ui/IconButton';
import FilterBar from '../components/ui/FilterBar';

export default function PermissionMapping() {
  const [activeTab, setActiveTab] = useState('system_permissions');
  const [corePermissions, setCorePermissions] = useState([]);
  const [menuPermissions, setMenuPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [menus, setMenus] = useState([]);
  const [processTypes, setProcessTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Core Permission Modal State
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);

  const handleBulkDeletePermissions = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected permission rule(s)?`)) return;
    try {
      for (const id of selectedIds) {
        await CoreAPI.deletePermission(id);
      }
      setSelectedIds([]);
      loadPermissions();
    } catch (err) { alert("Bulk delete failed: " + err.message); }
  };
  const [coreFormData, setCoreFormData] = useState({
    target_type: 'role', // 'role' or 'designation'
    role: '',
    designation: '',
    module: 'structural_masters',
    process_type: '',
    master_category: '',
    action: '',
    can_view: true,
    can_create: false,
    can_edit: false,
    can_delete: false,
    can_approve: false,
  });

  // Menu Permission Modal State
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuFormData, setMenuFormData] = useState({
    menu: '',
    role: '',
    permission: 'view',
    can_view: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coreRes, menuPermRes, roleRes, desigRes, menuRes, procRes, catRes] = await Promise.all([
        CoreAPI.getPermissions().catch(() => ({ data: [] })),
        axios.get('http://127.0.0.1:8000/api/core/ui-menu-permissions/').catch(() => ({ data: [] })),
        CoreAPI.getRoles().catch(() => ({ data: [] })),
        CoreAPI.getDesignations().catch(() => ({ data: [] })),
        axios.get('http://127.0.0.1:8000/api/core/ui-menus/').catch(() => ({ data: [] })),
        ProcessEngineAPI.getProcessTypes().catch(() => ({ data: [] })),
        MastersAPI.getCategories().catch(() => ({ data: [] })),
      ]);

      setCorePermissions(coreRes.data?.results || coreRes.data || []);
      setMenuPermissions(menuPermRes.data?.results || menuPermRes.data || []);
      const rList = roleRes.data?.results || roleRes.data || [];
      setRoles(rList);
      const dList = desigRes.data?.results || desigRes.data || [];
      setDesignations(dList);
      const mList = menuRes.data?.results || menuRes.data || [];
      setMenus(mList);
      setProcessTypes(procRes.data?.results || procRes.data || []);
      setCategories(catRes.data?.results || catRes.data || []);
    } catch (err) {
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddCorePermModal = () => {
    setEditingCorePerm(null);
    setCoreFormData({
      target_type: 'role',
      role: roles[0]?.id || '',
      designation: designations[0]?.id || '',
      module: 'structural_masters',
      process_type: '',
      master_category: '',
      action: '',
      can_view: true,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_approve: false,
    });
    setCoreModalOpen(true);
  };

  const openEditCorePermModal = (perm) => {
    setEditingCorePerm(perm);
    setCoreFormData({
      target_type: perm.role ? 'role' : 'designation',
      role: perm.role || '',
      designation: perm.designation || '',
      module: perm.module || 'structural_masters',
      process_type: perm.process_type || '',
      master_category: perm.master_category || '',
      action: perm.action || '',
      can_view: perm.can_view ?? true,
      can_create: perm.can_create ?? false,
      can_edit: perm.can_edit ?? false,
      can_delete: perm.can_delete ?? false,
      can_approve: perm.can_approve ?? false,
    });
    setCoreModalOpen(true);
  };

  const handleCorePermSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        role: coreFormData.target_type === 'role' ? (coreFormData.role || null) : null,
        designation: coreFormData.target_type === 'designation' ? (coreFormData.designation || null) : null,
        module: coreFormData.module,
        process_type: coreFormData.process_type || null,
        master_category: coreFormData.master_category || null,
        action: coreFormData.action || null,
        can_view: coreFormData.can_view,
        can_create: coreFormData.can_create,
        can_edit: coreFormData.can_edit,
        can_delete: coreFormData.can_delete,
        can_approve: coreFormData.can_approve,
      };

      if (editingCorePerm) {
        await CoreAPI.updatePermission(editingCorePerm.id, payload);
        setNotification(`Updated permission rule (${editingCorePerm.id})`);
      } else {
        await CoreAPI.createPermission(payload);
        setNotification("Created new core permission rule.");
      }

      window.dispatchEvent(new Event('erp_permissions_updated'));
      setCoreModalOpen(false);
      setEditingCorePerm(null);
      fetchData();
      setTimeout(() => setNotification(''), 3500);
    } catch (err) {
      alert("Core Permission operation failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteCorePerm = async (id) => {
    if (!window.confirm("Remove this core permission rule?")) return;
    try {
      await CoreAPI.deletePermission(id);
      window.dispatchEvent(new Event('erp_permissions_updated'));
      setNotification("Core permission rule deleted.");
      fetchData();
      setTimeout(() => setNotification(''), 3500);
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // Menu Permission Handlers
  const handleOpenAddMenuPerm = () => {
    setMenuFormData({
      menu: menus[0]?.id || '',
      role: roles[0]?.id || '',
      permission: 'view',
      can_view: true,
    });
    setMenuModalOpen(true);
  };

  const handleMenuPermSubmit = (e) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/api/core/ui-menu-permissions/', menuFormData)
      .then(() => {
        window.dispatchEvent(new Event('erp_permissions_updated'));
        window.dispatchEvent(new Event('erp_ui_metadata_updated'));
        setNotification("Menu permission mapping created.");
        setMenuModalOpen(false);
        fetchData();
        setTimeout(() => setNotification(''), 3500);
      })
      .catch(err => alert("Creation failed: " + err.message));
  };

  const handleDeleteMenuPerm = (id) => {
    if (window.confirm("Remove this menu permission rule?")) {
      axios.delete(`http://127.0.0.1:8000/api/core/ui-menu-permissions/${id}/`)
        .then(() => {
          window.dispatchEvent(new Event('erp_permissions_updated'));
          window.dispatchEvent(new Event('erp_ui_metadata_updated'));
          setNotification("Menu permission mapping removed.");
          fetchData();
          setTimeout(() => setNotification(''), 3500);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  // Filtering lists
  const filteredCorePermissions = corePermissions.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.id && p.id.toLowerCase().includes(term)) ||
      (p.module && p.module.toLowerCase().includes(term)) ||
      (p.role_name && p.role_name.toLowerCase().includes(term)) ||
      (p.designation_title && p.designation_title.toLowerCase().includes(term)) ||
      (p.process_type_name && p.process_type_name.toLowerCase().includes(term)) ||
      (p.master_category_name && p.master_category_name.toLowerCase().includes(term))
    );
  });

  const filteredMenuPermissions = menuPermissions.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.id && p.id.toLowerCase().includes(term)) ||
      (p.menu_name && p.menu_name.toLowerCase().includes(term)) ||
      (p.role_name && p.role_name.toLowerCase().includes(term))
    );
  });

  const moduleOptions = [
    { value: 'all', label: 'All Modules (Global Matrix)' },
    { value: 'structural_masters', label: 'Structural Masters' },
    { value: 'dynamic_masters', label: 'Dynamic Masters (EAV)' },
    { value: 'process_engine', label: 'Process Engine & Verification' },
    { value: 'workflow', label: 'Workflow & Proposal Approvals' },
    { value: 'journal', label: 'Journal & Stock Ledger' },
    { value: 'dashboard', label: 'Dashboard & Widgets' },
    { value: 'admin', label: 'Admin Console & System Config' },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="page-title">Role Permission Management & Access Matrix</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Full display, view, and control of `core_permission` table rules (Role Access Matrix) and sidebar menu access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={activeTab === 'system_permissions' ? openAddCorePermModal : handleOpenAddMenuPerm}
          >
            Add {activeTab === 'system_permissions' ? 'System Permission Rule' : 'Menu Permission Rule'}
          </Button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex border-b border-[#E5E7EB] bg-white px-3 rounded-xl shadow-xs gap-4">
        <button
          onClick={() => setActiveTab('system_permissions')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'system_permissions'
              ? 'border-[#1B4E9B] text-[#1B4E9B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Lock className="w-4 h-4" />
          Core System Permissions (`core_permission`)
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#EFF6FF] text-[#1B4E9B] font-mono">
            {corePermissions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('menu_permissions')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'menu_permissions'
              ? 'border-[#1B4E9B] text-[#1B4E9B]'
              : 'border-transparent text-[#6B7280] hover:text-[#1F2937]'
          }`}
        >
          <Layers className="w-4 h-4" />
          Sidebar Menu Permissions (`ui_menu_permission`)
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#F3F4F6] text-[#4B5563] font-mono">
            {menuPermissions.length}
          </span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search ${activeTab === 'system_permissions' ? 'core permissions...' : 'menu permissions...'}`}
      />

      {/* Core Permissions Table View */}
      {activeTab === 'system_permissions' && (
        <>
          {selectedIds.length > 0 && (
            <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between mb-3 animate-fade-in">
              <span className="text-xs font-bold text-[#1B4E9B]">
                {selectedIds.length} permission rule(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds([])} className="text-xs text-[#6B7280] hover:text-[#1F2937] font-semibold underline px-2">
                  Clear Selection
                </button>
                <Button variant="danger" icon={Trash2} onClick={handleBulkDeletePermissions}>
                  Delete Selected ({selectedIds.length})
                </Button>
              </div>
            </div>
          )}

          <div className="standard-card p-0 overflow-hidden">
            {loading ? (
              <div className="p-6">
                <SkeletonLoader rows={5} columns={10} />
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={filteredCorePermissions.length > 0 && filteredCorePermissions.every(p => selectedIds.includes(p.id))}
                          onChange={() => {
                            const pageIds = filteredCorePermissions.map(p => p.id);
                            if (pageIds.every(id => selectedIds.includes(id))) {
                              setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
                            } else {
                              setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                        />
                      </th>
                      <th>Primary Key</th>
                      <th>Target Role / Designation</th>
                      <th>Module</th>
                      <th>Process / Category</th>
                      <th className="text-center">View</th>
                      <th className="text-center">Create</th>
                      <th className="text-center">Edit</th>
                      <th className="text-center">Delete</th>
                      <th className="text-center">Approve</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCorePermissions.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="p-8 text-center text-[#6B7280] italic">
                          No `core_permission` rules found. Click `+ Add System Permission Rule` to grant fine-grained permissions to roles.
                        </td>
                      </tr>
                    ) : (
                      filteredCorePermissions.map((p) => (
                        <tr key={p.id} className={selectedIds.includes(p.id) ? 'bg-[#F0F9FF]' : ''}>
                          <td className="w-10 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(p.id)}
                              onChange={() => {
                                if (selectedIds.includes(p.id)) setSelectedIds(selectedIds.filter(i => i !== p.id));
                                else setSelectedIds([...selectedIds, p.id]);
                              }}
                              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                            />
                          </td>
                          <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{p.id}</td>
                          <td>
                            {p.role_name ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B4E9B] bg-[#EFF6FF] px-2.5 py-1 rounded-md text-xs border border-[#BFDBFE]">
                                <KeyRound className="w-3 h-3 text-[#1B4E9B]" />
                                Role: {p.role_name}
                              </span>
                            ) : p.designation_title ? (
                              <span className="inline-flex items-center gap-1.5 font-semibold text-[#6B21A8] bg-[#F3E8FF] px-2.5 py-1 rounded-md text-xs border border-[#E9D5FF]">
                                Designation: {p.designation_title}
                              </span>
                            ) : (
                              <Badge variant="neutral">Global / All Users</Badge>
                            )}
                          </td>
                          <td className="font-mono text-xs font-bold text-[#1F2937] uppercase">{p.module}</td>
                          <td className="text-xs text-[#4B5563]">
                            {p.process_type_name ? (
                              <span className="text-[#2563EB] font-semibold">Process: {p.process_type_name}</span>
                            ) : p.master_category_name ? (
                              <span className="text-[#16A34A] font-semibold">Category: {p.master_category_name}</span>
                            ) : p.action ? (
                              <span className="font-mono text-xs text-[#D97706] font-semibold">Action: {p.action}</span>
                            ) : (
                              <span className="text-[#9CA3AF] italic">All Scope</span>
                            )}
                          </td>
                          <td className="text-center">
                            {p.can_view ? (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#DCFCE7] text-[#16A34A]"><Check className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#FEE2E2] text-[#DC2626]"><X className="w-3.5 h-3.5" /></span>
                            )}
                          </td>
                          <td className="text-center">
                            {p.can_create ? (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#DCFCE7] text-[#16A34A]"><Check className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#FEE2E2] text-[#DC2626]"><X className="w-3.5 h-3.5" /></span>
                            )}
                          </td>
                          <td className="text-center">
                            {p.can_edit ? (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#DCFCE7] text-[#16A34A]"><Check className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#FEE2E2] text-[#DC2626]"><X className="w-3.5 h-3.5" /></span>
                            )}
                          </td>
                          <td className="text-center">
                            {p.can_delete ? (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#DCFCE7] text-[#16A34A]"><Check className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#FEE2E2] text-[#DC2626]"><X className="w-3.5 h-3.5" /></span>
                            )}
                          </td>
                          <td className="text-center">
                            {p.can_approve ? (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#DCFCE7] text-[#16A34A]"><Check className="w-3.5 h-3.5" /></span>
                            ) : (
                              <span className="inline-flex items-center justify-center p-1 rounded bg-[#FEE2E2] text-[#DC2626]"><X className="w-3.5 h-3.5" /></span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="flex justify-end gap-1">
                              <IconButton variant="edit" icon={Edit3} onClick={() => openEditCorePermModal(p)} title="Edit Rule" />
                              <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteCorePerm(p.id)} title="Delete Rule" />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Menu Permissions Table View */}
      {activeTab === 'menu_permissions' && (
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
                  {filteredMenuPermissions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-[#6B7280] italic">
                        No menu permission mappings found. Add rules to restrict sidebar menu access per role.
                      </td>
                    </tr>
                  ) : (
                    filteredMenuPermissions.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs text-[#6B7280]">{p.id}</td>
                        <td className="font-bold text-[#1F2937]">{p.menu_name || p.menu}</td>
                        <td className="font-semibold text-[#1B4E9B]">{p.role_name || p.role || 'All Roles'}</td>
                        <td className="font-mono text-xs text-[#374151]">{p.permission}</td>
                        <td>
                          <Badge variant={p.can_view ? 'success' : 'danger'}>
                            {p.can_view ? 'Allowed' : 'Denied'}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteMenuPerm(p.id)} title="Delete Mapping" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Core Permission Add/Edit Modal */}
      <Modal
        isOpen={coreModalOpen}
        onClose={() => setCoreModalOpen(false)}
        size="md"
        title={editingCorePerm ? `Edit Core Permission (${editingCorePerm.id})` : 'Add System Permission Rule (`core_permission`)'}
      >
        <form onSubmit={handleCorePermSubmit} className="space-y-4">
          <div>
            <label className="form-label">Target Binding *</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  coreFormData.target_type === 'role'
                    ? 'bg-[#1B4E9B] text-white border-[#1B4E9B]'
                    : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F9FAFB]'
                }`}
                onClick={() => setCoreFormData({ ...coreFormData, target_type: 'role' })}
              >
                Role (`core_role`)
              </button>
              <button
                type="button"
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  coreFormData.target_type === 'designation'
                    ? 'bg-[#1B4E9B] text-white border-[#1B4E9B]'
                    : 'bg-white text-[#374151] border-[#D1D5DB] hover:bg-[#F9FAFB]'
                }`}
                onClick={() => setCoreFormData({ ...coreFormData, target_type: 'designation' })}
              >
                Designation
              </button>
            </div>
          </div>

          {coreFormData.target_type === 'role' ? (
            <div>
              <label className="form-label">Select Target Role (`core_role`)*</label>
              <select
                value={coreFormData.role}
                onChange={(e) => setCoreFormData({ ...coreFormData, role: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select Role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.id})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="form-label">Select Target Designation *</label>
              <select
                value={coreFormData.designation}
                onChange={(e) => setCoreFormData({ ...coreFormData, designation: e.target.value })}
                className="form-input"
                required
              >
                <option value="">Select Designation...</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Target ERP Module *</label>
            <select
              value={coreFormData.module}
              onChange={(e) => setCoreFormData({ ...coreFormData, module: e.target.value })}
              className="form-input"
              required
            >
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {coreFormData.module === 'process_engine' && (
            <div>
              <label className="form-label">Scope to Process Type (Optional)</label>
              <select
                value={coreFormData.process_type}
                onChange={(e) => setCoreFormData({ ...coreFormData, process_type: e.target.value })}
                className="form-input"
              >
                <option value="">All Process Types</option>
                {processTypes.map((pt) => (
                  <option key={pt.id} value={pt.id}>
                    {pt.name} ({pt.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {coreFormData.module === 'dynamic_masters' && (
            <div>
              <label className="form-label">Scope to Master Category (Optional)</label>
              <select
                value={coreFormData.master_category}
                onChange={(e) => setCoreFormData({ ...coreFormData, master_category: e.target.value })}
                className="form-input"
              >
                <option value="">All Master Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Action / Operation Code (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={coreFormData.action}
              onChange={(e) => setCoreFormData({ ...coreFormData, action: e.target.value })}
              placeholder="e.g. approve_po, cancel_entry, view_logs"
            />
          </div>

          {/* Capabilities Checkbox Matrix */}
          <div>
            <label className="form-label mb-2">Capability Grants Matrix</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
              <label className="flex items-center gap-2 text-xs text-[#374151] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreFormData.can_view}
                  onChange={(e) => setCoreFormData({ ...coreFormData, can_view: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                Can View
              </label>
              <label className="flex items-center gap-2 text-xs text-[#374151] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreFormData.can_create}
                  onChange={(e) => setCoreFormData({ ...coreFormData, can_create: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                Can Create
              </label>
              <label className="flex items-center gap-2 text-xs text-[#374151] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreFormData.can_edit}
                  onChange={(e) => setCoreFormData({ ...coreFormData, can_edit: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                Can Edit
              </label>
              <label className="flex items-center gap-2 text-xs text-[#374151] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreFormData.can_delete}
                  onChange={(e) => setCoreFormData({ ...coreFormData, can_delete: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                Can Delete
              </label>
              <label className="flex items-center gap-2 text-xs text-[#374151] font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={coreFormData.can_approve}
                  onChange={(e) => setCoreFormData({ ...coreFormData, can_approve: e.target.checked })}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                Can Approve
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setCoreModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingCorePerm ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Menu Permission Modal */}
      <Modal isOpen={menuModalOpen} onClose={() => setMenuModalOpen(false)} size="md" title="Add Menu Permission Rule">
        <form onSubmit={handleMenuPermSubmit} className="space-y-4">
          <div>
            <label className="form-label">Target Sidebar Menu *</label>
            <select
              value={menuFormData.menu}
              onChange={(e) => setMenuFormData({ ...menuFormData, menu: e.target.value })}
              className="form-input"
              required
            >
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.menu_name} ({m.menu_path})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">User Role (`core_role`)*</label>
            <select
              value={menuFormData.role}
              onChange={(e) => setMenuFormData({ ...menuFormData, role: e.target.value })}
              className="form-input"
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="canViewMenuCheck"
              checked={menuFormData.can_view}
              onChange={(e) => setMenuFormData({ ...menuFormData, can_view: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="canViewMenuCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Allow menu visibility for this role
            </label>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setMenuModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
