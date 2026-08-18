import React, { useState, useEffect } from 'react';
import { ProcessEngineAPI, CoreAPI } from '../api';
import Modal from '../components/Modal';
import { Cpu, Plus, SlidersHorizontal, CheckCircle2, RefreshCw } from 'lucide-react';
import Button from '../components/ui/Button';

export default function ProcessTypeConfig() {
  const [processTypes, setProcessTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(true);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [newType, setNewType] = useState({ code: '', name: '', category: 'qc', owning_department_id: '', requires_approval: false });
  const [newAttr, setNewAttr] = useState({ attribute_code: '', attribute_name: '', data_type: 'text', reference_table: '', is_required: false });

  const loadData = async () => {
    setLoading(true);
    try {
      const [ptRes, deptRes] = await Promise.all([
        ProcessEngineAPI.getProcessTypes().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
      ]);
      const types = ptRes.data?.results || ptRes.data || [];
      const depts = deptRes.data?.results || deptRes.data || [];
      setProcessTypes(types);
      setDepartments(depts);
      if (depts.length > 0 && !newType.owning_department_id) {
        setNewType((prev) => ({ ...prev, owning_department_id: depts[0].id }));
      }
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]);
      } else if (selectedType) {
        const updated = types.find(t => t.id === selectedType.id);
        if (updated) setSelectedType(updated);
      }
    } catch (err) {
      console.error("Error loading process types:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await ProcessEngineAPI.createProcessType({
        ...newType,
        owning_department: newType.owning_department_id || (departments[0] ? departments[0].id : null),
      });
      window.dispatchEvent(new Event('erp_ui_metadata_updated'));
      setNotification(`Process type '${newType.name}' created successfully.`);
      setTypeModalOpen(false);
      setNewType({ code: '', name: '', category: 'qc', owning_department_id: departments[0]?.id || '', requires_approval: false });
      loadData();
      setTimeout(() => setNotification(''), 3000);
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
      window.dispatchEvent(new Event('erp_ui_metadata_updated'));
      setNotification(`Attribute definition '${newAttr.attribute_name}' added.`);
      setAttrModalOpen(false);
      setNewAttr({ attribute_code: '', attribute_name: '', data_type: 'text', reference_table: '', is_required: false });
      loadData();
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      alert("Failed to add attribute: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <Cpu className="w-5 h-5" />
            </span>
            <h1 className="page-title">Process Type & Attribute Schema Configuration</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            Configure dynamic process types, categories, owning departments, approval requirements, and EAV attribute definitions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={loadData}>Refresh</Button>
          <Button variant="secondary" icon={Plus} onClick={() => setTypeModalOpen(true)}>Add Process Type</Button>
          {selectedType && (
            <Button variant="primary" icon={Plus} onClick={() => setAttrModalOpen(true)}>Add Attribute Def</Button>
          )}
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Select active process type */}
      <div className="standard-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1B4E9B] uppercase tracking-wider">Select Process Type:</span>
            <select
              value={selectedType?.id || ''}
              onChange={(e) => setSelectedType(processTypes.find(t => t.id === e.target.value))}
              className="form-input w-72 text-xs font-bold"
            >
              {processTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>
          {selectedType && (
            <div className="flex items-center gap-2 text-xs">
              <span className="badge badge-info">Category: {selectedType.category?.toUpperCase()}</span>
              {selectedType.owning_department_name && (
                <span className="badge badge-neutral">Dept: {selectedType.owning_department_name}</span>
              )}
              <span className={`badge ${selectedType.requires_approval ? 'badge-warning' : 'badge-success'}`}>
                {selectedType.requires_approval ? 'Approval Required' : 'Auto Sign-Off'}
              </span>
            </div>
          )}
        </div>

        {selectedType ? (
          <div className="space-y-4">
            <h3 className="section-title text-sm font-bold flex items-center gap-2 text-[#1F2937]">
              <SlidersHorizontal className="w-4 h-4 text-[#1B4E9B]" />
              Attribute Definitions for {selectedType.name}
            </h3>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Attribute Code</th>
                    <th>Attribute Name</th>
                    <th>Data Type</th>
                    <th>Reference Table</th>
                    <th>Required?</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedType.attribute_definitions || []).length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-[#6B7280] italic">
                        No attribute definitions configured for this process type yet.
                      </td>
                    </tr>
                  ) : (
                    (selectedType.attribute_definitions || []).map((attr) => (
                      <tr key={attr.id || attr.attribute_code}>
                        <td className="font-mono text-xs text-[#1B4E9B] font-bold">{attr.attribute_code}</td>
                        <td className="font-semibold text-[#1F2937]">{attr.attribute_name}</td>
                        <td><span className="badge badge-neutral uppercase">{attr.data_type}</span></td>
                        <td className="font-mono text-xs text-[#6B7280]">{attr.reference_table || '-'}</td>
                        <td>
                          <span className={`badge ${attr.is_required ? 'badge-warning' : 'badge-neutral'}`}>
                            {attr.is_required ? 'Mandatory' : 'Optional'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-[#6B7280] italic">Select or create a process type above.</div>
        )}
      </div>

      {/* Modal 1: Create Process Type */}
      <Modal isOpen={typeModalOpen} onClose={() => setTypeModalOpen(false)} size="md" title="Create Process Engine Type">
        <form onSubmit={handleCreateType} className="space-y-4">
          <div>
            <label className="form-label">Type Code *</label>
            <input
              type="text"
              required
              value={newType.code}
              onChange={(e) => setNewType({ ...newType, code: e.target.value })}
              className="form-input"
              placeholder="e.g. qc_incoming_load"
            />
          </div>
          <div>
            <label className="form-label">Type Name *</label>
            <input
              type="text"
              required
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Quality Control Inspection"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="form-label">Owning Department *</label>
              <select
                value={newType.owning_department_id}
                onChange={(e) => setNewType({ ...newType, owning_department_id: e.target.value })}
                className="form-input"
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.id})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="reqApproval"
              checked={newType.requires_approval}
              onChange={(e) => setNewType({ ...newType, requires_approval: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="reqApproval" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Requires Formal Workflow Approval / Sign-Off
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setTypeModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Type</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Attribute Definition */}
      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} size="md" title={`Add Attribute Definition for ${selectedType?.name}`}>
        <form onSubmit={handleAddAttribute} className="space-y-4">
          <div>
            <label className="form-label">Attribute Code *</label>
            <input
              type="text"
              required
              value={newAttr.attribute_code}
              onChange={(e) => setNewAttr({ ...newAttr, attribute_code: e.target.value })}
              className="form-input"
              placeholder="e.g. moisture_level"
            />
          </div>
          <div>
            <label className="form-label">Attribute Name *</label>
            <input
              type="text"
              required
              value={newAttr.attribute_name}
              onChange={(e) => setNewAttr({ ...newAttr, attribute_name: e.target.value })}
              className="form-input"
              placeholder="e.g. Moisture Level (%)"
            />
          </div>
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
              <select value={newAttr.reference_table || 'plants'} onChange={(e) => setNewAttr({ ...newAttr, reference_table: e.target.value })} className="form-input">
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
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isReqCheck"
              checked={newAttr.is_required}
              onChange={(e) => setNewAttr({ ...newAttr, is_required: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="isReqCheck" className="text-xs text-[#374151] cursor-pointer font-semibold">
              Mark Attribute as Mandatory
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setAttrModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Add Attribute</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
