import React, { useEffect, useState } from 'react';
import { CoreAPI } from '../api';
import { useConfiguration } from '../context/ConfigurationContext';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import FilterBar from '../components/ui/FilterBar';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import IconButton from '../components/ui/IconButton';
import GenericFormRenderer from '../components/GenericFormRenderer';
import {
  Building2, MapPin, Users, Truck, Store, Plus, Trash2, Landmark,
  ShieldCheck, Eye, Edit3, KeyRound, CheckSquare, Square, Layers
} from 'lucide-react';

export default function StructuralMasters() {
  const { forms: uiForms } = useConfiguration();
  const [activeTab, setActiveTab] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
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

  // Selection & Bulk Action State
  const [selectedIds, setSelectedIds] = useState([]);

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingId, setEditingId] = useState(null);

  // View Record Modal State
  const [viewModalItem, setViewModalItem] = useState(null);
  const [viewModalType, setViewModalType] = useState('');

  // Form States
  const [roleForm, setRoleForm] = useState({ name: '', remarks: '' });
  const [companyForm, setCompanyForm] = useState({ name: '', gst_number: '', remarks: '' });
  const [plantForm, setPlantForm] = useState({ name: '', code: '', plant_type: 'processing', company: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', is_shared_across_plants: false });
  const [desigForm, setDesigForm] = useState({ title: '', department: '', hierarchy_level: 1, remarks: '' });
  const [empForm, setEmpForm] = useState({ name: '', designation: '', department: '', plant: '', role: '', status: 'active' });
  const [machForm, setMachForm] = useState({ name: '', code: '', machine_type_id: 'single_machine', registration_number: '', plant: '', department: '', status: 'active' });
  const [vendorForm, setVendorForm] = useState({ name: '', gst_number: '', remarks: '' });
  const [storageForm, setStorageForm] = useState({ unit_id: '', plant: '', department: '', code: '', name: '', capacity: '', remarks: '' });

  useEffect(() => {
    loadStructuralData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedIds([]);
  }, [activeTab]);

  async function loadStructuralData() {
    try {
      const [roleRes, compRes, plRes, dpRes, dsRes, empRes, macRes, venRes, strRes] = await Promise.all([
        CoreAPI.getRoles().catch(() => ({ data: [] })),
        CoreAPI.getCompanies().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getDesignations().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
        CoreAPI.getMachines().catch(() => ({ data: [] })),
        CoreAPI.getVendors().catch(() => ({ data: [] })),
        CoreAPI.getStorageLocations().catch(() => ({ data: [] })),
      ]);
      const rList = roleRes.data?.results || roleRes.data || [];
      const compList = compRes.data?.results || compRes.data || [];
      const plList = plRes.data?.results || plRes.data || [];
      const dpList = dpRes.data?.results || dpRes.data || [];
      const dsList = dsRes.data?.results || dsRes.data || [];
      const empList = empRes.data?.results || empRes.data || [];
      const macList = macRes.data?.results || macRes.data || [];
      const venList = venRes.data?.results || venRes.data || [];
      const strList = strRes.data?.results || strRes.data || [];

      setRoles(rList);
      setCompanies(compList);
      setPlants(plList);
      setDepartments(dpList);
      setDesignations(dsList);
      setEmployees(empList);
      setMachines(macList);
      setVendors(venList);
      setStorageLocations(strList);
    } catch (err) {
      console.error("Error loading structural data:", err);
    }
  }

  const getDynamicFormForType = (type) => {
    if (!uiForms || uiForms.length === 0) return null;
    return uiForms.find(
      (f) =>
        f.active &&
        (f.form_name === `${type}_form` ||
          f.form_name === `add_${type}_form` ||
          f.form_name === `add_${type}_modal_form` ||
          f.form_name.includes(type) ||
          f.module === type)
    );
  };

  const getModalTypeFromTab = (tab) => {
    if (tab === 'roles') return 'role';
    if (tab === 'companies') return 'company';
    if (tab === 'plants') return 'plant';
    if (tab === 'departments') return 'department';
    if (tab === 'designations') return 'designation';
    if (tab === 'employees') return 'employee';
    if (tab === 'machines') return 'machine';
    if (tab === 'vendors') return 'vendor';
    if (tab === 'storage') return 'storage';
    return tab;
  };

  const getCurrentList = () => {
    if (activeTab === 'roles') return roles;
    if (activeTab === 'companies') return companies;
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
      (item.remarks && item.remarks.toLowerCase().includes(term)) ||
      (item.unit_id && item.unit_id.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.designation_title && item.designation_title.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Selection Logic
  const isAllSelected = paginatedList.length > 0 && paginatedList.every(item => selectedIds.includes(item.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const pageIds = paginatedList.map(item => item.id);
      setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedList.map(item => item.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk Delete Handler
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) return;

    try {
      for (const id of selectedIds) {
        if (activeTab === 'roles') await CoreAPI.deleteRole(id);
        else if (activeTab === 'companies') await CoreAPI.deleteCompany(id);
        else if (activeTab === 'plants') await CoreAPI.deletePlant(id);
        else if (activeTab === 'departments') await CoreAPI.deleteDepartment(id);
        else if (activeTab === 'designations') await CoreAPI.deleteDesignation(id);
        else if (activeTab === 'employees') await CoreAPI.deleteEmployee(id);
        else if (activeTab === 'machines') await CoreAPI.deleteMachine(id);
        else if (activeTab === 'vendors') await CoreAPI.deleteVendor(id);
        else if (activeTab === 'storage') await CoreAPI.deleteStorageLocation(id);
      }
      setSelectedIds([]);
      loadStructuralData();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  // Open Create Modal
  const openCreateModal = (type) => {
    setModalType(type);
    setEditingId(null);
    if (type === 'role') {
      setRoleForm({ name: '', remarks: '' });
    } else if (type === 'company') {
      setCompanyForm({ name: '', gst_number: '', remarks: '' });
    } else if (type === 'plant') {
      setPlantForm({
        name: '',
        code: '',
        plant_type: 'processing',
        company: companies[0]?.id || '',
      });
    } else if (type === 'department') {
      setDeptForm({ name: '', code: '', is_shared_across_plants: false });
    } else if (type === 'designation') {
      setDesigForm({ title: '', department: departments[0]?.id || '', hierarchy_level: 1, remarks: '' });
    } else if (type === 'employee') {
      setEmpForm({
        name: '',
        department: departments[0]?.id || '',
        designation: designations[0]?.id || '',
        plant: plants[0]?.id || '',
        role: roles[0]?.id || '',
        status: 'active',
      });
    } else if (type === 'machine') {
      setMachForm({
        name: '',
        code: '',
        machine_type_id: 'single_machine',
        registration_number: '',
        plant: plants[0]?.id || '',
        department: departments[0]?.id || '',
        status: 'active',
      });
    } else if (type === 'vendor') {
      setVendorForm({ name: '', gst_number: '', remarks: '' });
    } else if (type === 'storage') {
      setStorageForm({
        unit_id: plants[0]?.id || 'PLN-01',
        plant: plants[0]?.id || '',
        department: departments[0]?.id || '',
        code: `BIN-${storageLocations.length + 1}`,
        name: '',
        capacity: 1000,
        remarks: '',
      });
    }
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item, type) => {
    setModalType(type);
    setEditingId(item.id);
    if (type === 'role') {
      setRoleForm({ name: item.name || '', remarks: item.remarks || '' });
    } else if (type === 'company') {
      setCompanyForm({ name: item.name || '', gst_number: item.gst_number || '', remarks: item.remarks || '' });
    } else if (type === 'plant') {
      setPlantForm({ name: item.name || '', code: item.code || '', plant_type: item.plant_type || 'processing', company: item.company || companies[0]?.id || '' });
    } else if (type === 'department') {
      setDeptForm({ name: item.name || '', code: item.code || '', is_shared_across_plants: item.is_shared_across_plants || false });
    } else if (type === 'designation') {
      setDesigForm({ title: item.title || '', department: item.department || departments[0]?.id || '', hierarchy_level: item.hierarchy_level || 1, remarks: item.remarks || '' });
    } else if (type === 'employee') {
      setEmpForm({ name: item.name || '', designation: item.designation || designations[0]?.id || '', department: item.department || departments[0]?.id || '', plant: item.plant || plants[0]?.id || '', role: item.role_ids?.[0] || roles[0]?.id || '', status: item.status || 'active' });
    } else if (type === 'machine') {
      setMachForm({ name: item.name || '', code: item.code || '', machine_type_id: item.machine_type_id || 'single_machine', registration_number: item.registration_number || '', plant: item.plant || plants[0]?.id || '', department: item.department || departments[0]?.id || '', status: item.status || 'active' });
    } else if (type === 'vendor') {
      setVendorForm({ name: item.name || '', gst_number: item.gst_number || '', remarks: item.remarks || '' });
    } else if (type === 'storage') {
      setStorageForm({ unit_id: item.unit_id || plants[0]?.id || 'PLN-01', plant: item.plant || plants[0]?.id || '', department: item.department || departments[0]?.id || '', code: item.code || '', name: item.name || '', capacity: item.capacity || 1000, remarks: item.remarks || '' });
    }
    setModalOpen(true);
  };

  // Open View Modal
  const handleOpenView = (item, type) => {
    setViewModalType(type);
    setViewModalItem(item);
  };

  // Submit Save Handlers (Create & Update)
  const handleSaveRole = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateRole(editingId, roleForm);
      else await CoreAPI.createRole(roleForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateCompany(editingId, companyForm);
      else await CoreAPI.createCompany(companyForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSavePlant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...plantForm,
        company: plantForm.company || companies[0]?.id || null,
      };
      if (editingId) await CoreAPI.updatePlant(editingId, payload);
      else await CoreAPI.createPlant(payload);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveDepartment = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateDepartment(editingId, deptForm);
      else await CoreAPI.createDepartment(deptForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveDesignation = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateDesignation(editingId, desigForm);
      else await CoreAPI.createDesignation(desigForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateEmployee(editingId, empForm);
      else await CoreAPI.createEmployee(empForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...machForm,
        plant: machForm.plant || plants[0]?.id || null,
        department: machForm.department || departments[0]?.id || null,
      };
      if (editingId) await CoreAPI.updateMachine(editingId, payload);
      else await CoreAPI.createMachine(payload);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await CoreAPI.updateVendor(editingId, vendorForm);
      else await CoreAPI.createVendor(vendorForm);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleSaveStorageLocation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        unit_id: storageForm.unit_id || storageForm.plant || (plants[0]?.id || 'PLN-01'),
        plant: storageForm.plant || plants[0]?.id || null,
        department: storageForm.department || departments[0]?.id || null,
        code: storageForm.code,
        name: storageForm.name || `Storage Bin ${storageForm.code}`,
        capacity: storageForm.capacity ? parseFloat(storageForm.capacity) : 1000,
        remarks: storageForm.remarks,
        status: 'active',
      };
      if (editingId) await CoreAPI.updateStorageLocation(editingId, payload);
      else await CoreAPI.createStorageLocation(payload);
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleDynamicFormSubmit = async (formData) => {
    try {
      const payload = { ...formData };

      if (modalType === 'plant') {
        if (payload.plant_type) {
          payload.plant_type = String(payload.plant_type).toLowerCase();
        }
        if (payload.company && String(payload.company).includes('(')) {
          const m = String(payload.company).match(/CMP-[\w-]+/);
          if (m) payload.company = m[0];
        }
        if (editingId) await CoreAPI.updatePlant(editingId, payload);
        else await CoreAPI.createPlant(payload);
      } else if (modalType === 'role') {
        if (editingId) await CoreAPI.updateRole(editingId, payload);
        else await CoreAPI.createRole(payload);
      } else if (modalType === 'company') {
        if (editingId) await CoreAPI.updateCompany(editingId, payload);
        else await CoreAPI.createCompany(payload);
      } else if (modalType === 'department') {
        if (editingId) await CoreAPI.updateDepartment(editingId, payload);
        else await CoreAPI.createDepartment(payload);
      } else if (modalType === 'designation') {
        if (editingId) await CoreAPI.updateDesignation(editingId, payload);
        else await CoreAPI.createDesignation(payload);
      } else if (modalType === 'employee') {
        if (editingId) await CoreAPI.updateEmployee(editingId, payload);
        else await CoreAPI.createEmployee(payload);
      } else if (modalType === 'machine') {
        if (editingId) await CoreAPI.updateMachine(editingId, payload);
        else await CoreAPI.createMachine(payload);
      } else if (modalType === 'vendor') {
        if (editingId) await CoreAPI.updateVendor(editingId, payload);
        else await CoreAPI.createVendor(payload);
      } else if (modalType === 'storage') {
        if (editingId) await CoreAPI.updateStorageLocation(editingId, payload);
        else await CoreAPI.createStorageLocation(payload);
      }
      
      setModalOpen(false);
      setEditingId(null);
      loadStructuralData();
    } catch (err) {
      let errMsg = err.message;
      if (err.response?.data) {
        if (typeof err.response.data === 'string') errMsg = err.response.data;
        else if (err.response.data.detail) errMsg = err.response.data.detail;
        else if (err.response.data.error) errMsg = err.response.data.error;
        else {
          errMsg = Object.entries(err.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        }
      }
      alert("Submission Error: " + errMsg);
    }
  };

  // Single Delete Handlers
  const handleDeleteSingle = async (id, type) => {
    if (!window.confirm(`Delete ${type} record (${id})?`)) return;
    try {
      if (type === 'role') await CoreAPI.deleteRole(id);
      else if (type === 'company') await CoreAPI.deleteCompany(id);
      else if (type === 'plant') await CoreAPI.deletePlant(id);
      else if (type === 'department') await CoreAPI.deleteDepartment(id);
      else if (type === 'designation') await CoreAPI.deleteDesignation(id);
      else if (type === 'employee') await CoreAPI.deleteEmployee(id);
      else if (type === 'machine') await CoreAPI.deleteMachine(id);
      else if (type === 'vendor') await CoreAPI.deleteVendor(id);
      else if (type === 'storage') await CoreAPI.deleteStorageLocation(id);
      loadStructuralData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const tabItems = [
    { id: 'roles', label: 'Roles', icon: ShieldCheck, count: roles.length },
    { id: 'companies', label: 'Companies / Entities', icon: Landmark, count: companies.length },
    { id: 'plants', label: 'Plants & Facilities', icon: Building2, count: plants.length },
    { id: 'departments', label: 'Departments', icon: MapPin, count: departments.length },
    { id: 'designations', label: 'Designations', icon: Users, count: designations.length },
    { id: 'employees', label: 'Employees / Workforce', icon: Users, count: employees.length },
    { id: 'machines', label: 'Machines & Vehicles', icon: Truck, count: machines.length },
    { id: 'vendors', label: 'Vendors', icon: Store, count: vendors.length },
    { id: 'storage', label: 'Storage Bins', icon: MapPin, count: storageLocations.length },
  ];

  const currentTabModalType = getModalTypeFromTab(activeTab);
  const matchedDynamicForm = getDynamicFormForType(modalType);

  // Common Header Checkbox
  const SelectAllHeader = (
    <input
      type="checkbox"
      checked={isAllSelected}
      onChange={handleToggleSelectAll}
      className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
      title="Select All Records on Page"
    />
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="Structural Enterprise Masters"
        description="Core organizational backbone, roles, company entities, facility hierarchy, workforce, and storage infrastructure."
        icon={Building2}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openCreateModal(currentTabModalType)}>
            Add {activeTab === 'roles' ? 'ROLE' : activeTab === 'companies' ? 'COMPANY' : activeTab === 'storage' ? 'STORAGE BIN' : activeTab === 'employees' ? 'EMPLOYEE' : activeTab.slice(0, -1).toUpperCase()}
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="standard-card p-2">
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Filter & Selection Bar */}
      <div className="space-y-3">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={`Search ${activeTab}...`}
        />

        {selectedIds.length > 0 && (
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-[#1B4E9B]" />
              <span className="text-xs font-bold text-[#1B4E9B]">
                {selectedIds.length} {activeTab} record(s) selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-[#6B7280] hover:text-[#1F2937] font-semibold underline px-2"
              >
                Clear Selection
              </button>
              <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table Data Container */}
      <div className="standard-card p-0 overflow-hidden">
        {activeTab === 'roles' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Role Name', 'Remarks', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((r) => (
              <tr key={r.id} className={selectedIds.includes(r.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => handleToggleSelectRow(r.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{r.id}</td>
                <td className="font-bold text-[#1F2937]">
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#1B4E9B]" />
                    {r.name}
                  </span>
                </td>
                <td className="text-xs text-[#6B7280]">{r.remarks || '-'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(r, 'role')} title="View Role" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(r, 'role')} title="Edit Role" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(r.id, 'role')} title="Delete Role" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'companies' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Company Name', 'GST Number', 'Remarks', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((c) => (
              <tr key={c.id} className={selectedIds.includes(c.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => handleToggleSelectRow(c.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{c.id}</td>
                <td className="font-bold text-[#1F2937]">{c.name}</td>
                <td className="font-mono text-xs text-[#16A34A]">{c.gst_number || 'GST Pending'}</td>
                <td className="text-xs text-[#6B7280]">{c.remarks || '-'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(c, 'company')} title="View Company" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(c, 'company')} title="Edit Company" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(c.id, 'company')} title="Delete Company" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'plants' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Facility Name', 'Type', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((p) => (
              <tr key={p.id} className={selectedIds.includes(p.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => handleToggleSelectRow(p.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{p.id}</td>
                <td className="font-bold text-[#1F2937]">{p.name}</td>
                <td className="capitalize text-[#374151]">{p.plant_type || 'Processing'}</td>
                <td><Badge variant={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(p, 'plant')} title="View Plant" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(p, 'plant')} title="Edit Plant" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(p.id, 'plant')} title="Delete Plant" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'departments' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Department Name', 'Assigned Plant', 'Shared Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((d) => (
              <tr key={d.id} className={selectedIds.includes(d.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(d.id)}
                    onChange={() => handleToggleSelectRow(d.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{d.id}</td>
                <td className="font-bold text-[#1F2937]">{d.name}</td>
                <td>{d.plant_name || 'All Plants (Shared)'}</td>
                <td><Badge variant={d.is_shared_across_plants ? 'success' : 'info'}>{d.is_shared_across_plants ? 'Shared' : 'Plant Specific'}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(d, 'department')} title="View Department" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(d, 'department')} title="Edit Department" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(d.id, 'department')} title="Delete Department" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'designations' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Title', 'Department', 'Hierarchy Level', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((des) => (
              <tr key={des.id} className={selectedIds.includes(des.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(des.id)}
                    onChange={() => handleToggleSelectRow(des.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{des.id}</td>
                <td className="font-bold text-[#1F2937]">{des.title}</td>
                <td>{des.department_name || '-'}</td>
                <td><Badge variant="info">Level {des.hierarchy_level}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(des, 'designation')} title="View Designation" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(des, 'designation')} title="Edit Designation" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(des.id, 'designation')} title="Delete Designation" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'employees' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Employee Name', 'Assigned Role', 'Designation', 'Department', 'Plant', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((emp) => (
              <tr key={emp.id} className={selectedIds.includes(emp.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(emp.id)}
                    onChange={() => handleToggleSelectRow(emp.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{emp.id}</td>
                <td className="font-bold text-[#1F2937]">{emp.name}</td>
                <td>
                  <Badge variant={emp.role_names && emp.role_names.length > 0 ? 'info' : 'neutral'}>
                    {emp.role_names && emp.role_names.length > 0 ? emp.role_names.join(', ') : 'No Role'}
                  </Badge>
                </td>
                <td className="text-[#1B4E9B]">{emp.designation_title || 'Staff'}</td>
                <td>{emp.department_name || '-'}</td>
                <td>{emp.plant_name || 'Corporate'}</td>
                <td><Badge variant={emp.status === 'active' ? 'success' : 'danger'}>{emp.status}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(emp, 'employee')} title="View Employee" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(emp, 'employee')} title="Edit Employee" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(emp.id, 'employee')} title="Delete Employee" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'machines' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Code', 'Name', 'Plant', 'Registration No', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((m) => (
              <tr key={m.id} className={selectedIds.includes(m.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(m.id)}
                    onChange={() => handleToggleSelectRow(m.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{m.id}</td>
                <td className="font-mono text-xs text-[#1B4E9B]">{m.code}</td>
                <td className="font-bold text-[#1F2937]">{m.name}</td>
                <td>{m.plant_name || '-'}</td>
                <td className="font-semibold text-[#16A34A]">{m.registration_number || 'N/A (Machine)'}</td>
                <td><Badge variant={m.status === 'active' ? 'success' : 'danger'}>{m.status}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(m, 'machine')} title="View Machine" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(m, 'machine')} title="Edit Machine" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(m.id, 'machine')} title="Delete Machine" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'vendors' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Vendor Name', 'GST Number', 'Status', 'Registered Date', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((v) => (
              <tr key={v.id} className={selectedIds.includes(v.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(v.id)}
                    onChange={() => handleToggleSelectRow(v.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{v.id}</td>
                <td className="font-bold text-[#1F2937]">{v.name}</td>
                <td className="font-mono text-xs text-[#16A34A]">{v.gst_number || 'GST Pending'}</td>
                <td><Badge variant={v.status === 'active' ? 'success' : 'danger'}>{v.status}</Badge></td>
                <td className="text-xs text-[#6B7280]">{v.created_at?.slice(0, 10) || '2026-08-13'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(v, 'vendor')} title="View Vendor" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(v, 'vendor')} title="Edit Vendor" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(v.id, 'vendor')} title="Delete Vendor" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'storage' && (
          <Table headers={[SelectAllHeader, 'Primary Key', 'Unit ID / Plant', 'Bin Code', 'Bin Name', 'Department', 'Capacity (KG)', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((st) => (
              <tr key={st.id} className={selectedIds.includes(st.id) ? 'bg-[#F0F9FF]' : ''}>
                <td className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(st.id)}
                    onChange={() => handleToggleSelectRow(st.id)}
                    className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                  />
                </td>
                <td className="font-mono text-[#1B4E9B] font-semibold">{st.id}</td>
                <td className="font-mono text-xs text-[#1B4E9B] font-bold">{st.unit_id || st.plant_name || st.plant || 'PLN-01'}</td>
                <td className="font-mono text-xs text-[#16A34A]">{st.code}</td>
                <td className="font-bold text-[#1F2937]">{st.name || `Bin ${st.code}`}</td>
                <td>{st.department_name || 'Main Warehouse'}</td>
                <td className="font-mono text-xs text-[#2563EB] font-bold">{st.capacity || st.bin_capacity_kg || '0'} KG</td>
                <td><Badge variant={st.status === 'active' ? 'success' : 'warning'}>{st.status || 'active'}</Badge></td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton variant="view" icon={Eye} onClick={() => handleOpenView(st, 'storage')} title="View Storage Bin" />
                    <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(st, 'storage')} title="Edit Storage Bin" />
                    <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteSingle(st.id, 'storage')} title="Delete Storage Bin" />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}

        <div className="p-4 border-t border-[#E5E7EB]">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredList.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* View Record Modal (All Entity Types) */}
      <Modal isOpen={!!viewModalItem} onClose={() => setViewModalItem(null)} size="md" title={`View ${viewModalType.toUpperCase()} Record`}>
        {viewModalItem && (
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-4 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
              <div>
                <span className="text-xs text-[#6B7280] block font-semibold">Primary Key ID</span>
                <span className="font-mono text-sm font-bold text-[#1B4E9B]">{viewModalItem.id}</span>
              </div>
              <div>
                <span className="text-xs text-[#6B7280] block font-semibold">Entity Type</span>
                <span className="font-bold text-xs uppercase text-[#374151]">{viewModalType}</span>
              </div>
              {viewModalItem.name && (
                <div className="col-span-2">
                  <span className="text-xs text-[#6B7280] block font-semibold">Name</span>
                  <span className="font-bold text-base text-[#1F2937]">{viewModalItem.name}</span>
                </div>
              )}
              {viewModalItem.title && (
                <div className="col-span-2">
                  <span className="text-xs text-[#6B7280] block font-semibold">Title</span>
                  <span className="font-bold text-base text-[#1F2937]">{viewModalItem.title}</span>
                </div>
              )}
              {viewModalItem.code && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Code</span>
                  <span className="font-mono text-xs font-bold text-[#16A34A]">{viewModalItem.code}</span>
                </div>
              )}
              {viewModalItem.gst_number && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">GST Number</span>
                  <span className="font-mono text-xs font-bold text-[#2563EB]">{viewModalItem.gst_number}</span>
                </div>
              )}
              {viewModalItem.plant_name && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Facility / Plant</span>
                  <span className="text-xs font-semibold text-[#374151]">{viewModalItem.plant_name}</span>
                </div>
              )}
              {viewModalItem.department_name && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Department</span>
                  <span className="text-xs font-semibold text-[#374151]">{viewModalItem.department_name}</span>
                </div>
              )}
              {viewModalItem.designation_title && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Designation</span>
                  <span className="text-xs font-semibold text-[#1B4E9B]">{viewModalItem.designation_title}</span>
                </div>
              )}
              {viewModalItem.role_names && viewModalItem.role_names.length > 0 && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Assigned Role(s)</span>
                  <span className="text-xs font-semibold text-[#1B4E9B]">{viewModalItem.role_names.join(', ')}</span>
                </div>
              )}
              {viewModalItem.status && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Status</span>
                  <Badge variant={viewModalItem.status === 'active' ? 'success' : 'danger'}>{viewModalItem.status}</Badge>
                </div>
              )}
              {viewModalItem.capacity && (
                <div>
                  <span className="text-xs text-[#6B7280] block font-semibold">Capacity</span>
                  <span className="font-mono text-xs font-bold text-[#2563EB]">{viewModalItem.capacity} KG</span>
                </div>
              )}
            </div>
            {viewModalItem.remarks && (
              <div>
                <span className="text-xs text-[#6B7280] block font-semibold">Remarks / Notes</span>
                <p className="text-xs text-[#374151] mt-1 bg-white p-3 rounded-lg border border-[#E5E7EB]">
                  {viewModalItem.remarks}
                </p>
              </div>
            )}
            <div className="modal-footer pt-3">
              <Button variant="secondary" onClick={() => setViewModalItem(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pop-Up Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        size="md"
        title={editingId ? `Edit ${modalType.toUpperCase()} Record (${editingId})` : `Create New ${modalType.toUpperCase()}`}
      >
        {matchedDynamicForm ? (
          <GenericFormRenderer
            formConfig={matchedDynamicForm}
            onSubmit={handleDynamicFormSubmit}
            onCancel={() => setModalOpen(false)}
          />
        ) : modalType === 'role' ? (
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div>
              <label className="form-label">Role Name * (Unique Identifier)</label>
              <input
                type="text"
                className="form-input"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="e.g. SYSTEM_ADMIN, MANAGER, OPERATOR, AUDITOR"
                required
              />
            </div>
            <div>
              <label className="form-label">Remarks / Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={roleForm.remarks}
                onChange={(e) => setRoleForm({ ...roleForm, remarks: e.target.value })}
                placeholder="Describe the functional access level of this core role..."
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingId ? 'Update Role' : 'Save Role'}
              </Button>
            </div>
          </form>
        ) : modalType === 'company' ? (
          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="form-label">Company / Legal Entity Name *</label>
              <input
                type="text"
                className="form-input"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder="Idhayam Edible Oils Ltd"
                required
              />
            </div>
            <div>
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-input"
                value={companyForm.gst_number}
                onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })}
                placeholder="33AAAAA0000A1Z5"
              />
            </div>
            <div>
              <label className="form-label">Remarks</label>
              <textarea
                className="form-input"
                rows={2}
                value={companyForm.remarks}
                onChange={(e) => setCompanyForm({ ...companyForm, remarks: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Company' : 'Save Company'}</Button>
            </div>
          </form>
        ) : modalType === 'plant' ? (
          <form onSubmit={handleSavePlant} className="space-y-4">
            <div>
              <label className="form-label">Plant / Facility Name *</label>
              <input
                type="text"
                className="form-input"
                value={plantForm.name}
                onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })}
                placeholder="Central Processing Plant"
                required
              />
            </div>
            <div>
              <label className="form-label">Facility Type</label>
              <select
                className="form-input"
                value={plantForm.plant_type}
                onChange={(e) => setPlantForm({ ...plantForm, plant_type: e.target.value })}
              >
                <option value="manufacturing">Manufacturing Plant</option>
                <option value="processing">Processing Unit</option>
                <option value="packaging">Packaging Warehouse</option>
                <option value="storage">Central Cold Storage</option>
                <option value="transport">Transport Hub</option>
              </select>
            </div>
            <div>
              <label className="form-label">Parent Company</label>
              <select
                className="form-input"
                value={plantForm.company}
                onChange={(e) => setPlantForm({ ...plantForm, company: e.target.value })}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Plant' : 'Save Plant'}</Button>
            </div>
          </form>
        ) : modalType === 'department' ? (
          <form onSubmit={handleSaveDepartment} className="space-y-4">
            <div>
              <label className="form-label">Department Name *</label>
              <input
                type="text"
                className="form-input"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="Quality Assurance & Testing"
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="sharedDeptCheck"
                checked={deptForm.is_shared_across_plants}
                onChange={(e) => setDeptForm({ ...deptForm, is_shared_across_plants: e.target.checked })}
                className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
              />
              <label htmlFor="sharedDeptCheck" className="text-xs text-[#374151] font-semibold cursor-pointer">
                Shared across all plants & facilities
              </label>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Department' : 'Save Department'}</Button>
            </div>
          </form>
        ) : modalType === 'designation' ? (
          <form onSubmit={handleSaveDesignation} className="space-y-4">
            <div>
              <label className="form-label">Designation Title *</label>
              <input
                type="text"
                className="form-input"
                value={desigForm.title}
                onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                placeholder="Senior QA Inspector"
                required
              />
            </div>
            <div>
              <label className="form-label">Parent Department</label>
              <select
                className="form-input"
                value={desigForm.department}
                onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Hierarchy Level (1 = Staff, 99 = Executive)</label>
              <input
                type="number"
                className="form-input"
                value={desigForm.hierarchy_level}
                onChange={(e) => setDesigForm({ ...desigForm, hierarchy_level: parseInt(e.target.value) || 1 })}
                min={1}
                max={99}
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Designation' : 'Save Designation'}</Button>
            </div>
          </form>
        ) : modalType === 'employee' ? (
          <form onSubmit={handleSaveEmployee} className="space-y-4">
            <div>
              <label className="form-label">Employee Name *</label>
              <input
                type="text"
                className="form-input"
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                placeholder="Full Employee Name"
                required
              />
            </div>
            <div>
              <label className="form-label">Assigned Role (core_role) *</label>
              <select
                className="form-input"
                value={empForm.role}
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
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
            <div>
              <label className="form-label">Department</label>
              <select
                className="form-input"
                value={empForm.department}
                onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Designation</label>
              <select
                className="form-input"
                value={empForm.designation}
                onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
              >
                <option value="">Select Designation...</option>
                {designations.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Plant / Facility</label>
              <select
                className="form-input"
                value={empForm.plant}
                onChange={(e) => setEmpForm({ ...empForm, plant: e.target.value })}
              >
                <option value="">Select Plant...</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={empForm.status}
                onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingId ? 'Update Employee' : 'Save Employee'}
              </Button>
            </div>
          </form>
        ) : modalType === 'machine' ? (
          <form onSubmit={handleSaveMachine} className="space-y-4">
            <div>
              <label className="form-label">Machine / Vehicle Name *</label>
              <input
                type="text"
                className="form-input"
                value={machForm.name}
                onChange={(e) => setMachForm({ ...machForm, name: e.target.value })}
                placeholder="High-Speed Extraction Mill #1"
                required
              />
            </div>
            <div>
              <label className="form-label">Machine Code *</label>
              <input
                type="text"
                className="form-input"
                value={machForm.code}
                onChange={(e) => setMachForm({ ...machForm, code: e.target.value })}
                placeholder="MAC-EXT-001"
                required
              />
            </div>
            <div>
              <label className="form-label">Registration / Vehicle No</label>
              <input
                type="text"
                className="form-input"
                value={machForm.registration_number}
                onChange={(e) => setMachForm({ ...machForm, registration_number: e.target.value })}
                placeholder="TN 58 AB 1234"
              />
            </div>
            <div>
              <label className="form-label">Assigned Plant</label>
              <select
                className="form-input"
                value={machForm.plant}
                onChange={(e) => setMachForm({ ...machForm, plant: e.target.value })}
              >
                <option value="">Select Plant...</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Machine' : 'Save Machine'}</Button>
            </div>
          </form>
        ) : modalType === 'vendor' ? (
          <form onSubmit={handleSaveVendor} className="space-y-4">
            <div>
              <label className="form-label">Vendor Name *</label>
              <input
                type="text"
                className="form-input"
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="Sri Lakshmi Raw Seeds Suppliers"
                required
              />
            </div>
            <div>
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-input"
                value={vendorForm.gst_number}
                onChange={(e) => setVendorForm({ ...vendorForm, gst_number: e.target.value })}
                placeholder="33BBBBB1111B2Z9"
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Vendor' : 'Save Vendor'}</Button>
            </div>
          </form>
        ) : modalType === 'storage' ? (
          <form onSubmit={handleSaveStorageLocation} className="space-y-4">
            <div>
              <label className="form-label">Bin Code *</label>
              <input
                type="text"
                className="form-input"
                value={storageForm.code}
                onChange={(e) => setStorageForm({ ...storageForm, code: e.target.value })}
                placeholder="BIN-A101"
                required
              />
            </div>
            <div>
              <label className="form-label">Bin / Location Name</label>
              <input
                type="text"
                className="form-input"
                value={storageForm.name}
                onChange={(e) => setStorageForm({ ...storageForm, name: e.target.value })}
                placeholder="Raw Sesame Seed Storage Bin A1"
              />
            </div>
            <div>
              <label className="form-label">Capacity (KG)</label>
              <input
                type="number"
                className="form-input"
                value={storageForm.capacity}
                onChange={(e) => setStorageForm({ ...storageForm, capacity: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" type="submit">{editingId ? 'Update Bin' : 'Save Bin'}</Button>
            </div>
          </form>
        ) : (
          <div className="p-4 text-center text-xs text-[#6B7280]">
            Loading form schema for {modalType}...
          </div>
        )}
      </Modal>
    </div>
  );
}
