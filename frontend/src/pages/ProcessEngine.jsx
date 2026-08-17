import React, { useEffect, useState } from 'react';
import { ProcessEngineAPI, CoreAPI, MastersAPI } from '../api';
import { useConfiguration } from '../context/ConfigurationContext';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import GenericFormRenderer from '../components/GenericFormRenderer';
import Pagination from '../components/Pagination';
import SearchInput from '../components/ui/SearchInput';
import { Cpu, Plus, Play, Trash2, Eye, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';

export default function ProcessEngine() {
  const { forms: uiForms } = useConfiguration();
  const [activeSubTab, setActiveSubTab] = useState('instances');
  const [processTypes, setProcessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [instances, setInstances] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [useDynamicFormMode, setUseDynamicFormMode] = useState(true);

  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [storageLocations, setStorageLocations] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);

  const [newType, setNewType] = useState({ code: '', name: '', category: 'qc', requires_approval: false });
  const [newAttr, setNewAttr] = useState({ attribute_code: '', attribute_name: '', data_type: 'text', reference_table: '', is_required: false });

  useEffect(() => {
    loadEngineData();
    window.addEventListener('erp_ui_metadata_updated', loadEngineData);
    return () => window.removeEventListener('erp_ui_metadata_updated', loadEngineData);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedType, activeSubTab]);

  async function loadEngineData() {
    try {
      const [ptRes, instRes, verRes, plantRes, deptRes, empRes, itemRes, binRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes().catch(() => ({ data: [] })),
        ProcessEngineAPI.getInstances().catch(() => ({ data: [] })),
        ProcessEngineAPI.getVerifications().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
        MastersAPI.getItems().catch(() => ({ data: [] })),
        CoreAPI.getStorageLocations().catch(() => ({ data: [] })),
      ]);

      const types = ptRes.data.results || ptRes.data || [];
      const insts = instRes.data.results || instRes.data || [];
      setProcessTypes(types);
      setInstances(insts);
      setVerifications(verRes.data.results || verRes.data || []);
      setPlants(plantRes.data.results || plantRes.data || []);
      setDepartments(deptRes.data.results || deptRes.data || []);
      setEmployees(empRes.data.results || empRes.data || []);
      setMasterItems(itemRes.data.results || itemRes.data || []);
      setStorageLocations(binRes.data.results || binRes.data || []);

      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]);
      }
    } catch (err) {
      console.error("Error loading process engine data:", err);
    }
  }

  const handleCreateProcessType = async (e) => {
    e.preventDefault();
    try {
      await ProcessEngineAPI.createProcessType(newType);
      setTypeModalOpen(false);
      setNewType({ code: '', name: '', category: 'qc', requires_approval: false });
      loadEngineData();
    } catch (err) {
      alert("Failed to create process type: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddAttribute = async (e) => {
    e.preventDefault();
    if (!selectedType) return;
    try {
      await ProcessEngineAPI.createAttributeDefinition({
        process_type: selectedType.id,
        attribute_code: newAttr.attribute_code,
        attribute_name: newAttr.attribute_name,
        data_type: newAttr.data_type,
        reference_table: newAttr.data_type === 'reference' ? newAttr.reference_table : null,
        is_required: newAttr.is_required,
      });
      setAttrModalOpen(false);
      setNewAttr({ attribute_code: '', attribute_name: '', data_type: 'text', reference_table: '', is_required: false });
      loadEngineData();
    } catch (err) {
      alert("Failed to add attribute: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleExecuteProcess = async (formData) => {
    if (!selectedType) return;
    try {
      const plantObj = plants[0];
      const deptObj = departments[0];
      const empObj = employees[0];

      const attributesPayload = Object.entries(formData.values || {}).map(([key, val]) => ({
        attribute_code: key,
        value: val,
      }));

      await ProcessEngineAPI.createInstance({
        process_type: selectedType.id,
        plant: formData.plant || (plantObj ? plantObj.id : null),
        department: formData.department || (deptObj ? deptObj.id : null),
        performed_by: formData.performed_by || (empObj ? empObj.id : null),
        status: 'pending',
        remarks: formData.remarks || 'Executed via dynamic UI process runner',
        values: formData.values || {},
        attributes: attributesPayload,
      });

      setLaunchModalOpen(false);
      loadEngineData();
    } catch (err) {
      alert("Failed to execute process instance: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteInstance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this process execution record?")) return;
    try {
      await ProcessEngineAPI.deleteInstance(id);
      loadEngineData();
    } catch (err) {
      alert("Failed to delete instance: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleVerify = async (verificationId) => {
    try {
      const empObj = employees[0];
      await ProcessEngineAPI.createVerification({
        process_instance: verificationId,
        verified_by: empObj ? empObj.id : null,
        status: 'verified',
        remarks: 'Admin verification sign-off completed',
      });
      loadEngineData();
    } catch (err) {
      alert("Verification failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const openInspectModal = (inst) => {
    setSelectedInstance(inst);
    setViewModalOpen(true);
  };

  const activeInstances = instances.filter((i) => selectedType && (i.process_type === selectedType.id || i.process_type_code === selectedType.code));
  const filteredInstances = activeInstances.filter((i) =>
    i.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInstances.length / itemsPerPage) || 1;
  const paginatedInstances = filteredInstances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#1B4E9B]" /> Generic Process Engine
          </h1>
          <p className="text-xs text-[#6B7280]">Dynamic EAV attribute definitions, execution runner, and admin sign-off verification.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTypeModalOpen(true)} className="btn-secondary">
            <Plus className="w-4 h-4 text-[#16A34A]" /> Add Process Type
          </button>
          <button onClick={() => setAttrModalOpen(true)} className="btn-secondary">
            <Plus className="w-4 h-4 text-[#2563EB]" /> Add Attribute Def
          </button>
          <button onClick={() => setLaunchModalOpen(true)} className="btn-primary">
            <Play className="w-4 h-4" /> Run Process Execution
          </button>
        </div>
      </div>

      {/* Process Type Selector Bar */}
      <div className="filter-search-toolbar">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-[#1B4E9B] tracking-wider whitespace-nowrap">Select Process Type:</span>
          <select
            value={selectedType?.id}
            onChange={(e) => setSelectedType(processTypes.find(p => p.id === e.target.value))}
            className="filter-select-input"
            style={{ minWidth: '240px' }}
          >
            {processTypes.map(pt => (
              <option key={pt.id} value={pt.id}>
                {pt.name} ({pt.code}) - [{pt.category?.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        <div className="admin-console-menu">
          {processTypes.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => setSelectedType(pt)}
              className={`admin-menu-item ${selectedType?.id === pt.id ? 'active' : ''}`}
            >
              <span>{pt.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Sub-Tabs */}
        <div className="admin-console-menu">
          <button
            type="button"
            onClick={() => setActiveSubTab('instances')}
            className={`admin-menu-item ${activeSubTab === 'instances' ? 'active' : ''}`}
          >
            <Cpu className="admin-menu-icon" />
            <span>Execution Instances</span>
            <span className="badge-count">{filteredInstances.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('verifications')}
            className={`admin-menu-item ${activeSubTab === 'verifications' ? 'active' : ''}`}
          >
            <ShieldCheck className="admin-menu-icon" />
            <span>Sign-Off Verifications</span>
            <span className="badge-count">{verifications.length}</span>
          </button>
        </div>

        {activeSubTab === 'instances' && (
          <div className="standard-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
              <h3 className="card-title text-sm">
                <span>{selectedType?.name || 'Process Executions'}</span>
              </h3>

              <div className="w-full sm:w-64">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search executions..."
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Instance ID</th>
                    <th>Plant Unit</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInstances.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-[#6B7280] italic">No execution instances recorded for this process.</td>
                    </tr>
                  ) : (
                    paginatedInstances.map((inst) => (
                      <tr key={inst.id}>
                        <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{inst.id}</td>
                        <td>{inst.plant_name || '-'}</td>
                        <td>{inst.department_name || '-'}</td>
                        <td>
                          <span className={`badge ${inst.status === 'completed' || inst.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="text-xs text-[#6B7280]">{new Date(inst.created_at).toLocaleString()}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button onClick={() => openInspectModal(inst)} className="btn-action-view" title="Inspect Record">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => handleDeleteInstance(inst.id)} className="btn-action-delete" title="Delete Instance">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredInstances.length}
              itemsPerPage={10}
            />
          </div>
        )}

        {activeSubTab === 'verifications' && (
          <div className="standard-card space-y-4">
            <h3 className="section-title">Admin Verification Sign-Offs</h3>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Verification ID</th>
                    <th>Target Process Instance</th>
                    <th>Verified By</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-[#6B7280] italic">No admin verification sign-offs.</td>
                    </tr>
                  ) : (
                    verifications.map((v) => (
                      <tr key={v.id}>
                        <td className="font-mono text-xs text-[#2563EB]">{v.id?.substring(0, 8)}...</td>
                        <td className="font-mono text-xs text-[#1B4E9B]">{v.process_instance}</td>
                        <td>{v.verified_by_name || 'Admin'}</td>
                        <td>
                          <span className={`badge ${v.status === 'verified' ? 'badge-success' : 'badge-warning'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td>
                          {v.status !== 'verified' && (
                            <button onClick={() => handleVerify(v.process_instance)} className="btn-approve">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verify Sign-Off
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={typeModalOpen} onClose={() => setTypeModalOpen(false)} size="md" title="Create Process Engine Type">
        <form onSubmit={handleCreateProcessType} className="space-y-4">
          <div><label className="form-label">Type Code *</label><input type="text" required value={newType.code} onChange={(e) => setNewType({ ...newType, code: e.target.value })} className="form-input" placeholder="e.g. qc_incoming_load" /></div>
          <div><label className="form-label">Type Name *</label><input type="text" required value={newType.name} onChange={(e) => setNewType({ ...newType, name: e.target.value })} className="form-input" placeholder="e.g. QC Incoming Load Inspection" /></div>
          <div>
            <label className="form-label">Category</label>
            <select value={newType.category} onChange={(e) => setNewType({ ...newType, category: e.target.value })} className="form-input">
              <option value="qc">Quality Control (QC)</option>
              <option value="production">Production & Cleaning</option>
              <option value="packaging">Packaging</option>
              <option value="purchase">Purchase & Requisition</option>
              <option value="transport">Transport & Fleet</option>
              <option value="hr">HR & Payroll</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setTypeModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Type</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} size="md" title={`Add Attribute Definition for ${selectedType?.name}`}>
        <form onSubmit={handleAddAttribute} className="space-y-4">
          <div><label className="form-label">Attribute Code *</label><input type="text" required value={newAttr.attribute_code} onChange={(e) => setNewAttr({ ...newAttr, attribute_code: e.target.value })} className="form-input" placeholder="e.g. moisture_level" /></div>
          <div><label className="form-label">Attribute Name *</label><input type="text" required value={newAttr.attribute_name} onChange={(e) => setNewAttr({ ...newAttr, attribute_name: e.target.value })} className="form-input" placeholder="e.g. Moisture Level (%)" /></div>
          <div>
            <label className="form-label">Data Type</label>
            <select value={newAttr.data_type} onChange={(e) => setNewAttr({ ...newAttr, data_type: e.target.value })} className="form-input">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="datetime">DateTime</option>
              <option value="boolean">Boolean</option>
              <option value="reference">Reference (Foreign Key)</option>
            </select>
          </div>
          {newAttr.data_type === 'reference' && (
            <div>
              <label className="form-label">Target Reference Master Table</label>
              <select value={newAttr.reference_table || 'employee'} onChange={(e) => setNewAttr({ ...newAttr, reference_table: e.target.value })} className="form-input">
                <option value="companies">Companies / Legal Entities</option>
                <option value="plants">Plants & Facilities</option>
                <option value="departments">Departments</option>
                <option value="designations">Designations</option>
                <option value="employee">Employees / Workforce</option>
                <option value="machine">Machines & Vehicles</option>
                <option value="vendor">Vendors</option>
                <option value="storage_location">Storage Bin Locations</option>
                <option value="master_item">Master Items</option>
                <option value="master_categories">Master Categories</option>
                <option value="process_types">Process Types</option>
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" onClick={() => setAttrModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Attribute</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={launchModalOpen} onClose={() => setLaunchModalOpen(false)} size="lg" title={`Execute ${selectedType?.name}`}>
        {uiForms.find(f => f.active && (f.form_name === `${selectedType?.code}_form` || f.form_name === selectedType?.code || f.form_name === 'process_engine_form' || f.module === 'process_engine' || f.module === selectedType?.code)) && (
          <div className="p-3 mb-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#1B4E9B] font-semibold">
              <Sparkles className="w-4 h-4 text-[#1B4E9B]" />
              <span>Dynamic Form Linked from Form Builder</span>
            </div>
            <button
              type="button"
              onClick={() => setUseDynamicFormMode(!useDynamicFormMode)}
              className="text-[#1B4E9B] font-bold hover:underline"
            >
              {useDynamicFormMode ? 'Switch to Standard Attributes' : 'Use Dynamic Form'}
            </button>
          </div>
        )}

        {useDynamicFormMode && uiForms.find(f => f.active && (f.form_name === `${selectedType?.code}_form` || f.form_name === selectedType?.code || f.form_name === 'process_engine_form' || f.module === 'process_engine' || f.module === selectedType?.code)) ? (
          <GenericFormRenderer
            formConfig={uiForms.find(f => f.active && (f.form_name === `${selectedType?.code}_form` || f.form_name === selectedType?.code || f.form_name === 'process_engine_form' || f.module === 'process_engine' || f.module === selectedType?.code))}
            onSubmit={async (formData) => {
              try {
                await ProcessEngineAPI.createInstance({
                  process_type: selectedType.id,
                  plant: formData.plant || plants[0]?.id || null,
                  department: formData.department || departments[0]?.id || null,
                  performed_by: formData.performed_by || employees[0]?.id || null,
                  status: selectedType.requires_approval ? 'pending' : 'completed',
                  remarks: formData.remarks || 'Launched via Dynamic Form',
                  values: formData,
                });
                setLaunchModalOpen(false);
                loadEngineData();
              } catch (err) {
                alert("Execution failed: " + (err.response?.data?.detail || err.message));
              }
            }}
            onCancel={() => setLaunchModalOpen(false)}
          />
        ) : (
          <DynamicForm
            definitions={selectedType?.attribute_definitions || []}
            plants={plants}
            departments={departments}
            employees={employees}
            onSubmit={handleExecuteProcess}
            onCancel={() => setLaunchModalOpen(false)}
          />
        )}
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="md" title="Process Execution Details">
        {selectedInstance && (
          <div className="space-y-4">
            <div><span className="text-xs text-[#6B7280]">Instance ID:</span><p className="font-mono text-[#1B4E9B] font-bold">{selectedInstance.id}</p></div>
            <div><span className="text-xs text-[#6B7280]">Process Type:</span><p className="text-[#1F2937] font-bold">{selectedInstance.process_type_name}</p></div>
            <div>
              <span className="text-xs text-[#6B7280]">Attribute Values:</span>
              <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E5E7EB] space-y-2 mt-1">
                {(selectedInstance.attribute_values || []).map((val, idx) => (
                  <div key={idx} className="flex justify-between border-b border-[#E5E7EB] pb-1 text-xs">
                    <span className="text-[#6B7280]">{val.attribute_name || val.attribute_code}:</span>
                    <span className="text-[#16A34A] font-mono">{String(val.display_value || val.value_text || val.value_number || '-')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
