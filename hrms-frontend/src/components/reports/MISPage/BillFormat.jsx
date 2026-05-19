import React from "react";
import { Button, Card, Table } from "react-bootstrap";

const BillFormat = () => {
  const exampleRows = [
    // Example rows
    {
      id: 1,
      item: "ACCOUNT EXECUTIVE",
      hsn: "956871",
      qty: 58,
      rate: "21500.00",
      net: "₹ 40,425.82",
    },
    {
      id: 2,
      item: "PF Charges",
      hsn: "956871",
      qty: 2,
      rate: "",
      net: "₹ 5,255.36",
    },
    {
      id: 3,
      item: "OT Charges",
      hsn: "956871",
      qty: 2,
      rate: "",
      net: "₹ 200.00",
    },
    {
      id: 4,
      item: "ESIC Charges",
      hsn: "956871",
      qty: 2,
      rate: "",
      net: "₹ 1,313.84",
    },
    {
      id: 5,
      item: "Service Charges",
      hsn: "956871",
      qty: 2,
      rate: "",
      net: "₹ 4,247.56",
    },
  ];
  return (
    <div>
      <Card.Header className="page-header">
        <p className="fs-5 fw-normal mb-0">Print Invoice - Techbharti </p>
        <Button variant="danger">Print</Button>
      </Card.Header>
      <div className="text-center form-subtitle my-3">TAX INVOICE</div>
      <Table bordered>
        <tbody className="">
          <tr>
            <td
              style={{
                fontSize: "34px",
                textAlign: "center",
                color: "red",
                fontWeight: "600",
                backgroundColor: "#f0f2f5",
              }}
            >
              TECHBHARTI
            </td>
          </tr>
          <tr>
            <td
              style={{
                textAlign: "center",
                fontWeight: "600",
                backgroundColor: "#f0f2f5",
              }}
            >
              SPECIALISED IN PROVIDING ALL TYPES OF SKILLED AND UNSKILLED LABOUR
              SUPPLIER IN MIDC &amp; WAREHOUSE AREAS AT PAN INDIA LEVEL SINCE 12
              YRS
            </td>
          </tr>
          <tr>
            <td
              style={{
                textAlign: "center",
                backgroundColor: "#f0f2f5",
                fontWeight: 600,
              }}
            >
              <b style={{ fontWeight: "bold" }}>City:</b> Navi Mumbai,{" "}
              <b style={{ fontWeight: "bold" }}>State:</b> Maharashtra,{" "}
              <b style={{ fontWeight: "bold" }}>Pincode:</b> 410701
            </td>
          </tr>

          <tr>
            <td
              style={{
                padding: 0,
                fontWeight: 600,
                textAlign: "center",
                backgroundColor: "#f0f2f5",
              }}
            >
              E-mail: techb@gmail.com | Ph.: 1234567890
            </td>
          </tr>

          <tr>
            <td
              style={{
                textAlign: "center",
                backgroundColor: "#f0f2f5",
                fontWeight: 600,
              }}
            >
              GSTIN:
            </td>
          </tr>
        </tbody>
      </Table>
      <Table bordered>
        <tbody>
          <tr>
            <td
              style={{
                fontWeight: 600,
                backgroundColor: "#f0f2f5",
                textAlign: "center",
              }}
            >
              Billing Client Details
            </td>
            <td
              style={{
                fontWeight: 600,
                backgroundColor: "#f0f2f5",
                textAlign: "center",
                width: "300px",
              }}
            >
              Invoice Details
            </td>
          </tr>
          <tr>
            <td
              style={{
                padding: "0px", // add spacing from top
                verticalAlign: "top",
              }}
            >
              <Table bordered className=" mb-0">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Name:</td>
                    <td style={{ fontWeight: 600 }}>TechBharti</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Add.:</td>
                    <td>mahape</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>GSTIN:</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan="2" style={{ fontWeight: 600 }}>
                      KINDLY ATTN: test
                    </td>
                  </tr>
                </tbody>
              </Table>
            </td>
            <td style={{ padding: "0px", verticalAlign: "top" }}>
              <table className="table mb-0">
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Invoice No.</td>
                    <td style={{ fontWeight: 600 }}>SV / 1778 / 2025-26</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Invoice Date</td>
                    <td style={{ fontWeight: 600 }}>27/10/2025</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Invoice Type</td>
                    <td>State</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Site Name</td>
                    <td style={{ fontWeight: 600 }}>Ghansoli</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Services Period</td>
                    <td style={{ fontWeight: 600 }}>October - 2025</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </Table>
      <Table bordered style={{ width: "100%" }}>
        <thead>
          <tr>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              Sr. No.
            </th>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              Item Description
            </th>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              HSN / SAC
            </th>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              QTY / TON / DAY
            </th>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              Rate
            </th>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              Net Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {exampleRows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.item}</td>
              <td>{row.hsn}</td>
              <td>{row.qty}</td>
              <td>{row.rate}</td>
              <td style={{ fontWeight: 600 }}>{row.net}</td>
            </tr>
          ))}

          <tr>
            <td colSpan="3"></td>
            <td colSpan="3" style={{ padding: 0, border: "none" }}>
              <Table bordered style={{ width: "100%" }} className="mb-0">
                <thead>
                  <tr>
                    <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                      Summary
                    </th>
                    <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Gross Amount</td>
                    <td>₹ 51443</td>
                  </tr>
                  <tr>
                    <td>IGST</td>
                    <td>₹ 0</td>
                  </tr>
                  <tr>
                    <td>SGST</td>
                    <td>₹ 4630</td>
                  </tr>
                  <tr>
                    <td>CGST</td>
                    <td>₹ 4630</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Net Amount</td>
                    <td style={{ fontWeight: 600 }}>₹ 60703</td>
                  </tr>
                </tbody>
              </Table>
            </td>
          </tr>
        </tbody>
      </Table>
      <Table bordered style={{ width: "100%" }}>
        <tbody>
          {/* Amount in Words */}
          <tr>
            <td
              colSpan={1}
              style={{
                backgroundColor: "#f0f2f5",
                fontWeight: 600,
                width: "200px",
              }}
            >
              Amount in Words
            </td>
            <td colSpan={9} style={{ fontWeight: 600 }}>
              SIXTY THOUSANDS SEVEN HUNDRED AND THREE ONLY
            </td>
          </tr>

          {/* Headers: Terms, Bank, For TechBharti */}
          <tr>
            <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
              Terms &amp; Conditions
            </th>
            <th
              style={{
                fontWeight: 600,
                backgroundColor: "#f0f2f5",
                width: "200px",
              }}
            >
              Bank Details
            </th>
            <th style={{ fontWeight: 600, width: "300px" }}>FOR TECHBHARTI</th>
          </tr>

          {/* Rows */}
          <tr>
            <td rowSpan={4}>
              <div className="mb-5">
                * Payment is requested by crossed ordered cheque/DD in favor of{" "}
                <span style={{ fontWeight: 600 }}>M/s TECHBHARTI</span> or made
                by NEFT/RTGS.
              </div>
              <div>* Subject to Jurisdiction of NAVI MUMBAI court only.</div>
            </td>
            <td style={{ fontWeight: 600 }}>NAME - Indian Bank</td>
            <td style={{ border: "none !important" }}></td>
          </tr>

          <tr>
            <td>A/c No.</td>
            <td style={{ border: "none !important" }}></td>
          </tr>

          <tr>
            <td>Branch :</td>
            <td style={{ border: "none !important" }}></td>
          </tr>

          <tr>
            <td
              style={{
                borderLeft: "none !important",
                borderBottom: "none !important",
              }}
            >
              IFSC Code :
            </td>
            <td
              style={{
                fontWeight: 600,
                borderLeft: "none !important",
                borderBottom: "none !important",
                borderRight: "none !important",
              }}
            >
              Authorised Signatory
            </td>
          </tr>

          {/* Footer note */}
          <tr>
            <td colSpan={3} style={{ fontWeight: 600, textAlign: "center" }}>
              This is a computer generated Invoice
            </td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

export default BillFormat;
