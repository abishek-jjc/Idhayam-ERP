import React, { useEffect, useState } from 'react';
import { ProcessEngineAPI, CoreAPI, MastersAPI } from '../api';
import { useConfiguration } from '../context/ConfigurationContext';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import GenericFormRenderer from '../components/GenericFormRenderer';
import Pagination from '../components/Pagination';
import SearchInput from '../components/ui/SearchInput';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Cpu, Play, Trash2, Eye, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export default function ProcessManagement() {
  const { forms: uiForms } = useConfiguration();
  const [activeSubTab, setActiveSubTab] = useState('instances');
  const [processTypes, setProcessTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [instances, setInstances] = useState([]);
  const [verifications, setVerifications] = useState([]);

  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [selectedPlantFilter, setSelectedPlantFilter] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);

  useEffect(() => {
    loadEngineData();
    window.addEventListener('erp_ui_metadata_updated', loadEngineData);
    return () => window.removeEventListener('erp_ui_metadata_updated', loadEngineData);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [selectedType, activeSubTab, selectedPlantFilter, selectedDeptFilter]);

  async function loadEngineData() {
    try {
      const [ptRes, instRes, verRes, plantRes, deptRes, empRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes().catch(() => ({ data: [] })),
        ProcessEngineAPI.getInstances().catch(() => ({ data: [] })),
        ProcessEngineAPI.getVerifications().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
      ]);

      const types = ptRes.data?.results || ptRes.data || [];
      const insts = instRes.data?.results || instRes.data || [];
      setProcessTypes(types);
      setInstances(insts);
      setVerifications(verRes.data?.results || verRes.data || []);
      setPlants(plantRes.data?.results || plantRes.data || []);
      setDepartments(deptRes.data?.results || deptRes.data || []);
      setEmployees(empRes.data?.results || empRes.data || []);

      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]);
      }
    } catch (err) {
      console.error("Error loading process management data:", err);
    }
  }

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
        status: selectedType.requires_approval ? 'pending' : 'completed',
        remarks: formData.remarks || 'Executed via process instance runner',
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

  const activeInstances = instances.filter((i) => {
    const matchesType = selectedType && (i.process_type === selectedType.id || i.process_type_code === selectedType.code);
    const matchesPlant = !selectedPlantFilter || i.plant === selectedPlantFilter || i.plant_id === selectedPlantFilter || i.plant_name === selectedPlantFilter;
    const matchesDept = !selectedDeptFilter || i.department === selectedDeptFilter || i.department_id === selectedDeptFilter || i.department_name === selectedDeptFilter;
    return matchesType && matchesPlant && matchesDept;
  });

  const filteredInstances = activeInstances.filter((i) =>
    i.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.plant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.department_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInstances.length / itemsPerPage) || 1;
  const paginatedInstances = filteredInstances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const matchingForm = uiForms.find(f => f.active && (f.form_name === `${selectedType?.code}_form` || f.form_name === selectedType?.code || f.form_name === 'process_engine_execution_form' || f.module === 'process_management' || f.module === selectedType?.code));

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <PageHeader
        title="Process Management & Runtime Execution"
        description="Monitor active workflow instances grouped by Plant and Department, execute process steps, track status, and audit verification sign-offs."
        icon={Cpu}
        breadcrumbItems={[
          { label: 'Process Management', path: '/process-management' },
          { label: selectedType?.name || 'Runtime Instances', path: '#' }
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={loadEngineData}>
              Refresh
            </Button>
            <Button variant="primary" icon={Play} onClick={() => setLaunchModalOpen(true)}>
              Run Process Execution
            </Button>
          </>
        }
      />

      {/* Process Type, Plant & Department Selector Bar */}
      <div className="filter-search-toolbar flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#1B4E9B] tracking-wider whitespace-nowrap">Process Type:</span>
            <select
              value={selectedType?.id || ''}
              onChange={(e) => setSelectedType(processTypes.find(p => p.id === e.target.value))}
              className="filter-select-input"
              style={{ minWidth: '200px' }}
            >
              {processTypes.map(pt => (
                <option key={pt.id} value={pt.id}>
                  {pt.name} ({pt.code}) - [{pt.category?.toUpperCase()}]
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#1B4E9B] tracking-wider whitespace-nowrap">Plant:</span>
            <select
              value={selectedPlantFilter}
              onChange={(e) => setSelectedPlantFilter(e.target.value)}
              className="filter-select-input"
              style={{ minWidth: '160px' }}
            >
              <option value="">All Plants</option>
              {plants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-[#1B4E9B] tracking-wider whitespace-nowrap">Department:</span>
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="filter-select-input"
              style={{ minWidth: '160px' }}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
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

      {/* Main Execution View */}
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
                {(selectedPlantFilter || selectedDeptFilter) && (
                  <span className="text-xs text-[#6B7280] font-normal ml-2">
                    (Filtered by {selectedPlantFilter ? `Plant: ${plants.find(p => p.id === selectedPlantFilter)?.name || selectedPlantFilter}` : ''} {selectedDeptFilter ? `Dept: ${departments.find(d => d.id === selectedDeptFilter)?.name || selectedDeptFilter}` : ''})
                  </span>
                )}
              </h3>

              <div className="w-full sm:w-64">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search instances, plants..."
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
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInstances.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-[#6B7280] italic">No execution instances recorded matching the current filters.</td>
                    </tr>
                  ) : (
                    paginatedInstances.map((inst) => (
                      <tr key={inst.id}>
                        <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{inst.id}</td>
                        <td className="font-semibold text-[#1F2937]">{inst.plant_name || inst.plant || '-'}</td>
                        <td className="text-[#374151]">{inst.department_name || inst.department || '-'}</td>
                        <td>
                          <span className={`badge ${inst.status === 'completed' || inst.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="text-xs text-[#6B7280]">{inst.created_at ? new Date(inst.created_at).toLocaleString() : 'N/A'}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
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
                    <th className="text-right">Action</th>
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
                        <td className="text-right">
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

      {/* Execution Launcher Modal (No Toggle Switch) */}
      <Modal isOpen={launchModalOpen} onClose={() => setLaunchModalOpen(false)} size="lg" title={`Execute ${selectedType?.name}`}>
        {matchingForm ? (
          <GenericFormRenderer
            formConfig={matchingForm}
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

      {/* Instance Record Inspection Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="md" title="Process Execution Details">
        {selectedInstance && (
          <div className="space-y-4 font-sans">
            <div><span className="text-xs text-[#6B7280]">Instance ID:</span><p className="font-mono text-[#1B4E9B] font-bold">{selectedInstance.id}</p></div>
            <div><span className="text-xs text-[#6B7280]">Process Type:</span><p className="text-[#1F2937] font-bold">{selectedInstance.process_type_name}</p></div>
            <div><span className="text-xs text-[#6B7280]">Plant & Department:</span><p className="text-[#1F2937] font-semibold">{selectedInstance.plant_name || '-'} · {selectedInstance.department_name || '-'}</p></div>
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
