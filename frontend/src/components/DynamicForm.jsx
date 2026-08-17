import React, { useState } from 'react';

export default function DynamicForm({ definitions, onSubmit, onCancel, plants, departments, employees }) {
  const [formData, setFormData] = useState({
    plant: plants[0]?.id || '',
    department: departments[0]?.id || '',
    performed_by: employees[0]?.id || '',
    remarks: '',
    values: {},
  });

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
    <form onSubmit={handleSubmit} className="space-y-4">
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

          if (def.data_type === 'reference') {
            const refOptions = def.reference_options || [];

            return (
              <div key={def.id}>
                <label className="form-label">
                  {def.attribute_name} {def.is_required && '*'}
                </label>

                <select
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  required={def.is_required}
                >
                  <option value="">Select {def.attribute_name}</option>
                  {refOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (def.data_type === 'number') {
            return (
              <div key={def.id}>
                <label className="form-label">
                  {def.attribute_name} {def.is_required && '*'}
                </label>

                <input
                  type="number"
                  min="0"
                  step="any"
                  value={val}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || Number(value) >= 0) {
                      handleValueChange(def.attribute_code, value);
                    }
                  }}
                  className="form-input"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'date') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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
                  checked={!!val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.checked)}
                  className="w-4 h-4 rounded text-[#1B4E9B] border-[#D1D5DB]"
                />
                <label htmlFor={def.attribute_code} className="text-[13px] text-[#374151] font-medium cursor-pointer">
                  {def.attribute_name}
                </label>
              </div>
            );
          }

          if (def.data_type === 'select') {
            const selectOptions = (def.options || '').split(',').map(o => o.trim()).filter(Boolean);
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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

          if (def.data_type === 'email') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
                <input
                  type="email"
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  placeholder="user@company.com"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'phone') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
                <input
                  type="tel"
                  value={val}
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.value)}
                  className="form-input"
                  placeholder="+91 98765 43210"
                  required={def.is_required}
                />
              </div>
            );
          }

          if (def.data_type === 'currency') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} (₹) {def.is_required && '*'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#6B7280] font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={val}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || Number(value) >= 0) {
                        handleValueChange(def.attribute_code, value);
                      }
                    }}
                    className="form-input pl-8"
                    placeholder="0.00"
                    required={def.is_required}
                  />
                </div>
              </div>
            );
          }

          if (def.data_type === 'file') {
            return (
              <div key={def.id}>
                <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
                <input
                  type="file"
                  onChange={(e) => handleValueChange(def.attribute_code, e.target.files[0]?.name || '')}
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1B4E9B] file:text-white"
                  required={def.is_required}
                />
              </div>
            );
          }

          return (
            <div key={def.id}>
              <label className="form-label">{def.attribute_name} {def.is_required && '*'}</label>
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
