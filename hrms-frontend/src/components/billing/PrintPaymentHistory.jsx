import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Alert, Button, Card, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDDMMYYYY } from "../../utils/utils";
import { useRef } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PrintPaymentHistory = () => {
  const printData = useRef();
  const hasPrinted = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [billData, setBillData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = new URLSearchParams(window.location.search);

  const raw = params.get("paydata");
  const billInvNo = params.get("billdata");
  const paydata = raw ? JSON.parse(raw) : {};
  //   console.log(paydata);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_URL}/api/bills/getDataByInvNo?billInvNo=${billInvNo}`,
        { ...getAuthHeaders() },
      );

      //   console.log(res.data.bills[0]);
      setBillData(res.data.bills[0]);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        // alert(e.response?.data?.message || "Failed to Fetch Receipt Data");
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Print Receipt</h1>
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
            <Table bordered>
              <tbody style={{ fontSize: "18px" }}>
                <tr className="text-center">
                  <td colSpan={8}>
                    <b>
                      GST:
                      {billData?.siteId?.clientId?.billingCompany?.gstNo}/ PAN
                      NO:
                      {billData?.siteId?.clientId?.billingCompany?.panNo}
                    </b>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4}>
                    <b>Invoice No: </b> {billData?.invoiceNo}
                    <br />
                    <b>Invoice Date: </b>{" "}
                    {formatDDMMYYYY(billData?.invoiceDate)}
                    <br />
                  </td>
                  <td colSpan={4}>
                    <b>State: </b>{" "}
                    {billData?.siteId?.clientId?.billingCompany?.regionState}
                    <br />
                    <b>State Code: </b>
                    {billData?.siteId?.clientId?.billingCompany?.stateCode}
                  </td>
                </tr>
                <tr className="text-center">
                  <td colSpan={8}>
                    <b>RECEIPT </b>
                  </td>
                </tr>
                <tr>
                  <td colSpan={8}>
                    Received from{" "}
                    <b>{billData?.siteId?.clientId?.companyName}</b> a sum of Rs{" "}
                    <b>{paydata.paidAmount}</b>/- (in{" "}
                    <b>{paydata.transactionType}</b>) dated{" "}
                    <b>{formatDDMMYYYY(paydata.paymentDate)}</b> being the
                    payment against invoice <b>{billData?.invoiceNo}</b>
                  </td>
                </tr>
                <tr>
                  <td colSpan={4} className="align-top">
                    Depositor Signature
                    <br />
                    <b>Name: </b>
                    <br />
                    <b>Date: </b>
                  </td>
                  <td colSpan={4} className="text-center">
                    Receiver Signature
                    <div className="py-5"></div>
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrintPaymentHistory;
