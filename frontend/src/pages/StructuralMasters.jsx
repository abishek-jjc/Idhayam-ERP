import React, { useEffect, useState } from 'react';
import { CoreAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Building2, MapPin, Users, Truck, Store, Plus, Search, Trash2 } from 'lucide-react';

export default function StructuralMasters() {
  const [activeTab, setActiveTab] = useState('plants');
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');

  const [plantForm, setPlantForm] = useState({ name: '', code: '', plant_type: 'processing' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', is_shared_across_plants: false });
  const [desigForm, setDesigForm] = useState({ title: '', code: '', hierarchy_level: 1 });
  const [empForm, setEmpForm] = useState({ name: '', designation: '', department: '', plant: '', status: 'active' });
  const [machForm, setMachForm] = useState({ name: '', code: '', machine_type: 'single_machine', registration_number: '' });
  const [venForm, setVenForm] = useState({ name: '', code: '', gst_number: '' });
  const [storForm, setStorForm] = useState({ code: '', name: '', bin_capacity_kg: 10000 });

  useEffect(() => {
    loadStructuralData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

  async function loadStructuralData() {
    try {
      const [plRes, dpRes, dsRes, empRes, macRes, venRes, strRes] = await Promise.all([
        CoreAPI.getPlants(),
        CoreAPI.getDepartments(),
        CoreAPI.getDesignations(),
        CoreAPI.getEmployees(),
        CoreAPI.getMachines(),
        CoreAPI.getVendors(),
        CoreAPI.getStorageLocations(),
      ]);
      setPlants(plRes.data.results || plRes.data || []);
      setDepartments(dpRes.data.results || dpRes.data || []);
      setDesignations(dsRes.data.results || dsRes.data || []);
      setEmployees(empRes.data.results || empRes.data || []);
      setMachines(macRes.data.results || macRes.data || []);
      setVendors(venRes.data.results || venRes.data || []);
      setStorageLocations(strRes.data.results || strRes.data || []);
    } catch (err) {
      console.error("Error loading structural data:", err);
    }
  }

  const getModalTypeFromTab = (tab) => {
    if (tab === 'plants') return 'plant';
    if (tab === 'departments') return 'department';
    if (tab === 'designations') return 'designation';
    if (tab === 'employees') return 'employee';
    if (tab === 'machines') return 'machine';
    if (tab === 'vendors') return 'vendor';
    if (tab === 'storage') return 'storage';
    return tab;
  };

  const openCreateModal = (type) => {
    setModalType(type);
    if (type === 'employee') {
      setEmpForm({
        name: '',
        department: departments[0]?.id || '',
        designation: designations[0]?.id || '',
        plant: plants[0]?.id || '',
        status: 'active',
      });
    }
    setModalOpen(true);
  };

  const handleCreatePlant = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createPlant({ ...plantForm, company: 'CMP-13-08-2026-0001' });
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createDepartment(deptForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createDesignation(desigForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createEmployee(empForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createMachine(machForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createVendor(venForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleCreateStorage = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createStorageLocation(storForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.message); }
  };

  const handleDeletePlant = async (id) => {
    if (!window.confirm("Delete plant record?")) return;
    try { await CoreAPI.deletePlant(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete department record?")) return;
    try { await CoreAPI.deleteDepartment(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Delete employee record?")) return;
    try { await CoreAPI.deleteEmployee(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Delete machine/vehicle record?")) return;
    try { await CoreAPI.deleteMachine(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };

  const getCurrentList = () => {
    if (activeTab === 'plants') return plants;
    if (activeTab === 'departments') return departments;
    if (activeTab === 'designations') return designations;
    if (activeTab === 'employees') return employees;
    if (activeTab === 'machines') return machines;
    if (activeTab === 'vendors') return vendors;
    if (activeTab === 'storage') return storageLocations;
    return [];
  };

  const currentList = getCurrentList();
  const filteredList = currentList.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.id && item.id.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.designation_title && item.designation_title.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: 'plants', label: 'Plants & Facilities', icon: Building2, count: plants.length },
    { id: 'departments', label: 'Departments', icon: MapPin, count: departments.length },
    { id: 'designations', label: 'Designations', icon: Users, count: designations.length },
    { id: 'employees', label: 'Employees / Workforce', icon: Users, count: employees.length },
    { id: 'machines', label: 'Machines & Vehicles', icon: Truck, count: machines.length },
    { id: 'vendors', label: 'Vendors', icon: Store, count: vendors.length },
    { id: 'storage', label: 'Storage Bins', icon: MapPin, count: storageLocations.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-400" /> Structural Enterprise Masters
          </h1>
          <p className="text-xs text-slate-400">Core organizational backbone, hierarchy, workforce, and asset infrastructure.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => openCreateModal(getModalTypeFromTab(activeTab))} className="btn-primary text-xs">
            <Plus className="w-4 h-4" /> Add {activeTab === 'storage' ? 'STORAGE BIN' : activeTab === 'employees' ? 'EMPLOYEE' : activeTab.slice(0, -1).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Sub-Navigation Navbar & Dropdown */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-blue-500/30">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold uppercase text-blue-400 tracking-wider whitespace-nowrap">Select Master View:</span>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="form-input text-xs py-2 px-3 bg-slate-950 border border-blue-500/50 text-white font-bold rounded-xl cursor-pointer w-full md:w-64"
          >
            {tabs.map(t => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white font-semibold">
                {t.label} ({t.count} items)
              </option>
            ))}
          </select>
        </div>

        <div className="flex border border-white/10 rounded-xl overflow-hidden bg-slate-950 p-1 gap-1 overflow-x-auto w-full md:w-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                <span className="text-[10px] opacity-80 bg-slate-900/80 px-1.5 py-0.5 rounded-full">{t.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input pl-9 text-xs"
        />
      </div>

      {/* Content View */}
      <div className="glass-panel p-4 space-y-4">
        {/* Plants Tab */}
        {activeTab === 'plants' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Facility Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((p) => (
                <tr key={p.id}>
                  <td className="pk-badge">{p.id}</td>
                  <td className="font-bold text-white">{p.name}</td>
                  <td className="capitalize text-slate-300">{p.plant_type || 'Processing'}</td>
                  <td><span className={`badge badge-${p.is_active ? 'completed' : 'rejected'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button onClick={() => handleDeletePlant(p.id)} className="btn-action-delete" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Department Name</th>
                <th>Assigned Plant</th>
                <th>Shared Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((d) => (
                <tr key={d.id}>
                  <td className="pk-badge">{d.id}</td>
                  <td className="font-bold text-white">{d.name}</td>
                  <td>{d.plant_name || 'All Plants (Shared)'}</td>
                  <td><span className={`badge badge-${d.is_shared_across_plants ? 'completed' : 'info'}`}>{d.is_shared_across_plants ? 'Shared Across Plants' : 'Plant Specific'}</span></td>
                  <td>
                    <button onClick={() => handleDeleteDepartment(d.id)} className="btn-action-delete" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Designations Tab */}
        {activeTab === 'designations' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Title</th>
                <th>Department</th>
                <th>Hierarchy Level</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((des) => (
                <tr key={des.id}>
                  <td className="pk-badge">{des.id}</td>
                  <td className="font-bold text-white">{des.title}</td>
                  <td>{des.department_name || '-'}</td>
                  <td><span className="badge badge-info">Level {des.hierarchy_level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Plant</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((emp) => (
                <tr key={emp.id}>
                  <td className="pk-badge">{emp.id}</td>
                  <td className="font-bold text-white">{emp.name}</td>
                  <td className="text-blue-400">{emp.designation_title || 'Staff'}</td>
                  <td>{emp.department_name || '-'}</td>
                  <td>{emp.plant_name || 'Corporate'}</td>
                  <td><span className={`badge badge-${emp.status}`}>{emp.status}</span></td>
                  <td>
                    <button onClick={() => handleDeleteEmployee(emp.id)} className="btn-action-delete" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Machines & Vehicles Tab */}
        {activeTab === 'machines' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Code</th>
                <th>Name</th>
                <th>Plant</th>
                <th>Registration No (Vehicle)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((m) => (
                <tr key={m.id}>
                  <td className="pk-badge">{m.id}</td>
                  <td className="font-mono text-xs text-blue-400">{m.code}</td>
                  <td className="font-bold text-white">{m.name}</td>
                  <td>{m.plant_name || '-'}</td>
                  <td className="font-semibold text-emerald-400">{m.registration_number || 'N/A (Machine)'}</td>
                  <td><span className={`badge badge-${m.status}`}>{m.status}</span></td>
                  <td>
                    <button onClick={() => handleDeleteMachine(m.id)} className="btn-action-delete" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Vendor Name</th>
                <th>GST Number</th>
                <th>Status</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((v) => (
                <tr key={v.id}>
                  <td className="pk-badge">{v.id}</td>
                  <td className="font-bold text-white">{v.name}</td>
                  <td className="font-mono text-xs text-emerald-400">{v.gst_number || 'GST Pending'}</td>
                  <td><span className={`badge badge-${v.status}`}>{v.status}</span></td>
                  <td className="text-xs text-slate-400">{v.created_at?.slice(0, 10) || '2026-08-13'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Storage Bins Tab */}
        {activeTab === 'storage' && (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Custom PK (XXX-DD-MM-YYYY-1234)</th>
                <th>Bin Code</th>
                <th>Bin Name</th>
                <th>Department</th>
                <th>Capacity (KG)</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map((st) => (
                <tr key={st.id}>
                  <td className="pk-badge">{st.id}</td>
                  <td className="font-mono text-xs text-blue-400">{st.code}</td>
                  <td className="font-bold text-white">{st.name}</td>
                  <td>{st.department_name || 'Main Warehouse'}</td>
                  <td className="font-mono text-xs text-emerald-400">{st.bin_capacity_kg} KG</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredList.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Pop-Up Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Create New ${modalType.toUpperCase()}`}>
        {modalType === 'plant' && (
          <form onSubmit={handleCreatePlant} className="space-y-4">
            <div><label className="form-label">Plant Code *</label><input type="text" required value={plantForm.code} onChange={(e) => setPlantForm({ ...plantForm, code: e.target.value })} className="form-input" placeholder="e.g. PLN-DELHI-01" /></div>
            <div><label className="form-label">Plant Name *</label><input type="text" required value={plantForm.name} onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })} className="form-input" placeholder="e.g. Plant 1 - Main Unit" /></div>
            <div>
              <label className="form-label">Plant Type</label>
              <select value={plantForm.plant_type} onChange={(e) => setPlantForm({ ...plantForm, plant_type: e.target.value })} className="form-input">
                <option value="processing">Processing Unit</option>
                <option value="packaging">Packaging Warehouse</option>
                <option value="storage">Central Cold Storage</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Plant</button>
            </div>
          </form>
        )}

        {modalType === 'department' && (
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div><label className="form-label">Department Code *</label><input type="text" required value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="form-input" placeholder="e.g. DPT-QC" /></div>
            <div><label className="form-label">Department Name *</label><input type="text" required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="form-input" placeholder="e.g. Quality Assurance" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Department</button>
            </div>
          </form>
        )}

        {modalType === 'employee' && (
          <form onSubmit={handleCreateEmployee} className="space-y-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                className="form-input"
                placeholder="e.g. Rajesh Sharma"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Department</label>
                <select
                  value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                  className="form-input"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Designation</label>
                <select
                  value={empForm.designation}
                  onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                  className="form-input"
                >
                  <option value="">-- Select Designation --</option>
                  {designations.map((ds) => (
                    <option key={ds.id} value={ds.id}>{ds.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Assigned Plant</label>
                <select
                  value={empForm.plant}
                  onChange={(e) => setEmpForm({ ...empForm, plant: e.target.value })}
                  className="form-input"
                >
                  <option value="">-- Select Plant --</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  value={empForm.status}
                  onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Employee</button>
            </div>
          </form>
        )}

        {modalType === 'machine' && (
          <form onSubmit={handleCreateMachine} className="space-y-4">
            <div><label className="form-label">Machine / Vehicle Code *</label><input type="text" required value={machForm.code} onChange={(e) => setMachForm({ ...machForm, code: e.target.value })} className="form-input" placeholder="e.g. MCH-001 or TRK-99" /></div>
            <div><label className="form-label">Display Name *</label><input type="text" required value={machForm.name} onChange={(e) => setMachForm({ ...machForm, name: e.target.value })} className="form-input" placeholder="e.g. Bhuler Sorting Machine" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Machine / Vehicle</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
