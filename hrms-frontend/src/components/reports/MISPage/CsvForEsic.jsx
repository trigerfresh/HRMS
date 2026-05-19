import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const CsvForEsic = () => {
  return (
    <div>
      <Card.Header className="page-header mb-4">
        <div className="text-start">
          <p className="fs-5 fw-normal mb-0">Print - Techbharti</p>
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
            <th>IP</th>
            <th>INSURED NAME</th>
            <th>PRESENT DAYS</th>
            <th>GROSS</th>
            <th>EE CONTRIBUTION</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>12546987</td>
            <td>Saurabh J.</td>
            <td>29</td>
            <td>20212.91</td>
            <td>152</td>
          </tr>
          <tr>
            <td></td>
            <td>Ruchita D</td>
            <td>29</td>
            <td>20212.91</td>
            <td>152</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default CsvForEsic;
