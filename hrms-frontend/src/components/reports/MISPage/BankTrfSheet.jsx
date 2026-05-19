import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const BankTrfSheet = () => {
  return (
    <div>
      <Card.Header className="page-header mb-4">
        <div className="text-start">
          <p className="fs-5 fw-normal mb-0">
            Print Bank TRF Sheet - Techbharti
          </p>
          <p className="fs-5 fw-normal mb-0">Month: </p>
        </div>
        <div className="page-actions">
          <Button variant="danger">Print</Button>
          <Button variant="success">Download</Button>
        </div>
      </Card.Header>
      <Table bordered responsive hover>
        <thead className="table-secondary">
          <tr>
            <th>Sr No</th>
            <th>Employee Name</th>
            <th>Beneficiary Name</th>
            <th>Bank Name</th>
            <th>Account Number</th>
            <th>IFSC Code</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Ruchita D</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td>17635.76</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default BankTrfSheet;
