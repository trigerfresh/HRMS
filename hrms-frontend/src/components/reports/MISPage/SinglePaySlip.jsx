import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const SinglePaySlip = () => {
  return (
    <div>
      <Card.Header className="page-header mb-4">
        <div className="text-start">
          <p className="fs-5 fw-normal mb-0">Print Pay Slip - Techbharti</p>
          <p className="fs-5 fw-normal mb-0">Month: </p>
        </div>
        <div className="page-actions">
          <Button variant="danger">Print</Button>
          <Button variant="success">Download</Button>
        </div>
      </Card.Header>
      <Table bordered className="fw-bold">
        <thead>
          <tr>
            <td colSpan={8}>
              <div style={{ textAlign: "center", color: "red" }}>
                TechBharti
              </div>
              <div style={{ textAlign: "center" }}>Navi Mumbai - 410701</div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={8} align="center">
              Pay Slip for the Month of October 2025
            </td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder">
              Employee Name :
            </td>
            <td colSpan={3} className="noborder">
              Ruchita D
            </td>
            <td className="noborder">Emp. Code :</td>
            <td className="noborder">4792</td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder">
              Site Name
            </td>
            <td colSpan={3} className="noborder">
              Ghansoli
            </td>
            <td className="noborder">Designation</td>
            <td className="noborder">ACCOUNT EXECUTIVE</td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder">
              DOJ
            </td>
            <td colSpan={3} className="noborder">
              2025-10-27
            </td>
            <td className="noborder">UAN</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder">
              Month Days
            </td>
            <td colSpan={3} className="noborder">
              31
            </td>
            <td className="noborder">ESIC IP</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder">
              Payable Days
            </td>
            <td colSpan={3} className="noborder">
              29
            </td>
            <td className="noborder">DOB</td>
            <td className="noborder">2003-01-16</td>
          </tr>
          <tr>
            <td colSpan={3} className="noborder"></td>
            <td colSpan={3} className="noborder"></td>
            <td className="noborder">PAN</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td className="noborder"></td>
            <td className="noborder">PL</td>
            <td className="noborder">SL</td>
            <td className="noborder">CL</td>
            <td className="noborder">Work Days</td>
            <td className="noborder">29</td>
            <td className="noborder">Aadhar No</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td className="noborder">O/Bal</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">Weekly Offs</td>
            <td className="noborder">4</td>
            <td className="noborder">Bank Name</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td className="noborder">Earned</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">Paid Hol</td>
            <td className="noborder">4</td>
            <td className="noborder">Account No.</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td className="noborder">Avail</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">Paid Leave</td>
            <td className="noborder">0</td>
            <td className="noborder">IFSC Code</td>
            <td className="noborder"></td>
          </tr>
          <tr>
            <td className="noborder">C/Bal</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">0</td>
            <td className="noborder">Absent Days</td>
            <td className="noborder">3</td>
            <td className="noborder">Insurance No.</td>
            <td className="noborder">0</td>
          </tr>
          <tr>
            <td colSpan={8}>
              <table className="table table-bordered" style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td colSpan={2}>Earnings</td>
                    <td>Payable</td>
                    <td>Earned</td>
                    <td colSpan={2}>Deductions</td>
                    <td colSpan={2}>Amount</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>BASIC + VDA</td>
                    <td>20000</td>
                    <td>18709.68</td>
                    <td colSpan={2}>PF</td>
                    <td colSpan={2}>2425.55</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>SPL ALLOWANCE</td>
                    <td>0</td>
                    <td>0</td>
                    <td colSpan={2}>ESIC</td>
                    <td colSpan={2}>151.60</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>HRA</td>
                    <td>1500</td>
                    <td>1403.23</td>
                    <td colSpan={2}>PT</td>
                    <td colSpan={2}>0.00</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>OTHER ALLOWANCE</td>
                    <td>0</td>
                    <td>0</td>
                    <td colSpan={2}>LWF</td>
                    <td colSpan={2}>0.00</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>LWW</td>
                    <td>0</td>
                    <td>0</td>
                    <td colSpan={2}>Uniform/ID</td>
                    <td colSpan={2}>0</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>BONUS</td>
                    <td>0</td>
                    <td>0</td>
                    <td colSpan={2}>Advance</td>
                    <td colSpan={2}>0.00</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>OT ALLOWANCE</td>
                    <td>100</td>
                    <td>100</td>
                    <td colSpan={2}>Total Deductions</td>
                    <td colSpan={2}>2577.15</td>
                  </tr>
                  <tr>
                    <td colSpan={2}>Total Earnings</td>
                    <td>21500</td>
                    <td>20212.91</td>
                    <td colSpan={2}>Net Salary</td>
                    <td colSpan={2}>17635.76</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default SinglePaySlip;
