import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const MIS = () => {
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
            <th>SL.NO.</th>
            <th>PARTICULARS</th>
            <th>AMOUNT</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>1</td>
            <td className="fw-bold">INVOICE VALUE</td>
            <td>60702.24</td>
          </tr>
          <tr>
            <td>2</td>
            <td className="fw-bold">TAX VALUE</td>
            <td>9260</td>
          </tr>
          <tr>
            <td>3</td>
            <td className="fw-bold">SALARY AMOUNT</td>
            <td>35272</td>
          </tr>
          <tr>
            <td>4</td>
            <td className="fw-bold">EPF AMOUNT(Employer)</td>
            <td>5255</td>
          </tr>
          <tr>
            <td>5</td>
            <td className="fw-bold">EPF ADMIN CHARGES</td>
            <td>53</td>
          </tr>
          <tr>
            <td>6</td>
            <td className="fw-bold">ESIC AMOUNT(Employer)</td>
            <td>1314</td>
          </tr>
          <tr>
            <td>7</td>
            <td className="fw-bold">PT AMOUNT(Employer)</td>
            <td>0</td>
          </tr>
          <tr>
            <td>8</td>
            <td className="fw-bold">
              ANY OTHER EXPENSES(Commission, Accom, Trv etc)
            </td>
            <td>0</td>
          </tr>
          <tr>
            <td>9</td>
            <td className="fw-bold">BALANCE</td>
            <td>9548</td>
          </tr>
          <tr>
            <td>10</td>
            <td className="fw-bold">SERVICE CHARGE</td>
            <td>4248</td>
          </tr>
          <tr>
            <td>11</td>
            <td className="fw-bold">NET PROFIT</td>
            <td>
              <b>13796</b>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default MIS;
