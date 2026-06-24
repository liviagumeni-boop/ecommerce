import React from "react";

const Select = ({ label, options = [], value, onChange }) => {
  return (
    <div className="mb-3">
      {label && (
        <label className="form-label">
          {label}
        </label>
      )}

      <select
        className="form-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select option</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;