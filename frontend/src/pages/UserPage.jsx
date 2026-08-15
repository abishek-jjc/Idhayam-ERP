import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ProcessEngineAPI, MastersAPI, WorkflowAPI } from '../api';
import Modal from '../components/Modal';
import { UserCheck, Cpu, Layers, GitPullRequest, Plus, ShieldCheck, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function UserPage() {
  const { user, designation, permissions, isSuperAdmin, hasPermission } = useAuth();

  const [processTypes, setProcessTypes] = useState([]);
  const [instances, setInstances] = useState([]);
  const [masterCategories, setMasterCategories] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [selectedProcessType, setSelectedProcessType] = useState(null);
  const [createInstanceModal, setCreateInstanceModal] = useState(false);
  const [attrDefinitions, setAttrDefinitions] = useState([]);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const [ptRes, instRes, catRes, itemRes, propRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes(),
        ProcessEngineAPI.getInstances(),
        MastersAPI.getCategories(),
        MastersAPI.getItems(),
        WorkflowAPI.getProposals(),
      ]);

      const ptList = ptRes.data.results || ptRes.data || [];
      const instList = instRes.data.results || instRes.data || [];
      const catList = catRes.data.results || catRes.data || [];
      const itemList = itemRes.data.results || itemRes.data || [];
      const propList = propRes.data.results || propRes.data || [];

      setProcessTypes(ptList);
      setInstances(instList);
      setMasterCategories(catList);
      setMasterItems(itemList);
      setProposals(propList);
    } catch (err) {
      console.error("Error loading user page data:", err);
    }
  }

  // Filter process types by designation permission
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
      await ProcessEngineAPI.createInstance({
        process_type: selectedProcessType.id,
        plant: 'PLN-01-PUNE-MFG',
        department: selectedProcessType.owning_department || 'DPT-PROD',
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
      <div className="glass-panel p-6 bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-indigo-500/30 shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Welcome, {user?.name || 'Enterprise User'}
              {isSuperAdmin && <span className="badge badge-approved text-xs">SuperAdmin</span>}
            </h1>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-1">
              <span>Active Designation: <strong className="text-indigo-400">{designation?.title || 'General Staff'}</strong></span>
              <span>&bull;</span>
              <span>Hierarchy Level: <strong className="text-purple-400">{designation?.hierarchy_level || 1}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-white/10 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Designation Access Control Active</span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Permitted Process Types & Execution */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Permitted Process Engine Types */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" /> Permitted Process Engine Types
                </h3>
                <p className="text-xs text-slate-400">Process types enabled specifically for designation '{designation?.title}' by SuperAdmin.</p>
              </div>
              <span className="badge badge-info text-xs">{permittedProcessTypes.length} Allowed</span>
            </div>

            {permittedProcessTypes.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-white/5 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No Process Types Assigned</p>
                <p className="text-xs text-slate-500">SuperAdmin has not granted this designation permissions for any process types yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permittedProcessTypes.map((pt) => {
                  const canCreate = isSuperAdmin || hasPermission('process_engine', pt.id, 'create');
                  return (
                    <div key={pt.id} className="p-4 rounded-xl bg-slate-950/60 border border-white/10 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[11px] text-indigo-400 font-semibold">{pt.code}</span>
                          <span className="badge badge-info text-[10px] capitalize">{pt.category}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm">{pt.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{pt.remarks || 'Standard process execution template'}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-[10px] text-slate-400">
                          Approval: {pt.requires_approval ? <strong className="text-amber-400">Required</strong> : <span className="text-emerald-400">Auto</span>}
                        </span>
                        {canCreate && (
                          <button
                            onClick={() => openCreateProcessModal(pt)}
                            className="btn-primary text-xs py-1 px-2.5"
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
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" /> Recent Process Executions
            </h3>

            <div className="overflow-x-auto max-h-72">
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
                      <td colSpan="4" className="text-center py-6 text-slate-500 italic">No executions logged yet.</td>
                    </tr>
                  ) : (
                    instances.slice(0, 8).map((inst) => (
                      <tr key={inst.id}>
                        <td className="font-mono text-blue-400 font-semibold">{inst.id}</td>
                        <td className="font-semibold text-white">{inst.process_type_name || inst.process_type}</td>
                        <td>
                          <span className={`badge ${inst.status === 'completed' || inst.status === 'approved' ? 'badge-approved' : 'badge-pending'}`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="text-slate-400">{inst.created_at ? new Date(inst.created_at).toLocaleString() : '-'}</td>
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
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Master Categories
            </h3>

            <div className="space-y-2">
              {masterCategories.map((cat) => (
                <div key={cat.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-xs">{cat.name}</p>
                    <p className="font-mono text-[10px] text-emerald-400">{cat.code}</p>
                  </div>
                  <span className="badge badge-info text-[10px]">
                    {masterItems.filter(i => i.category === cat.id || i.category_code === cat.code).length} Items
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Proposals */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <GitPullRequest className="w-5 h-5 text-purple-400" /> Pending Workflow Approvals
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {proposals.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4">No pending workflow proposals.</p>
              ) : (
                proposals.slice(0, 5).map((prop) => (
                  <div key={prop.id} className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-purple-400">{prop.id}</span>
                      <span className="badge badge-pending text-[10px]">{prop.status}</span>
                    </div>
                    <p className="font-bold text-xs text-white">{prop.proposal_type || 'Proposal Review'}</p>
                    <p className="text-[10px] text-slate-400 italic">{prop.remarks || 'Awaiting sign-off'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Execute Process Instance */}
      <Modal isOpen={createInstanceModal} onClose={() => setCreateInstanceModal(false)} title={`Execute Process: ${selectedProcessType?.name}`}>
        <form onSubmit={handleCreateInstanceSubmit} className="space-y-4">
          <p className="text-xs text-slate-400">Fill in dynamic attributes required for this process execution:</p>
          
          {attrDefinitions.map((attr) => (
            <div key={attr.id} className="space-y-1">
              <label className="form-label">{attr.attribute_name} {attr.is_required && '*'}</label>
              {attr.data_type === 'boolean' ? (
                <select
                  value={formValues[attr.attribute_code] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [attr.attribute_code]: e.target.value })}
                  className="form-input"
                >
                  <option value="">Select Option</option>
                  <option value="true">Yes / True</option>
                  <option value="false">No / False</option>
                </select>
              ) : attr.data_type === 'number' ? (
                <input
                  type="number"
                  step="any"
                  required={attr.is_required}
                  value={formValues[attr.attribute_code] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [attr.attribute_code]: e.target.value })}
                  className="form-input"
                  placeholder="Enter numeric value"
                />
              ) : (
                <input
                  type="text"
                  required={attr.is_required}
                  value={formValues[attr.attribute_code] || ''}
                  onChange={(e) => setFormValues({ ...formValues, [attr.attribute_code]: e.target.value })}
                  className="form-input"
                  placeholder={`Enter ${attr.attribute_name}`}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setCreateInstanceModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Process Execution</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
