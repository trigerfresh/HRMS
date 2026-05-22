import React from 'react'
import { Alert, Table } from 'react-bootstrap'

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
                <tr key={emp.id}>
                  <td>{index + 1}</td> {/* Sr No. */}
                  <td>
                    Code: {emp.employee_code} <br />
                    {emp.initial} {emp.first_name} {emp.last_name} <br />
                    {emp.uan_no && `UAN No: ${emp.uan_no}`} <br />
                    {emp.esisNo && `ESIS No: ${emp.esisNo}`}
                  </td>
                  <td>{emp.rank}</td>
                  <td>{emp.company_name || 'N/A'}</td>
                  <td>
                    {emp.client_id ? 'Client Code: ' + emp.client_id : 'N/A'}
                    <br />
                    {emp.site_name ? 'Site Name: ' + emp.site_name : 'N/A'}
                  </td>
                  <td>
                    {emp.created_by?.name} <br />
                    {new Date(emp.created_on).toLocaleDateString('en-GB')}
                  </td>
                  <td className="salary-detail">
                    Rs.{emp.basic_salary || '0'}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${emp?.status?.toLowerCase()}`}
                    >
                      {emp?.em_status}
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
                        onClick={() => onUpdateSalary(emp.id)}
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
                        onClick={() => onDelete(emp.id)}
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
  )
}

export default EmployeeTable
