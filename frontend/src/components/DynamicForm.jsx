import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Loader2 } from 'lucide-react';

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
  storage: { endpoint: '/api/core/storage-locations/', label: 'Storage Bins' },
  master_categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  categories: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  category: { endpoint: '/api/masters/categories/', label: 'Master Categories' },
  master_items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  items: { endpoint: '/api/masters/items/', label: 'Master Items' },
  item: { endpoint: '/api/masters/items/', label: 'Master Items' },
  process_types: { endpoint: '/api/process/types/', label: 'Process Types' },
};

export default function DynamicForm({ definitions = [], onSubmit, onCancel, plants = [], departments = [], employees = [] }) {
  const [formData, setFormData] = useState({
    plant: plants[0]?.id || '',
    department: departments[0]?.id || '',
    performed_by: employees[0]?.id || '',
    remarks: '',
    values: {},
  });

  const [masterOptions, setMasterOptions] = useState({});
  const [loadingMasters, setLoadingMasters] = useState({});

  useEffect(() => {
    const refDefs = definitions.filter((d) => d.data_type === 'reference' && d.reference_table);
    const tablesToFetch = [...new Set(refDefs.map((d) => d.reference_table?.toLowerCase().trim()).filter(Boolean))];

    tablesToFetch.forEach((tableKey) => {
      const config = MASTER_TABLE_MAP[tableKey];
      if (config && !masterOptions[tableKey]) {
        setLoadingMasters((prev) => ({ ...prev, [tableKey]: true }));
        axios
          .get(`${API_BASE}${config.endpoint}`)
          .then((res) => {
            const list = res.data?.results || res.data || [];
            setMasterOptions((prev) => ({ ...prev, [tableKey]: list }));
          })
          .catch((err) => {
            console.error(`Failed to fetch options for ${tableKey}:`, err);
            setMasterOptions((prev) => ({ ...prev, [tableKey]: [] }));
          })
          .finally(() => {
            setLoadingMasters((prev) => ({ ...prev, [tableKey]: false }));
          });
      }
    });
  }, [definitions]);

  const handleValueChange = (code, val) => {
    setFormData((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [code]: val,
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#E5E7EB]">
        <div>
          <label className="form-label">Plant *</label>
          <select
            value={formData.plant}
            onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
            className="form-input"
            required
          >
            <option value="">Select Plant</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Department *</label>
          <select
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="form-input"
            required
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="form-label">Performed By (Employee)</label>
          <select
            value={formData.performed_by}
            onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
            className="form-input"
          >
            <option value="">Select Operator / Officer</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation_title || 'Employee'})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h4 className="text-[13px] font-bold text-[#1B4E9B] uppercase tracking-wider">Dynamic Process Attributes</h4>

        {definitions.length === 0 && (
          <p className="text-xs text-[#6B7280] italic">No dynamic attributes defined for this process type yet.</p>
        )}

        {definitions.map((def) => {
          const val = formData.values[def.attribute_code] || '';
          const refTable = def.reference_table?.toLowerCase().trim();

          if (def.data_type === 'reference') {
            const options = masterOptions[refTable] || def.reference_options || [];
            const isLoading = loadingMasters[refTable];
            const masterInfo = MASTER_TABLE_MAP[refTable];

            return (
              <div key={def.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">
                    {def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}
                  </label>
                  {refTable && (
                    <span className="text-[10px] text-[#1B4E9B] font-semibold flex items-center gap-1">
                      <Database className="w-3 h-3" /> {masterInfo?.label || refTable}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={val}
                    onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                    className="form-input"
                    required={def.is_required}
                    disabled={isLoading}
                  >
                    <option value="">
                      {isLoading ? 'Loading master records...' : `-- Select ${def.attribute_name} --`}
                    </option>
                    {options.map((opt) => {
                      const id = opt.id || opt.code;
                      const displayTitle = opt.name || opt.title || opt.code || opt.id;
                      return (
                        <option key={id} value={id}>
                          {displayTitle} ({id})
                        </option>
                      );
                    })}
                  </select>
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B4E9B] absolute right-8 top-2.5 pointer-events-none" />
                  )}
                </div>
              </div>
            );
          }

          if (def.data_type === 'number' || def.data_type === 'currency') {
            return (
              <div key={def.id}>
                <label className="form-label">
                  {def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleValueChange(def.attribute_code, value);
                  }}
                  className="form-input"
                  required={def.is_required}
                  placeholder="0.00"
                />
              </div>
            );
          }

          if (def.data_type === 'date') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
                <input
                  type="date"
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'time') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
                <input
                  type="time"
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'datetime') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
                <input
                  type="datetime-local"
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'boolean') {
            return (
              <div key={def.id} className="flex items-center gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id={def.attribute_code}
                  checked={val === true || val === 'true' || val === 1}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.checked)}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                <label htmlFor={def.attribute_code} className="text-[13px] text-[#374151] font-medium cursor-pointer">
                  {def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}
                </label>
              </div>
            );
          }

          if (def.data_type === 'select') {
            const selectOptions = (def.options || '').split(',').map(o => o.trim()).filter(Boolean);
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
                <select
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  required={def.is_required}
                >
                  <option value="">Select {def.attribute_name}</option>
                  {selectOptions.map((opt, idx) => (
                    <option key={idx} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );
          }

          if (def.data_type === 'textarea') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
                <textarea
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  rows="3"
                  required={def.is_required}
                  placeholder={`Enter ${def.attribute_name}`}
                ></textarea>
              </div>
            );
          }

          return (
            <div key={def.id}>
              <label className="form-label">{def.attribute_name} {def.is_required && <span className="text-[#DC2626]">*</span>}</label>
              <input
                type="text"
                value={val}
                onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                className="form-input"
                placeholder={`Enter ${def.attribute_name}`}
                required={def.is_required}
              />
            </div>
          );
        })}

        <div>
          <label className="form-label">Remarks / Notes</label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="form-input"
            rows="2"
            placeholder="Additional notes for this process instance..."
          ></textarea>
        </div>
      </div>

      <div className="modal-footer">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Launch Instance</button>
      </div>
    </form>
  );
}
