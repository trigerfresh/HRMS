import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import FilterPanel from "../../utils/FilterPanel";
import { FaPlus, FaPrint, FaSearch, FaTrashAlt } from "react-icons/fa";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import CreateNewBill from "../../components/billing/CreateNewBill";
import CreateNewTranspBill from "../../components/billing/CreateNewTranspBill";
import { formatDDMMYYYY, toFixed2 } from "../../utils/utils";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE_URL = `${API_URL}/api/bills`;

const formatForInput = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
};

const BillingPage = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [gstAmount, setGstAmount] = useState(0);
  const [gstAmountWithoutGST, setGstAmountWithoutGST] = useState(0);
  const [finalAmtWithGST, setFinalAmtWithGST] = useState(0);
  const [totalBills, setTotalBills] = useState(0);
  const [recieveAmtData, setReceiveAmtData] = useState(null);
  const [paymentHisData, setPaymentHisData] = useState([]);
  // const [totalBillsAmount, setTotalBillsAmount] = useState(0);
  const [paymentRecAmt, setPaymentRecAmt] = useState(0);
  const [paymentPendAmt, setPaymentPendAmt] = useState(0);
  const [showNewBill, setShowNewBill] = useState(false);
  const [showNewTranspBill, setShowNewTranspBill] = useState(false);
  const [showReceiveAmt, setShowReceiveAmt] = useState(false);
  const [showInvoiceChange, setShowInvoiceChange] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [RAvalidationErrors, setRAValidationErrors] = useState({});
  const [ICvalidationErrors, setICValidationErrors] = useState({});
  const [gstFilter, setGstFilter] = useState("all"); // "all" | "gst" | "non-gst"

  const [receiveForm, setReceiveForm] = useState({
    amount: "",
    paymentDate: "",
    transactionType: "Cash",
    transactionID: "",
    tds: "",
    bankName: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNo: "",
    invoiceDate: "",
    invoiceFrom: "",
    invoiceTo: "",
  });

  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [searchFields, setSearchFields] = useState([
    { field: "invoiceNo", keyword: "" },
  ]);
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const searchOptions = [
    { value: "invoiceNo", label: "Invoice No" },
    { value: "clientName", label: "Client Name" },
    { value: "clientCode", label: "Client Code" },
    { value: "clientEmailId", label: "Client Email ID" },
    { value: "salesPersonName", label: "Sales Person Name" },
    { value: "siteName", label: "Location Name" },
    { value: "siteContactPerson", label: "Branch Person Name" },
  ];

  const fetchBills = async () => {
    // console.log(selectedMonth, selectedYear, searchFields);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Build query params for search and date filters
      const params = new URLSearchParams();
      if (searchFields && searchFields.length > 0) {
        params.append("searchFields", JSON.stringify(searchFields));
      }

      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);

      const response = await fetch(`${API_BASE_URL}/?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch bills data");
      }

      const result = await response.json();
      // console.log(result.data);
      setBills(result.data);
      // setTotalBills(result.count || 0);
      // setTotalBillsAmount(result.totalSum || 0);
      // setPaymentPendAmt(result.totalPending || 0);
      // setPaymentRecAmt(result.totalPaid || 0);
      // console.log(result);
    } catch (error) {
      console.error("Error fetching bills data:", error);
      setError(error.response?.data?.message || "Failed to fetch bills data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    fetchBills();
  }, [searchFields, selectedMonth, selectedYear]);

  const handleSearch = () => {
    fetchBills();
  };

  const handleReset = () => {
    setSearchFields([{ field: "clientCode", keyword: "" }]); // Reset search fields
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    fetchBills();
  };

  const filteredBills = bills.filter((bill) => {
    const cgst = Number(bill.cgst || 0);
    const sgst = Number(bill.sgst || 0);
    const igst = Number(bill.igst || 0);

    if (gstFilter === "gst") {
      return cgst > 0 || sgst > 0 || igst > 0;
    }

    if (gstFilter === "non-gst") {
      return cgst === 0 && sgst === 0 && igst === 0;
    }

    return true;
  });

  // const { gstAmount, gstAmountWithoutGST, finalAmtWithGST } = useMemo(() => {
  //   if (gstFilter !== "gst") {
  //     return {
  //       gstAmount: 0,
  //       gstAmountWithoutGST: 0,
  //       finalAmtWithGST: 0,
  //     };
  //   }

  //   return filteredBills.reduce(
  //     (acc, bill) => {
  //       const cgst = Number(bill.cgst || 0);
  //       const sgst = Number(bill.sgst || 0);
  //       const igst = Number(bill.igst || 0);

  //       const gstTotal = cgst + sgst + igst;
  //       const amountWithoutGST = Number(bill.totalCostWithoutGST || 0);
  //       const finalAmount = Number(bill.finalAmount || 0);

  //       acc.gstAmount += gstTotal;
  //       acc.gstAmountWithoutGST += amountWithoutGST;
  //       acc.finalAmtWithGST += finalAmount;

  //       return acc;
  //     },
  //     { gstAmount: 0, gstAmountWithoutGST: 0, finalAmtWithGST: 0 }
  //   );
  // }, [filteredBills, gstFilter]);

  // useEffect(() => {
  //   let totalAmount = 0;
  //   let totalPending = 0;
  //   let totalPaid = 0;

  //   filteredBills.forEach((bill) => {
  //     const finalAmount = Number(bill.finalAmount || 0);
  //     const paidAmount = Number(bill.paidAmount || 0);
  //     const pendingAmount =
  //       bill.pendingAmount !== undefined
  //         ? Number(bill.pendingAmount || 0)
  //         : finalAmount - paidAmount;

  //     totalAmount += finalAmount;
  //     totalPaid += paidAmount;
  //     totalPending += pendingAmount;
  //   });

  //   setTotalBills(filteredBills.length);
  //   setTotalBillsAmount(Number(totalAmount.toFixed(2)));
  //   setPaymentPendAmt(Number(totalPending.toFixed(2)));
  //   setPaymentRecAmt(Number(totalPaid.toFixed(2)));
  // }, [filteredBills]);

  useEffect(() => {
    let gstAmount = 0;
    let gstAmountWithoutGST = 0;
    let finalAmtWithGST = 0;

    let totalPaid = 0;
    let totalPending = 0;
    let totalSum = 0;

    filteredBills.forEach((bill) => {
      const cgst = Number(bill.cgst || 0);
      const sgst = Number(bill.sgst || 0);
      const igst = Number(bill.igst || 0);
      const finalAmount = Number(bill.finalAmount || 0);
      const costWithoutGST = Number(bill.totalCostWithoutGST || 0);

      gstAmount += cgst + sgst + igst;
      gstAmountWithoutGST += costWithoutGST;
      finalAmtWithGST += finalAmount;

      totalPaid += Number(bill.paidAmount || 0);
      totalPending += Number(bill.pendingAmount || 0);
      // totalSum+= Number(bill.f || 0);
    });

    setGstAmount(toFixed2(gstAmount));
    setGstAmountWithoutGST(toFixed2(gstAmountWithoutGST));
    setFinalAmtWithGST(toFixed2(finalAmtWithGST));

    setPaymentRecAmt(toFixed2(totalPaid));
    setPaymentPendAmt(toFixed2(totalPending));
    setTotalBills(filteredBills.length);
  }, [filteredBills]);

  const fetchPaymentHistory = async (billId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_BASE_URL}/payment-history/${billId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch payment history data");
      }

      const result = await response.json();
      // console.log(result.data);
      setPaymentHisData(result.data);
    } catch (error) {
      console.error("Error fetching bills data:", error);
      alert(
        error.response?.data?.message ||
          "Failed to fetch payment history data.",
      );
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFields && searchFields.length > 0) {
        params.append("searchFields", JSON.stringify(searchFields));
      }
      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);
      const token = localStorage.getItem("token");

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const response = await fetch(
        `${API_BASE_URL}/attendance/export?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!response.ok) {
        throw new Error(
          `Failed to download update template: ${response.status}`,
        );
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BillsData_${randomNumber}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel download error:", error);
      alert("Failed to download Excel. Please try again.");
    }
  };

  const handleReceiveAmt = (d) => {
    setReceiveAmtData(d);
    setShowReceiveAmt(true);
  };

  const handleReceiveChange = (e) => {
    const { name, value } = e.target;
    setReceiveForm((prev) => ({ ...prev, [name]: value }));

    const key = name;
    if (RAvalidationErrors[key]) {
      setRAValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const handleInvoiceChange = (e) => {
    const { name, value } = e.target;

    setInvoiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    const key = name;
    if (ICvalidationErrors[key]) {
      setICValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const handleReceiveAmtValid = () => {
    const errors = {};

    if (!receiveForm.amount) {
      errors.amount = "Amount is required.";
    }
    if (receiveForm.amount < 0) {
      errors.amount = "Amount should be greater than 0.";
    }
    if (!receiveForm.paymentDate) {
      errors.paymentDate = "Payment Date is required.";
    }
    if (!receiveForm.tds) {
      errors.tds = "TDS is required.";
    }
    if (receiveForm.transactionType && receiveForm.transactionType !== "Cash") {
      if (!receiveForm.transactionID)
        errors.transactionID = "Trs ID/Cheque No is required.";
    }

    // console.log(errors);
    setRAValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReceiveSubmit = async () => {
    // console.log(RAvalidationErrors)
    if (!handleReceiveAmtValid()) {
      alert("Please fill all the fields!");
      return;
    }
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE_URL}/receive-payment`,
        {
          billId: recieveAmtData?._id,
          paidAmount: Number(receiveForm.amount),
          paymentDate: receiveForm.paymentDate,
          transactionType: receiveForm.transactionType,
          transactionID: receiveForm.transactionID,
          bankName: receiveForm.bankName,
          tds: Number(receiveForm.tds) || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Payment received successfully!");

      setShowReceiveAmt(false);
      setReceiveForm({
        amount: "",
        paymentDate: "",
        transactionType: "Cash",
        transactionID: "",
        tds: "",
        bankName: "",
      });

      fetchBills();
    } catch (err) {
      alert("Error: Unable to save payment.");
      console.error(err);
    }
  };

  const handleInvChangeValid = () => {
    const errors = {};

    if (!invoiceForm.invoiceNo) {
      errors.invoiceNo = "Invoice No is required.";
    }
    if (!invoiceForm.invoiceDate) {
      errors.invoiceDate = "Invoice Date is required.";
    }
    if (!invoiceForm.invoiceFrom) {
      errors.invoiceFrom = "Invoice From is required.";
    }
    if (!invoiceForm.invoiceTo) {
      errors.invoiceTo = "Invoice To is required.";
    }

    // console.log(errors);
    setICValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInvChangeSubmit = async () => {
    if (!handleInvChangeValid()) {
      alert("Please fill all the fields!");
      return;
    }
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE_URL}/invoice-change`,
        {
          billData: recieveAmtData,
          invoiceForm,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Invoice updated successfully!");

      setShowInvoiceChange(false);
      setInvoiceForm({
        invoiceNo: "",
        invoiceDate: "",
        invoiceFrom: "",
        invoiceTo: "",
      });

      fetchBills();
    } catch (err) {
      alert(
        `Operation failed: ${
          err.response?.data?.message || "Error: Unable to update invoice."
        }`,
      );
      console.error(err);
    }
  };

  const handleInvoicePrint = (invoiceNo) => {
    navigate(`/billing/print-invoice?invoiceNo=${invoiceNo}`, {
      state: { autoPrint: true },
    });
  };

  const handlePayHistPrint = (r) => {
    const paydata = encodeURIComponent(JSON.stringify(r));
    navigate(
      `/billing/print-payment-history?paydata=${paydata}&billdata=${recieveAmtData}`,
      {
        state: { autoPrint: true },
      },
    );
  };

  const handleEditBill = (invoiceNo, billingType) => {
    // console.log(billingType);
    setIsEditing(invoiceNo);
    if (billingType === "Transporter") {
      setShowNewTranspBill(true);
    } else setShowNewBill(true);
  };

  const handleSuccessNewBill = () => {
    setIsEditing(null);
    setShowNewBill(false);
    fetchBills();
  };

  const handleSuccessTranspNewBill = () => {
    setIsEditing(null);
    setShowNewTranspBill(false);
    fetchBills();
  };

  const handleCancelNewBill = () => {
    setIsEditing(null);
    setShowNewBill(false);
  };

  const handleCancelTranspNewBill = () => {
    setIsEditing(null);
    setShowNewTranspBill(false);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleDelPayHist = async (id) => {
    if (window.confirm("Are you sure you want to delete this receipt?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/del-payment-history/${id}`,
          getAuthHeaders(),
        );
        alert("Receipt deleted successfully!");
        fetchBills();
        setShowPaymentHistory(false);
      } catch (e) {
        console.log(e);
        if (e.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else
          alert(
            `Delete failed: ${e.response?.data?.message || "Server error"}`,
          );
      }
    }
  };

  const handleDelBill = async (bill) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        await axios.delete(`${API_BASE_URL}/del-bill`, {
          data: bill,
          ...getAuthHeaders(),
        });
        alert("Bill deleted successfully!");
        fetchBills();
      } catch (e) {
        console.log(e);
        if (e.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else
          alert(
            `Delete failed: ${e.response?.data?.message || "Server error"}`,
          );
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">All Billing Summary</h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
          >
            <FaSearch /> {showSearchPanel ? "Hide Search" : "Search"}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setIsEditing(null);
              setShowSearchPanel(false);
              setShowNewBill(true);
              setShowNewTranspBill(false);
            }}
          >
            <FaPlus /> Create New Bill
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setShowNewBill(false);
              setShowSearchPanel(false);
              setShowNewTranspBill(true);
            }}
          >
            <FaPlus /> Create New Transporter Bill
          </button>
        </div>
      </div>

      {showSearchPanel && (
        <FilterPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onSearch={handleSearch}
          onReset={handleReset}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
          filterMode="month-year"
        />
      )}

      {showNewBill ? (
        <CreateNewBill
          key={isEditing ? isEditing._id : "new"}
          onSuccess={handleSuccessNewBill}
          isEditing={isEditing}
          onCancel={handleCancelNewBill}
        />
      ) : showNewTranspBill ? (
        <CreateNewTranspBill
          key={isEditing ? isEditing._id : "new"}
          isEditing={isEditing}
          onSuccess={handleSuccessTranspNewBill}
          onCancel={handleCancelTranspNewBill}
        />
      ) : (
        <div className="billing-table-section">
          <Card>
            <div className="page-header">
              <h1 className="card-header">
                {gstFilter === "all"
                  ? "All Billing Summary"
                  : gstFilter === "gst"
                    ? "View GST Bills"
                    : "View Non GST Bills"}{" "}
                <span className="text-success">({filteredBills.length})</span>
              </h1>
              <div className="page-actions">
                {gstFilter === "all" ? (
                  <>
                    <Button
                      variant="success"
                      onClick={() => setGstFilter("gst")}
                    >
                      View GST Bills
                    </Button>

                    <Button
                      variant="warning"
                      onClick={() => setGstFilter("non-gst")}
                    >
                      View Non GST Bills
                    </Button>

                    <Button variant="primary" onClick={() => {}}>
                      Wages Bulk Upload
                    </Button>
                  </>
                ) : gstFilter === "gst" ? (
                  <>
                    <Button variant="info" onClick={() => setGstFilter("all")}>
                      View All Bills
                    </Button>
                    <Button variant="danger" onClick={() => {}}>
                      Download Payment History
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="info" onClick={() => setGstFilter("all")}>
                      View All Bills
                    </Button>
                    <Button variant="danger" onClick={() => {}}>
                      Download Payment History
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="mb-4">
              {gstFilter === "all" ? (
                <div className="employee-counts justify-content-around">
                  <span className="working">
                    Total Bills Generated : {totalBills}
                  </span>
                  <span className="working">
                    Billing Amount : {finalAmtWithGST}
                  </span>
                  <span className="working">
                    Payment Received : {paymentRecAmt}
                  </span>
                  <span className="left">
                    Payment Not Received : {paymentPendAmt}
                  </span>
                </div>
              ) : gstFilter === "gst" ? (
                <>
                  <div className="employee-counts justify-content-around mb-3">
                    <span className="working">
                      Bill Amount Before GST : {gstAmountWithoutGST}
                    </span>
                    <span className="working">
                      Bill Amount After GST : {finalAmtWithGST}
                    </span>
                    <span className="left">Total GST : {gstAmount}</span>
                  </div>
                  <div className="employee-counts justify-content-around">
                    <span className="working">
                      Bills Generated : {totalBills}
                    </span>
                    <span className="working">
                      Billing Amount : {finalAmtWithGST}
                    </span>
                    <span className="working">
                      Payment Received : {paymentRecAmt}
                    </span>
                    <span className="left">
                      Payment Not Received : {paymentPendAmt}
                    </span>
                  </div>
                </>
              ) : (
                <div className="employee-counts justify-content-around">
                  <span className="working">
                    Bills Generated : {totalBills}
                  </span>
                  <span className="working">
                    Billing Amount : {finalAmtWithGST}
                  </span>
                  <span className="working">
                    Payment Received : {paymentRecAmt}
                  </span>
                  <span className="left">
                    Payment Not Received : {paymentPendAmt}
                  </span>
                </div>
              )}
            </div>
            {loading ? (
              <Alert variant="warning" className="mb-0 text-center">
                Loading...
              </Alert>
            ) : error ? (
              <Alert variant="danger" className="mb-0 text-center">
                {error}
              </Alert>
            ) : (
              <Table bordered hover responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Sr No.</th>
                    <th>Invoice no</th>
                    <th>Invoice Date</th>
                    <th>Client Detail</th>
                    <th>Branch Detail</th>
                    <th>Total Cost</th>
                    <th>Paid amount(Rs.)</th>
                    <th>Payment not received(Rs.)</th>
                    <th>Expected</th>
                    <th>Created Detail</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBills.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={11}>No data found</td>
                    </tr>
                  ) : (
                    filteredBills.map((bill, i) => (
                      <tr key={bill._id}>
                        <td>{i + 1}</td>
                        <td>{bill.invoiceNo}</td>
                        <td>
                          {/* {new Date(bill.invoiceDate).toLocaleDateString()} */}
                          {formatDDMMYYYY(bill.invoiceDate)}
                        </td>
                        <td>
                          Name: {bill.clientName} <br />
                          Contact No: {bill.clientContactNo} <br />
                          Email: {bill.clientEmailId}
                        </td>
                        <td>
                          Client Code: {bill.clientCode} <br />
                          Site Name: {bill.siteName}
                        </td>
                        <td>{bill.finalAmount}</td>
                        <td>{bill.paidAmount || 0}</td>
                        <td>{bill.pendingAmount || 0}</td>
                        <td>{bill.expected || ""}</td>
                        <td>
                          {bill.created_by} <br />
                          {formatDDMMYYYY(bill.created_on)}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="tb-action-btn edit"
                              onClick={() => {
                                handleReceiveAmt(bill);
                              }}
                            >
                              Receive Amt
                            </button>
                            <button
                              className="tb-action-btn update"
                              onClick={() => {
                                setShowPaymentHistory(true);
                                fetchPaymentHistory(bill._id);
                                setReceiveAmtData(bill.invoiceNo);
                              }}
                            >
                              Payment History
                            </button>
                            <button
                              className="tb-action-btn view"
                              onClick={() => {
                                handleInvoicePrint(bill.invoiceNo);
                              }}
                            >
                              Print
                            </button>
                            <button
                              className="tb-action-btn edit"
                              onClick={() => {
                                setInvoiceForm({
                                  invoiceDate: bill.invoiceDate,
                                  invoiceFrom: bill.invoiceFrom,
                                  invoiceTo: bill.invoiceTo,
                                  invoiceNo: bill.invoiceNo,
                                });
                                setReceiveAmtData(bill);
                                setShowInvoiceChange(true);
                              }}
                            >
                              Inv. Change
                            </button>
                            <button
                              className="tb-action-btn edit"
                              onClick={() =>
                                handleEditBill(bill.invoiceNo, bill.billingType)
                              }
                            >
                              Edit
                            </button>{" "}
                            <button
                              className="tb-action-btn delete"
                              onClick={() => {
                                handleDelBill(bill);
                              }}
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
          </Card>
        </div>
      )}

      {showReceiveAmt ? (
        <Modal
          centered
          show={showReceiveAmt}
          size="md"
          scrollable
          onHide={() => setShowReceiveAmt(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Bill No : {recieveAmtData.invoiceNo} </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={receiveForm.amount}
                    isInvalid={!!RAvalidationErrors.amount}
                    onChange={handleReceiveChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {RAvalidationErrors.amount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Payment Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="paymentDate"
                    value={formatForInput(receiveForm.paymentDate)}
                    onChange={handleReceiveChange}
                    isInvalid={!!RAvalidationErrors.paymentDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {RAvalidationErrors.paymentDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    name="transactionType"
                    value={receiveForm.transactionType}
                    onChange={handleReceiveChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="IMPS">IMPS</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Trs Id / Cheque No</Form.Label>
                  <Form.Control
                    type="text"
                    name="transactionID"
                    value={receiveForm.transactionID}
                    isInvalid={!!RAvalidationErrors.transactionID}
                    onChange={handleReceiveChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {RAvalidationErrors.transactionID}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>TDS Amount</Form.Label>
                  <Form.Control
                    type="number"
                    name="tds"
                    value={receiveForm.tds}
                    isInvalid={!!RAvalidationErrors.tds}
                    onChange={handleReceiveChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {RAvalidationErrors.tds}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={receiveForm.bankName}
                    onChange={handleReceiveChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <div className="d-flex flex-column">
              <span className="text-secondary">
                Bill amount: Rs {recieveAmtData.finalAmount}
              </span>
              <span className="text-danger">
                Payment Not Received: Rs {recieveAmtData.pendingAmount}
              </span>
            </div>
            <div>
              <Button
                variant="secondary"
                onClick={() => setShowReceiveAmt(false)}
                className="me-2"
              >
                Close
              </Button>
              <Button variant="primary" onClick={handleReceiveSubmit}>
                Receive
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      ) : (
        ""
      )}
      {showInvoiceChange ? (
        <Modal
          show={showInvoiceChange}
          onHide={() => setShowInvoiceChange(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Invoice No : {recieveAmtData.invoiceNo}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col className="mb-3" md={6}>
                <Form.Group controlId="invoiceNo">
                  <Form.Label>New Invoice No</Form.Label>
                  <Form.Control
                    type="text"
                    name="invoiceNo"
                    value={invoiceForm.invoiceNo}
                    isInvalid={!!ICvalidationErrors.invoiceNo}
                    onChange={handleInvoiceChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {ICvalidationErrors.invoiceNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col className="mb-3" md={6}>
                <Form.Group controlId="invoiceDate">
                  <Form.Label>Invoice Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="invoiceDate"
                    value={formatForInput(invoiceForm.invoiceDate)}
                    isInvalid={!!ICvalidationErrors.invoiceDate}
                    onChange={handleInvoiceChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {ICvalidationErrors.invoiceDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col className="mb-3" md={6}>
                <Form.Group controlId="invoiceFrom">
                  <Form.Label>Invoice From</Form.Label>
                  <Form.Control
                    type="date"
                    name="invoiceFrom"
                    value={formatForInput(invoiceForm.invoiceFrom)}
                    isInvalid={!!ICvalidationErrors.invoiceFrom}
                    onChange={handleInvoiceChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {ICvalidationErrors.invoiceFrom}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col className="mb-3" md={6}>
                <Form.Group controlId="invoiceTo">
                  <Form.Label>Invoice To</Form.Label>
                  <Form.Control
                    type="date"
                    name="invoiceTo"
                    value={formatForInput(invoiceForm.invoiceTo)}
                    isInvalid={!!ICvalidationErrors.invoiceTo}
                    onChange={handleInvoiceChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {ICvalidationErrors.invoiceTo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowInvoiceChange(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                handleInvChangeSubmit();
              }}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        ""
      )}
      {showPaymentHistory ? (
        <Modal
          centered
          show={showPaymentHistory}
          size="lg"
          onHide={() => setShowPaymentHistory(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Bill No: {recieveAmtData}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>Payment History</h5>
            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Paid Amount</th>
                  <th>Trs ID</th>
                  <th>Bank Name</th>
                  <th>Date</th>
                  <th>TDS</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentHisData.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={6}>No data found</td>
                  </tr>
                ) : (
                  paymentHisData.map((p, i) => (
                    <tr key={i}>
                      <td>{p.paidAmount}</td>
                      <td>{p.transactionID}</td>
                      <td>{p.bankName}</td>
                      <td>{formatDDMMYYYY(p.paymentDate)}</td>
                      <td>{p.tds}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => {
                              handlePayHistPrint(p);
                            }}
                            type="button"
                            className="icon-btn edit"
                          >
                            <FaPrint />
                          </button>
                          <button
                            onClick={() => {
                              handleDelPayHist(p._id);
                            }}
                            type="button"
                            className="icon-btn delete"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Modal.Body>
        </Modal>
      ) : (
        ""
      )}
    </div>
  );
};

export default BillingPage;
