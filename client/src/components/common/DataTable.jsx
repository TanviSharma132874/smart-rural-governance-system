function DataTable({ columns, rows, emptyMessage = "No records found." }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white text-left text-sm">
          <thead className="bg-slate-50 text-ink-900">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-bold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, rowIndex) => (
                <tr key={row.id || rowIndex} className="border-t border-slate-100">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 align-top text-ink-800">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-ink-800">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
