import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Download, Edit3, Trash2, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="standard-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#EFF6FF] text-[#1B4E9B]">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="page-title">Process Attribute Values</h1>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            View, search, filter, edit, delete, and export dynamic process attribute instances across all workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-secondary">
            <FileText className="w-4 h-4" /> Print / PDF
          </button>
          <button onClick={fetchValues} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          {notification}
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="filter-search-toolbar">
        <form onSubmit={handleSearch} className="search-form-group">
          <div className="search-input-wrapper" style={{ maxWidth: '480px', flex: 1 }}>
            <Search className="search-input-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search value text, attribute name, code..."
              className="search-input-field"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        <div className="filter-select-group">
          <Filter className="filter-select-icon" />
          <select
            value={filterProcessType}
            onChange={(e) => setFilterProcessType(e.target.value)}
            className="filter-select-input"
          >
            <option value="">All Process Types</option>
            {processTypes.map(pt => (
              <option key={pt.id} value={pt.name}>{pt.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attribute Values Data Table */}
      <div className="standard-card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={6} columns={6} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table id="attr-values-table" className="custom-table">
              <thead>
                <tr>
                  <th>Process Instance</th>
                  <th>Attribute Name</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredValues.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-[#6B7280] italic">
                      No process attribute values found.
                    </td>
                  </tr>
                ) : (
                  filteredValues.map((val) => (
                    <tr key={val.id}>
                      <td>
                        <div className="font-bold text-[#1F2937]">{val.process_type_name || 'Process Instance'}</div>
                        <div className="text-[11px] font-mono text-[#1B4E9B]">{val.process_instance}</div>
                      </td>
                      <td className="font-semibold text-[#1B4E9B]">{val.attribute_name || 'N/A'}</td>
                      <td className="font-mono text-xs text-[#374151]">{val.attribute_code}</td>
                      <td>
                        <span className="badge badge-info">
                          {val.data_type}
                        </span>
                      </td>
                      <td className="max-w-xs truncate font-medium text-[#1F2937]">
                        {val.display_value || val.value_text || <span className="text-[#6B7280] italic">Empty</span>}
                      </td>
                      <td className="text-[#6B7280]">{val.performed_by_name || 'System Operator'}</td>
                      <td className="text-[#6B7280] font-mono text-[11px]">
                        {val.created_at ? new Date(val.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(val)}
                            className="btn-action-edit"
                            title="Edit Value"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(val.id)}
                            className="btn-action-delete"
                            title="Delete Value"
                          >
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
        )}
      </div>

      {/* Edit Value Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md" title="Edit Attribute Value">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="form-label">Attribute Code & Name</label>
            <input
              type="text"
              readOnly
              value={`${editingItem?.attribute_code} - ${editingItem?.attribute_name}`}
              className="form-input bg-[#F8FAFC] text-[#6B7280]"
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
          <div className="modal-footer">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
