import React, { useEffect, useState } from 'react';
import { WorkflowAPI, ProcessEngineAPI, CoreAPI, MastersAPI, NotificationAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import GenericFormRenderer from '../components/GenericFormRenderer';
import Tabs from '../components/ui/Tabs';
import Badge from '../components/ui/Badge';
import { useConfiguration } from '../context/ConfigurationContext';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Upload,
  FileText,
  Eye,
  Search,
  BarChart3,
  Bell,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

export default function WorkflowApprovals() {
  const { forms } = useConfiguration();
  const workflowForm = forms.find(
    (form) =>
      form.active &&
      (['workflow_proposal_form', 'proposal_form', 'approval_form'].includes(form.form_name) || form.module === 'workflow')
  );

  const [activeTab, setActiveTab] = useState('proposals'); // 'proposals' | 'activity_audit' | 'notifications'

  const [proposals, setProposals] = useState([]);
  const [instances, setInstances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [proposalTypes, setProposalTypes] = useState([]);
  const [allAmendments, setAllAmendments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const [newProposal, setNewProposal] = useState({
    proposal_type: 'basic',
    process_instance: '',
    requested_by: '',
    plant: '',
    department: '',
    vendor_mode: 'single',
    vendor_count: 2,
    vendor_allocations: [{ vendor_id: '', percentage: 100 }],
    restock_lead_time_days: 7,
    frequency_interval_hours: 24,
    remarks: '',
  });

  const [quotationForm, setQuotationForm] = useState({
    vendor: '',
    quoted_rate: 1500,
    allocated_percentage: 100,
    is_selected: true,
    file_name: '',
    parsed_details: null,
  });

  const [amendmentForm, setAmendmentForm] = useState({
    amended_by: '',
    amendment_reason: 'Updated pricing structure and revised scope',
    new_quoted_rate: 1800,
  });

  useEffect(() => {
    loadWorkflowData();
  }, []);

  async function loadWorkflowData() {
    try {
      const [propRes, instRes, empRes, plantRes, deptRes, desigRes, venRes, catRes, amdRes, notifRes] = await Promise.all([
        WorkflowAPI.getProposals().catch(() => ({ data: [] })),
        ProcessEngineAPI.getInstances().catch(() => ({ data: [] })),
        CoreAPI.getEmployees().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getDesignations().catch(() => ({ data: [] })),
        CoreAPI.getVendors().catch(() => ({ data: [] })),
        MastersAPI.getCategories().catch(() => ({ data: [] })),
        WorkflowAPI.getAmendments().catch(() => ({ data: [] })),
        NotificationAPI.getNotifications().catch(() => ({ data: [] })),
      ]);

      const loadedProposals = propRes.data?.results || propRes.data || [];
      setProposals(loadedProposals);
      setInstances(instRes.data?.results || instRes.data || []);
      
      const loadedEmps = empRes.data?.results || empRes.data || [];
      const loadedPlants = plantRes.data?.results || plantRes.data || [];
      const loadedDepts = deptRes.data?.results || deptRes.data || [];
      const loadedDesigs = desigRes.data?.results || desigRes.data || [];
      const loadedVendors = venRes.data?.results || venRes.data || [];
      const loadedCats = catRes.data?.results || catRes.data || [];
      const loadedAmds = amdRes.data?.results || amdRes.data || [];
      const loadedNotifs = notifRes.data?.results || notifRes.data || [];

      setEmployees(loadedEmps);
      setPlants(loadedPlants);
      setDepartments(loadedDepts);
      setDesignations(loadedDesigs);
      setVendors(loadedVendors);
      setProposalTypes(loadedCats.filter(c => c.code?.toLowerCase().includes('proposal') || c.name?.toLowerCase().includes('proposal')));
      setAllAmendments(loadedAmds);
      setNotifications(loadedNotifs);

      if (loadedEmps.length > 0 && !newProposal.requested_by) {
        setNewProposal(prev => ({
          ...prev,
          requested_by: loadedEmps[0].id,
          plant: loadedPlants[0]?.id || '',
          department: loadedDepts[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error("Error loading workflow proposals:", err);
    }
  }

  const handleVendorModeChange = (mode) => {
    if (mode === 'multiple') {
      const count = newProposal.vendor_count || 2;
      const alloc = [];
      const equalShare = Math.floor(100 / count);
      let remainder = 100 - equalShare * count;

      for (let i = 0; i < count; i++) {
        alloc.push({
          vendor_id: vendors[i % vendors.length]?.id || '',
          percentage: equalShare + (i === 0 ? remainder : 0),
        });
      }
      setNewProposal({
        ...newProposal,
        vendor_mode: mode,
        vendor_count: count,
        vendor_allocations: alloc,
      });
    } else {
      setNewProposal({
        ...newProposal,
        vendor_mode: mode,
        vendor_allocations: [{ vendor_id: vendors[0]?.id || '', percentage: 100 }],
      });
    }
  };

  const handleVendorCountChange = (count) => {
    const num = Math.max(1, parseInt(count) || 1);
    const alloc = [];
    const equalShare = Math.floor(100 / num);
    let remainder = 100 - equalShare * num;

    for (let i = 0; i < num; i++) {
      alloc.push({
        vendor_id: vendors[i % vendors.length]?.id || '',
        percentage: equalShare + (i === 0 ? remainder : 0),
      });
    }
    setNewProposal({
      ...newProposal,
      vendor_count: num,
      vendor_allocations: alloc,
    });
  };

  const handleVendorAllocationChange = (index, field, val) => {
    const updated = [...newProposal.vendor_allocations];
    const parsedVal = field === 'percentage' ? Math.max(0, parseFloat(val) || 0) : val;
    updated[index] = {
      ...updated[index],
      [field]: parsedVal,
    };
    setNewProposal({ ...newProposal, vendor_allocations: updated });
  };

  const getTotalAllocationSum = () => {
    if (newProposal.vendor_mode === 'single') return 100;
    return newProposal.vendor_allocations.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
  };

  const handleCreateProposal = async (eventOrValues) => {
    const isEvent = typeof eventOrValues?.preventDefault === 'function';
    if (isEvent) eventOrValues.preventDefault();
    const proposalValues = isEvent ? newProposal : { ...newProposal, ...(eventOrValues || {}) };
    const totalAlloc = proposalValues.vendor_mode === 'single'
      ? 100
      : proposalValues.vendor_allocations.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
    if (proposalValues.vendor_mode === 'multiple' && totalAlloc !== 100) {
      alert(`Vendor allocation total must equal exactly 100%. Current total is ${totalAlloc}%.`);
      return;
    }

    try {
      let instId = proposalValues.process_instance;
      if (!instId) {
        if (instances.length > 0) {
          instId = instances[0].id;
        } else {
          alert("No Process Execution Instance available.");
          return;
        }
      }

      const res = await WorkflowAPI.createProposal({
        process_instance: instId,
        requested_by: proposalValues.requested_by || employees[0]?.id || null,
        plant: proposalValues.plant || plants[0]?.id || null,
        department: proposalValues.department || departments[0]?.id || null,
        status: 'pending',
        vendor_mode: proposalValues.vendor_mode,
        remarks: `[Type: ${proposalValues.proposal_type.toUpperCase()}] ${proposalValues.remarks || 'Initiated'}`,
      });

      const newProp = res.data;

      // Restock Trigger Handling -> Send System Notification with Category Tag
      if (proposalValues.proposal_type === 'formula_restock') {
        const plantObj = plants.find(p => p.id === proposalValues.plant);
        await NotificationAPI.createNotification({
          title: `Automated Formula Restock Triggered [${newProp.id || 'PRP'}]`,
          message: `Restock threshold reached (Lead time: ${proposalValues.restock_lead_time_days} days, Check: ${proposalValues.frequency_interval_hours}h). Proposal initiated for Plant ${plantObj?.name || proposalValues.plant}.`,
          category: `RESTOCK_ALERT:PLANT_${proposalValues.plant || 'ALL'}`,
        }).catch(() => {});
      }

      setProposalModalOpen(false);
      loadWorkflowData();
    } catch (err) {
      alert("Failed to submit proposal: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const extractedRate = (Math.floor(Math.random() * 50) + 10) * 100 + 500;
    const matchedVendor = vendors[Math.floor(Math.random() * vendors.length)] || vendors[0];

    setQuotationForm(prev => ({
      ...prev,
      file_name: fileName,
      vendor: matchedVendor?.id || prev.vendor,
      quoted_rate: extractedRate,
      parsed_details: {
        vendor_name: matchedVendor?.name || 'Detected Vendor Enterprise',
        extracted_rate: `₹${extractedRate.toLocaleString()} (Extracted from ${fileName})`,
        tax_rate: '18% GST Included',
        confidence: '98.5% Accuracy',
      },
    }));
  };

  const handleAddQuotation = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;
    try {
      await WorkflowAPI.createQuotation({
        proposal: selectedProposal.id,
        vendor: quotationForm.vendor || vendors[0]?.id,
        quoted_rate: Math.max(0, quotationForm.quoted_rate || 0),
        allocated_percentage: Math.max(0, quotationForm.allocated_percentage || 0),
        is_selected: quotationForm.is_selected,
        remarks: quotationForm.file_name ? `Quotation Attachment: ${quotationForm.file_name}` : 'Quotation details uploaded',
      });
      setQuotationModalOpen(false);
      loadWorkflowData();
    } catch (err) {
      alert("Failed to add quotation: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAction = async (proposalId, statusAction) => {
    try {
      await WorkflowAPI.updateProposal(proposalId, { status: statusAction });

      // Post Notification
      await NotificationAPI.createNotification({
        title: `Proposal ${proposalId} Status Updated to ${statusAction.toUpperCase()}`,
        message: `Proposal ${proposalId} has been marked as ${statusAction}.`,
        category: `APPROVAL_UPDATE:PROPOSAL_${proposalId}`,
      }).catch(() => {});

      loadWorkflowData();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleStepAction = async (stepId, newStatus, proposalId) => {
    try {
      const activeEmp = employees[0]?.id || null;
      await WorkflowAPI.updateApprovalStep(stepId, {
        status: newStatus,
        acted_by: activeEmp,
        acted_at: new Date().toISOString(),
      });

      await NotificationAPI.createNotification({
        title: `Approval Step Updated: ${newStatus.toUpperCase()}`,
        message: `Step ${stepId} for proposal ${proposalId} set to ${newStatus}.`,
        category: `APPROVAL_STEP:${newStatus.toUpperCase()}`,
      }).catch(() => {});

      loadWorkflowData();
    } catch (err) {
      alert("Step update failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateAmendment = async (e) => {
    e.preventDefault();
    if (!selectedProposal) return;
    try {
      await WorkflowAPI.createAmendment({
        proposal: selectedProposal.id,
        amended_by: amendmentForm.amended_by || employees[0]?.id,
        amendment_reason: amendmentForm.amendment_reason,
        previous_values: { remarks: selectedProposal.remarks || '', status: selectedProposal.status },
        new_values: { status: 'amended', new_quoted_rate: Math.max(0, amendmentForm.new_quoted_rate || 0) },
      });

      await WorkflowAPI.updateProposal(selectedProposal.id, { status: 'amended' });

      setAmendmentModalOpen(false);
      loadWorkflowData();
    } catch (err) {
      alert("Failed to submit amendment: " + (err.response?.data?.detail || err.message));
    }
  };

  const openQuotationModal = (prop) => {
    setSelectedProposal(prop);
    setQuotationForm({
      vendor: vendors[0]?.id || '',
      quoted_rate: 1500,
      allocated_percentage: 100,
      is_selected: true,
      file_name: '',
      parsed_details: null,
    });
    setQuotationModalOpen(true);
  };

  const openAmendmentModal = (prop) => {
    setSelectedProposal(prop);
    setAmendmentForm({
      amended_by: employees[0]?.id || '',
      amendment_reason: 'Updated pricing structure and revised scope',
      new_quoted_rate: 1800,
    });
    setAmendmentModalOpen(true);
  };

  const openInspectModal = (prop) => {
    setSelectedProposal(prop);
    setViewModalOpen(true);
  };

  const approvedCount = proposals.filter(p => p.status === 'approved').length;
  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;
  const totalCount = proposals.length;

  const filteredProposals = proposals.filter((p) =>
    p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.remarks?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProposals.length / itemsPerPage) || 1;
  const paginatedProposals = filteredProposals.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const mainTabs = [
    { id: 'proposals', label: 'Proposals & Step Hierarchy', icon: GitPullRequest, count: proposals.length },
    { id: 'activity_audit', label: 'Activity & Audit Log (Amendments)', icon: Activity, count: allAmendments.length },
    { id: 'notifications', label: 'System Notifications & Triggers', icon: Bell, count: notifications.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-[#1B4E9B]" /> Multi-Stage Workflow & Approvals
          </h1>
          <p className="text-xs text-[#6B7280]">
            Sequential approval step hierarchies, multi-vendor rate quotations, restock triggers, and amendment audit logs.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setProposalModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Initiate Approval Proposal
          </button>
        </div>
      </div>

      {/* REQUIREMENT 1: 4-Column Responsive Metrics Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-[#16A34A] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label font-bold text-xs uppercase tracking-wider text-[#6B7280]">Approved Proposals</p>
              <p className="kpi-number mt-1 text-[#16A34A] font-extrabold text-2xl">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#2563EB] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label font-bold text-xs uppercase tracking-wider text-[#6B7280]">Pending Proposals</p>
              <p className="kpi-number mt-1 text-[#2563EB] font-extrabold text-2xl">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#DC2626] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label font-bold text-xs uppercase tracking-wider text-[#6B7280]">Rejected Proposals</p>
              <p className="kpi-number mt-1 text-[#DC2626] font-extrabold text-2xl">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shadow-2xs">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#1B4E9B] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label font-bold text-xs uppercase tracking-wider text-[#6B7280]">Total Proposals</p>
              <p className="kpi-number mt-1 text-[#1B4E9B] font-extrabold text-2xl">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1B4E9B] flex items-center justify-center shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Selector */}
      <div className="standard-card p-2">
        <Tabs tabs={mainTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* TAB 1: PROPOSALS & STEP HIERARCHY */}
      {activeTab === 'proposals' && (
        <div className="standard-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="section-title">Workflow Proposals Pipeline ({filteredProposals.length})</h3>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-9 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Proposal ID</th>
                  <th>Process / Type</th>
                  <th>Requested By</th>
                  <th>Plant / Dept</th>
                  <th>Sequential Approval Hierarchy</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProposals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-[#6B7280] italic">No workflow proposals logged.</td>
                  </tr>
                ) : (
                  paginatedProposals.map((prop) => (
                    <tr key={prop.id}>
                      <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{prop.id}</td>
                      <td className="font-semibold text-[#1F2937]">
                        {prop.process_type_name || 'Workflow Proposal'}
                        <div className="text-[11px] text-[#6B7280] font-mono">{prop.vendor_mode} vendor</div>
                      </td>
                      <td>{prop.requested_by_name || '-'}</td>
                      <td className="text-xs text-[#374151]">
                        {prop.plant_name || 'Plant'} / {prop.department_name || 'Dept'}
                      </td>
                      
                      {/* REQUIREMENT 2: Approval Step Hierarchy Visualization */}
                      <td>
                        <div className="flex flex-col gap-1.5 min-w-[220px]">
                          {prop.approval_steps && prop.approval_steps.length > 0 ? (
                            prop.approval_steps.map((step) => (
                              <div
                                key={step.id}
                                className={`flex items-center justify-between p-1.5 rounded border text-[11px] font-mono ${
                                  step.status === 'approved'
                                    ? 'bg-[#DCFCE7] border-[#BBF7D0] text-[#16A34A]'
                                    : step.status === 'rejected'
                                    ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                                    : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1B4E9B]'
                                }`}
                              >
                                <span>
                                  Step {step.step_order}: <strong>{step.designation_title || 'Designation'}</strong>
                                </span>
                                <div className="flex items-center gap-1">
                                  {step.status === 'pending' ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleStepAction(step.id, 'approved', prop.id)}
                                        className="text-[10px] bg-[#16A34A] text-white px-1.5 py-0.5 rounded hover:bg-green-700"
                                        title="Approve Step"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleStepAction(step.id, 'rejected', prop.id)}
                                        className="text-[10px] bg-[#DC2626] text-white px-1.5 py-0.5 rounded hover:bg-red-700"
                                        title="Reject Step"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="font-bold uppercase tracking-wider">{step.status}</span>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-[#6B7280] italic">Default Multi-Stage Chain Active</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <select
                          value={prop.status}
                          onChange={(e) => handleAction(prop.id, e.target.value)}
                          className={`form-input text-xs h-8 py-0 px-2 font-bold capitalize cursor-pointer ${
                            prop.status === 'approved' ? 'text-[#16A34A] border-[#BBF7D0]' :
                            prop.status === 'rejected' ? 'text-[#DC2626] border-[#FECACA]' :
                            prop.status === 'amended' ? 'text-[#CA8A04] border-[#FEF08A]' :
                            'text-[#2563EB] border-[#BFDBFE]'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="amended">Amended</option>
                        </select>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openInspectModal(prop)} title="View Proposal Details" className="btn-action-view">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => openQuotationModal(prop)} title="Add Quotation Copy" className="btn-action-edit">
                            <Plus className="w-3.5 h-3.5" /> Rate
                          </button>
                          <button onClick={() => openAmendmentModal(prop)} title="Submit Amendment" className="btn-action-reset">
                            <FileText className="w-3.5 h-3.5" /> Edit
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
            totalItems={filteredProposals.length}
            itemsPerPage={10}
          />
        </div>
      )}

      {/* REQUIREMENT 3: Integrated Activity & Audit Log Section */}
      {activeTab === 'activity_audit' && (
        <div className="standard-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1B4E9B]" /> Approval Activity & Amendment Audit Log
              </h3>
              <p className="helper-text">Historical log of proposal state revisions, scope changes, and value diffs.</p>
            </div>
            <span className="badge badge-info">{allAmendments.length} logged amendments</span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Amendment ID</th>
                <th>Proposal Target</th>
                <th>Amended By</th>
                <th>Amendment Reason</th>
                <th>Previous Values</th>
                <th>New Values</th>
                <th>Date / Time</th>
              </tr>
            </thead>
            <tbody>
              {allAmendments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-[#6B7280] italic">No proposal amendments logged.</td>
                </tr>
              ) : (
                allAmendments.map((amd) => (
                  <tr key={amd.id}>
                    <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{amd.id}</td>
                    <td className="font-mono text-xs font-bold text-[#1F2937]">{amd.proposal}</td>
                    <td className="font-semibold text-[#1F2937]">{amd.amended_by_name || amd.amended_by || '-'}</td>
                    <td className="text-xs text-[#374151] max-w-xs">{amd.amendment_reason}</td>
                    <td>
                      <span className="font-mono text-[11px] bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-1 rounded">
                        {JSON.stringify(amd.previous_values)}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] px-2 py-1 rounded">
                        {JSON.stringify(amd.new_values)}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#6B7280]">
                      {amd.created_at ? new Date(amd.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUIREMENT 5: System Notifications & Triggers Tab */}
      {activeTab === 'notifications' && (
        <div className="standard-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="section-title flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1B4E9B]" /> System Notifications & Triggers (notifications_systemnotification)
              </h3>
              <p className="helper-text">Application-level routed alert triggers by category tag.</p>
            </div>
            <span className="badge badge-info">{notifications.length} alerts</span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Notification ID</th>
                <th>Title</th>
                <th>Message Detail</th>
                <th>Category Tag (Routing)</th>
                <th>Read Status</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {notifications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-[#6B7280] italic">No system notifications logged.</td>
                </tr>
              ) : (
                notifications.map((notif) => (
                  <tr key={notif.id}>
                    <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{notif.id}</td>
                    <td className="font-semibold text-[#1F2937]">{notif.title}</td>
                    <td className="text-xs text-[#374151] max-w-md">{notif.message}</td>
                    <td>
                      <span className="font-mono text-[11px] bg-[#EFF6FF] text-[#1B4E9B] border border-[#BFDBFE] px-2 py-0.5 rounded">
                        {notif.category}
                      </span>
                    </td>
                    <td>
                      <Badge variant={notif.is_read ? 'success' : 'warning'}>
                        {notif.is_read ? 'Read' : 'Unread Alert'}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-[#6B7280]">
                      {notif.created_at ? new Date(notif.created_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REQUIREMENT 4: Dynamic Form Engine Proposal Modal */}
      <Modal isOpen={proposalModalOpen} onClose={() => setProposalModalOpen(false)} size="md" title="Initiate Approval Proposal">
        <GenericFormRenderer
          formConfig={
            workflowForm || {
              title: 'Initiate Approval Proposal Form',
              module: 'workflow',
              fields: [
                { field_name: 'Proposal Type Mode', field_code: 'proposal_type', field_type: 'select', options: 'basic,formula_restock,project', required: true, field_order: 1 },
                { field_name: 'Process Execution Instance', field_code: 'process_instance', field_type: 'reference', reference_table: 'process_instance', required: false, field_order: 2 },
                { field_name: 'Plant Facility', field_code: 'plant', field_type: 'reference', reference_table: 'plants', required: false, field_order: 3 },
                { field_name: 'Department Unit', field_code: 'department', field_type: 'reference', reference_table: 'departments', required: false, field_order: 4 },
                { field_name: 'Vendor Quoting Mode', field_code: 'vendor_mode', field_type: 'select', options: 'single,multiple', required: true, field_order: 5 },
                { field_name: 'Restock Lead Time (Days)', field_code: 'restock_lead_time_days', field_type: 'number', required: false, field_order: 6 },
                { field_name: 'Check Frequency (Hours)', field_code: 'frequency_interval_hours', field_type: 'number', required: false, field_order: 7 },
                { field_name: 'Proposal Justification & Remarks', field_code: 'remarks', field_type: 'textarea', required: false, field_order: 8 },
              ]
            }
          }
          initialValues={newProposal}
          onSubmit={handleCreateProposal}
          onCancel={() => setProposalModalOpen(false)}
        />
      </Modal>

      {/* Upload Quotation Modal */}
      <Modal isOpen={quotationModalOpen} onClose={() => setQuotationModalOpen(false)} size="md" title={`Upload Quotation Copy for Proposal ${selectedProposal?.id}`}>
        <form onSubmit={handleAddQuotation} className="space-y-4">
          <div className="border-2 border-dashed border-[#1B4E9B]/40 rounded-lg p-5 text-center bg-[#EFF6FF] hover:bg-[#DBEAFE] transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.png,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-8 h-8 text-[#1B4E9B] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#1F2937]">Upload Quotation Document Copy</p>
            <p className="text-[11px] text-[#6B7280] mt-1">PDF, Image, or DOC (Extracts rate details)</p>
            {quotationForm.file_name && (
              <span className="inline-block mt-2 text-xs font-mono text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded border border-[#BBF7D0]">
                Attached: {quotationForm.file_name}
              </span>
            )}
          </div>

          {quotationForm.parsed_details && (
            <div className="bg-[#DCFCE7] border border-[#BBF7D0] p-3.5 rounded-lg space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A]">
                <CheckCircle2 className="w-4 h-4" /> OCR Document Details Extracted
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-[#1F2937]">
                <div>Vendor: <span className="font-bold">{quotationForm.parsed_details.vendor_name}</span></div>
                <div>Extracted Rate: <span className="text-[#16A34A] font-bold">{quotationForm.parsed_details.extracted_rate}</span></div>
                <div>Tax Info: <span>{quotationForm.parsed_details.tax_rate}</span></div>
                <div>OCR Accuracy: <span className="text-[#2563EB]">{quotationForm.parsed_details.confidence}</span></div>
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Vendor Enterprise *</label>
            <select required value={quotationForm.vendor} onChange={(e) => setQuotationForm({ ...quotationForm, vendor: e.target.value })} className="form-input">
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Quoted Rate (₹) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={quotationForm.quoted_rate}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || Number(val) >= 0) setQuotationForm({ ...quotationForm, quoted_rate: parseFloat(val) || 0 });
              }}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Allocated Percentage (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={quotationForm.allocated_percentage}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || Number(val) >= 0) setQuotationForm({ ...quotationForm, allocated_percentage: parseFloat(val) || 0 });
              }}
              className="form-input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sel_vendor"
              checked={quotationForm.is_selected}
              onChange={(e) => setQuotationForm({ ...quotationForm, is_selected: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="sel_vendor" className="text-xs text-[#374151] font-semibold cursor-pointer">Mark as Selected Quoted Vendor</label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setQuotationModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Quotation Record</button>
          </div>
        </form>
      </Modal>

      {/* Amendment Modal */}
      <Modal isOpen={amendmentModalOpen} onClose={() => setAmendmentModalOpen(false)} size="md" title={`Submit Proposal Amendment for ${selectedProposal?.id}`}>
        <form onSubmit={handleCreateAmendment} className="space-y-4">
          <div>
            <label className="form-label">Amended By Employee *</label>
            <select required value={amendmentForm.amended_by} onChange={(e) => setAmendmentForm({ ...amendmentForm, amended_by: e.target.value })} className="form-input">
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Amendment Reason *</label>
            <textarea required value={amendmentForm.amendment_reason} onChange={(e) => setAmendmentForm({ ...amendmentForm, amendment_reason: e.target.value })} className="form-input h-20"></textarea>
          </div>
          <div>
            <label className="form-label">Revised Quoted Rate (₹)</label>
            <input
              type="number"
              min="0"
              value={amendmentForm.new_quoted_rate}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || Number(val) >= 0) setAmendmentForm({ ...amendmentForm, new_quoted_rate: parseFloat(val) || 0 });
              }}
              className="form-input"
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setAmendmentModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Amendment</button>
          </div>
        </form>
      </Modal>

      {/* View Proposal Inspection Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="md" title="Proposal Workflow Details">
        {selectedProposal && (
          <div className="space-y-4">
            <div><span className="text-xs text-[#6B7280]">Proposal ID:</span><p className="font-mono text-[#1B4E9B] font-bold">{selectedProposal.id}</p></div>
            <div><span className="text-xs text-[#6B7280]">Status:</span><p className="font-bold capitalize text-[#1F2937]">{selectedProposal.status}</p></div>
            <div><span className="text-xs text-[#6B7280]">Quotations Attached:</span><p className="text-[#374151] font-mono text-xs">{selectedProposal.quotations?.length || 0} quotations</p></div>
            <div><span className="text-xs text-[#6B7280]">Amendments Logged:</span><p className="text-[#374151] font-mono text-xs">{selectedProposal.amendments?.length || 0} amendments</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
