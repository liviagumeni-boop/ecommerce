import React from "react";

export type FilterOption = {
  label: string;
  value: string | number;
};

export type FilterField =
  | {
      type: "search";
      key: string;
      placeholder: string;
    }
  | {
      type: "select";
      key: string;
      placeholder: string;
      options: FilterOption[];
    };

type TableFiltersProps = {
  values: Record<string, any>;
  onChange: (key: string, value: string) => void;
  onReset: () => void;
  fields: FilterField[];
  extra?: React.ReactNode; // e.g. a date-range picker, or any custom control
  actions?: React.ReactNode;
};

const TableFilters: React.FC<TableFiltersProps> = ({
  values,
  onChange,
  onReset,
  fields,
  extra,
  actions,
}) => {
  return (
    <div className="d-flex flex-wrap gap-2 align-items-center mb-4">
      {fields.map((field) => {
        if (field.type === "search") {
          return (
            <input
              key={field.key}
              className="form-control"
              placeholder={field.placeholder}
              style={{ maxWidth: 220 }}
              value={values[field.key] ?? ""}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          );
        }

        // select
        return (
          <select
            key={field.key}
            className="form-control"
            style={{ maxWidth: 180 }}
            value={values[field.key] ?? ""}
            onChange={(e) => onChange(field.key, e.target.value)}
          >
            <option value="">{field.placeholder}</option>
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      })}

      {extra}

      <button className="btn btn-outline-secondary btn-sm" onClick={onReset}>
        Reset
      </button>

      {actions && <div className="ms-auto d-flex gap-2">{actions}</div>}
    </div>
  );
};

export default TableFilters;