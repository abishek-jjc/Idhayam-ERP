import React, { useEffect, useState } from 'react';
import { JournalAPI, CoreAPI, MastersAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import SearchInput from '../components/ui/SearchInput';
import GenericFormRenderer from '../components/GenericFormRenderer';
import { useConfiguration } from '../context/ConfigurationContext';
import { BookOpenCheck, Boxes, Plus, Trash2, Eye, ArrowRight } from 'lucide-react';

export default function JournalStock() {
  const { forms } = useConfiguration();
  const journalForm = forms.find((form) => form.active && (
    ['journal_entry_form', 'journal_form', 'stock_ledger_form'].includes(form.form_name) || form.module === 'journal'
  ));
  const [activeTab, setActiveTab] = useState('journal');
  const [entries, setEntries] = useState([]);
  const [stocks, setStocks] = useState([]);

  const [departments, setDepartments] = useState([]);
  const [masterItems, setMasterItems] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);

  const [formData, setFormData] = useState({
    movement_type: 'external_in',
    material_id: '',
    from_department: '',
    to_department: '',
    quantity: 1000,
    unit: 'KG',
    remarks: '',
  });

  useEffect(() => {
    loadLedgerData();
    const interval = setInterval(loadLedgerData, 10000); // 10s auto poll
    const handleJournalEvent = () => loadLedgerData();
    window.addEventListener('erp_journal_updated', handleJournalEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('erp_journal_updated', handleJournalEvent);
    };
  }, []);

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSelectedIds([]);
  }, [activeTab]);

  const handleBulkDeleteJournal = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected record(s)?`)) return;
    try {
      for (const id of selectedIds) {
        if (activeTab === 'journal') await JournalAPI.deleteEntry(id);
      }
      setSelectedIds([]);
      loadLedgerData();
    } catch (err) { alert("Bulk delete failed: " + err.message); }
  };

  async function loadLedgerData() {
    try {
      const [entRes, stockRes, deptRes, itemRes, empRes] = await Promise.all([
        JournalAPI.getEntries(),
        JournalAPI.getStocks(),
        CoreAPI.getDepartments(),
        MastersAPI.getItems(),
        CoreAPI.getEmployees(),
      ]);

      const loadedEntries = entRes.data.results || entRes.data || [];
      const loadedStocks = stockRes.data.results || stockRes.data || [];
      const loadedDepts = deptRes.data.results || deptRes.data || [];
      const loadedItems = itemRes.data.results || itemRes.data || [];
      const loadedEmps = empRes.data.results || empRes.data || [];

      setEntries(loadedEntries);
      setStocks(loadedStocks);
      setDepartments(loadedDepts);
      setMasterItems(loadedItems);
      setEmployees(loadedEmps);

      if (loadedDepts.length > 0 && !formData.to_department) {
        setFormData(prev => ({
          ...prev,
          from_department: loadedDepts[0]?.id || '',
          to_department: loadedDepts[1]?.id || loadedDepts[0]?.id || '',
          material_id: loadedItems[0]?.id || '',
        }));
      }
    } catch (err) {
      console.error("Error loading journal data:", err);
    }
  }

  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    setFormData({
      movement_type: 'external_in',
      material_id: masterItems[0]?.id || '',
      from_department: departments[0]?.id || '',
      to_department: departments[1]?.id || departments[0]?.id || '',
      quantity: 1000,
      unit: 'KG',
      remarks: '',
    });
    setModalOpen(true);
  };

  const handleSaveEntry = async (eventOrValues) => {
    const isEvent = typeof eventOrValues?.preventDefault === 'function';
    if (isEvent) eventOrValues.preventDefault();
    const submittedValues = isEvent ? formData : { ...formData, ...(eventOrValues || {}) };
    try {
      const payload = {
        ...submittedValues,
        material_id: submittedValues.material_id || masterItems[0]?.id || null,
        from_department: submittedValues.from_department || null,
        to_department: submittedValues.to_department || null,
        posted_by: employees[0]?.id || null,
      };

      if (editingEntry) {
        await JournalAPI.updateEntry(editingEntry.id, payload);
      } else {
        await JournalAPI.createEntry(payload);
      }
      setModalOpen(false);
      setEditingEntry(null);
      window.dispatchEvent(new Event('erp_journal_updated'));
      loadLedgerData();
    } catch (err) {
      alert("Failed to save ledger entry: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movement ledger entry?")) return;
    try {
      await JournalAPI.deleteEntry(id);
      window.dispatchEvent(new Event('erp_journal_updated'));
      loadLedgerData();
    } catch (err) {
      alert("Failed to delete entry: " + (err.response?.data?.detail || err.message));
    }
  };

  const openInspectModal = (e) => {
    setSelectedEntry(e);
    setViewModalOpen(true);
  };

  const currentList = activeTab === 'journal' ? entries : stocks;
  const filteredList = currentList.filter(item => {
    const term = searchQuery.toLowerCase();
    return (
      (item.id && item.id.toLowerCase().includes(term)) ||
      (item.remarks && item.remarks.toLowerCase().includes(term)) ||
      (item.movement_type && item.movement_type.toLowerCase().includes(term)) ||
      (item.material_id && item.material_id.toLowerCase().includes(term)) ||
      (item.unit && item.unit.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-[#1B4E9B]" /> Universal Movement Journal & Stock Ledger
          </h1>
          <p className="text-xs text-[#6B7280]">Integrated material & financial transaction postings and live bin balance caches.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleOpenCreateModal} className="btn-primary">
            <Plus className="w-4 h-4" /> Post Universal Movement Entry
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="standard-card space-y-4">
        {/* Tabs & Search Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
          <div className="admin-console-menu">
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`admin-menu-item ${activeTab === 'journal' ? 'active' : ''}`}
            >
              <BookOpenCheck className="admin-menu-icon" />
              <span>Journal Movement Entries</span>
              <span className="badge-count">
                {entries.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`admin-menu-item ${activeTab === 'stock' ? 'active' : ''}`}
            >
              <Boxes className="admin-menu-icon" />
              <span>Live Stock Balance Cache</span>
              <span className="badge-count">
                {stocks.length}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="w-full sm:w-64 shrink-0">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${activeTab === 'journal' ? 'entries' : 'stock cache'}...`}
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-[#1B4E9B]">
              {selectedIds.length} {activeTab === 'journal' ? 'entry' : 'stock record'}(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds([])} className="text-xs text-[#6B7280] hover:text-[#1F2937] font-semibold underline px-2">
                Clear Selection
              </button>
              <button onClick={handleBulkDeleteJournal} className="btn-danger flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#DC2626] text-white">
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {activeTab === 'journal' ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={paginatedList.length > 0 && paginatedList.every(i => selectedIds.includes(i.id))}
                      onChange={() => {
                        const pageIds = paginatedList.map(i => i.id);
                        if (pageIds.every(i => selectedIds.includes(i))) {
                          setSelectedIds(selectedIds.filter(id => !pageIds.includes(id)));
                        } else {
                          setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
                        }
                      }}
                      className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                    />
                  </th>
                  <th>Entry ID</th>
                  <th>Movement Type</th>
                  <th>Material Item</th>
                  <th>Source Routing</th>
                  <th>Target Routing</th>
                  <th>Quantity</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-6 text-[#6B7280] italic">No universal journal movement entries recorded.</td>
                  </tr>
                ) : (
                  paginatedList.map((e) => (
                    <tr key={e.id} className={selectedIds.includes(e.id) ? 'bg-[#F0F9FF]' : ''}>
                      <td className="w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => {
                            if (selectedIds.includes(e.id)) setSelectedIds(selectedIds.filter(i => i !== e.id));
                            else setSelectedIds([...selectedIds, e.id]);
                          }}
                          className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                        />
                      </td>
                      <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{e.id}</td>
                      <td className="capitalize text-[#374151] font-semibold">{e.movement_type?.replace('_', ' ')}</td>
                      <td className="font-semibold text-[#0F172A] text-xs">
                        {e.material_name || e.material_id}
                      </td>
                      <td className="text-xs text-[#475569]">
                        {e.from_plant_name || e.from_department_name ? (
                          <span>{e.from_plant_name || 'Plant'} • {e.from_department_name || 'Dept'}</span>
                        ) : (
                          <span className="text-[#94A3B8] italic">External Supplier / Start</span>
                        )}
                      </td>
                      <td className="text-xs text-[#475569]">
                        {e.to_plant_name || e.to_department_name ? (
                          <span>{e.to_plant_name || 'Plant'} • {e.to_department_name || 'Dept'}</span>
                        ) : (
                          <span className="text-[#94A3B8] italic">Customer / Dispatch</span>
                        )}
                      </td>
                      <td className="font-semibold text-[#1F2937]">
                        {Number(e.quantity).toLocaleString()} <span className="font-mono text-[#1B4E9B] text-xs font-semibold">{e.unit || 'KG'}</span>
                      </td>
                      <td className="text-xs text-[#6B7280]">{new Date(e.created_at || e.entry_date || Date.now()).toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openInspectModal(e)} className="btn-action-view" title="Inspect Record">
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button onClick={() => handleDeleteEntry(e.id)} className="btn-action-delete" title="Delete Entry">
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
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Stock ID</th>
                  <th>Plant Unit</th>
                  <th>Department</th>
                  <th>Bin / Location</th>
                  <th>Material ID</th>
                  <th>Live Stock Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-[#6B7280] italic">No live stock balances tracked.</td>
                  </tr>
                ) : (
                  paginatedList.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{s.id}</td>
                      <td className="font-semibold text-[#0F172A]">{s.plant_name || s.plant || '-'}</td>
                      <td>{s.department_name || s.department || '-'}</td>
                      <td className="font-mono text-xs text-[#1B4E9B]">{s.bin_code || s.storage_location || 'DEFAULT-BIN'}</td>
                      <td className="font-mono text-xs text-[#374151]">{s.material_id}</td>
                      <td className="font-bold text-[#0F172A]">
                        {Number(s.quantity).toLocaleString()} <span className="text-xs font-mono text-[#6B7280]">{s.unit_id || 'KG'}</span>
                      </td>
                      <td>
                        <span className={`badge ${s.stock_status === 'available' ? 'badge-success' : 'badge-warning'}`}>
                          {s.stock_status || 'Available'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredList.length}
        />
      </div>

      {/* Post Movement Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingEntry ? "Edit Ledger Entry" : "Post Universal Movement Entry"} size="md">
        <GenericFormRenderer
          formConfig={
            journalForm || {
              title: 'Financial & Inventory Journal Movement Form',
              module: 'journal',
              fields: [
                { field_name: 'Movement Type', field_code: 'movement_type', field_type: 'select', options: 'external_in,external_out,internal', required: true, field_order: 1 },
                { field_name: 'Material Item', field_code: 'material_id', field_type: 'reference', reference_table: 'masters_items', required: true, field_order: 2 },
                { field_name: 'Source Department', field_code: 'from_department', field_type: 'reference', reference_table: 'departments', required: false, field_order: 3 },
                { field_name: 'Target Department', field_code: 'to_department', field_type: 'reference', reference_table: 'departments', required: false, field_order: 4 },
                { field_name: 'Quantity Amount', field_code: 'quantity', field_type: 'number', required: true, field_order: 5 },
                { field_name: 'Unit Code', field_code: 'unit', field_type: 'text', required: true, field_order: 6 },
                { field_name: 'Justification & Remarks', field_code: 'remarks', field_type: 'textarea', required: false, field_order: 7 },
              ]
            }
          }
          initialValues={formData}
          onSubmit={handleSaveEntry}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      {/* Inspect View Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Journal Entry Specification" size="sm">
        {selectedEntry && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] space-y-1">
              <p className="font-mono text-[#1B4E9B] font-bold">ID: {selectedEntry.id}</p>
              <p><strong className="text-[#374151]">Movement:</strong> {selectedEntry.movement_type}</p>
              <p><strong className="text-[#374151]">Material:</strong> {selectedEntry.material_name || selectedEntry.material_id}</p>
              <p><strong className="text-[#374151]">Quantity:</strong> {selectedEntry.quantity} {selectedEntry.unit}</p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setViewModalOpen(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
