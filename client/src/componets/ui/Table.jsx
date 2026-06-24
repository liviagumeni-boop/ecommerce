import React from "react";

const Table = ({ columns, data }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">

        <thead className="table-light">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="fw-semibold">
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((val, j) => (
                <td key={j}>
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
};

export default Table;