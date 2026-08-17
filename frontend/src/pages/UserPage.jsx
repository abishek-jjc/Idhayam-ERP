import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProcessEngineAPI, MastersAPI, WorkflowAPI } from '../api';
import Modal from '../components/Modal';
import DynamicForm from '../components/DynamicForm';
import { UserCheck, Cpu, Layers, GitPullRequest, Plus, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

export default function UserPage() {
  const { user, designation, isSuperAdmin, hasPermission } = useAuth();

  const [processTypes, setProcessTypes] = useState([]);
  const [instances, setInstances] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [selectedProcessType, setSelectedProcessType] = useState(null);
  const [createInstanceModal, setCreateInstanceModal] = useState(false);
  const [attrDefinitions, setAttrDefinitions] = useState([]);
  const [formValues, setFormValues] = useState({});

  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const [ptRes, instRes, catRes, itemRes, propRes, plantRes, deptRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes(),
        ProcessEngineAPI.getInstances(),
        MastersAPI.getCategories(),
        MastersAPI.getItems(),
        WorkflowAPI.getProposals(),
        ProcessEngineAPI.getPlants ? ProcessEngineAPI.getPlants() : fetch('http://127.0.0.1:8000/api/core/plants/').then(r => r.json()),
        fetch('http://127.0.0.1:8000/api/core/departments/').then(r => r.json()),
      ]);

      const ptList = ptRes.data?.results || ptRes.data || [];
      const instList = instRes.data?.results || instRes.data || [];
      const catList = catRes.data?.results || catRes.data || [];
      const itemList = itemRes.data?.results || itemRes.data || [];
      const propList = propRes.data?.results || propRes.data || [];
      const plantList = plantRes.results || plantRes.data?.results || plantRes.data || plantRes || [];
      const deptList = deptRes.results || deptRes.data?.results || deptRes.data || deptRes || [];

      setProcessTypes(ptList);
      setInstances(instList);
      setMasterCategories(catList);
      setMasterItems(itemList);
      setProposals(propList);
      setPlants(plantList);
      setDepartments(deptList);
    } catch (err) {
      console.error("Error loading user page data:", err);
    }
  }

  const permittedProcessTypes = processTypes.filter((pt) => {
    if (isSuperAdmin) return true;
    return hasPermission('process_engine', pt.id) || hasPermission('process_engine', pt.code);
  });

  const openCreateProcessModal = async (pt) => {
    setSelectedProcessType(pt);
    try {
      const defRes = await ProcessEngineAPI.getAttributeDefinitions({ process_type: pt.id });
      const defs = defRes.data.results || defRes.data || [];
      setAttrDefinitions(defs);

      const initialVals = {};
      defs.forEach(d => { initialVals[d.attribute_code] = ''; });
      setFormValues(initialVals);
      setCreateInstanceModal(true);
    } catch (err) {
      console.error("Error loading attributes:", err);
    }
  };

  const handleCreateInstanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProcessType) return;
    try {
      const plantId = plants[0]?.id || null;
      const deptId = selectedProcessType.owning_department || departments[0]?.id || null;

      await ProcessEngineAPI.createInstance({
        process_type: selectedProcessType.id,
        plant: plantId,
        department: deptId,
        status: selectedProcessType.requires_approval ? 'pending' : 'completed',
        values: formValues,
      });
      setCreateInstanceModal(false);
      loadUserData();
    } catch (err) {
      alert("Failed to submit process execution: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#1B4E9B] text-white flex items-center justify-center font-extrabold shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="page-title flex items-center gap-2">
              Welcome, {user?.name || 'Enterprise User'}
              {isSuperAdmin && <span className="badge badge-success text-xs">SuperAdmin</span>}
            </h1>
            <p className="text-xs text-[#6B7280] font-medium flex items-center gap-2 mt-1">
              <span>Active Designation: <strong className="text-[#1B4E9B]">{designation?.title || 'General Staff'}</strong></span>
              <span>&bull;</span>
              <span>Hierarchy Level: <strong className="text-[#1F2937]">{designation?.hierarchy_level || 1}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F8FAFC] px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
          <span className="text-[#374151] font-semibold">Designation Access Control Active</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Permitted Process Types & Execution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Permitted Process Engine Types */}
          <div className="standard-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="section-title flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#1B4E9B]" /> Permitted Process Engine Types
                </h3>
                <p className="text-xs text-[#6B7280]">Process types enabled for designation '{designation?.title}'.</p>
              </div>
              <span className="badge badge-info text-xs">{permittedProcessTypes.length} Allowed</span>
            </div>

            {permittedProcessTypes.length === 0 ? (
              <div className="p-8 text-center bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] space-y-2">
                <AlertCircle className="w-8 h-8 text-[#F6CE0A] mx-auto" />
                <p className="text-sm font-semibold text-[#1F2937]">No Process Types Assigned</p>
                <p className="text-xs text-[#6B7280]">SuperAdmin has not granted permissions for any process types yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permittedProcessTypes.map((pt) => {
                  const canCreate = isSuperAdmin || hasPermission('process_engine', pt.id, 'create');
                  return (
                    <div key={pt.id} className="p-4 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#1B4E9B] transition-all flex flex-col justify-between gap-3 shadow-sm">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[11px] text-[#1B4E9B] font-semibold">{pt.code}</span>
                          <span className="badge badge-info text-[10px] capitalize">{pt.category}</span>
                        </div>
                        <h4 className="font-bold text-[#1F2937] text-sm">{pt.name}</h4>
                        <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{pt.remarks || 'Standard process execution template'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB]">
                        <span className="text-[11px] text-[#6B7280]">
                          Approval: {pt.requires_approval ? <strong className="text-[#CA8A04]">Required</strong> : <span className="text-[#16A34A]">Auto</span>}
                        </span>
                        {canCreate && (
                          <button
                            onClick={() => openCreateProcessModal(pt)}
                            className="btn-primary text-xs py-1 px-2.5 h-8"
                          >
                            <Plus className="w-3.5 h-3.5" /> Execute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Process Executions */}
          <div className="standard-card space-y-4">
            <h3 className="section-title flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1B4E9B]" /> Recent Process Executions
            </h3>

            <div className="overflow-x-auto max-h-72 custom-scrollbar">
              <table className="custom-table text-xs">
                <thead>
                  <tr>
                    <th>Execution ID</th>
                    <th>Process Type</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-6 text-[#6B7280] italic">No executions logged yet.</td>
                    </tr>
                  ) : (
                    instances.slice(0, 8).map((inst) => (
                      <tr key={inst.id}>
                        <td className="font-mono text-[#1B4E9B] font-semibold">{inst.id}</td>
                        <td className="font-medium text-[#1F2937]">{inst.process_type_name || inst.process_type}</td>
                        <td>
                          <span className={`badge ${inst.status === 'completed' || inst.status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="text-[#6B7280]">{inst.created_at ? new Date(inst.created_at).toLocaleString() : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Column 3: Accessible Masters & Pending Approvals */}
        <div className="space-y-6">

          {/* Accessible Master Categories */}
          <div className="standard-card space-y-4">
            <h3 className="section-title flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#16A34A]" /> Master Categories
            </h3>

            <div className="space-y-2">
              {masterCategories.map((cat) => (
                <div key={cat.id} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1F2937] text-xs">{cat.name}</p>
                    <p className="font-mono text-[10px] text-[#16A34A]">{cat.code}</p>
                  </div>
                  <span className="badge badge-info text-[10px]">
                    {masterItems.filter(i => i.category === cat.id || i.category_code === cat.code).length} Items
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Proposals */}
          <div className="standard-card space-y-4">
            <h3 className="section-title flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-[#2563EB]" /> Pending Workflow Approvals
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {proposals.length === 0 ? (
                <p className="text-xs text-[#6B7280] italic text-center py-4">No pending workflow proposals.</p>
              ) : (
                proposals.slice(0, 5).map((prop) => (
                  <div key={prop.id} className="p-3 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#2563EB]">{prop.id}</span>
                      <span className="badge badge-warning text-[10px]">{prop.status}</span>
                    </div>
                    <p className="font-bold text-xs text-[#1F2937]">{prop.proposal_type || 'Proposal Review'}</p>
                    <p className="text-[10px] text-[#6B7280] italic">{prop.remarks || 'Awaiting sign-off'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Execute Process Instance */}
      <Modal isOpen={createInstanceModal} onClose={() => setCreateInstanceModal(false)} size="lg" title={`Execute Process: ${selectedProcessType?.name}`}>
        <DynamicForm
          definitions={attrDefinitions}
          plants={plants}
          departments={departments}
          employees={[{ id: user?.username || 'user-01', name: user?.name || 'Current User', designation_title: designation?.title }]}
          onSubmit={async (formData) => {
            try {
              await ProcessEngineAPI.createInstance({
                process_type: selectedProcessType.id,
                plant: formData.plant || plants[0]?.id || null,
                department: formData.department || departments[0]?.id || null,
                performed_by: formData.performed_by || null,
                status: selectedProcessType.requires_approval ? 'pending' : 'completed',
                remarks: formData.remarks,
                values: formData.values,
              });
              setCreateInstanceModal(false);
              loadUserData();
            } catch (err) {
              alert("Failed to submit process execution: " + (err.response?.data?.detail || err.message));
            }
          }}
          onCancel={() => setCreateInstanceModal(false)}
        />
      </Modal>

    </div>
  );
}

