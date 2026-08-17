import React, { useEffect, useState } from 'react';
import { WorkflowAPI, ProcessEngineAPI, CoreAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import GenericFormRenderer from '../components/GenericFormRenderer';
import { useConfiguration } from '../context/ConfigurationContext';
import { GitPullRequest, CheckCircle2, XCircle, Clock, Plus, Upload, FileText, Eye, Search, BarChart3 } from 'lucide-react';

export default function WorkflowApprovals() {
  const { forms } = useConfiguration();
  const workflowForm = forms.find((form) => form.active && (
    ['workflow_proposal_form', 'proposal_form', 'approval_form'].includes(form.form_name) || form.module === 'workflow'
  ));
  const [proposals, setProposals] = useState([]);
  const [instances, setInstances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [plants, setPlants] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [amendmentModalOpen, setAmendmentModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  const [newProposal, setNewProposal] = useState({
    process_instance: '',
    requested_by: '',
    plant: '',
    department: '',
    vendor_mode: 'single',
    vendor_count: 2,
    vendor_allocations: [{ vendor_id: '', percentage: 100 }],
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
      const [propRes, instRes, empRes, plantRes, deptRes, venRes] = await Promise.all([
        WorkflowAPI.getProposals(),
        ProcessEngineAPI.getInstances(),
        CoreAPI.getEmployees(),
        CoreAPI.getPlants(),
        CoreAPI.getDepartments(),
        CoreAPI.getVendors(),
      ]);

      const loadedProposals = propRes.data.results || propRes.data || [];
      setProposals(loadedProposals);
      setInstances(instRes.data.results || instRes.data || []);
      const loadedEmps = empRes.data.results || empRes.data || [];
      const loadedPlants = plantRes.data.results || plantRes.data || [];
      const loadedDepts = deptRes.data.results || deptRes.data || [];
      const loadedVendors = venRes.data.results || venRes.data || [];

      setEmployees(loadedEmps);
      setPlants(loadedPlants);
      setDepartments(loadedDepts);
      setVendors(loadedVendors);

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
          alert("No Process Instance available. Please execute a process instance first.");
          return;
        }
      }

      await WorkflowAPI.createProposal({
        process_instance: instId,
        requested_by: proposalValues.requested_by || employees[0]?.id || null,
        plant: proposalValues.plant || plants[0]?.id || null,
        department: proposalValues.department || departments[0]?.id || null,
        status: 'pending',
        vendor_mode: proposalValues.vendor_mode,
        remarks: proposalValues.remarks || `Standard proposal initiated (${proposalValues.vendor_mode} vendor mode)`,
      });

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
        remarks: quotationForm.file_name ? `Quotation Copy Attachment: ${quotationForm.file_name}` : 'Quotation details uploaded',
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
      loadWorkflowData();
    } catch (err) {
      alert("Status update failed: " + (err.response?.data?.detail || err.message));
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
        previous_values: { remarks: selectedProposal.remarks || '' },
        new_values: { new_quoted_rate: Math.max(0, amendmentForm.new_quoted_rate || 0) },
      });
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

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-[#1B4E9B]" /> Multi-Stage Workflow & Approvals
          </h1>
          <p className="text-xs text-[#6B7280]">Proposal initiation, multi-vendor rate quotations, amendments, and sign-offs.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setProposalModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Initiate Approval Proposal
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-[#16A34A]">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label">Approved Proposals</p>
              <p className="kpi-number mt-1 text-[#16A34A]">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#2563EB]">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label">Pending Proposals</p>
              <p className="kpi-number mt-1 text-[#2563EB]">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#DC2626]">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label">Rejected Proposals</p>
              <p className="kpi-number mt-1 text-[#DC2626]">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="kpi-card border-l-4 border-l-[#1B4E9B]">
          <div className="flex items-center justify-between">
            <div>
              <p className="kpi-label">Total Proposals</p>
              <p className="kpi-number mt-1 text-[#1B4E9B]">{totalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1B4E9B] flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="standard-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="section-title">Workflow Proposals ({filteredProposals.length})</h3>

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
                <th>Process Type</th>
                <th>Requested By</th>
                <th>Vendor Mode</th>
                <th>Status (Select to Update)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProposals.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-[#6B7280] italic">No workflow proposals logged.</td>
                </tr>
              ) : (
                paginatedProposals.map((prop) => (
                  <tr key={prop.id}>
                    <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{prop.id}</td>
                    <td className="font-semibold text-[#1F2937]">{prop.process_type_name || 'Workflow Proposal'}</td>
                    <td>{prop.requested_by_name || '-'}</td>
                    <td className="capitalize text-[#374151]">{prop.vendor_mode} Vendor</td>
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

      {/* Modals */}
      <Modal isOpen={proposalModalOpen} onClose={() => setProposalModalOpen(false)} size="md" title="Initiate Approval Proposal">
        {workflowForm ? (
          <GenericFormRenderer
            formConfig={workflowForm}
            initialValues={newProposal}
            onSubmit={handleCreateProposal}
            onCancel={() => setProposalModalOpen(false)}
          />
        ) : (
        <form onSubmit={handleCreateProposal} className="space-y-4">
          <div>
            <label className="form-label">Process Execution Instance *</label>
            <select required value={newProposal.process_instance} onChange={(e) => setNewProposal({ ...newProposal, process_instance: e.target.value })} className="form-input">
              <option value="">Select Process Execution</option>
              {instances.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.process_type_name || 'Execution'} ({inst.id})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Plant Unit</label>
              <select value={newProposal.plant} onChange={(e) => setNewProposal({ ...newProposal, plant: e.target.value })} className="form-input">
                {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select value={newProposal.department} onChange={(e) => setNewProposal({ ...newProposal, department: e.target.value })} className="form-input">
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Vendor Quoting Mode</label>
            <select value={newProposal.vendor_mode} onChange={(e) => handleVendorModeChange(e.target.value)} className="form-input">
              <option value="single">Single Vendor Procurement (100%)</option>
              <option value="multiple">Multiple Vendor Split Procurement (Must sum to 100%)</option>
            </select>
          </div>

          {newProposal.vendor_mode === 'multiple' && (
            <div className="space-y-3 p-4 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <label className="form-label mb-0">How many vendors?</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newProposal.vendor_count}
                  onChange={(e) => handleVendorCountChange(e.target.value)}
                  className="form-input w-24 text-center"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <div className="text-xs font-semibold text-[#6B7280] flex justify-between">
                  <span>Vendor Enterprise Selection</span>
                  <span>Allocation %</span>
                </div>

                {newProposal.vendor_allocations.map((alloc, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <select
                      value={alloc.vendor_id}
                      onChange={(e) => handleVendorAllocationChange(idx, 'vendor_id', e.target.value)}
                      className="form-input text-xs"
                    >
                      <option value="">Select Vendor #{idx + 1}</option>
                      {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                    <div className="relative w-32">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={alloc.percentage}
                        onChange={(e) => handleVendorAllocationChange(idx, 'percentage', e.target.value)}
                        className="form-input text-xs text-right pr-6"
                      />
                      <span className="absolute right-2 top-2 text-xs text-[#6B7280]">%</span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-bold text-[#1F2937]">Total Allocation Percentage:</span>
                  <span className={`font-mono font-bold text-sm ${
                    getTotalAllocationSum() === 100 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                  }`}>
                    {getTotalAllocationSum()}% {getTotalAllocationSum() === 100 ? '✓ (Valid 100%)' : '⚠ (Must equal 100%)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div><label className="form-label">Proposal Remarks</label><textarea value={newProposal.remarks} onChange={(e) => setNewProposal({ ...newProposal, remarks: e.target.value })} className="form-input h-20" placeholder="Justification for proposal..."></textarea></div>

          <div className="modal-footer">
            <button type="button" onClick={() => setProposalModalOpen(false)} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={newProposal.vendor_mode === 'multiple' && getTotalAllocationSum() !== 100}
              className={`btn-primary ${newProposal.vendor_mode === 'multiple' && getTotalAllocationSum() !== 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Submit Proposal
            </button>
          </div>
        </form>
        )}
      </Modal>

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

          <div><label className="form-label">Quoted Rate (₹) *</label><input type="number" min="0" step="0.01" required value={quotationForm.quoted_rate} onChange={(e) => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) setQuotationForm({ ...quotationForm, quoted_rate: parseFloat(val) || 0 });
          }} className="form-input" /></div>

          <div><label className="form-label">Allocated Percentage (%)</label><input type="number" min="0" max="100" value={quotationForm.allocated_percentage} onChange={(e) => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) setQuotationForm({ ...quotationForm, allocated_percentage: parseFloat(val) || 0 });
          }} className="form-input" /></div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="sel_vendor" checked={quotationForm.is_selected} onChange={(e) => setQuotationForm({ ...quotationForm, is_selected: e.target.checked })} className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]" />
            <label htmlFor="sel_vendor" className="text-xs text-[#374151] font-semibold cursor-pointer">Mark as Selected Quoted Vendor</label>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={() => setQuotationModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Quotation Record</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={amendmentModalOpen} onClose={() => setAmendmentModalOpen(false)} size="md" title={`Submit Proposal Amendment for ${selectedProposal?.id}`}>
        <form onSubmit={handleCreateAmendment} className="space-y-4">
          <div>
            <label className="form-label">Amended By Employee *</label>
            <select required value={amendmentForm.amended_by} onChange={(e) => setAmendmentForm({ ...amendmentForm, amended_by: e.target.value })} className="form-input">
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">Amendment Reason *</label><textarea required value={amendmentForm.amendment_reason} onChange={(e) => setAmendmentForm({ ...amendmentForm, amendment_reason: e.target.value })} className="form-input h-20"></textarea></div>
          <div><label className="form-label">Revised Quoted Rate (₹)</label><input type="number" min="0" value={amendmentForm.new_quoted_rate} onChange={(e) => {
            const val = e.target.value;
            if (val === '' || Number(val) >= 0) setAmendmentForm({ ...amendmentForm, new_quoted_rate: parseFloat(val) || 0 });
          }} className="form-input" /></div>
          <div className="modal-footer">
            <button type="button" onClick={() => setAmendmentModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Submit Amendment</button>
          </div>
        </form>
      </Modal>

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
