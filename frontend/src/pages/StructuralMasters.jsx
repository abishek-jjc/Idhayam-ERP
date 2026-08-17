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
import { Building2, MapPin, Users, Truck, Store, Plus, Trash2, Landmark, Sparkles, Sliders } from 'lucide-react';

export default function StructuralMasters() {
  const { forms: uiForms } = useConfiguration();
  const [activeTab, setActiveTab] = useState('companies');
  const [companies, setCompanies] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [machines, setMachines] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);
  const [useDynamicFormMode, setUseDynamicFormMode] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');

  const [companyForm, setCompanyForm] = useState({ name: '', gst_number: '', remarks: '' });
  const [plantForm, setPlantForm] = useState({ name: '', code: '', plant_type: 'processing', company: '' });
  const [deptForm, setDeptForm] = useState({ name: '', code: '', is_shared_across_plants: false });
  const [desigForm, setDesigForm] = useState({ title: '', department: '', hierarchy_level: 1, remarks: '' });
  const [empForm, setEmpForm] = useState({ name: '', designation: '', department: '', plant: '', status: 'active' });
  const [machForm, setMachForm] = useState({ name: '', code: '', machine_type_id: 'single_machine', registration_number: '', plant: '', department: '', status: 'active' });
  const [vendorForm, setVendorForm] = useState({ name: '', gst_number: '', remarks: '' });
  const [storageForm, setStorageForm] = useState({ unit_id: '', plant: '', department: '', code: '', name: '', capacity: '', remarks: '' });

  useEffect(() => {
    loadStructuralData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

  async function loadStructuralData() {
    try {
      const [compRes, plRes, dpRes, dsRes, empRes, macRes, venRes, strRes] = await Promise.all([
        CoreAPI.getCompanies().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getDesignations().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
        CoreAPI.getMachines().catch(() => ({ data: [] })),
        CoreAPI.getVendors().catch(() => ({ data: [] })),
        CoreAPI.getStorageLocations().catch(() => ({ data: [] })),
      ]);
      const compList = compRes.data.results || compRes.data || [];
      const plList = plRes.data.results || plRes.data || [];
      const dpList = dpRes.data.results || dpRes.data || [];
      const dsList = dsRes.data.results || dsRes.data || [];
      const empList = empRes.data.results || empRes.data || [];
      const macList = macRes.data.results || macRes.data || [];
      const venList = venRes.data.results || venRes.data || [];
      const strList = strRes.data.results || strRes.data || [];

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

  const openCreateModal = (type) => {
    setModalType(type);
    if (type === 'company') {
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

  const handleDynamicFormSubmit = async (formData) => {
    try {
      if (modalType === 'company') await CoreAPI.createCompany(formData);
      else if (modalType === 'plant') await CoreAPI.createPlant(formData);
      else if (modalType === 'department') await CoreAPI.createDepartment(formData);
      else if (modalType === 'designation') await CoreAPI.createDesignation(formData);
      else if (modalType === 'employee') await CoreAPI.createEmployee(formData);
      else if (modalType === 'machine') await CoreAPI.createMachine(formData);
      else if (modalType === 'vendor') await CoreAPI.createVendor(formData);
      else if (modalType === 'storage') await CoreAPI.createStorageLocation(formData);
      
      setModalOpen(false);
      loadStructuralData();
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.detail || err.response?.data?.error || err.message));
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createCompany(companyForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreatePlant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...plantForm,
        company: plantForm.company || companies[0]?.id || null,
      };
      await CoreAPI.createPlant(payload);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createDepartment(deptForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateDesignation = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createDesignation(desigForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createEmployee(empForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...machForm,
        plant: machForm.plant || plants[0]?.id || null,
        department: machForm.department || departments[0]?.id || null,
      };
      await CoreAPI.createMachine(payload);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    try {
      await CoreAPI.createVendor(vendorForm);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleCreateStorageLocation = async (e) => {
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
      await CoreAPI.createStorageLocation(payload);
      setModalOpen(false);
      loadStructuralData();
    } catch (err) { alert(err.response?.data?.detail || err.message); }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Delete company record?")) return;
    try { await CoreAPI.deleteCompany(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeletePlant = async (id) => {
    if (!window.confirm("Delete plant record?")) return;
    try { await CoreAPI.deletePlant(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteDepartment = async (id) => {
    if (!window.confirm("Delete department record?")) return;
    try { await CoreAPI.deleteDepartment(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteDesignation = async (id) => {
    if (!window.confirm("Delete designation record?")) return;
    try { await CoreAPI.deleteDesignation(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Delete employee record?")) return;
    try { await CoreAPI.deleteEmployee(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteMachine = async (id) => {
    if (!window.confirm("Delete machine/vehicle record?")) return;
    try { await CoreAPI.deleteMachine(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteVendor = async (id) => {
    if (!window.confirm("Delete vendor record?")) return;
    try { await CoreAPI.deleteVendor(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };
  const handleDeleteStorageLocation = async (id) => {
    if (!window.confirm("Delete storage location bin?")) return;
    try { await CoreAPI.deleteStorageLocation(id); loadStructuralData(); } catch (err) { alert(err.message); }
  };

  const getCurrentList = () => {
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
      (item.unit_id && item.unit_id.toLowerCase().includes(term)) ||
      (item.department_name && item.department_name.toLowerCase().includes(term)) ||
      (item.designation_title && item.designation_title.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabItems = [
    { id: 'companies', label: 'Companies / Entities', icon: Landmark, count: companies.length },
    { id: 'plants', label: 'Plants & Facilities', icon: Building2, count: plants.length },
    { id: 'departments', label: 'Departments', icon: MapPin, count: departments.length },
    { id: 'designations', label: 'Designations', icon: Users, count: designations.length },
    { id: 'employees', label: 'Employees / Workforce', icon: Users, count: employees.length },
    { id: 'machines', label: 'Machines & Vehicles', icon: Truck, count: machines.length },
    { id: 'vendors', label: 'Vendors', icon: Store, count: vendors.length },
    { id: 'storage', label: 'Storage Bins', icon: MapPin, count: storageLocations.length },
  ];

  const matchedDynamicForm = getDynamicFormForType(modalType);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="Structural Enterprise Masters"
        description="Core organizational backbone, company entities, facility hierarchy, workforce, and storage infrastructure."
        icon={Building2}
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openCreateModal(getModalTypeFromTab(activeTab))}>
            Add {activeTab === 'companies' ? 'COMPANY' : activeTab === 'storage' ? 'STORAGE BIN' : activeTab === 'employees' ? 'EMPLOYEE' : activeTab.slice(0, -1).toUpperCase()}
          </Button>
        }
      />

      {/* Navigation Tabs */}
      <div className="standard-card p-2">
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search ${activeTab}...`}
      />

      {/* Table Data */}
      <div className="standard-card p-0 overflow-hidden">
        {activeTab === 'companies' && (
          <Table headers={['Primary Key', 'Company Name', 'GST Number', 'Remarks', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((c) => (
              <tr key={c.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{c.id}</td>
                <td className="font-bold text-[#1F2937]">{c.name}</td>
                <td className="font-mono text-xs text-[#16A34A]">{c.gst_number || 'GST Pending'}</td>
                <td className="text-xs text-[#6B7280]">{c.remarks || '-'}</td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteCompany(c.id)} title="Delete Company" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'plants' && (
          <Table headers={['Primary Key', 'Facility Name', 'Type', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{p.id}</td>
                <td className="font-bold text-[#1F2937]">{p.name}</td>
                <td className="capitalize text-[#374151]">{p.plant_type || 'Processing'}</td>
                <td><Badge variant={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'Active' : 'Inactive'}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeletePlant(p.id)} title="Delete Plant" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'departments' && (
          <Table headers={['Primary Key', 'Department Name', 'Assigned Plant', 'Shared Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((d) => (
              <tr key={d.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{d.id}</td>
                <td className="font-bold text-[#1F2937]">{d.name}</td>
                <td>{d.plant_name || 'All Plants (Shared)'}</td>
                <td><Badge variant={d.is_shared_across_plants ? 'success' : 'info'}>{d.is_shared_across_plants ? 'Shared' : 'Plant Specific'}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteDepartment(d.id)} title="Delete Dept" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'designations' && (
          <Table headers={['Primary Key', 'Title', 'Department', 'Hierarchy Level', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((des) => (
              <tr key={des.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{des.id}</td>
                <td className="font-bold text-[#1F2937]">{des.title}</td>
                <td>{des.department_name || '-'}</td>
                <td><Badge variant="info">Level {des.hierarchy_level}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteDesignation(des.id)} title="Delete Designation" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'employees' && (
          <Table headers={['Primary Key', 'Employee Name', 'Designation', 'Department', 'Plant', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((emp) => (
              <tr key={emp.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{emp.id}</td>
                <td className="font-bold text-[#1F2937]">{emp.name}</td>
                <td className="text-[#1B4E9B]">{emp.designation_title || 'Staff'}</td>
                <td>{emp.department_name || '-'}</td>
                <td>{emp.plant_name || 'Corporate'}</td>
                <td><Badge variant={emp.status === 'active' ? 'success' : 'danger'}>{emp.status}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteEmployee(emp.id)} title="Delete Employee" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'machines' && (
          <Table headers={['Primary Key', 'Code', 'Name', 'Plant', 'Registration No', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((m) => (
              <tr key={m.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{m.id}</td>
                <td className="font-mono text-xs text-[#1B4E9B]">{m.code}</td>
                <td className="font-bold text-[#1F2937]">{m.name}</td>
                <td>{m.plant_name || '-'}</td>
                <td className="font-semibold text-[#16A34A]">{m.registration_number || 'N/A (Machine)'}</td>
                <td><Badge variant={m.status === 'active' ? 'success' : 'danger'}>{m.status}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteMachine(m.id)} title="Delete Machine" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'vendors' && (
          <Table headers={['Primary Key', 'Vendor Name', 'GST Number', 'Status', 'Registered Date', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((v) => (
              <tr key={v.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{v.id}</td>
                <td className="font-bold text-[#1F2937]">{v.name}</td>
                <td className="font-mono text-xs text-[#16A34A]">{v.gst_number || 'GST Pending'}</td>
                <td><Badge variant={v.status === 'active' ? 'success' : 'danger'}>{v.status}</Badge></td>
                <td className="text-xs text-[#6B7280]">{v.created_at?.slice(0, 10) || '2026-08-13'}</td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteVendor(v.id)} title="Delete Vendor" />
                </td>
              </tr>
            ))}
          </Table>
        )}

        {activeTab === 'storage' && (
          <Table headers={['Primary Key', 'Unit ID / Plant', 'Bin Code', 'Bin Name', 'Department', 'Capacity (KG)', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.map((st) => (
              <tr key={st.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{st.id}</td>
                <td className="font-mono text-xs text-[#1B4E9B] font-bold">{st.unit_id || st.plant_name || st.plant || 'PLN-01'}</td>
                <td className="font-mono text-xs text-[#16A34A]">{st.code}</td>
                <td className="font-bold text-[#1F2937]">{st.name || `Bin ${st.code}`}</td>
                <td>{st.department_name || 'Main Warehouse'}</td>
                <td className="font-mono text-xs text-[#2563EB] font-bold">{st.capacity || st.bin_capacity_kg || '0'} KG</td>
                <td><Badge variant={st.status === 'active' ? 'success' : 'warning'}>{st.status || 'active'}</Badge></td>
                <td className="text-right">
                  <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteStorageLocation(st.id)} title="Delete Storage Location" />
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

      {/* Pop-Up Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md" title={`Create New ${modalType.toUpperCase()}`}>
        
        {/* Dynamic vs Default Form Switch Bar */}
        {matchedDynamicForm && (
          <div className="p-3 mb-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#1B4E9B] font-semibold">
              <Sparkles className="w-4 h-4 text-[#1B4E9B]" />
              <span>Dynamic Form Linked: <strong>{matchedDynamicForm.title}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setUseDynamicFormMode(!useDynamicFormMode)}
              className="text-[#1B4E9B] font-bold hover:underline"
            >
              {useDynamicFormMode ? 'Switch to Standard Form' : 'Use Dynamic Form'}
            </button>
          </div>
        )}

        {/* Dynamic Form Renderer when linked and enabled */}
        {matchedDynamicForm && useDynamicFormMode ? (
          <GenericFormRenderer
            formConfig={matchedDynamicForm}
            onSubmit={handleDynamicFormSubmit}
            onCancel={() => setModalOpen(false)}
          />
        ) : (
          <>
            {modalType === 'company' && (
              <form onSubmit={handleCreateCompany} className="space-y-4">
                <div>
                  <label className="form-label">Company Legal Name *</label>
                  <input type="text" required value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} className="form-input" placeholder="e.g. Idhayam Oils Private Limited" />
                </div>
                <div>
                  <label className="form-label">GSTIN / Registration Number</label>
                  <input type="text" value={companyForm.gst_number} onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })} className="form-input" placeholder="e.g. 33AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="form-label">Remarks / Head Office Address</label>
                  <textarea value={companyForm.remarks} onChange={(e) => setCompanyForm({ ...companyForm, remarks: e.target.value })} className="form-input" rows="2" placeholder="Registered office details"></textarea>
                </div>
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Company</Button>
                </div>
              </form>
            )}

            {modalType === 'plant' && (
              <form onSubmit={handleCreatePlant} className="space-y-4">
                <div><label className="form-label">Plant Code *</label><input type="text" required value={plantForm.code} onChange={(e) => setPlantForm({ ...plantForm, code: e.target.value })} className="form-input" placeholder="e.g. PLN-DELHI-01" /></div>
                <div><label className="form-label">Plant Name *</label><input type="text" required value={plantForm.name} onChange={(e) => setPlantForm({ ...plantForm, name: e.target.value })} className="form-input" placeholder="e.g. Plant 1 - Main Unit" /></div>
                <div>
                  <label className="form-label">Company Entity</label>
                  <select value={plantForm.company} onChange={(e) => setPlantForm({ ...plantForm, company: e.target.value })} className="form-input">
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Plant Type</label>
                  <select value={plantForm.plant_type} onChange={(e) => setPlantForm({ ...plantForm, plant_type: e.target.value })} className="form-input">
                    <option value="manufacturing">Manufacturing Unit</option>
                    <option value="processing">Processing Unit</option>
                    <option value="packaging">Packaging Warehouse</option>
                    <option value="storage">Central Cold Storage</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Plant</Button>
                </div>
              </form>
            )}

            {modalType === 'department' && (
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div><label className="form-label">Department Code *</label><input type="text" required value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })} className="form-input" placeholder="e.g. DPT-QC" /></div>
                <div><label className="form-label">Department Name *</label><input type="text" required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} className="form-input" placeholder="e.g. Quality Assurance" /></div>
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Department</Button>
                </div>
              </form>
            )}

            {modalType === 'designation' && (
              <form onSubmit={handleCreateDesignation} className="space-y-4">
                <div>
                  <label className="form-label">Designation Title *</label>
                  <input type="text" required value={desigForm.title} onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })} className="form-input" placeholder="e.g. Quality Control Lead" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Department</label>
                    <select value={desigForm.department} onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })} className="form-input">
                      <option value="">-- General / Shared --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Hierarchy Level (1-99) *</label>
                    <input type="number" min="1" max="99" required value={desigForm.hierarchy_level} onChange={(e) => setDesigForm({ ...desigForm, hierarchy_level: parseInt(e.target.value) || 1 })} className="form-input" />
                  </div>
                </div>
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Designation</Button>
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
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Employee</Button>
                </div>
              </form>
            )}

            {modalType === 'machine' && (
              <form onSubmit={handleCreateMachine} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Machine / Vehicle Code *</label>
                    <input type="text" required value={machForm.code} onChange={(e) => setMachForm({ ...machForm, code: e.target.value })} className="form-input" placeholder="e.g. MCH-001 or TRK-99" />
                  </div>
                  <div>
                    <label className="form-label">Display Name *</label>
                    <input type="text" required value={machForm.name} onChange={(e) => setMachForm({ ...machForm, name: e.target.value })} className="form-input" placeholder="e.g. Bhuler Sorting Machine" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Plant / Facility</label>
                    <select
                      value={machForm.plant}
                      onChange={(e) => setMachForm({ ...machForm, plant: e.target.value })}
                      className="form-input"
                    >
                      <option value="">-- Optional Plant --</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <select
                      value={machForm.department}
                      onChange={(e) => setMachForm({ ...machForm, department: e.target.value })}
                      className="form-input"
                    >
                      <option value="">-- Optional Department --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Registration / Serial No.</label>
                    <input type="text" value={machForm.registration_number} onChange={(e) => setMachForm({ ...machForm, registration_number: e.target.value })} className="form-input" placeholder="e.g. TN-58-9999" />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      value={machForm.status}
                      onChange={(e) => setMachForm({ ...machForm, status: e.target.value })}
                      className="form-input"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Under Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Machine / Vehicle</Button>
                </div>
              </form>
            )}

            {modalType === 'vendor' && (
              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div>
                  <label className="form-label">Vendor Business Name *</label>
                  <input type="text" required value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} className="form-input" placeholder="e.g. Supreme Raw Agri Corp" />
                </div>
                <div>
                  <label className="form-label">GSTIN / Registration Number</label>
                  <input type="text" value={vendorForm.gst_number} onChange={(e) => setVendorForm({ ...vendorForm, gst_number: e.target.value })} className="form-input" placeholder="e.g. 33BBBBB0000B1Z8" />
                </div>
                <div>
                  <label className="form-label">Remarks</label>
                  <textarea value={vendorForm.remarks} onChange={(e) => setVendorForm({ ...vendorForm, remarks: e.target.value })} className="form-input" rows="2" placeholder="Vendor notes or contact person"></textarea>
                </div>
                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Vendor</Button>
                </div>
              </form>
            )}

            {modalType === 'storage' && (
              <form onSubmit={handleCreateStorageLocation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Unit ID / Plant Code *</label>
                    <input
                      type="text"
                      required
                      value={storageForm.unit_id}
                      onChange={(e) => setStorageForm({ ...storageForm, unit_id: e.target.value })}
                      className="form-input"
                      placeholder="e.g. PLN-01 or UNIT-A"
                    />
                  </div>
                  <div>
                    <label className="form-label">Assigned Plant Facility</label>
                    <select
                      value={storageForm.plant}
                      onChange={(e) => setStorageForm({ ...storageForm, plant: e.target.value, unit_id: e.target.value ? e.target.value : storageForm.unit_id })}
                      className="form-input"
                    >
                      <option value="">-- Select Plant --</option>
                      {plants.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Storage Bin Code *</label>
                    <input
                      type="text"
                      required
                      value={storageForm.code}
                      onChange={(e) => setStorageForm({ ...storageForm, code: e.target.value })}
                      className="form-input"
                      placeholder="e.g. BIN-A01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Bin Display Name</label>
                    <input
                      type="text"
                      value={storageForm.name}
                      onChange={(e) => setStorageForm({ ...storageForm, name: e.target.value })}
                      className="form-input"
                      placeholder="e.g. Raw Sesame Storage Bin 1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Department / Warehouse</label>
                    <select
                      value={storageForm.department}
                      onChange={(e) => setStorageForm({ ...storageForm, department: e.target.value })}
                      className="form-input"
                    >
                      <option value="">-- Main Warehouse (Default) --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Capacity (KG) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={storageForm.capacity}
                      onChange={(e) => setStorageForm({ ...storageForm, capacity: e.target.value })}
                      className="form-input"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Remarks</label>
                  <textarea
                    value={storageForm.remarks}
                    onChange={(e) => setStorageForm({ ...storageForm, remarks: e.target.value })}
                    className="form-input"
                    rows="2"
                    placeholder="Storage temperature, bin type or location specs"
                  ></textarea>
                </div>

                <div className="modal-footer">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Create Storage Bin</Button>
                </div>
              </form>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
