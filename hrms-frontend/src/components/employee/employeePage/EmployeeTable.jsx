import React from "react";
import { Alert, Table } from "react-bootstrap";

const EmployeeTable = ({
  loading,
  error,
  employees,
  onEdit,
  onUpdateSalary,
  onChangeStatus,
  onDelete,
}) => {
  return (
    <div className="table-responsive">
      {loading ? (
        <Alert variant="warning" className="mb-0 text-center">
          Loading clients...
        </Alert>
      ) : error ? (
        <Alert variant="danger" className="mb-0 text-center">
          {error}
        </Alert>
      ) : (
        <Table hover bordered responsive className="employee-table">
          <thead className="table-secondary">
            <tr>
              <th>Sr No.</th>
              <th>Code & Name</th>
              <th>Designation</th>
              <th>Client</th>
              <th>Site</th>
              <th>Created Detail</th>
              <th>Salary Detail</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr className="text-center">
                <td colSpan={9}>No data found</td>
              </tr>
            ) : (
              employees.map((emp, index) => (
                <tr key={emp._id}>
                  <td>{index + 1}</td> {/* Sr No. */}
                  <td>
                    Code: {emp.employeeCode} <br />
                    {emp.initial} {emp.firstName} {emp.lastName} <br />
                    {emp.uanNo && `UAN No: ${emp.uanNo}`} <br />
                    {emp.esisNo && `ESIS No: ${emp.esisNo}`}
                  </td>
                  <td>{emp.designation}</td>
                  <td>{emp.client?.companyName || "N/A"}</td>
                  <td>
                    {emp.location?.clientCode
                      ? "Client Code: " + emp.location?.clientCode
                      : "N/A"}
                    <br />
                    {emp.location?.siteName
                      ? "Site Name: " + emp.location?.siteName
                      : "N/A"}
                  </td>
                  <td>
                    {emp.created_by?.name} <br />
                    {new Date(emp.created_on).toLocaleDateString("en-GB")}
                  </td>
                  <td className="salary-detail">Rs.{emp.salary || "0"}</td>
                  <td>
                    <span
                      className={`status-badge status-${emp.status.toLowerCase()}`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="tb-action-btn edit"
                        onClick={() => onEdit(emp)}
                      >
                        Edit
                      </button>
                      <button
                        className="tb-action-btn update"
                        onClick={() => onUpdateSalary(emp._id)}
                      >
                        Update Salary
                      </button>
                      <button
                        className="tb-action-btn change"
                        onClick={() => onChangeStatus(emp)}
                      >
                        Change Status
                      </button>
                      <button
                        className="tb-action-btn delete"
                        onClick={() => onDelete(emp._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
};

export default EmployeeTable;
