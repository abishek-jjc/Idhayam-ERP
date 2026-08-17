import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MastersAPI } from '../api';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import FilterBar from '../components/ui/FilterBar';
import Table from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import IconButton from '../components/ui/IconButton';
import EmptyState from '../components/ui/EmptyState';
import GenericFormRenderer from '../components/GenericFormRenderer';
import { Layers, Plus, Trash2, Eye, Sliders, Database, ArrowRightLeft, FolderPlus, Sparkles } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

const MASTER_TABLE_MAP = {
  companies: { endpoint: '/api/core/companies/', label: 'Companies' },
  company: { endpoint: '/api/core/companies/', label: 'Companies' },
  plants: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  plant: { endpoint: '/api/core/plants/', label: 'Plants & Facilities' },
  departments: { endpoint: '/api/core/departments/', label: 'Departments' },
  department: { endpoint: '/api/core/departments/', label: 'Departments' },
  designations: { endpoint: '/api/core/designations/', label: 'Designations' },
  designation: { endpoint: '/api/core/designations/', label: 'Designations' },
  employees: { endpoint: '/api/core/employees/', label: 'Employees' },
  employee: { endpoint: '/api/core/employees/', label: 'Employees' },
  machines: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  machine: { endpoint: '/api/core/machines/', label: 'Machines & Vehicles' },
  vendors: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  vendor: { endpoint: '/api/core/vendors/', label: 'Vendors' },
  storage_locations: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  storage_location: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  master_categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  master_items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  process_types: { endpoint: '/api/process/types/', label: 'Process Types' },
};

