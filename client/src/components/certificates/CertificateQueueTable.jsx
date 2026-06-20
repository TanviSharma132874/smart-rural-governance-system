import DataTable from "../common/DataTable";
import StatusBadge from "../common/StatusBadge";

function CertificateQueueTable({ certificates, onSelect, emptyMessage = "No certificate records found." }) {
  return (
    <DataTable
      onRowClick={onSelect}
      columns={[
        {
          key: "applicationNumber",
          label: "Application",
          render: (row) => (
            <div>
              <p className="font-semibold text-ink-950">{row.applicationNumber}</p>
              <p className="mt-1 text-xs text-ink-800">{row.certificateType}</p>
            </div>
          ),
        },
        {
          key: "applicant",
          label: "Applicant",
          render: (row) => (
            <div>
              <p className="font-semibold text-ink-950">{row.applicant?.name || "Citizen"}</p>
              <p className="mt-1 text-xs text-ink-800">{row.district}</p>
            </div>
          ),
        },
        {
          key: "department",
          label: "Department",
          render: (row) => (
            <span className="text-sm text-ink-900">
              {row.department || "Not Assigned"}
            </span>
          ),
        },
        {
          key: "status",
          label: "Workflow",
          render: (row) => <StatusBadge value={row.status} />,
        },
      ]}
      rows={certificates}
      emptyMessage={emptyMessage}
    />
  );
}

export default CertificateQueueTable;