import React, { useEffect, useState } from 'react';
import { MastersAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Layers, Plus, Edit2, Trash2, Search, Eye, Sliders, Database, ArrowRightLeft, Sparkles } from 'lucide-react';

export default function DynamicMasters() {
  const [activeTab, setActiveTab] = useState('legacy_json'); // 'legacy_json' | 'eav_converted'

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [versions, setVersions] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [instances, setInstances] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [attrModalOpen, setAttrModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const [selectedInspectRecord, setSelectedInspectRecord] = useState(null);

  const [newCat, setNewCat] = useState({ code: '', name: '', remarks: '' });
  const [newAttr, setNewAttr] = useState({
    attribute_code: '',
    attribute_name: '',
    data_type: 'text',
    reference_table: '',
    is_required: false,
    sort_order: 1,
    remarks: '',
  });

  const [newItem, setNewItem] = useState({ code: '', name: '', attributes: '' });
  const [dynamicFormValues, setDynamicFormValues] = useState({});
  const [customAttrPairs, setCustomAttrPairs] = useState([{ key: '', value: '' }]);

  const [newVersion, setNewVersion] = useState({
    master_item: '',
    value: '{"rate": 12.5}',
    effective_from: '2026-04-01',
    effective_to: '2026-12-31',
    version_no: 1,
    remarks: 'Annual statutory rate review',
  });

  useEffect(() => {
    loadMastersData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryAttributes(selectedCategory);
    }
  }, [selectedCategory, categories]);

  async function loadMastersData() {
    try {
      const [catRes, itemRes, verRes, instRes] = await Promise.all([
        MastersAPI.getCategories(),
        MastersAPI.getItems(),
        MastersAPI.getVersions(),
        MastersAPI.getInstances(),
      ]);
      const loadedCats = catRes.data.results || catRes.data || [];
      setCategories(loadedCats);
      setItems(itemRes.data.results || itemRes.data || []);
      setVersions(verRes.data.results || verRes.data || []);
      setInstances(instRes.data.results || instRes.data || []);

      if (loadedCats.length > 0 && !selectedCategory) {
        setSelectedCategory(loadedCats[0].code);
      }
    } catch (err) {
      console.error("Error loading masters data:", err);
    }
  }

  async function loadCategoryAttributes(catCode) {
    const activeCat = categories.find((c) => c.code === catCode);
    if (!activeCat) return;
    try {
      const attrRes = await MastersAPI.getAttributes({ master_category: activeCat.id });
      const attrs = attrRes.data.results || attrRes.data || [];
      setAttributes(attrs);
    } catch (err) {
      console.error("Error loading category attributes:", err);
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await MastersAPI.createCategory(newCat);
      setCategoryModalOpen(false);
      setNewCat({ code: '', name: '', remarks: '' });
      loadMastersData();
    } catch (err) {
      alert("Failed to create category: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCreateAttribute = async (e) => {
    e.preventDefault();
    const activeCat = categories.find((c) => c.code === selectedCategory);
    if (!activeCat) return;
    try {
      await MastersAPI.createAttribute({
        ...newAttr,
        master_category: activeCat.id,
      });
      setAttrModalOpen(false);
      setNewAttr({
        attribute_code: '',
        attribute_name: '',
        data_type: 'text',
        reference_table: '',
        is_required: false,
        sort_order: 1,
        remarks: '',
      });
      loadCategoryAttributes(selectedCategory);
    } catch (err) {
      alert("Failed to create attribute: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const catObj = categories.find((c) => c.code === selectedCategory);
      const finalAttrs = { ...dynamicFormValues };

      // Collect custom key-value pairs
      customAttrPairs.forEach((pair) => {
        if (pair.key.trim() && pair.value.trim()) {
          const formattedKey = pair.key.trim().toLowerCase().replace(/\s+/g, '_');
          finalAttrs[formattedKey] = pair.value.trim();
        }
      });

      await MastersAPI.createItem({
        category: catObj.id,
        code: newItem.code,
        name: newItem.name,
        attributes: finalAttrs,
        values: finalAttrs,
      });

      setItemModalOpen(false);
      setNewItem({ code: '', name: '', attributes: '' });
      setDynamicFormValues({});
      setCustomAttrPairs([{ key: '', value: '' }]);
      loadMastersData();
    } catch (err) {
      alert("Failed to save item: " + (err.response?.data?.detail || err.message));
    }
  };


  const handleCreateVersion = async (e) => {
    e.preventDefault();
    try {
      let parsedVal = {};
      if (typeof newVersion.value === 'string') {
        parsedVal = JSON.parse(newVersion.value);
      } else {
        parsedVal = newVersion.value;
      }
      await MastersAPI.createVersion({
        ...newVersion,
        value: parsedVal,
      });
      setVersionModalOpen(false);
      setNewVersion({
        master_item: '',
        value: '{"rate": 12.5}',
        effective_from: '2026-04-01',
        effective_to: '2026-12-31',
        version_no: 1,
        remarks: 'Annual statutory rate review',
      });
      loadMastersData();
    } catch (err) {
      alert("Failed to create version: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this master item?")) return;
    try {
      await MastersAPI.deleteItem(id);
      loadMastersData();
    } catch (err) {
      alert("Failed to delete item: " + (err.response?.data?.detail || err.message));
    }
  };

  const openCreateItemModal = () => {
    setNewItem({ code: '', name: '', attributes: '' });
    const initialDyn = {};
    attributes.forEach(d => { initialDyn[d.attribute_code] = ''; });
    setDynamicFormValues(initialDyn);
    setItemModalOpen(true);
  };

  const openInspectModal = (record) => {
    setSelectedInspectRecord(record);
    setViewModalOpen(true);
  };

  const activeCategoryObj = categories.find((c) => c.code === selectedCategory);
  
  // Filter legacy MasterItems
  const activeItems = items.filter((i) => i.category_code === selectedCategory || (activeCategoryObj && i.category === activeCategoryObj.id));
  const filteredItems = activeItems.filter(i => 
    i.code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter MasterInstances
  const activeInstances = instances.filter((inst) => inst.category_code === selectedCategory || (activeCategoryObj && inst.master_category === activeCategoryObj.id));
  const filteredInstances = activeInstances.filter(inst => 
    inst.code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDisplayList = activeTab === 'legacy_json' ? filteredItems : filteredInstances;
  const totalPages = Math.ceil(currentDisplayList.length / itemsPerPage) || 1;
  const paginatedList = currentDisplayList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-400" /> 6-Table Masters Architecture Engine
          </h1>
          <p className="text-xs text-slate-400">Stores both JSON master items (MasterCategory, MasterItem, MasterItemVersion) and converted EAV tables (MasterAttribute, MasterInstance, MasterAttributeValue).</p>
        </div>

        {/* View Tab Switcher */}
        <div className="flex p-1 bg-slate-950 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('legacy_json')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'legacy_json' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" /> 3-Table JSON Store
          </button>
          <button
            onClick={() => setActiveTab('eav_converted')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'eav_converted' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> 3-Table Converted EAV
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end gap-2">
        <button onClick={() => setCategoryModalOpen(true)} className="btn-secondary text-xs">
          <Plus className="w-4 h-4 text-blue-400" /> Add MasterCategory
        </button>
        <button onClick={() => setAttrModalOpen(true)} className="btn-secondary text-xs">
          <Sliders className="w-4 h-4 text-emerald-400" /> Add MasterAttribute
        </button>
        <button onClick={openCreateItemModal} className="btn-primary text-xs">
          <Plus className="w-4 h-4" /> Add MasterItem & Sync EAV
        </button>
      </div>

      {/* Category Navbar Dropdown */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/90 border border-emerald-500/30">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider whitespace-nowrap">Select Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input text-xs py-2 px-3 bg-slate-950 border border-emerald-500/50 text-white font-bold rounded-xl cursor-pointer w-full md:w-80"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.code} className="bg-slate-900 text-white font-semibold">
                {cat.name} ({cat.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex border border-white/10 rounded-xl overflow-hidden bg-slate-950 p-1 gap-1 overflow-x-auto w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs rounded-lg transition-all whitespace-nowrap ${
                selectedCategory === cat.code
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Master Attributes Extracted List */}
      <div className="glass-panel p-4 bg-slate-950/80 border border-white/10 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Extracted MasterAttribute Definitions ({attributes.length})
          </span>
          <span className="text-[10px] text-slate-400 font-mono">Auto-extracted from JSON & Category definitions</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {attributes.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No extracted MasterAttribute rows for this category yet.</span>
          ) : (
            attributes.map((attr) => (
              <span key={attr.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-mono">
                <span className="text-white font-bold">{attr.attribute_name}</span>
                <span className="text-purple-400">({attr.data_type})</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{activeCategoryObj?.name || 'Master Data'}</span>
              <span className="badge badge-info text-xs">
                {activeTab === 'legacy_json' ? `${filteredItems.length} MasterItems (JSON)` : `${filteredInstances.length} MasterInstances (EAV)`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Viewing table: {activeTab === 'legacy_json' ? 'MasterItem' : 'MasterInstance & MasterAttributeValue'}</p>
          </div>

          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>{activeTab === 'legacy_json' ? 'JSON Attributes (MasterItem.attributes)' : 'Converted EAV Attributes (MasterAttributeValue)'}</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-500 italic">No records found.</td>
                </tr>
              ) : (
                paginatedList.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs text-blue-400 font-semibold">{row.code}</td>
                    <td className="font-semibold text-white">{row.name}</td>
                    <td>
                      {activeTab === 'legacy_json' ? (
                        <span className="font-mono text-xs text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-white/5">
                          {row.attributes ? JSON.stringify(row.attributes) : 'Null'}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {row.attribute_values && row.attribute_values.length > 0 ? (
                            row.attribute_values.map((v) => (
                              <span key={v.id} className="text-[11px] font-mono bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded text-purple-300">
                                {v.attribute_code}: {v.value_text || v.value_number || (v.value_boolean !== null ? String(v.value_boolean) : '')}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">No EAV rows</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${row.is_active !== false ? 'badge-approved' : 'badge-rejected'}`}>
                        {row.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openInspectModal(row)} className="p-1 hover:text-blue-400 text-slate-400" title="Inspect Record">
                          <Eye className="w-4 h-4" />
                        </button>
                        {activeTab === 'legacy_json' && (
                          <button onClick={() => handleDeleteItem(row.id)} className="p-1 hover:text-red-400 text-slate-400" title="Delete Item">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
          totalItems={currentDisplayList.length}
          itemsPerPage={10}
        />
      </div>

      {/* Statutory Rule Versions Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Statutory Rule Versions (MasterItemVersion)</span>
            <span className="badge badge-completed text-xs">{versions.length} versions</span>
          </h3>
          <button onClick={() => setVersionModalOpen(true)} className="btn-secondary text-xs">
            <Plus className="w-4 h-4 text-purple-400" /> Add Rule Version
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table text-xs">
            <thead>
              <tr>
                <th>Version ID</th>
                <th>Master Item</th>
                <th>Version No</th>
                <th>Effective From</th>
                <th>Effective To</th>
                <th>Rule JSON Value</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {versions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500 italic">No statutory rule versions recorded.</td>
                </tr>
              ) : (
                versions.map((ver) => (
                  <tr key={ver.id}>
                    <td className="font-mono text-purple-400 font-semibold">{ver.id}</td>
                    <td className="font-semibold text-white">{ver.master_item_name || ver.master_item}</td>
                    <td><span className="badge badge-info">v{ver.version_no}</span></td>
                    <td className="text-emerald-400 font-semibold">{ver.effective_from || '-'}</td>
                    <td className="text-amber-400 font-semibold">{ver.effective_to || 'Indefinite'}</td>
                    <td className="font-mono text-emerald-400 bg-slate-900 px-2 py-1 rounded">
                      {JSON.stringify(ver.value)}
                    </td>
                    <td className="text-slate-300 italic">{ver.remarks || 'No remarks'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create MasterCategory */}
      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="Create MasterCategory">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div><label className="form-label">Category Code *</label><input type="text" required value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value })} className="form-input" placeholder="e.g. cat_raw_materials" /></div>
          <div><label className="form-label">Category Name *</label><input type="text" required value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="form-input" placeholder="e.g. Raw Chemical Materials" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setCategoryModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create MasterCategory</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create MasterAttribute */}
      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} title={`Add MasterAttribute to Category: ${activeCategoryObj?.name}`}>
        <form onSubmit={handleCreateAttribute} className="space-y-4">
          <div><label className="form-label">Attribute Code *</label><input type="text" required value={newAttr.attribute_code} onChange={(e) => setNewAttr({ ...newAttr, attribute_code: e.target.value })} className="form-input" placeholder="e.g. purity_rating" /></div>
          <div><label className="form-label">Attribute Name *</label><input type="text" required value={newAttr.attribute_name} onChange={(e) => setNewAttr({ ...newAttr, attribute_name: e.target.value })} className="form-input" placeholder="e.g. Min Purity Rating" /></div>
          <div>
            <label className="form-label">Data Type *</label>
            <select value={newAttr.data_type} onChange={(e) => setNewAttr({ ...newAttr, data_type: e.target.value })} className="form-input">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="reference">Reference FK</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setAttrModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Save MasterAttribute</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Create MasterItem */}
      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} title="Create MasterItem & Sync to MasterInstance + MasterAttributeValue">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div><label className="form-label">Item Code *</label><input type="text" required value={newItem.code} onChange={(e) => setNewItem({ ...newItem, code: e.target.value })} className="form-input" placeholder="e.g. RAW-CHEM-POLY-03" /></div>
          <div><label className="form-label">Item Name *</label><input type="text" required value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="form-input" placeholder="e.g. High-Grade Chemical Compound" /></div>

          {/* Dynamic Master Attributes Inputs */}
          {attributes.length > 0 ? (
            <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-3">
              <p className="text-xs font-bold text-purple-400 uppercase">Category Attributes</p>
              {attributes.map((attr) => (
                <div key={attr.id} className="space-y-1">
                  <label className="form-label">{attr.attribute_name} {attr.is_required && '*'}</label>
                  <input
                    type={attr.data_type === 'number' ? 'number' : 'text'}
                    step="any"
                    value={dynamicFormValues[attr.attribute_code] || ''}
                    onChange={(e) => setDynamicFormValues({ ...dynamicFormValues, [attr.attribute_code]: e.target.value })}
                    className="form-input"
                    placeholder={`Enter ${attr.attribute_name}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-400 uppercase">Custom Master Attributes</p>
                <button
                  type="button"
                  onClick={() => setCustomAttrPairs([...customAttrPairs, { key: '', value: '' }])}
                  className="text-xs text-blue-400 hover:underline font-semibold"
                >
                  + Add Attribute Field
                </button>
              </div>
              {customAttrPairs.map((pair, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Attribute Name (e.g. Grade)"
                    value={pair.key}
                    onChange={(e) => {
                      const copy = [...customAttrPairs];
                      copy[idx].key = e.target.value;
                      setCustomAttrPairs(copy);
                    }}
                    className="form-input text-xs w-1/2"
                  />
                  <input
                    type="text"
                    placeholder="Attribute Value (e.g. Grade A)"
                    value={pair.value}
                    onChange={(e) => {
                      const copy = [...customAttrPairs];
                      copy[idx].value = e.target.value;
                      setCustomAttrPairs(copy);
                    }}
                    className="form-input text-xs w-1/2"
                  />
                  {customAttrPairs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCustomAttrPairs(customAttrPairs.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 font-bold px-2 py-1"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setItemModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Item & Save Attributes</button>
          </div>
        </form>
      </Modal>


      {/* MODAL 4: Create Version */}
      <Modal isOpen={versionModalOpen} onClose={() => setVersionModalOpen(false)} title="Create Statutory Rule Version">
        <form onSubmit={handleCreateVersion} className="space-y-4">
          <div>
            <label className="form-label">Master Item *</label>
            <select required value={newVersion.master_item} onChange={(e) => setNewVersion({ ...newVersion, master_item: e.target.value })} className="form-input">
              <option value="">Select Master Item</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>
          <div><label className="form-label">Version Number *</label><input type="number" required value={newVersion.version_no} onChange={(e) => setNewVersion({ ...newVersion, version_no: parseInt(e.target.value) })} className="form-input" /></div>
          <div><label className="form-label">Rule Value (JSON) *</label><textarea required value={newVersion.value} onChange={(e) => setNewVersion({ ...newVersion, value: e.target.value })} className="form-input font-mono text-xs h-20"></textarea></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Effective From *</label><input type="date" required value={newVersion.effective_from} onChange={(e) => setNewVersion({ ...newVersion, effective_from: e.target.value })} className="form-input" /></div>
            <div><label className="form-label">Effective To</label><input type="date" value={newVersion.effective_to || ''} onChange={(e) => setNewVersion({ ...newVersion, effective_to: e.target.value })} className="form-input" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setVersionModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Version</button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Inspect Record */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Master Record Inspection">
        {selectedInspectRecord && (
          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 max-h-96 overflow-y-auto space-y-2">
              {Object.entries(selectedInspectRecord).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-white/5 pb-1 text-xs">
                  <span className="font-semibold text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-mono text-emerald-400 ml-4 text-right break-all">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? 'null')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
