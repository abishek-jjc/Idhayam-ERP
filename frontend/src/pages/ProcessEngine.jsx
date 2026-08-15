import React, { useEffect, useState } from 'react';
import { ProcessEngineAPI, CoreAPI, MastersAPI } from '../api';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import Pagination from '../components/Pagination';
import { Cpu, Plus, Play, ChevronRight, Download, ShieldCheck, BarChart3, Trash2, Eye, Search } from 'lucide-react';

export default function ProcessEngine() {
  const [activeSubTab, setActiveSubTab] = useState('instances');
  const [processTypes, setProcessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [instances, setInstances] = useState([]);
  const [verifications, setVerifications] = useState([]);

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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedType, activeSubTab]);

  async function loadEngineData() {
    try {
      const [ptRes, instRes, verRes, plantRes, deptRes, empRes, itemRes, binRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes(),
        ProcessEngineAPI.getInstances(),
        ProcessEngineAPI.getVerifications(),
        CoreAPI.getPlants(),
        CoreAPI.getDepartments(),
        CoreAPI.getEmployees(),
        MastersAPI.getItems(),
        CoreAPI.getStorageLocations(),
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

      const attributesPayload = Object.entries(formData).map(([key, val]) => ({
        attribute_code: key,
        value: val,
      }));

      await ProcessEngineAPI.createInstance({
        process_type: selectedType.id,
        plant: plantObj ? plantObj.id : null,
        department: deptObj ? deptObj.id : null,
        performed_by: empObj ? empObj.id : null,
        status: 'pending',
        remarks: 'Executed via dynamic UI process runner',
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
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-7 h-7 text-blue-400" /> Generic Process Engine
          </h1>
          <p className="text-xs text-slate-400">Dynamic EAV attribute definitions, execution runner, and admin sign-off verification.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setTypeModalOpen(true)} className="btn-secondary text-xs">
            <Plus className="w-4 h-4 text-emerald-400" /> Add Process Type
          </button>
          <button onClick={() => setAttrModalOpen(true)} className="btn-secondary text-xs">
            <Plus className="w-4 h-4 text-purple-400" /> Add Attribute Def
          </button>
          <button onClick={() => setLaunchModalOpen(true)} className="btn-primary text-xs">
            <Play className="w-4 h-4" /> Run Process Execution
          </button>
        </div>
      </div>

      {/* Process Type Navbar Dropdown */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-blue-500/30">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold uppercase text-blue-400 tracking-wider whitespace-nowrap">Select Process Type:</span>
          <select
            value={selectedType?.id}
            onChange={(e) => setSelectedType(processTypes.find(p => p.id === e.target.value))}
            className="form-input text-xs py-2 px-3 bg-slate-950 border border-blue-500/50 text-white font-bold rounded-xl cursor-pointer w-full md:w-80"
          >
            {processTypes.map(pt => (
              <option key={pt.id} value={pt.id} className="bg-slate-900 text-white font-semibold">
                {pt.name} ({pt.code}) - [{pt.category?.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex border border-white/10 rounded-xl overflow-hidden bg-slate-950 p-1 gap-1 overflow-x-auto w-full md:w-auto">
          {processTypes.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setSelectedType(pt)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all whitespace-nowrap ${
                selectedType?.id === pt.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{pt.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
          {/* Sub-Tabs */}
          <div className="flex border-b border-white/10 gap-2">
            <button
              onClick={() => setActiveSubTab('instances')}
              className={`px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all ${
                activeSubTab === 'instances' ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400'
              }`}
            >
              Execution Instances ({filteredInstances.length})
            </button>
            <button
              onClick={() => setActiveSubTab('verifications')}
              className={`px-4 py-2.5 font-semibold text-xs rounded-t-xl transition-all ${
                activeSubTab === 'verifications' ? 'bg-purple-600/20 text-purple-400 border-b-2 border-purple-500' : 'text-slate-400'
              }`}
            >
              Sign-Off Verifications ({verifications.length})
            </button>
          </div>

          {activeSubTab === 'instances' && (
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedType?.name || 'Process Executions'}</span>
                </h3>

                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search executions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-9 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
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
                        <td colSpan="6" className="text-center py-6 text-slate-500 italic">No execution instances recorded for this process.</td>
                      </tr>
                    ) : (
                      paginatedInstances.map((inst) => (
                        <tr key={inst.id}>
                          <td className="font-mono text-xs text-blue-400">{inst.id}</td>
                          <td>{inst.plant_name || '-'}</td>
                          <td>{inst.department_name || '-'}</td>
                          <td>
                            <span className={`badge badge-${inst.status}`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="text-xs text-slate-400">{new Date(inst.created_at).toLocaleString()}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <button onClick={() => openInspectModal(inst)} className="p-1 hover:text-blue-400 text-slate-400">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteInstance(inst.id)} className="p-1 hover:text-red-400 text-slate-400">
                                <Trash2 className="w-4 h-4" />
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
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">Admin Verification Sign-Offs</h3>
              
              <div className="overflow-x-auto">
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
                        <td colSpan="5" className="text-center py-6 text-slate-500 italic">No admin verification sign-offs.</td>
                      </tr>
                    ) : (
                      verifications.map((v) => (
                        <tr key={v.id}>
                          <td className="font-mono text-xs text-purple-400">{v.id?.substring(0, 8)}...</td>
                          <td className="font-mono text-xs text-blue-400">{v.process_instance}</td>
                          <td>{v.verified_by_name || 'Admin'}</td>
                          <td>
                            <span className={`badge ${v.status === 'verified' ? 'badge-approved' : 'badge-pending'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td>
                            {v.status !== 'verified' && (
                              <button onClick={() => handleVerify(v.process_instance)} className="btn-primary text-xs py-1 px-3">
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
      <Modal isOpen={typeModalOpen} onClose={() => setTypeModalOpen(false)} title="Create Process Engine Type">
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
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setTypeModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Type</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} title={`Add Attribute Definition for ${selectedType?.name}`}>
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
              <label className="form-label">Target Reference Table</label>
              <select value={newAttr.reference_table} onChange={(e) => setNewAttr({ ...newAttr, reference_table: e.target.value })} className="form-input">
                <option value="employee">Employee</option>
                <option value="vendor">Vendor</option>
                <option value="master_item">Master Item</option>
                <option value="master_item_version">Master Item Version</option>
                <option value="storage_location">Storage Bin Location</option>
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setAttrModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Attribute</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={launchModalOpen} onClose={() => setLaunchModalOpen(false)} title={`Execute ${selectedType?.name}`}>
        <DynamicForm
          attributeDefinitions={selectedType?.attribute_definitions || []}
          plants={plants}
          departments={departments}
          employees={employees}
          masterItems={masterItems}
          storageLocations={storageLocations}
          onSubmit={handleExecuteProcess}
        />
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Process Execution Details">
        {selectedInstance && (
          <div className="space-y-4">
            <div><span className="text-xs text-slate-400">Instance ID:</span><p className="font-mono text-blue-400 font-bold">{selectedInstance.id}</p></div>
            <div><span className="text-xs text-slate-400">Process Type:</span><p className="text-white font-bold">{selectedInstance.process_type_name}</p></div>
            <div>
              <span className="text-xs text-slate-400">Attribute Values:</span>
              <div className="bg-slate-950 p-3 rounded-lg space-y-2 mt-1">
                {(selectedInstance.attribute_values || []).map((val, idx) => (
                  <div key={idx} className="flex justify-between border-b border-white/5 pb-1 text-xs">
                    <span className="text-slate-400">{val.attribute_name || val.attribute_code}:</span>
                    <span className="text-emerald-400 font-mono">{String(val.display_value || val.value_text || val.value_number || '-')}</span>
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
