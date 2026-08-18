import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MastersAPI, CoreAPI } from '../api';
import { useConfiguration } from '../context/ConfigurationContext';
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

export default function DynamicMasters() {
  const { forms: uiForms } = useConfiguration();
  const [activeTab, setActiveTab] = useState('eav_instances'); // 'eav_instances' | 'item_templates'

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [versions, setVersions] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [instances, setInstances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [plants, setPlants] = useState([]);

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

  const [newCat, setNewCat] = useState({ code: '', name: '', owning_department: '', remarks: '' });
  const [newAttr, setNewAttr] = useState({
    attribute_code: '',
    attribute_name: '',
    data_type: 'text',
    reference_table: '',
    is_required: false,
    sort_order: 1,
    remarks: '',
  });

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

  async function loadMastersData() {
    try {
      const [catRes, itemRes, verRes, instRes, deptRes, plantRes] = await Promise.all([
        MastersAPI.getCategories().catch(() => ({ data: [] })),
        MastersAPI.getItems().catch(() => ({ data: [] })),
        MastersAPI.getVersions().catch(() => ({ data: [] })),
        MastersAPI.getInstances().catch(() => ({ data: [] })),
        CoreAPI.getDepartments().catch(() => ({ data: [] })),
        CoreAPI.getPlants().catch(() => ({ data: [] })),
      ]);
      const loadedCats = catRes.data?.results || catRes.data || [];
      setCategories(loadedCats);
      setItems(itemRes.data?.results || itemRes.data || []);
      setVersions(verRes.data?.results || verRes.data || []);
      setInstances(instRes.data?.results || instRes.data || []);
      setDepartments(deptRes.data?.results || deptRes.data || []);
      setPlants(plantRes.data?.results || plantRes.data || []);

      if (loadedCats.length > 0 && !selectedCategory) {
        setSelectedCategory(loadedCats[0].code);
      }
    } catch (err) {
      console.error("Error loading masters data:", err);
    }
  }

  async function loadCategoryAttributes(catCode) {
    const activeCat = categories.find((c) => c.code === catCode || c.id === catCode);
    if (!activeCat) return;
    try {
      const attrRes = await MastersAPI.getAttributes({ master_category: activeCat.id });
      const attrs = attrRes.data?.results || attrRes.data || [];
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
      setNewCat({ code: '', name: '', owning_department: '', remarks: '' });
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
    setItemModalOpen(true);
  };

  const openInspectModal = (record) => {
    setSelectedInspectRecord(record);
    setViewModalOpen(true);
  };

  const activeCategoryObj = categories.find((c) => c.code === selectedCategory || c.id === selectedCategory);

  const activeItems = items.filter((i) => i.category_code === selectedCategory || i.category === selectedCategory || (activeCategoryObj && i.category === activeCategoryObj.id));
  const filteredItems = activeItems.filter(i =>
    i.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeInstances = instances.filter((inst) => inst.category_code === selectedCategory || inst.master_category === selectedCategory || (activeCategoryObj && inst.master_category === activeCategoryObj.id));
  const filteredInstances = activeInstances.filter(inst =>
    inst.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentDisplayList = activeTab === 'item_templates' ? filteredItems : filteredInstances;
  const totalPages = Math.ceil(currentDisplayList.length / itemsPerPage) || 1;
  const paginatedList = currentDisplayList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const storeTabs = [
    { id: 'eav_instances', label: 'EAV Master Instances (masters_masterinstance)', icon: ArrowRightLeft, count: activeInstances.length },
    { id: 'item_templates', label: 'Master Item Templates (masters_masteritem)', icon: Database, count: activeItems.length },
  ];

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, selectedCategory, currentPage]);

  const handleSingleDelete = async (id) => {
    if (!window.confirm(`Delete record (${id})?`)) return;
    try {
      if (activeTab === 'eav_instances') {
        await axios.delete(`http://127.0.0.1:8000/api/masters/instances/${id}/`);
      } else {
        await MastersAPI.deleteItem(id);
      }
      loadMastersData();
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected record(s)?`)) return;
    try {
      for (const id of selectedIds) {
        if (activeTab === 'eav_instances') {
          await axios.delete(`http://127.0.0.1:8000/api/masters/instances/${id}/`);
        } else {
          await MastersAPI.deleteItem(id);
        }
      }
      setSelectedIds([]);
      loadMastersData();
    } catch (err) { alert("Bulk delete failed: " + err.message); }
  };

  const SelectAllHeader = (
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
  );

  // Helper to extract typed EAV attribute value for a row from masters_masterattributevalue
  const getEavAttributeValue = (instance, attribute) => {
    const valuesArray = instance.attribute_values || [];
    const foundVal = valuesArray.find(
      (v) =>
        v.attribute_code === attribute.attribute_code ||
        v.master_attribute === attribute.id
    );

    if (foundVal) {
      if (attribute.data_type === 'boolean' || (foundVal.value_boolean !== null && foundVal.value_boolean !== undefined)) {
        return foundVal.value_boolean ? 'true' : 'false';
      }
      if (foundVal.value_number !== null && foundVal.value_number !== undefined) {
        return String(foundVal.value_number);
      }
      if (foundVal.value_date) return String(foundVal.value_date);
      if (foundVal.value_datetime) return String(foundVal.value_datetime);
      if (foundVal.value_text) return String(foundVal.value_text);
      if (foundVal.value_reference_id) return String(foundVal.value_reference_id);
    }

    // Fallback: check raw attributes dictionary on instance or item
    if (instance.attributes && typeof instance.attributes === 'object') {
      const rawVal = instance.attributes[attribute.attribute_code];
      if (rawVal !== undefined && rawVal !== null) {
        return typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
      }
    }

    return '-';
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <PageHeader
        title="Dynamic Masters (EAV Engine)"
        description="Manage master categories, extracted EAV attributes, template items, and typed attribute instance records."
        icon={Layers}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={FolderPlus} onClick={() => setCategoryModalOpen(true)}>
              + Add Category
            </Button>
            <Button variant="secondary" icon={Sliders} onClick={() => setAttrModalOpen(true)}>
              + Add Attribute
            </Button>
            <Button variant="primary" icon={Plus} onClick={openCreateItemModal}>
              + Add Master Instance
            </Button>
          </div>
        }
      />

      {/* Tab Switcher: EAV Instances vs Master Item Templates */}
      <div className="standard-card p-2">
        <Tabs tabs={storeTabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Step 1: Category Selector (masters_mastercategory) */}
      <div className="standard-card space-y-3">
        <div className="flex items-center justify-between">
          <label className="form-label text-xs uppercase tracking-wider text-[#1B4E9B] mb-0 font-bold flex items-center gap-1.5">
            <Database className="w-4 h-4" /> 1. Select Category (masters_mastercategory)
          </label>
          <span className="helper-text">{categories.length} Categories Registered</span>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-input font-bold text-xs max-w-xs"
          >
            {categories.map((cat) => (
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
                    ? 'bg-[#EFF6FF] border-[#1B4E9B] text-[#1B4E9B] font-bold shadow-sm'
                    : 'bg-[#F8FAFC] border-[#E5E7EB] text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Attribute Definitions (masters_masterattribute) */}
      <div className="standard-card space-y-3">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#1B4E9B] flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> 2. Extracted Attributes (masters_masterattribute)
          </span>
          <span className="badge badge-info">{attributes.length} definitions</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {attributes.length === 0 ? (
            <div className="text-xs text-[#6B7280] italic py-2">
              No attribute definitions created for {activeCategoryObj?.name || 'this category'} yet. Click "+ Add Attribute" to define fields.
            </div>
          ) : (
            attributes.map((attr) => (
              <span
                key={attr.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-xs font-mono shadow-2xs"
              >
                <span className="text-[#1F2937] font-bold">{attr.attribute_name}</span>
                <span className="text-[#1B4E9B] font-semibold">({attr.data_type})</span>
                {attr.is_required && <span className="text-[#DC2626] font-bold">*</span>}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Step 3: Master Data Table with Dynamic Columns */}
      <div className="space-y-4">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={`Search ${activeCategoryObj?.name || 'master'} records...`}
        />

        {selectedIds.length > 0 && (
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg flex items-center justify-between animate-fade-in">
            <span className="text-xs font-bold text-[#1B4E9B]">
              {selectedIds.length} master record(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedIds([])} className="text-xs text-[#6B7280] hover:text-[#1F2937] font-semibold underline px-2">
                Clear Selection
              </button>
              <Button variant="danger" icon={Trash2} onClick={handleBulkDelete}>
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          </div>
        )}

        <div className="standard-card p-0 overflow-hidden">
          {activeTab === 'eav_instances' ? (
            // TAB 2: EAV Master Instances (Dynamic Columns from masters_masterattributevalue)
            <Table
              headers={[
                SelectAllHeader,
                'Code',
                'Master Instance Name',
                'Plant',
                'Department',
                ...attributes.map((attr) => attr.attribute_name),
                'Status',
                { label: 'Actions', align: 'right' },
              ]}
            >
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7 + attributes.length}>
                    <EmptyState
                      title="No master instance records found"
                      message={`No EAV MasterInstance rows for category '${activeCategoryObj?.name || selectedCategory}'.`}
                    />
                  </td>
                </tr>
              ) : (
                paginatedList.map((row) => (
                  <tr key={row.id} className={selectedIds.includes(row.id) ? 'bg-[#F0F9FF]' : ''}>
                    <td className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => {
                          if (selectedIds.includes(row.id)) setSelectedIds(selectedIds.filter(i => i !== row.id));
                          else setSelectedIds([...selectedIds, row.id]);
                        }}
                        className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                      />
                    </td>
                    <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{row.code}</td>
                    <td className="font-semibold text-[#1F2937]">{row.name}</td>
                    <td className="text-xs text-[#374151]">{row.plant_name || row.plant || '-'}</td>
                    <td className="text-xs text-[#374151]">{row.department_name || row.department || '-'}</td>
                    
                    {/* Render Typed Values for Dynamic Attribute Columns */}
                    {attributes.map((attr) => {
                      const valStr = getEavAttributeValue(row, attr);
                      return (
                        <td key={attr.id} className="font-mono text-xs">
                          {valStr === 'true' ? (
                            <Badge variant="success">True</Badge>
                          ) : valStr === 'false' ? (
                            <Badge variant="neutral">False</Badge>
                          ) : (
                            <span className="bg-[#EFF6FF] text-[#1B4E9B] border border-[#BFDBFE] px-2 py-0.5 rounded">
                              {valStr}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td>
                      <Badge variant={row.is_active !== false ? 'success' : 'danger'}>
                        {row.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton variant="view" icon={Eye} onClick={() => openInspectModal(row)} title="Inspect Instance" />
                        <IconButton variant="delete" icon={Trash2} onClick={() => handleSingleDelete(row.id)} title="Delete Instance" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          ) : (
            // TAB 1: Master Item Templates (JSON Schema in masters_masteritem)
            <Table headers={[SelectAllHeader, 'Code', 'Template Name', 'Category', 'Plant', 'Department', 'JSON Attributes', 'Status', { label: 'Actions', align: 'right' }]}>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <EmptyState
                      title="No master item templates found"
                      message={`No MasterItem template records logged for '${activeCategoryObj?.name || selectedCategory}'.`}
                    />
                  </td>
                </tr>
              ) : (
                paginatedList.map((row) => (
                  <tr key={row.id} className={selectedIds.includes(row.id) ? 'bg-[#F0F9FF]' : ''}>
                    <td className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => {
                          if (selectedIds.includes(row.id)) setSelectedIds(selectedIds.filter(i => i !== row.id));
                          else setSelectedIds([...selectedIds, row.id]);
                        }}
                        className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB] cursor-pointer"
                      />
                    </td>
                    <td className="font-mono text-xs text-[#1B4E9B] font-semibold">{row.code}</td>
                    <td className="font-semibold text-[#1F2937]">{row.name}</td>
                    <td className="text-xs text-[#374151]">{row.category_name || row.category || '-'}</td>
                    <td className="text-xs text-[#374151]">{row.plant_name || row.plant || '-'}</td>
                    <td className="text-xs text-[#374151]">{row.department_name || row.department || '-'}</td>
                    <td>
                      <span className="font-mono text-xs text-[#16A34A] bg-[#F8FAFC] px-2 py-1 rounded border border-[#E5E7EB]">
                        {row.attributes ? JSON.stringify(row.attributes) : 'Null'}
                      </span>
                    </td>
                    <td>
                      <Badge variant={row.is_active !== false ? 'success' : 'danger'}>
                        {row.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconButton variant="view" icon={Eye} onClick={() => openInspectModal(row)} title="Inspect Template" />
                        <IconButton variant="delete" icon={Trash2} onClick={() => handleDeleteItem(row.id)} title="Delete Template" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </Table>
          )}

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

      {/* Statutory Rule Versions Section (masters_masteritemversion) */}
      <div className="standard-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="section-title">Statutory Rule Versions (masters_masteritemversion)</h3>
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

      {/* MODAL 1: Create MasterCategory (masters_mastercategory) */}
      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} size="md" title="Create Master Category (masters_mastercategory)">
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="form-label">Category Code *</label>
            <input
              type="text"
              required
              value={newCat.code}
              onChange={(e) => setNewCat({ ...newCat, code: e.target.value })}
              className="form-input"
              placeholder="e.g. cat_raw_materials"
            />
          </div>
          <div>
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              required
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="form-input"
              placeholder="e.g. Raw Chemical Materials"
            />
          </div>
          <div>
            <label className="form-label">Owning Department (core_department)</label>
            <select
              value={newCat.owning_department}
              onChange={(e) => setNewCat({ ...newCat, owning_department: e.target.value })}
              className="form-input"
            >
              <option value="">-- General / Unassigned --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Remarks</label>
            <textarea
              value={newCat.remarks}
              onChange={(e) => setNewCat({ ...newCat, remarks: e.target.value })}
              className="form-input"
              rows="2"
              placeholder="Description of category scope"
            ></textarea>
          </div>
          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Create Category</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create MasterAttribute (masters_masterattribute) */}
      <Modal isOpen={attrModalOpen} onClose={() => setAttrModalOpen(false)} size="md" title={`Add Master Attribute to: ${activeCategoryObj?.name}`}>
        <form onSubmit={handleCreateAttribute} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Attribute Code *</label>
              <input
                type="text"
                required
                value={newAttr.attribute_code}
                onChange={(e) => setNewAttr({ ...newAttr, attribute_code: e.target.value })}
                className="form-input"
                placeholder="e.g. purity_rating"
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
                placeholder="e.g. Min Purity Rating"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Data Type *</label>
              <select
                value={newAttr.data_type}
                onChange={(e) => setNewAttr({ ...newAttr, data_type: e.target.value, reference_table: e.target.value === 'reference' ? 'master_items' : '' })}
                className="form-input"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="number">Number / Decimal</option>
                <option value="date">Date</option>
                <option value="datetime">DateTime</option>
                <option value="boolean">Boolean</option>
                <option value="select">Dropdown Select</option>
                <option value="reference">Reference Foreign Key (FK)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Sort Order</label>
              <input
                type="number"
                value={newAttr.sort_order}
                onChange={(e) => setNewAttr({ ...newAttr, sort_order: parseInt(e.target.value) || 1 })}
                className="form-input"
              />
            </div>
          </div>

          {newAttr.data_type === 'reference' && (
            <div>
              <label className="form-label">Target Reference Table *</label>
              <select
                value={newAttr.reference_table}
                onChange={(e) => setNewAttr({ ...newAttr, reference_table: e.target.value })}
                className="form-input"
                required
              >
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

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="attr_is_required"
              checked={newAttr.is_required}
              onChange={(e) => setNewAttr({ ...newAttr, is_required: e.target.checked })}
              className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
            />
            <label htmlFor="attr_is_required" className="text-xs text-[#374151] cursor-pointer font-medium">
              Is Required Field
            </label>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={() => setAttrModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save Attribute</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Create Master Instance & Attribute Values */}
      <Modal isOpen={itemModalOpen} onClose={() => setItemModalOpen(false)} size="md" title={`Create Master Instance [${activeCategoryObj?.name || selectedCategory}]`}>
        <GenericFormRenderer
          formConfig={
            uiForms.find(f => f.active && (f.form_name === `${selectedCategory}_form` || f.form_name === 'master_item_form' || f.form_name === 'add_item_form' || f.module === 'masters')) || {
              title: `Add Master Instance [${selectedCategory?.toUpperCase() || 'GENERAL'}]`,
              module: 'masters',
              fields: [
                { field_name: 'Instance Code', field_code: 'code', field_type: 'text', required: true, field_order: 1 },
                { field_name: 'Instance Name', field_code: 'name', field_type: 'text', required: true, field_order: 2 },
                { field_name: 'Plant Facility', field_code: 'plant', field_type: 'reference', reference_table: 'plants', required: false, field_order: 3 },
                { field_name: 'Department Unit', field_code: 'department', field_type: 'reference', reference_table: 'departments', required: false, field_order: 4 },
                ...attributes.map((attr, idx) => ({
                  field_name: attr.attribute_name,
                  field_code: attr.attribute_code,
                  field_type: attr.data_type === 'reference' ? 'reference' : attr.data_type === 'number' ? 'number' : attr.data_type === 'boolean' ? 'boolean' : attr.data_type === 'date' ? 'date' : 'text',
                  reference_table: attr.reference_table,
                  required: Boolean(attr.is_required),
                  field_order: idx + 5,
                })),
              ]
            }
          }
          onSubmit={async (formData) => {
            try {
              const catObj = categories.find((c) => c.code === selectedCategory || c.id === selectedCategory) || categories[0];
              await MastersAPI.createItem({
                category: catObj?.id || selectedCategory,
                code: formData.code || `MSC-${Date.now().toString().slice(-4)}`,
                name: formData.name || formData.title || 'Dynamic Master Instance',
                plant: formData.plant || null,
                department: formData.department || null,
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
      </Modal>

      {/* MODAL 4: Create Version (masters_masteritemversion) */}
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
          <div>
            <label className="form-label">Version Number *</label>
            <input type="number" min="1" required value={newVersion.version_no} onChange={(e) => setNewVersion({ ...newVersion, version_no: parseInt(e.target.value) || 1 })} className="form-input" />
          </div>
          <div>
            <label className="form-label">Rule Value (JSON) *</label>
            <textarea required value={newVersion.value} onChange={(e) => setNewVersion({ ...newVersion, value: e.target.value })} className="form-input font-mono text-xs h-20"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Effective From *</label>
              <input type="date" required value={newVersion.effective_from} onChange={(e) => setNewVersion({ ...newVersion, effective_from: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Effective To</label>
              <input type="date" value={newVersion.effective_to || ''} onChange={(e) => setNewVersion({ ...newVersion, effective_to: e.target.value })} className="form-input" />
            </div>
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
