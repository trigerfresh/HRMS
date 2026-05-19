import React, { useState, useEffect, useMemo } from "react";

import {
  Card,
  Form,
  Row,
  Col,
  Button,
  Alert,
  Table,
  Modal,
} from "react-bootstrap";
import { FaPlus, FaMinus, FaSearch } from "react-icons/fa";

import FilterPanel from "../../utils/FilterPanel"; // Ensure this path is correct
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API_BASE_URL = `${API_URL}/api`; // Your backend API base URL

const AttendanceByEmployeePage = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showBulkUploadErr, setShowBulkUploadErr] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [attendanceType, setAttendanceType] = useState("Both"); // Day, Night, Both
  const [AttendanceDataCount, setAttendanceDataCount] = useState(0);
  const [monthlyAttendanceData, setMonthlyAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [approveInvRec, setApproveInvRec] = useState([]);
  const [showGenerateInvoice, setShowGenerateInvoice] = useState(false);
  const [monthDaysForBilling, setMonthDaysForBilling] = useState("With Sunday");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Search and filter states
  const [searchFields, setSearchFields] = useState([
    { field: "clientCode", keyword: "" },
  ]);
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const searchOptions = [
    { value: "clientCode", label: "Client Code" },
    { value: "employeeCode", label: "Employee Code" },
    { value: "employeeName", label: "Employee Name" },
    { value: "siteName", label: "Site Name" },
    { value: "contactPerson", label: "Contact Person" },
    { value: "contactPersonEmail", label: "Contact Person Email" },
  ];

  const fetchMonthlyAttendanceData = async () => {
    // console.log(selectedMonth, selectedYear, searchFields);
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      if (searchFields && searchFields.length > 0) {
        params.append("searchFields", JSON.stringify(searchFields));
      }

      if (selectedMonth) params.append("month", selectedMonth);
      if (selectedYear) params.append("year", selectedYear);

      const response = await fetch(
        `${API_BASE_URL}/attendance?${params.toString()}`,
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
        throw new Error("Failed to fetch attendance data");
      }

      const result = await response.json();
      setMonthlyAttendanceData(result.data);
      setAttendanceDataCount(result.count);
      // setInvoiceStatus(
      //   result.invoiceStatus || { generated: 0, notGenerated: 0 }
      // );

      // console.log(result.data[0]);
    } catch (error) {
      console.error("Error fetching monthly attendance data:", error);
      setError(
        error.response?.data?.message || "Failed to fetch attendance data.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyAttendanceData();
  }, []);

  useEffect(() => {
    fetchMonthlyAttendanceData();
  }, [searchFields, selectedMonth, selectedYear]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setShowBulkUploadErr(false);
    setSnackbar({ ...snackbar, open: false });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: "Please select an Excel file to upload.",
        severity: "danger",
      });
      return;
    }

    setSnackbar({
      open: true,
      message: "Uploading",
      severity: "warning",
    });
    const formData = new FormData();
    formData.append("attendanceFile", selectedFile);
    formData.append("attendanceType", attendanceType); // Append attendance type

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/attendance/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (response.ok) {
        setSnackbar({
          open: true,
          message:
            result.uploadedCount +
            (result.uploadedCount < 2 ? " row" : " rows") +
            " uploaded successfully! Click on Verify Data",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "File upload failed!",
          severity: "danger",
        });
      }
    } catch (error) {
      console.error("Error uploading attendance:", error);
      setSnackbar({ open: true, message: error.message, severity: "error" });
    } finally {
      setSelectedFile(null); // Clear selected file after successful upload
      if (document.getElementById("attendanceFile")) {
        document.getElementById("attendanceFile").value = "";
      }
    }
  };

  const handleVerifyData = async () => {
    setSnackbar({
      open: true,
      message: "Verifying...",
      severity: "warning",
    });

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/attendance/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      // console.log(result);
      if (response.ok) {
        setSnackbar({
          open: true,
          message: result.results
            ? "Click on view uploaded data to see any error"
            : result.message,
          severity: "success",
        });

        if (result.results) {
          setShowBulkUploadErr(true);
        } else {
          setShowBulkUploadErr(false);
        }
      } else {
        setSnackbar({
          open: true,
          message: `Error : ${result.error}`,
          // message: result.error,
          severity: "error",
        });
      }
      fetchMonthlyAttendanceData();
    } catch (error) {
      console.error("Error verifying attendance:", error);
      setSnackbar({ open: true, message: error, severity: "danger" });
    }
  };

  const handleDownloadUploadErrorExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      // Corrected URL:
      const response = await fetch(
        `${API_BASE_URL}/attendance/uploaderrortemplate/download`,
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
        throw new Error(`Failed to download template: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ViewUploadedData.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download Excel template.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem("token");

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const response = await fetch(
        `${API_BASE_URL}/attendance/download-template`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // window.open(`${API_BASE_URL}/attendance/download-template`, "_blank");

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_Template_${randomNumber}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download Attendance template.");
    }
  };

  const handleDelete = async (ids) => {
    if (!window.confirm("Delete this attendance records?")) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/attendance/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) throw new Error("Deleting records failed!");

      alert("Record deleted successfully!");
      fetchMonthlyAttendanceData();
    } catch (err) {
      // console.log(err);
      alert(err || `Delete failed: ${err}`);
    }
  };

  const handleApprove = async (d) => {
    // console.log(d);
    setApproveInvRec(d);
    setShowGenerateInvoice(true);
  };

  const handleApproveWages = async (id) => {
    try {
      const siteId = approveInvRec[0].siteId._id;
      const month = Number(approveInvRec[0].month);
      const year = Number(approveInvRec[0].year);
      const attendanceType = approveInvRec[0].attendanceType;
      // console.log(siteId, approveInvRec[0].siteId._id);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/attendance/approve-invoice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approveInvRec, monthDaysForBilling }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!response.ok) throw new Error("Creating Invoice failed!");
      window.location.href = `/billing/review?siteId=${siteId}&month=${month}&year=${year}&attendanceType=${attendanceType}`;
      // alert("Created Invoice successfully!");
      fetchMonthlyAttendanceData();
    } catch (err) {
      // console.log(err);
      alert(err || `Invoice creation failed: ${err}`);
    }
  };

  const handlePrint = (d) => {
    // console.log(d);
    const siteId = d[0].siteId._id;
    const month = Number(d[0].month);
    const year = Number(d[0].year);
    const attendanceType = d[0].attendanceType;

    navigate(
      `/attendance/print?siteId=${siteId}&month=${month}&year=${year}&attendanceType=${attendanceType}`,
      {
        state: { autoPrint: true },
      },
    );
  };

  const handleSearch = () => {
    fetchMonthlyAttendanceData();
  };

  const handleReset = () => {
    setSearchFields([{ field: "clientCode", keyword: "" }]);
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
    fetchMonthlyAttendanceData();
  };

  // const groupedData = monthlyAttendanceData.reduce((acc, item) => {
  //   const key = item.clientCode;

  //   if (!acc[key]) {
  //     acc[key] = {
  //       ...item,
  //       totalPresentDays: 0,
  //       totalOT: 0,
  //       totalWeekOffs: 0,
  //       total: 0,
  //       records: [],
  //     };
  //   }

  //   acc[key].totalPresentDays += item.totalPresentDays || 0;
  //   acc[key].totalOT += item.totalOT || 0;
  //   acc[key].totalWeekOffs += item.totalWeekOffs || 0;
  //   acc[key].total += item.total || 0;
  //   acc[key].records.push(item);

  //   return acc;
  // }, {});

  // const groupedAttendance = Object.values(groupedData);

  const groupedAttendance = useMemo(() => {
    const groupedData = monthlyAttendanceData.reduce((acc, item) => {
      const key = item.clientCode;

      if (!acc[key]) {
        acc[key] = {
          ...item,
          totalPresentDays: 0,
          totalOT: 0,
          totalWeekOffs: 0,
          total: 0,
          records: [],
        };
      }

      acc[key].totalPresentDays += item.totalPresentDays || 0;
      acc[key].totalOT += item.totalOT || 0;
      acc[key].totalWeekOffs += item.totalWeekOffs || 0;
      acc[key].total += item.total || 0;
      acc[key].records.push(item);

      return acc;
    }, {});

    return Object.values(groupedData);
  }, [monthlyAttendanceData]);

  const invoiceStatus = useMemo(() => {
    if (!groupedAttendance.length) return { generated: 0, notGenerated: 0 };

    return {
      generated: groupedAttendance.filter(
        (rec) => rec.invoiceStatus !== "Pending",
      ).length,
      notGenerated: groupedAttendance.filter(
        (rec) => rec.invoiceStatus === "Pending",
      ).length,
    };
  }, [groupedAttendance]);

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
      a.download = `AttendanceData_${randomNumber}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Excel download error:", error);
      alert("Failed to download Excel. Please try again.");
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const handleDownloadRecord = async (d) => {
    // console.log(d);
    try {
      const siteId = d[0].siteId._id;
      const month = Number(d[0].month);
      const year = Number(d[0].year);
      const attendanceType = d[0].attendanceType;

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const response = await axios.get(
        `${API_BASE_URL}/attendance/exportPrintDownload?siteId=${siteId}&month=${month}&year=${year}&attendanceType=${attendanceType}`,
        {
          responseType: "blob",
          ...getAuthHeaders(),
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Attendance_${randomNumber}.xlsx`;
      link.click();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      console.error("Excel download error:", error);
      alert("Failed to download Excel. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance By Employee</h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
          >
            <FaSearch /> {showSearchPanel ? "Hide Search" : "Search"}
          </button>
        </div>
      </div>

      <Card>
        <Card.Title
          onClick={() => setShowUpload(!showUpload)}
          style={{ cursor: "pointer" }}
          className="d-flex align-items-center justify-content-start my-0"
        >
          <span className="me-2">
            {showUpload ? <FaMinus size="0.8em" /> : <FaPlus size="0.8em" />}
          </span>
          <span>Upload Attendance Excel Sheet</span>
        </Card.Title>

        {showUpload && (
          <Card.Body>
            <Alert variant="info" className="py-2">
              <strong>
                P - Present | A - Absent | W - Weekly Off |WP - Weekly Off Paid
                | P1 / PP / PPP - Overtime | HF - Half Day | D - Day | N - Night
                | H - Holiday | CL | PL | SL
              </strong>
              <br />
            </Alert>
            <p
              className=""
              style={{
                color: "var(--red-color)",
                fontWeight: "bold",
                fontStyle: "italic",
              }}
            >
              Do not use any special character in your file name.
            </p>

            <Form>
              {/* File Input Row */}
              <Form.Group as={Row} className="align-items-center mb-3">
                <Col xs="auto">
                  <Form.Label
                    htmlFor="attendanceFile"
                    className="btn btn-secondary mb-0"
                  >
                    Choose File
                  </Form.Label>
                  <Form.Control
                    id="attendanceFile"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </Col>
                <Col>
                  <span>
                    {selectedFile ? selectedFile.name : "No file chosen"}
                  </span>
                </Col>
              </Form.Group>

              <p className="text-muted mb-3">Please upload Excel sheet only.</p>

              {/* Attendance Type Dropdown */}
              <Form.Group as={Row} className="align-items-center mb-3">
                <Col xs="auto">
                  <Form.Label htmlFor="attendanceType">
                    Attendance Type:
                  </Form.Label>
                </Col>
                <Col xs="auto">
                  <Form.Select
                    id="attendanceType"
                    value={attendanceType}
                    onChange={(e) => setAttendanceType(e.target.value)}
                  >
                    <option value="Both">Both</option>
                    <option value="Day">Day</option>
                    <option value="Night">Night</option>
                  </Form.Select>
                </Col>
              </Form.Group>

              {/* Action Buttons */}
              <Row className="g-2">
                <Col xs="auto">
                  <Button variant="primary" onClick={handleUpload}>
                    Start Upload
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button variant="warning" onClick={handleVerifyData}>
                    Verify Data
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button variant="danger" onClick={handleDownloadTemplate}>
                    Download Template
                  </Button>
                </Col>
                {showBulkUploadErr && (
                  <Col xs="auto">
                    <Button
                      variant="success"
                      onClick={handleDownloadUploadErrorExcel}
                    >
                      View Uploaded Data
                    </Button>
                  </Col>
                )}
              </Row>

              {snackbar.open && (
                <Alert
                  className="mt-3 mb-0"
                  variant={
                    snackbar.severity === "success"
                      ? "success"
                      : snackbar.severity === "warning"
                        ? "warning"
                        : "danger"
                  }
                  // dismissible
                  // onClose={handleCloseSnackbar}
                >
                  {snackbar.message}
                </Alert>
              )}
            </Form>
          </Card.Body>
        )}
      </Card>

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

      <div className="data-section">
        <Card>
          <div className="page-header">
            <h1 className="card-header">
              Monthly Attendance Data{" "}
              <span className="text-success">({groupedAttendance.length})</span>
            </h1>
            <div className="page-actions">
              <div className="employee-counts">
                <span className="working">
                  Total Invoice Generated : {invoiceStatus.generated}
                </span>
                <span className="left">
                  Total Invoice Not Generated : {invoiceStatus.notGenerated}
                </span>
              </div>
            </div>
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
            <div>
              {/* Add a responsive wrapper */}
              <Table hover bordered responsive>
                <thead className="table-secondary">
                  <tr>
                    <th style={{ minWidth: "70px" }}>Sr No.</th>
                    <th style={{ minWidth: "150px" }}>Site Name</th>
                    <th style={{ minWidth: "250px" }}>Contact Person Detail</th>
                    <th style={{ minWidth: "200px" }}>Address</th>
                    <th>Month-Year</th>
                    <th style={{ minWidth: "100px" }}>Total N.D.</th>
                    <th style={{ minWidth: "100px" }}>Total O.T.</th>
                    <th style={{ minWidth: "100px" }}>Total Off</th>
                    <th style={{ minWidth: "100px" }}>Holiday</th>
                    <th style={{ minWidth: "100px" }}>Total</th>
                    <th>Created Detail</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ textAlign: "center" }}>
                        No attendance data found.
                      </td>
                    </tr>
                  ) : (
                    groupedAttendance.map((data, index) => (
                      <tr key={data._id || index}>
                        <td>{index + 1}</td>

                        <td>
                          Site Name: {data.siteId?.siteName} <br />
                          Client Code: {data.clientCode} <br />
                          Type: {data.attendanceType}
                        </td>

                        <td>
                          Client Name: {data.client?.companyName} <br />
                          Contact Person: {data.siteId?.contactPersonName}{" "}
                          <br />
                          Email: {data.siteId?.emailId} <br />
                          Contact No: {data.siteId?.contactNo}
                        </td>

                        <td>{data.siteId?.address}</td>

                        <td>
                          {new Date(0, data.month - 1).toLocaleString("en", {
                            month: "long",
                          })}
                          -{data.year}
                        </td>

                        <td>{data.totalPresentDays}</td>
                        <td>{data.totalOT}</td>
                        <td>{data.totalWeekOffs}</td>
                        <td>{data.totalHolidays}</td>
                        <td>{data.total}</td>

                        <td>
                          {data.created_by?.name}
                          <br />
                          {new Date(data.created_on).toLocaleDateString(
                            "en-GB",
                          )}
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="tb-action-btn edit"
                              onClick={() =>
                                handlePrint(data.records.map((r) => r))
                              }
                            >
                              Print
                            </button>
                            {data.invoiceStatus === "Pending" ? (
                              <button
                                className="tb-action-btn update"
                                onClick={() =>
                                  handleApprove(data.records.map((r) => r))
                                }
                              >
                                Approve
                              </button>
                            ) : (
                              ""
                            )}

                            <button
                              className="tb-action-btn delete"
                              onClick={() =>
                                handleDelete(data.records.map((r) => r._id))
                              }
                            >
                              Delete
                            </button>

                            <button
                              className="tb-action-btn view"
                              onClick={() =>
                                handleDownloadRecord(data.records.map((r) => r))
                              }
                            >
                              Download
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
      {showGenerateInvoice ? (
        <Modal
          show={showGenerateInvoice}
          onHide={() => setShowGenerateInvoice(false)}
          size="md"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Generate Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col className="mb-3" md={12}>
                <Form.Group controlId="initial">
                  <Form.Label>Select Days for Billing</Form.Label>
                  <Form.Select
                    name="initial"
                    value={monthDaysForBilling}
                    onChange={(e) => setMonthDaysForBilling(e.target.value)}
                  >
                    <option value="With Sunday">With Sunday</option>
                    <option value="Without Sunday">Without Sunday</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowGenerateInvoice(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleApproveWages}>
              Create Invoice
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        ""
      )}
    </div>
  );
};

export default AttendanceByEmployeePage;
