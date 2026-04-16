import React from 'react';
import { Icon } from './IconHelper';

const DataTable = ({
  headers,
  rows,
  onSelectRow,
  selectedRows,
  renderRow,
  showCheckbox = false,
  onSelectAll,
  selectAllChecked,
  className = ''
}) => {
  return (
    <div className={`w-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900 shadow-sm ${className}`}>
      {/* Table Header */}
      <div className="flex items-center bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 gap-4">
        {showCheckbox && (
          <input
            type="checkbox"
            onChange={(e) => onSelectAll?.(e.target.checked)}
            checked={selectAllChecked}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
          />
        )}
        {headers.map((header, idx) => (
          <div
            key={idx}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
            style={{ flex: header.flex || 1 }}
          >
            {header.label}
          </div>
        ))}
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {rows && rows.length > 0 ? (
          rows.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center p-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              onClick={() => onSelectRow?.(row)}
            >
              {renderRow ? renderRow(row) : <span className="text-sm text-slate-600">{JSON.stringify(row)}</span>}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center p-8 text-slate-500 dark:text-slate-400">
            <p className="text-sm">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;
