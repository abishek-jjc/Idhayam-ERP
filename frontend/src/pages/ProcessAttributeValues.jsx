import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, Edit3, Trash2, Plus, Sparkles, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function ProcessAttributeValues() {
  const [values, setValues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProcessType, setFilterProcessType] = useState('');
  const [processTypes, setProcessTypes] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editValueText, setEditValueText] = useState('');
  const [notification, setNotification] = useState('');

  const fetchValues = () => {
    setLoading(true);
    let url = 'http://127.0.0.1:8000/api/process-attribute-values/';
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    axios.get(url)
      .then(res => {
        setValues(res.data?.results || res.data || []);
      })
      .catch(err => console.error("Error fetching attribute values:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchValues();
    axios.get('http://127.0.0.1:8000/api/process/types/')
      .then(res => setProcessTypes(res.data?.results || res.data || []))
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchValues();
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this attribute value entry?")) {
      axios.delete(`http://127.0.0.1:8000/api/process-attribute-values/${id}/`)
        .then(() => {
          setNotification("Attribute value deleted successfully.");
          fetchValues();
          setTimeout(() => setNotification(''), 3000);
        })
        .catch(err => alert("Delete failed: " + err.message));
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditValueText(item.value_text || item.display_value || '');
    setIsModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    axios.patch(`http://127.0.0.1:8000/api/process-attribute-values/${editingItem.id}/`, {
      value_text: editValueText
    })
      .then(() => {
        setNotification("Attribute value updated successfully.");
        setIsModalOpen(false);
        fetchValues();
        setTimeout(() => setNotification(''), 3000);
      })
      .catch(err => alert("Update failed: " + err.message));
  };

  const filteredValues = values.filter(v => {
    if (!filterProcessType) return true;
    return v.process_type_name === filterProcessType;
  });

  const handleExportCSV = () => {
    const headers = [
      { label: 'Value ID', key: 'id' },
      { label: 'Process Instance', key: 'process_instance' },
      { label: 'Process Type', key: 'process_type_name' },
      { label: 'Attribute Code', key: 'attribute_code' },
      { label: 'Attribute Name', key: 'attribute_name' },
      { label: 'Data Type', key: 'data_type' },
      { label: 'Value', key: 'display_value' },
      { label: 'Created By', key: 'performed_by_name' },
      { label: 'Created At', key: 'created_at' },
    ];
    exportToCSV('process_attribute_values', headers, filteredValues);
  };

  const handleExportPDF = () => {
    exportToPDF('Process Attribute Values Report', 'attr-values-table');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Process Attribute Values</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            View, search, filter, edit, delete, and export dynamic process attribute instances across all workflows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-2 text-xs">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4" /> Print / PDF
          </button>
          <button onClick={fetchValues} className="btn-primary flex items-center gap-2 text-xs">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-4 bg-slate-900/40 border border-white/10 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search value text, attribute name, code..."
              className="form-input pl-9"
            />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>

        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterProcessType}
            onChange={(e) => setFilterProcessType(e.target.value)}
            className="form-input text-xs w-56"
          >
            <option value="">All Process Types</option>
            {processTypes.map(pt => (
              <option key={pt.id} value={pt.name}>{pt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attribute Values Data Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={6} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table id="attr-values-table" className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Process Instance</th>
                  <th className="p-4">Attribute Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Created By</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {filteredValues.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-400 italic">
                      No process attribute values found.
                    </td>
                  </tr>
                ) : (
                  filteredValues.map((val) => (
                    <tr key={val.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4">
                        <div className="font-bold text-white">{val.process_type_name || 'Process Instance'}</div>
                        <div className="text-[10px] font-mono text-slate-400">{val.process_instance}</div>
                      </td>
                      <td className="p-4 font-semibold text-blue-300">{val.attribute_name || 'N/A'}</td>
                      <td className="p-4 font-mono text-[11px] text-purple-300">{val.attribute_code}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                          {val.data_type}
                        </span>
                      </td>
                      <td className="p-4 max-w-xs truncate font-medium text-slate-100">
                        {val.display_value || val.value_text || <span className="text-slate-500 italic">Empty</span>}
                      </td>
                      <td className="p-4 text-slate-400">{val.performed_by_name || 'System Operator'}</td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {val.created_at ? new Date(val.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(val)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Value"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(val.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Value"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Value Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Edit Attribute Value">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="form-label">Attribute Code & Name</label>
            <input
              type="text"
              readOnly
              value={`${editingItem?.attribute_code} - ${editingItem?.attribute_name}`}
              className="form-input bg-slate-950/60 text-slate-400"
            />
          </div>
          <div>
            <label className="form-label">Value Text *</label>
            <textarea
              value={editValueText}
              onChange={(e) => setEditValueText(e.target.value)}
              className="form-input"
              rows="3"
              required
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
