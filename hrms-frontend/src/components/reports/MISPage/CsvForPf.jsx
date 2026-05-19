import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const CsvForPf = () => {
  return (
    <div>
      <Card.Header className="page-header mb-4">
        <div className="text-start">
          <p className="fs-5 fw-normal mb-0">Print Salary Sheet - Techbharti</p>
          <p className="fs-5 fw-normal mb-0">Month: </p>
        </div>
        <div className="page-actions">
          <Button variant="danger">Print</Button>
          <Button variant="success">Download</Button>
        </div>
      </Card.Header>
      <Table bordered>
        <thead>
          <tr>
            <th>UAN</th>
            <th>NAME AS PER AADHAR/UAN</th>
            <th>GROSS WAGES</th>
            <th>EPS WAGES</th>
            <th>ESLI WAGES</th>
            <th>EE</th>
            <th>ER</th>
            <th>ER EDLI</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td></td>
            <td>Saurabh J.</td>
            <td>20212.91</td>
            <td>20212.91</td>
            <td>20212.91</td>
            <td>2426</td>
            <td>1684</td>
            <td>742</td>
          </tr>
          <tr>
            <td></td>
            <td>Ruchita D</td>
            <td>20212.91</td>
            <td>20212.91</td>
            <td>20212.91</td>
            <td>2426</td>
            <td>1684</td>
            <td>742</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default CsvForPf;
