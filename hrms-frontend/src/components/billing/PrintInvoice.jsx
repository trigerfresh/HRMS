import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Alert, Button, Card, Table } from "react-bootstrap";
import { formatDDMMYYYY, numberToWords } from "../../utils/utils";
import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PrintInvoice = () => {
  const printData = useRef();
  const hasPrinted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [billData, setBillData] = useState({});
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = new URLSearchParams(location.search);
  const billInvNo = params.get("invoiceNo");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const getMonthName = (monthNumber) => {
    return new Date(0, monthNumber - 1).toLocaleString("en-US", {
      month: "long",
    });
  };

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    const invoiceNo = billInvNo;
    try {
      const res = await axios.get(`${API_URL}/api/bills/getInvoiceData`, {
        params: { invoiceNo },
        ...getAuthHeaders(),
      });

      // console.log(res.data.bills[0]);
      setBillData(res.data.bills[0]);
      setOrdersData(res.data.orders);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(e.response?.data?.message || "Failed to Fetch Receipt Data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      billData &&
      location.state?.autoPrint &&
      !hasPrinted.current
    ) {
      hasPrinted.current = true;
      handlePrint();
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [loading, billData]);

  const clientDetails = billData?.clientId || {};
  const billingCompany = billData?.clientId?.billingCompany || {};
  const billingCompanyBank = billData?.clientId?.companyBankName || {};
  const siteDetails = billData?.siteId || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Print Invoice - {clientDetails.companyName}
        </h1>
        <div className="page-actions">
          <Button variant="danger" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="success" onClick={() => navigate("/billing")}>
            Go Back
          </Button>
        </div>
      </div>
      <div ref={printData} className="print-area">
        <Card>
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <div>
              <div className="text-center form-subtitle my-3">TAX INVOICE</div>

              <Table borderless>
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontSize: "34px",
                        textAlign: "center",
                        color: "red",
                        fontWeight: 700,
                        backgroundColor: "#f0f2f5",
                        textTransform: "uppercase",
                      }}
                    >
                      {billingCompany?.companyName}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: 650,
                        backgroundColor: "#f0f2f5",
                      }}
                    >
                      SPECIALISED IN PROVIDING ALL TYPES OF SKILLED AND
                      UNSKILLED LABOUR SUPPLIER IN MIDC &amp; WAREHOUSE AREAS AT
                      PAN INDIA LEVEL SINCE 12 YRS
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        backgroundColor: "#f0f2f5",
                        fontWeight: "bold",
                      }}
                    >
                      {billingCompany?.address} City: {billingCompany?.city}{" "}
                      State: {billingCompany?.state} Pincode:{" "}
                      {billingCompany?.pinCode}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        backgroundColor: "#f0f2f5",
                        fontWeight: "bold",
                      }}
                    >
                      E-mail: {billingCompany?.emailId} | Ph.:{" "}
                      {billingCompany?.contactNo}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        backgroundColor: "#f0f2f5",
                        fontWeight: "bold",
                      }}
                    >
                      GSTIN: {billingCompany?.gstNo}
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
                    <td style={{ padding: 0, verticalAlign: "top" }}>
                      <Table bordered className="mb-0">
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Name:</td>
                            <td>{clientDetails?.companyName}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Add.:</td>
                            <td>{clientDetails?.address}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>GSTIN:</td>
                            <td>{clientDetails?.gstNo}</td>
                          </tr>
                          <tr>
                            <td colSpan={2} style={{ fontWeight: 600 }}>
                              KINDLY ATTN: {clientDetails?.contactPersonName}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>

                    <td style={{ padding: 0, verticalAlign: "top" }}>
                      <Table bordered className="mb-0">
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Invoice No.</td>
                            <td style={{ fontWeight: 600 }}>
                              {billData?.invoiceNo}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Invoice Date</td>
                            <td style={{ fontWeight: 600 }}>
                              {formatDDMMYYYY(billData?.invoiceDate)}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Invoice Type</td>
                            <td>State</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Site Name</td>
                            <td style={{ fontWeight: 600 }}>
                              {siteDetails?.siteName}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600 }}>Services Period</td>
                            <td style={{ fontWeight: 600 }}>
                              {getMonthName(billData?.invoiceMonth)} -{" "}
                              {billData?.invoiceYear}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                </tbody>
              </Table>

              <Table bordered>
                <thead>
                  {billData?.billingType === "Transporter" ? (
                    <tr>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Sr. No.
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        DATE
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        HSN / SAC
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        FROM
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        TO
                      </th>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        LR NO
                      </th>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        VEHICLE NO
                      </th>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        WEIGHT
                      </th>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        INVOICE NO
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Net Amount
                      </th>
                    </tr>
                  ) : (
                    <tr>
                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Sr. No.
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Item Description
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        HSN / SAC
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        QTY / TON / DAY
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Rate
                      </th>

                      <th
                        style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}
                      >
                        Net Amount
                      </th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {ordersData.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={8}>No data found</td>
                    </tr>
                  ) : (
                    ordersData.map((o, i) =>
                      billData?.billingType === "Transporter" ? (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{formatDDMMYYYY(o.tbDate)}</td>
                          <td>{o.sacCode}</td>
                          <td>{o.tbFrom || 0}</td>
                          <td>{o.tbTo || 0}</td>
                          <td>{o.lrNo || 0}</td>
                          <td>{o.tbVehicleNo || 0}</td>
                          <td>{o.tbWeight || 0}</td>
                          <td>{o.tbInvoiceNo || 0}</td>
                          <td>{o.total}</td>
                        </tr>
                      ) : (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{o.type}</td>
                          <td>{o.sacCode}</td>
                          <td>{o.totalNos || 0}</td>
                          <td>{o.costPerHead || 0}</td>
                          <td>{o.total}</td>
                        </tr>
                      ),
                    )
                  )}
                  <tr>
                    {billData?.billingType === "Transporter" ? (
                      <td colSpan="8"></td>
                    ) : (
                      <td colSpan="4"></td>
                    )}
                    <td colSpan="2" style={{ padding: 0 }}>
                      <Table bordered className="mb-0">
                        <thead>
                          <tr>
                            <th
                              style={{
                                fontWeight: 600,
                                backgroundColor: "#f0f2f5",
                              }}
                            >
                              Summary
                            </th>

                            <th
                              style={{
                                fontWeight: 600,
                                backgroundColor: "#f0f2f5",
                              }}
                            >
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Gross Amount</td>
                            <td>₹ {billData?.totalCostWithoutGST || 0}</td>
                          </tr>
                          <tr>
                            <td>IGST</td>
                            <td>₹ {billData?.igst || 0}</td>
                          </tr>
                          <tr>
                            <td>SGST</td>
                            <td>₹ {billData?.sgst || 0}</td>
                          </tr>
                          <tr>
                            <td>CGST</td>
                            <td>₹ {billData?.cgst || 0}</td>
                          </tr>
                          <tr className="fw-bold">
                            <td>Net Amount</td>
                            <td>₹ {billData?.finalAmount || 0}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Table bordered>
                <tbody>
                  <tr>
                    <td
                      colSpan={1}
                      style={{
                        backgroundColor: "#f0f2f5",
                        fontWeight: 600,
                        width: "30%",
                      }}
                    >
                      Amount in Words
                    </td>
                    <td colSpan={2} style={{ fontWeight: 600 }}>
                      {numberToWords(billData?.finalAmount)}
                    </td>
                  </tr>

                  <tr>
                    <td style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                      Terms &amp; Conditions
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        backgroundColor: "#f0f2f5",
                        // width: "200px",
                      }}
                    >
                      Bank Details
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        width: "30%",
                        textTransform: "uppercase",
                      }}
                    >
                      FOR {billingCompany?.companyName}
                    </td>
                  </tr>

                  <tr>
                    <td rowSpan={4}>
                      <div className="mb-5">
                        * Payment is requested by crossed ordered cheque/DD in
                        favor of{" "}
                        <span style={{ fontWeight: 600 }}>
                          M/s{" "}
                          <span
                            style={{
                              textTransform: "uppercase",
                            }}
                          >
                            {billingCompany?.companyName}
                          </span>
                        </span>{" "}
                        or made by NEFT/RTGS.
                      </div>
                      <div>
                        * Subject to Jurisdiction of NAVI MUMBAI court only.
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      NAME - {billingCompanyBank.bankName}
                    </td>
                    <td rowSpan={4} className="position-relative">
                      <div className="mb-5"></div>
                      <div
                        style={{
                          fontWeight: 600,
                          position: "absolute",
                          bottom: "10px",
                        }}
                      >
                        Authorised Signatory
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td>A/c No.: {billingCompanyBank.accountNo}</td>
                  </tr>

                  <tr>
                    <td>Branch : {billingCompanyBank.branchCity}</td>
                  </tr>

                  <tr>
                    <td>IFSC Code : {billingCompanyBank.ifsc}</td>
                  </tr>

                  <tr>
                    <td
                      colSpan={3}
                      style={{ fontWeight: 600, textAlign: "center" }}
                    >
                      This is a computer generated Invoice
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrintInvoice;
