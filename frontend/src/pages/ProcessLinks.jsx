import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GitCommit, Plus, Edit3, Trash2, ArrowDown, Workflow, CheckCircle2, RefreshCw, ZoomIn, ZoomOut, Maximize2, RotateCcw, FileText, Activity } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import IconButton from '../components/ui/IconButton';
import SearchInput from '../components/ui/SearchInput';
import EmptyState from '../components/ui/EmptyState';

export default function ProcessLinks() {
  const [activeTab, setActiveTab] = useState('flow_visualizer'); // 'flow_visualizer' | 'link_management'
  const [links, setLinks] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    from_process_instance: '',
    to_process_instance: '',
    link_type: 'fulfills',
    remarks: '',
  });

  const [notification, setNotification] = useState('');

  const linkTypes = [
    { code: 'consumes', label: 'Consumes' },
    { code: 'pays_for', label: 'Pays For' },
    { code: 'fulfills', label: 'Fulfills' },
    { code: 'amends', label: 'Amends' },
    { code: 'splits_into', label: 'Splits Into' },
    { code: 'generates_pay', label: 'Generates Pay' },
    { code: 'verifies', label: 'Verifies' },
    { code: 'settles', label: 'Settles' },
  ];

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('http://127.0.0.1:8000/api/process-links/'),
      axios.get('http://127.0.0.1:8000/api/process/instances/')
    ])
      .then(([linkRes, instRes]) => {
        setLinks(linkRes.data?.results || linkRes.data || []);
        setInstances(instRes.data?.results || instRes.data || []);
      })
      .catch(err => console.error("Error fetching process links:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      from_process_instance: instances[0]?.id || '',
      to_process_instance: instances[1]?.id || '',
      link_type: 'fulfills',
      remarks: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      from_process_instance: item.from_process_instance,
      to_process_instance: item.to_process_instance,
      link_type: item.link_type,
      remarks: item.remarks || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to remove this process link?")) {
      axios.delete(`http://127.0.0.1:8000/api/process-links/${id}/`)
        .then(() => {
          setNotification("Process link removed.");
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      axios.patch(`http://127.0.0.1:8000/api/process-links/${editingId}/`, formData)
        .then(() => {
          setNotification("Process link updated.");
          setIsModalOpen(false);
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Update failed: " + err.message));
    } else {
      axios.post('http://127.0.0.1:8000/api/process-links/', formData)
        .then(() => {
          setNotification("New process link created.");
          setIsModalOpen(false);
          fetchData();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Creation failed: " + err.message));
    }
  };

  const filteredLinks = links.filter(l =>
    (l.from_process_name && l.from_process_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.to_process_name && l.to_process_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.link_type && l.link_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.remarks && l.remarks.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const mainTabs = [
    { id: 'flow_visualizer', label: 'Flow Visualizer', icon: Workflow },
    { id: 'link_management', label: 'Link Management', icon: GitCommit, count: links.length },
  ];

  // Visual flow step definitions matching reference image
  const flowSteps = [
    { step: 1, stage: 'Initiation', title: 'Purchase Request', desc: 'Procurement Initiation', status: 'Active', icon: FileText, rel: 'fulfills' },
    { step: 2, stage: 'Procurement', title: 'Purchase Order', desc: 'Vendor Binding', status: 'Active', icon: Workflow, rel: 'consumes' },
    { step: 3, stage: 'Receipt', title: 'GRN (Receipt)', desc: 'Inventory Verification', status: 'Active', icon: Activity, rel: 'pays_for' },
    { step: 4, stage: 'Invoicing', title: 'Vendor Invoice', desc: 'Accounts Payable', status: 'Active', icon: FileText, rel: 'settles' },
    { step: 5, stage: 'Payment', title: 'Payment', desc: 'Payment Settlement', status: 'Active', icon: CheckCircle2, rel: null },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header (Section 6 & 25 Specs) */}
      <PageHeader
        title="Process Links & Flow Visualizer"
        description="Configure and visualize parent-child process relationships and workflow flow."
        breadcrumbItems={[
          { label: 'Admin Console', path: '/admin-console' },
          { label: 'Process Links', path: '/process-links' }
        ]}
        actions={
          <>
            <Button variant="secondary" icon={RefreshCw} onClick={fetchData}>
              Refresh
            </Button>
            <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
              Add Process Link
            </Button>
          </>
        }
      />

      {/* Tabs Switcher */}
      <div className="standard-card p-2">
        <Tabs tabs={mainTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {activeTab === 'flow_visualizer' ? (
        <>
          {/* Main Visualizer Grid (Matching Reference Image) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Process Flow Overview & Legend (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Process Flow Overview Card */}
              <div className="standard-card space-y-4">
                <div>
                  <h3 className="card-title text-sm">Process Flow Overview</h3>
                  <p className="helper-text mt-0.5">Visual representation of your process chain</p>
                </div>

                <div className="stat-card-grid">
                  <div className="stat-card-item">
                    <div className="stat-card-badge" style={{ backgroundColor: '#1B4E9B' }}>
                      8
                    </div>
                    <div className="stat-card-label">Total Processes</div>
                  </div>

                  <div className="stat-card-item">
                    <div className="stat-card-badge" style={{ backgroundColor: '#16A34A' }}>
                      7
                    </div>
                    <div className="stat-card-label">Total Links</div>
                  </div>

                  <div className="stat-card-item">
                    <div className="stat-card-badge" style={{ backgroundColor: '#2563EB' }}>
                      4
                    </div>
                    <div className="stat-card-label">Active Processes</div>
                  </div>

                  <div className="stat-card-item">
                    <div className="stat-card-badge" style={{ backgroundColor: '#EAB308' }}>
                      0
                    </div>
                    <div className="stat-card-label">Inactive Processes</div>
                  </div>
                </div>
              </div>

              {/* Legend Card */}
              <div className="standard-card space-y-3">
                <h3 className="card-title text-sm">Legend</h3>
                <div className="legend-item-list">
                  <div className="legend-item-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#1B4E9B' }}></div>
                      <span style={{ fontWeight: 700, color: '#1F2937' }}>Process</span>
                    </div>
                    <span className="helper-text">Individual process</span>
                  </div>

                  <div className="legend-item-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#1B4E9B' }}>&rarr; Link</span>
                    </div>
                    <span className="helper-text">Process relationship</span>
                  </div>

                  <div className="legend-item-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16A34A' }} />
                      <span style={{ fontWeight: 700, color: '#1F2937' }}>Active</span>
                    </div>
                    <span className="helper-text">Process is active</span>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive Process Flow Chain (8 Cols) */}
            <div className="lg:col-span-8 standard-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                <div>
                  <h3 className="card-title text-sm">Interactive Process Flow Chain</h3>
                  <p className="helper-text mt-0.5">Click on any process to view details or manage links</p>
                </div>

                <div className="flex items-center gap-1">
                  <button type="button" className="btn-icon" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
                  <button type="button" className="btn-icon" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
                  <button type="button" className="btn-icon" title="Maximize"><Maximize2 className="w-4 h-4" /></button>
                  <button type="button" className="btn-icon" title="Reset View"><RotateCcw className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Vertical Connected Process Chain Canvas */}
              <div className="process-flow-canvas">
                {flowSteps.map((stepItem) => {
                  const Icon = stepItem.icon;
                  return (
                    <React.Fragment key={stepItem.step}>
                      <div className="flow-step-row">
                        {/* Step Stage Badge */}
                        <div className="flow-step-stage">
                          <p className="flow-step-number">Step {stepItem.step}</p>
                          <p className="flow-step-label">{stepItem.stage}</p>
                        </div>

                        {/* Connected Card */}
                        <div className="flow-step-card">
                          <div className="flow-step-left">
                            <div className="flow-step-icon-bg">
                              <Icon />
                            </div>
                            <div>
                              <h4 className="flow-step-title">{stepItem.title}</h4>
                              <p className="flow-step-desc">{stepItem.desc}</p>
                            </div>
                          </div>
                          <Badge variant="success">Active</Badge>
                        </div>
                      </div>

                      {/* Relationship Connector */}
                      {stepItem.rel && (
                        <div className="flow-connector-row">
                          <div className="flow-connector-spacer"></div>
                          <div className="flow-connector-body">
                            <span className="flow-connector-badge">
                              {stepItem.rel}
                            </span>
                            <ArrowDown className="flow-connector-arrow" />
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION: Process Links Summary Table (Section 25 Specs) */}
          <div className="standard-card space-y-4 p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
              <h3 className="card-title text-sm">Process Links Summary</h3>
              <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Filter summary table..." className="max-w-xs" />
            </div>

            <Table headers={['#', 'From Process', 'Link Type', 'To Process', 'Description', 'Status', { label: 'Actions', align: 'right' }]}>
              {filteredLinks.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <EmptyState
                      title="No process links found"
                      message="Create a process link to define the relationship between processes."
                      icon={GitCommit}
                    />
                  </td>
                </tr>
              ) : (
                filteredLinks.map((lnk, idx) => (
                  <tr key={lnk.id}>
                    <td className="font-mono text-xs text-[#6B7280]">{idx + 1}</td>
                    <td>
                      <div className="font-bold text-[#1F2937]">{lnk.from_process_name || 'Purchase Request'}</div>
                      <div className="text-[11px] text-[#6B7280]">Procurement Initiation</div>
                    </td>
                    <td>
                      <span className="badge badge-info font-mono text-[10px] uppercase">{lnk.link_type}</span>
                    </td>
                    <td>
                      <div className="font-bold text-[#1F2937]">{lnk.to_process_name || 'Purchase Order'}</div>
                      <div className="text-[11px] text-[#6B7280]">Vendor Binding</div>
                    </td>
                    <td className="text-xs text-[#6B7280]">{lnk.remarks || 'PR fulfills PO creation'}</td>
                    <td><Badge variant="success">Active</Badge></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(lnk)} title="Edit Link" />
                        <IconButton variant="delete" icon={Trash2} onClick={() => handleDelete(lnk.id)} title="Delete Link" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          </div>
        </>
      ) : (
        /* LINK MANAGEMENT TAB VIEW */
        <div className="standard-card space-y-4 p-0 overflow-hidden">
          <div className="p-4 border-b border-[#E5E7EB] flex flex-wrap items-center justify-between gap-4">
            <h3 className="card-title text-sm">Process Links Configuration Directory</h3>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search links directory..." className="max-w-xs" />
          </div>

          <Table headers={['Link ID', 'From Process Instance', 'Link Type', 'To Process Instance', 'Remarks', { label: 'Actions', align: 'right' }]}>
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState title="No process links found" message="Create a process link to define relationships between processes." />
                </td>
              </tr>
            ) : (
              filteredLinks.map((lnk) => (
                <tr key={lnk.id}>
                  <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{lnk.id}</td>
                  <td>
                    <div className="font-bold text-[#1F2937]">{lnk.from_process_name || 'From Instance'}</div>
                    <div className="text-[11px] font-mono text-[#6B7280]">{lnk.from_process_instance}</div>
                  </td>
                  <td><span className="badge badge-info uppercase">{lnk.link_type}</span></td>
                  <td>
                    <div className="font-bold text-[#1F2937]">{lnk.to_process_name || 'To Instance'}</div>
                    <div className="text-[11px] font-mono text-[#6B7280]">{lnk.to_process_instance}</div>
                  </td>
                  <td className="text-xs text-[#6B7280]">{lnk.remarks || 'No remarks'}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconButton variant="edit" icon={Edit3} onClick={() => handleOpenEdit(lnk)} title="Edit Link" />
                      <IconButton variant="delete" icon={Trash2} onClick={() => handleDelete(lnk.id)} title="Delete Link" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title={editingId ? "Edit Process Link" : "Create Process Link"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">From Process Instance *</label>
            <select
              value={formData.from_process_instance}
              onChange={(e) => setFormData({ ...formData, from_process_instance: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select Origin Instance</option>
              {instances.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.id} - {inst.process_type_name} ({inst.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Relationship / Link Type *</label>
            <select
              value={formData.link_type}
              onChange={(e) => setFormData({ ...formData, link_type: e.target.value })}
              className="form-input"
              required
            >
              {linkTypes.map(lt => (
                <option key={lt.code} value={lt.code}>{lt.label} ({lt.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">To Process Instance *</label>
            <select
              value={formData.to_process_instance}
              onChange={(e) => setFormData({ ...formData, to_process_instance: e.target.value })}
              className="form-input"
              required
            >
              <option value="">Select Destination Instance</option>
              {instances.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.id} - {inst.process_type_name} ({inst.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Remarks / Description</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Context for this process connection..."
            ></textarea>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? "Update Link" : "Save Link"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
