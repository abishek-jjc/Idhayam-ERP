import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GitCommit, Plus, Edit3, Trash2, ArrowRight, Layers, Workflow, CheckCircle2, RefreshCw } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonLoader from '../components/SkeletonLoader';

export default function ProcessLinks() {
  const [links, setLinks] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <GitCommit className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-white tracking-tight">Process Links & Flow Visualizer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic process chain links (Purchase Request → Purchase Order → GRN → Invoice) and visualize process relationships.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchData} className="btn-secondary text-xs flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handleOpenAdd} className="btn-primary text-xs flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Process Link
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* Visual Process Flow Diagram Studio */}
      <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-indigo-400" /> Interactive Process Flow Chain
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Live Visual Architecture</span>
        </div>

        {/* Node Flow Representation */}
        <div className="p-6 bg-slate-950/60 border border-white/10 rounded-xl overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-6 min-w-max py-4">
            <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-center w-48 shadow-lg shadow-blue-500/10">
              <div className="text-[10px] uppercase font-bold text-blue-400 tracking-widest">Step 1</div>
              <div className="text-sm font-extrabold text-white mt-1">Purchase Request</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Procurement Initiation</div>
            </div>

            <div className="flex flex-col items-center text-slate-400">
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">fulfills</span>
              <ArrowRight className="w-6 h-6 text-purple-400 my-1 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-center w-48 shadow-lg shadow-indigo-500/10">
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Step 2</div>
              <div className="text-sm font-extrabold text-white mt-1">Purchase Order</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Vendor Binding</div>
            </div>

            <div className="flex flex-col items-center text-slate-400">
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">consumes</span>
              <ArrowRight className="w-6 h-6 text-indigo-400 my-1 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-cyan-600/10 border border-cyan-500/30 text-center w-48 shadow-lg shadow-cyan-500/10">
              <div className="text-[10px] uppercase font-bold text-cyan-400 tracking-widest">Step 3</div>
              <div className="text-sm font-extrabold text-white mt-1">GRN (Receipt)</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Inventory Verification</div>
            </div>

            <div className="flex flex-col items-center text-slate-400">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">pays_for</span>
              <ArrowRight className="w-6 h-6 text-emerald-400 my-1 animate-pulse" />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/30 text-center w-48 shadow-lg shadow-emerald-500/10">
              <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Step 4</div>
              <div className="text-sm font-extrabold text-white mt-1">Vendor Invoice</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">Accounts Payable</div>
            </div>
          </div>
        </div>
      </div>

      {/* Configured Process Links Table */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configured Process Links Directory</h3>
          <span className="text-xs text-slate-400">{links.length} Active Links</span>
        </div>

        {loading ? (
          <div className="p-6">
            <SkeletonLoader rows={4} columns={5} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Link ID</th>
                  <th className="p-4">From Process</th>
                  <th className="p-4 text-center">Relationship Type</th>
                  <th className="p-4">To Process</th>
                  <th className="p-4">Remarks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                {links.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                      No process links defined yet. Click "Add Process Link" to build process dependencies.
                    </td>
                  </tr>
                ) : (
                  links.map((lnk) => (
                    <tr key={lnk.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-mono text-[11px] text-slate-400">{lnk.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-white">{lnk.from_process_name || 'From Instance'}</div>
                        <div className="text-[10px] font-mono text-blue-400">{lnk.from_process_instance}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20 uppercase font-bold">
                          {lnk.link_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-white">{lnk.to_process_name || 'To Instance'}</div>
                        <div className="text-[10px] font-mono text-indigo-400">{lnk.to_process_instance}</div>
                      </td>
                      <td className="p-4 text-slate-400">{lnk.remarks || 'No remarks'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(lnk)}
                            className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                            title="Edit Link"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(lnk.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                            title="Delete Link"
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

      {/* Add / Edit Process Link Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Process Link" : "Create Process Link"}>
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

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingId ? "Update Link" : "Save Link"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