export default function DynamicMasters() {
  const [activeTab, setActiveTab] = useState('legacy_json'); // 'legacy_json' | 'eav_converted'

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [versions, setVersions] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [instances, setInstances] = useState([]);
  const [uiForms, setUiForms] = useState([]);
  const [useDynamicFormMode, setUseDynamicFormMode] = useState(true);
  const [masterOptions, setMasterOptions] = useState({});

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
    window.addEventListener('erp_ui_metadata_updated', loadMastersData);
    return () => window.removeEventListener('erp_ui_metadata_updated', loadMastersData);
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryAttributes(selectedCategory);
    }
  }, [selectedCategory, categories]);

  useEffect(() => {
    const refAttrs = attributes.filter(a => a.data_type === 'reference' && a.reference_table);
    refAttrs.forEach(a => {
      const tableKey = a.reference_table?.toLowerCase().trim();
      const config = MASTER_TABLE_MAP[tableKey];
      if (config && !masterOptions[tableKey]) {
        axios.get(`${API_BASE}${config.endpoint}`)
          .then(res => {
            const list = res.data?.results || res.data || [];
            setMasterOptions(prev => ({ ...prev, [tableKey]: list }));
          })
          .catch(() => {});
      }
    });
  }, [attributes]);

  async function loadMastersData() {
    try {
      const [catRes, itemRes, verRes, instRes, formsRes] = await Promise.all([
        MastersAPI.getCategories().catch(() => ({ data: [] })),
        MastersAPI.getItems().catch(() => ({ data: [] })),
        MastersAPI.getVersions().catch(() => ({ data: [] })),
        MastersAPI.getInstances().catch(() => ({ data: [] })),
        axios.get('http://127.0.0.1:8000/api/core/ui-forms/').catch(() => ({ data: [] })),
      ]);
      const loadedCats = catRes.data.results || catRes.data || [];
      setCategories(loadedCats);
      setItems(itemRes.data.results || itemRes.data || []);
      setVersions(verRes.data.results || verRes.data || []);
      setInstances(instRes.data.results || instRes.data || []);
      setUiForms(formsRes.data?.results || formsRes.data || []);

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
    const activeCat = categories.find((c) => c.code === selectedCategory || c.id === selectedCategory) || categories[0];
    if (!activeCat) {
      alert("Please select or create a category first.");
      return;
    }
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
      const catObj = categories.find((c) => c.code === selectedCategory || c.id === selectedCategory) || categories[0];
      const finalAttrs = { ...dynamicFormValues };

      customAttrPairs.forEach((pair) => {
        if (pair.key.trim() && pair.value.trim()) {
          const formattedKey = pair.key.trim().toLowerCase().replace(/\s+/g, '_');
          finalAttrs[formattedKey] = pair.value.trim();
        }
      });

      await MastersAPI.createItem({
        category: catObj?.id || selectedCategory,
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
  
  const activeItems = items.filter((i) => i.category_code === selectedCategory || (activeCategoryObj && i.category === activeCategoryObj.id));
  const filteredItems = activeItems.filter(i => 
    i.code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeInstances = instances.filter((inst) => inst.category_code === selectedCategory || (activeCategoryObj && inst.master_category === activeCategoryObj.id));
  const filteredInstances = activeInstances.filter(inst => 
    inst.code?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDisplayList = activeTab === 'legacy_json' ? filteredItems : filteredInstances;
  const totalPages = Math.ceil(currentDisplayList.length / itemsPerPage) || 1;
  const paginatedList = currentDisplayList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const storeTabs = [
    { id: 'legacy_json', label: 'JSON Store (3-Table)', icon: Database, count: items.length },
    { id: 'eav_converted', label: 'Converted EAV (3-Table)', icon: ArrowRightLeft, count: instances.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Page Header (Section 9 Specs) */}
      <PageHeader
        title="Dynamic Masters"
        description="Manage master categories, extracted EAV attributes, and configurable master data records."
        icon={Layers}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={FolderPlus} onClick={() => setCategoryModalOpen(false)} onClickCapture={() => setCategoryModalOpen(true)}>
              + Add Category
            </Button>
            <Button variant="secondary" icon={Sliders} onClick={() => setAttrModalOpen(true)}>
              + Add Attribute
            </Button>
            <Button variant="primary" icon={Plus} onClick={openCreateItemModal}>
              + Add Master Item
            </Button>
          </div>
        }
      />

      {/* Action Bar / Store View Selector */}
      <div className="standard-card p-2">
        <Tabs tabs={storeTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Step 1: Category Selection */}
      <div className="standard-card space-y-3">
        <div className="flex items-center justify-between">
          <label className="form-label text-xs uppercase tracking-wider text-[#1B4E9B] mb-0 font-bold">
            1. Select Master Category
          </label>
          <span className="helper-text">{categories.length} Categories Registered</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input font-bold text-xs max-w-xs"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.code}>
                {cat.name} ({cat.code})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar w-full flex-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.code
                    ? 'bg-[#EFF6FF] border-[#1B4E9B] text-[#1B4E9B] font-bold'
                    : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Attribute Definitions */}
      <div className="standard-card space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1B4E9B] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> 2. Extracted MasterAttribute Definitions
          </span>
          <span className="badge badge-info">{attributes.length} definitions</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {attributes.length === 0 ? (
            <div className="text-xs text-[#6B7280] italic py-2">
              No attribute definitions created for {activeCategoryObj?.name || 'this category'} yet. Click "+ Add Attribute" above.
            </div>
          ) : (
            attributes.map((attr) => (
              <span key={attr.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono">
                <span className="text-[#1F2937] font-bold">{attr.attribute_name}</span>
                <span className="text-[#1B4E9B]">({attr.data_type})</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Step 3: Master Data Table */}
      <div className="space-y-4">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={`Search ${activeCategoryObj?.name || 'master'} records...`}
        />

        <div className="standard-card p-0 overflow-hidden">
          <Table headers={['Code', 'Master Item Name', activeTab === 'legacy_json' ? 'JSON Attributes' : 'Converted EAV Attributes', 'Status', { label: 'Actions', align: 'right' }]}>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan="5">
                  <EmptyState
                    title="No master data records found"
                    message={`No ${activeTab === 'legacy_json' ? 'MasterItem' : 'MasterInstance'} rows for ${activeCategoryObj?.name || 'category'}.`}
                  />
                </td>
              </tr>
            ) : (
              paginatedList.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{row.code}</td>
                  <td className="font-semibold text-[#1F2937]">{row.name}</td>
                  <td>
                    {activeTab === 'legacy_json' ? (
                      <span className="font-mono text-xs text-[#16A34A] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E5E7EB]">
                        {row.attributes ? JSON.stringify(row.attributes) : 'Null'}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.attribute_values && row.attribute_values.length > 0 ? (
                          row.attribute_values.map((v) => (
                            <span key={v.id} className="text-[11px] font-mono bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded text-[#1B4E9B]">
                              {v.attribute_code}: {v.value_text || v.value_number || (v.value_boolean !== null ? String(v.value_boolean) : '')}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#6B7280] italic">No EAV rows</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <Badge variant={row.is_active !== false ? 'success' : 'danger'}>
                      {row.is_active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <IconButton variant="view" icon={Eye} onClick={() => openInspectModal(row)} title="Inspect Record" />
                      {activeTab === 'legacy_json' && (
                        <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteItem(row.id)} title="Delete Record" />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </Table>

          <div className="p-4 border-t border-[#E5E7EB]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={currentDisplayList.length}
              itemsPerPage={10}
            />
          </div>
        </div>
      </div>

      {/* Statutory Rule Versions Section */}
      <div className="standard-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="section-title">Statutory Rule Versions (MasterItemVersion)</h3>
            <p className="helper-text">Historical rate revisions and statutory audit versioning.</p>
          </div>
          <Button variant="secondary" icon={Plus} onClick={() => setVersionModalOpen(true)}>
            Add Rule Version
          </Button>
        </div>

        <Table headers={['Version ID', 'Master Item', 'Version No', 'Effective From', 'Effective To', 'Rule JSON Value', 'Remarks']}>
          {versions.length === 0 ? (
            <tr>
              <td colSpan="7">
                <EmptyState title="No statutory rule versions" message="No version history records logged." />
              </td>
            </tr>
          ) : (
            versions.map((ver) => (
              <tr key={ver.id}>
                <td className="font-mono text-[#1B4E9B] font-semibold">{ver.id}</td>
                <td className="font-semibold text-[#1F2937]">{ver.master_item_name || ver.master_item}</td>
                <td><Badge variant="info">v{ver.version_no}</Badge></td>
                <td className="text-[#16A34A] font-semibold">{ver.effective_from || '-'}</td>
                <td className="text-[#CA8A04] font-semibold">{ver.effective_to || 'Indefinite'}</td>
                <td className="font-mono text-[#16A34A] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E5E7EB]">
                  {JSON.stringify(ver.value)}
                </td>
                <td className="text-[#6B7280] italic">{ver.remarks || 'No remarks'}</td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* MODAL 1: Create MasterCategory */}
      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} size="md" title="Create MasterCategory">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div><label className="form-label">Category Code *</label><input type="text" required value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value })} className="form-input" placeholder="e.g. cat_raw_materials" /></div>
          <div><label className="form-label">Category Name *</label><input type="text" required value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="form-input" placeholder="e.g. Raw Chemical Materials" /></div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create MasterAttribute */}
      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} size="md" title={`Add MasterAttribute to Category: ${activeCategoryObj?.name}`}>
        <form onSubmit={handleCreateAttribute} className="space-y-4">
          <div><label className="form-label">Attribute Code *</label><input type="text" required value={newAttr.attribute_code} onChange={(e) => setNewAttr({ ...newAttr, attribute_code: e.target.value })} className="form-input" placeholder="e.g. purity_rating" /></div>
          <div><label className="form-label">Attribute Name *</label><input type="text" required value={newAttr.attribute_name} onChange={(e) => setNewAttr({ ...newAttr, attribute_name: e.target.value })} className="form-input" placeholder="e.g. Min Purity Rating" /></div>
          <div>
            <label className="form-label">Data Type *</label>
            <select value={newAttr.data_type} onChange={(e) => setNewAttr({ ...newAttr, data_type: e.target.value, reference_table: e.target.value === 'reference' ? 'master_items' : '' })} className="form-input">
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="boolean">Boolean</option>
              <option value="reference">Reference Foreign Key (FK)</option>
            </select>
          </div>
          {newAttr.data_type === 'reference' && (
            <div>
              <label className="form-label">Target Reference Master Table *</label>
              <select value={newAttr.reference_table} onChange={(e) => setNewAttr({ ...newAttr, reference_table: e.target.value })} className="form-input" required>
                <option value="companies">Companies / Entities</option>
                <option value="plants">Plants & Facilities</option>
                <option value="departments">Departments</option>
                <option value="designations">Designations</option>
                <option value="employees">Employees / Workforce</option>
                <option value="machines">Machines & Vehicles</option>
                <option value="vendors">Vendors</option>
                <option value="storage_locations">Storage Bins / Locations</option>
                <option value="master_categories">Master Categories</option>
                <option value="master_items">Master Items</option>
                <option value="process_types">Process Types</option>
              </select>
            </div>
          )}
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setAttrModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Attribute</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Create MasterItem */}
      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} size="md" title="Create MasterItem & Sync to MasterInstance">
        {uiForms.find(f => f.active && (f.form_name === `${selectedCategory}_form` || f.form_name === 'master_item_form' || f.form_name === 'add_item_form' || f.module === 'masters')) && (
          <div className="p-3 mb-4 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#1B4E9B] font-semibold">
              <Sparkles className="w-4 h-4 text-[#1B4E9B]" />
              <span>Dynamic Form Available from Form Builder</span>
            </div>
            <button
              type="button"
              onClick={() => setUseDynamicFormMode(!useDynamicFormMode)}
              className="text-[#1B4E9B] font-bold hover:underline"
            >
              {useDynamicFormMode ? 'Switch to Standard Form' : 'Use Dynamic Form'}
            </button>
          </div>
        )}

        {useDynamicFormMode && uiForms.find(f => f.active && (f.form_name === `${selectedCategory}_form` || f.form_name === 'master_item_form' || f.form_name === 'add_item_form' || f.module === 'masters')) ? (
          <GenericFormRenderer
            formConfig={uiForms.find(f => f.active && (f.form_name === `${selectedCategory}_form` || f.form_name === 'master_item_form' || f.form_name === 'add_item_form' || f.module === 'masters'))}
            onSubmit={async (formData) => {
              try {
                const catObj = categories.find((c) => c.code === selectedCategory || c.id === selectedCategory) || categories[0];
                await MastersAPI.createItem({
                  category: catObj?.id || selectedCategory,
                  code: formData.code || `ITM-${Date.now().toString().slice(-4)}`,
                  name: formData.name || formData.title || 'Dynamic Master Item',
                  attributes: formData,
                  values: formData,
                });
                setItemModalOpen(false);
                loadMastersData();
              } catch (err) {
                alert("Submission failed: " + (err.response?.data?.detail || err.message));
              }
            }}
            onCancel={() => setItemModalOpen(false)}
          />
        ) : (
          <form onSubmit={handleSaveItem} className="space-y-4">
            <div><label className="form-label">Item Code *</label><input type="text" required value={newItem.code} onChange={(e) => setNewItem({ ...newItem, code: e.target.value })} className="form-input" placeholder="e.g. RAW-CHEM-POLY-03" /></div>
            <div><label className="form-label">Item Name *</label><input type="text" required value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="form-input" placeholder="e.g. High-Grade Chemical Compound" /></div>

            {/* Dynamic Master Attributes Inputs */}
            {attributes.length > 0 ? (
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] space-y-3">
                <p className="text-xs font-bold text-[#1B4E9B] uppercase">Category Attributes</p>
                {attributes.map((attr) => {
                  const val = dynamicFormValues[attr.attribute_code] || '';
                  const refTable = attr.reference_table?.toLowerCase().trim();
                  const options = masterOptions[refTable] || [];

                  if (attr.data_type === 'reference') {
                    return (
                      <div key={attr.id} className="space-y-1">
                        <label className="form-label">{attr.attribute_name} {attr.is_required && '*'}</label>
                        <select
                          value={val}
                          onChange={(e) => setDynamicFormValues({ ...dynamicFormValues, [attr.attribute_code]: e.target.value })}
                          className="form-input"
                          required={attr.is_required}
                        >
                          <option value="">-- Select {attr.attribute_name} --</option>
                          {options.map((opt) => (
                            <option key={opt.id || opt.code} value={opt.id || opt.code}>
                              {opt.name || opt.title || opt.code || opt.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (attr.data_type === 'boolean') {
                    return (
                      <div key={attr.id} className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={attr.attribute_code}
                          checked={val === true || val === 'true'}
                          onChange={(e) => setDynamicFormValues({ ...dynamicFormValues, [attr.attribute_code]: e.target.checked })}
                          className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                        />
                        <label htmlFor={attr.attribute_code} className="text-xs text-[#374151] cursor-pointer font-medium">
                          {attr.attribute_name} {attr.is_required && '*'}
                        </label>
                      </div>
                    );
                  }

                  if (attr.data_type === 'date') {
                    return (
                      <div key={attr.id} className="space-y-1">
                        <label className="form-label">{attr.attribute_name} {attr.is_required && '*'}</label>
                        <input
                          type="date"
                          value={val}
                          onChange={(e) => setDynamicFormValues({ ...dynamicFormValues, [attr.attribute_code]: e.target.value })}
                          className="form-input"
                          required={attr.is_required}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={attr.id} className="space-y-1">
                      <label className="form-label">{attr.attribute_name} {attr.is_required && '*'}</label>
                      <input
                        type={attr.data_type === 'number' ? 'number' : 'text'}
                        min={attr.data_type === 'number' ? '0' : undefined}
                        step="any"
                        value={val}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (attr.data_type !== 'number' || value === '' || Number(value) >= 0) {
                            setDynamicFormValues({ ...dynamicFormValues, [attr.attribute_code]: value });
                          }
                        }}
                        className="form-input"
                        placeholder={`Enter ${attr.attribute_name}`}
                        required={attr.is_required}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1B4E9B] uppercase">Custom Master Attributes</p>
                <button
                  type="button"
                  onClick={() => setCustomAttrPairs([...customAttrPairs, { key: '', value: '' }])}
                  className="text-xs text-[#1B4E9B] hover:underline font-semibold"
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
                      className="text-[#DC2626] font-bold px-2 py-1"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setItemModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Item</Button>
          </div>
        </form>
        )}
      </Modal>

      {/* MODAL 4: Create Version */}
      <Modal isOpen={versionModalOpen} onClose={() => setVersionModalOpen(false)} size="md" title="Create Statutory Rule Version">
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
          <div><label className="form-label">Version Number *</label><input type="number" min="1" required value={newVersion.version_no} onChange={(e) => setNewVersion({ ...newVersion, version_no: parseInt(e.target.value) || 1 })} className="form-input" /></div>
          <div><label className="form-label">Rule Value (JSON) *</label><textarea required value={newVersion.value} onChange={(e) => setNewVersion({ ...newVersion, value: e.target.value })} className="form-input font-mono text-xs h-20"></textarea></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Effective From *</label><input type="date" required value={newVersion.effective_from} onChange={(e) => setNewVersion({ ...newVersion, effective_from: e.target.value })} className="form-input" /></div>
            <div><label className="form-label">Effective To</label><input type="date" value={newVersion.effective_to || ''} onChange={(e) => setNewVersion({ ...newVersion, effective_to: e.target.value })} className="form-input" /></div>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setVersionModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Version</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Inspect Record */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} size="md" title="Master Record Inspection">
        {selectedInspectRecord && (
          <div className="space-y-3">
            <div className="bg-[#F8FAFC] p-4 rounded-lg border border-[#E5E7EB] max-h-96 overflow-y-auto custom-scrollbar space-y-2">
              {Object.entries(selectedInspectRecord).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-[#E5E7EB] pb-1 text-xs">
                  <span className="font-semibold text-[#6B7280] capitalize">{key.replace(/_/g, ' ')}:</span>
                  <span className="font-mono text-[#1B4E9B] ml-4 text-right break-all">
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
