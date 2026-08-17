import React, { useEffect, useState } from 'react';
import { JournalAPI, CoreAPI, MastersAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import SearchInput from '../components/ui/SearchInput';
import { BookOpenCheck, Boxes, Plus, Trash2, Eye } from 'lucide-react';

export default function JournalStock() {
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
  }, [activeTab]);

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

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        material_id: formData.material_id || masterItems[0]?.id || null,
        from_department: formData.from_department || null,
        to_department: formData.to_department || null,
        posted_by: employees[0]?.id || null,
      };

      if (editingEntry) {
        await JournalAPI.updateEntry(editingEntry.id, payload);
      } else {
        await JournalAPI.createEntry(payload);
      }
      setModalOpen(false);
      setEditingEntry(null);
      loadLedgerData();
    } catch (err) {
      alert("Failed to save ledger entry: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this movement ledger entry?")) return;
    try {
      await JournalAPI.deleteEntry(id);
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
            <BookOpenCheck className="w-6 h-6 text-[#1B4E9B]" /> Universal Movement Journal & Stock
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

        {activeTab === 'journal' ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Movement Type</th>
                  <th>Material ID</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Timestamp</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-[#6B7280] italic">No universal journal movement entries recorded.</td>
                  </tr>
                ) : (
                  paginatedList.map((e) => (
                    <tr key={e.id}>
                      <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{e.id}</td>
                      <td className="capitalize text-[#374151] font-semibold">{e.movement_type?.replace('_', ' ')}</td>
                      <td className="font-mono text-xs text-[#374151]">{e.material_id}</td>
                      <td className="font-semibold text-[#1F2937]">{Number(e.quantity).toLocaleString()}</td>
                      <td className="font-mono text-[#1B4E9B] font-semibold">{e.unit || 'KG'}</td>
                      <td className="text-xs text-[#6B7280]">{new Date(e.created_at || Date.now()).toLocaleString()}</td>
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
                  <th>Material ID</th>
                  <th>Current Stock Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-[#6B7280] italic">No live stock balances tracked.</td>
                  </tr>
                ) : (
                  paginatedList.map((s) => (
                    <tr key={s.id}>
                      <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{s.id}</td>
                      <td>{s.plant_name || s.plant || '-'}</td>
                      <td>{s.department_name || s.department || '-'}</td>
                      <td className="font-mono text-xs text-[#374151]">{s.material_id}</td>
                      <td className="font-semibold text-[#1F2937]">{Number(s.quantity).toLocaleString()} KG</td>
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
          itemsPerPage={10}
        />
      </div>

      {/* Modals */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md" title="Post Universal Movement Entry">
        <form onSubmit={handleSaveEntry} className="space-y-4">
          <div>
            <label className="form-label">Movement Type *</label>
            <select value={formData.movement_type} onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })} className="form-input">
              <option value="external_in">External Receipt (Inward)</option>
              <option value="external_out">External Dispatch (Outward)</option>
              <option value="internal">Internal Plant/Dept Transfer</option>
            </select>
          </div>

          <div>
            <label className="form-label">Material Item *</label>
            <select value={formData.material_id} onChange={(e) => setFormData({ ...formData, material_id: e.target.value })} className="form-input">
              {masterItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">From Department</label>
              <select value={formData.from_department} onChange={(e) => setFormData({ ...formData, from_department: e.target.value })} className="form-input">
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">To Department</label>
              <select value={formData.to_department} onChange={(e) => setFormData({ ...formData, to_department: e.target.value })} className="form-input">
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) setFormData({ ...formData, quantity: parseFloat(val) || 0 });
                }}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Unit *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="form-input"
              >
                <option value="KG">KG (Kilograms)</option>
                <option value="MT">MT (Metric Tons)</option>
                <option value="LITERS">LITERS (Ltrs)</option>
                <option value="BAGS">BAGS (Bags)</option>
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOXES">BOXES (Boxes)</option>
                <option value="METERS">METERS (Mtr)</option>
              </select>
            </div>
          </div>

          <div><label className="form-label">Movement Remarks</label><textarea value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="form-input h-20" placeholder="Ledger remarks..."></textarea></div>

          <div className="modal-footer">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Post Entry</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="md" title="Universal Journal Entry Inspection">
        {selectedEntry && (
          <div className="space-y-4">
            <div><span className="text-xs text-[#6B7280]">Entry ID:</span><p className="font-mono text-[#1B4E9B] font-bold">{selectedEntry.id}</p></div>
            <div><span className="text-xs text-[#6B7280]">Movement Type:</span><p className="text-[#1F2937] font-bold capitalize">{selectedEntry.movement_type}</p></div>
            <div><span className="text-xs text-[#6B7280]">Quantity:</span><p className="text-[#16A34A] font-bold font-mono">{Number(selectedEntry.quantity).toLocaleString()}</p></div>
            <div><span className="text-xs text-[#6B7280]">Unit:</span><p className="text-[#1B4E9B] font-bold font-mono">{selectedEntry.unit || 'KG'}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
