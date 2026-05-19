import React from "react";
import { Alert, Card, Table } from "react-bootstrap";
import { FaEye, FaPen, FaTrashAlt } from "react-icons/fa";

const ClientList = ({ clients, onEdit, onDelete, onView, loading, error }) => {
  return (
    <Card className="card table-card">
      {loading ? (
        <Alert variant="warning" className="mb-0 text-center">
          Loading clients...
        </Alert>
      ) : error ? (
        <Alert variant="danger" className="mb-0 text-center">
          {error}
        </Alert>
      ) : (
        <Table hover responsive bordered className="">
          <thead className="table-secondary">
            <tr>
              <th>Sr No.</th>
              <th>Client Name</th>
              <th>Contact</th>
              <th>Person/Email</th>
              <th>City</th>
              <th>State/Pincode</th>
              <th>Created Detail</th>
              <th>Total Sites</th>
              <th>Total Employee</th>
              <th>Billing company</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.length > 0 ? (
              clients.map((client, index) => (
                <tr key={client._id}>
                  <td>{index + 1}</td>
                  <td>{client.companyName || ""}</td>
                  <td>{client.contactPersonName || ""}</td>
                  <td>{client.emailId || ""}</td>
                  <td>{client.city || ""}</td>
                  <td>
                    {`${client.state || ""} ${client.pincode || ""}`.trim() ||
                      ""}
                  </td>
                  <td>
                    {client.created_by} <br />
                    <span className="date-text">
                      {new Date(client.created_on).toLocaleDateString("en-GB")}
                    </span>
                  </td>
                  <td className="count-cell">{client.totalSites || 0}</td>
                  <td className="count-cell">{client.totalEmployees || 0}</td>
                  <td>{client.billingCompany || ""}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-btn view"
                        onClick={() => onView(client)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="icon-btn edit"
                        onClick={() => onEdit(client._id)}
                        title="Edit Client"
                      >
                        <FaPen />
                      </button>
                      <button
                        className="icon-btn delete"
                        onClick={() => onDelete(client._id)}
                        title="Delete Client"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr className="text-center">
                <td colSpan={11}>No data found</td>
              </tr>
            )}
          </tbody>
        </Table>
      )}
    </Card>
  );
};

export default ClientList;
