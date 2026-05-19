import React, { useState, useEffect } from "react";
import FilterPanel from "../../utils/FilterPanel";
import { FaMinus, FaPlus, FaSearch } from "react-icons/fa";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = `${API_URL}/api/manpower-attendance`;

const ManpowerAttendance = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [data, setData] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const response = await fetch(API_BASE_URL, {
      headers: { Authorization: "Bearer " + token },
    });
    const json = await response.json();
    setData(json?.data || []);
    setLoading(false);
  };

  const handleDownloadTemplate = () => {
    window.open(`${API_BASE_URL}/download-template`, "_blank");
  };

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile)
      return setSnackbar({
        open: true,
        message: "Choose a file first",
        severity: "warning",
      });
    const formData = new FormData();
    formData.append("attendanceFile", selectedFile);
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });
    const result = await response.json();
    setSnackbar({
      open: true,
      message: result.message || "Uploaded.",
      severity: result.success ? "success" : "error",
    });
    fetchList();
    setSelectedFile(null);
  };

  const handleVerify = async () => {
    if (!selectedFile)
      return setSnackbar({
        open: true,
        message: "Choose a file first",
        severity: "warning",
      });
    const formData = new FormData();
    formData.append("attendanceFile", selectedFile);
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE_URL}/verify`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });
    const result = await response.json();
    setSnackbar({
      open: true,
      message: result.hasErrors ? "File has errors." : "File is valid!",
      severity: result.hasErrors ? "warning" : "success",
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Time / Rokada Based Attendance</h1>
        <button
          className="search-btn"
          onClick={() => setShowSearchPanel(!showSearchPanel)}
        >
          <FaSearch /> {showSearchPanel ? "Hide Search" : "Search"}
        </button>
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

              {/* Action Buttons */}
              <Row className="g-2">
                <Col xs="auto">
                  <Button variant="primary" onClick={handleUpload}>
                    Start Upload
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button variant="warning" onClick={handleVerify}>
                    Verify Data
                  </Button>
                </Col>
                <Col xs="auto">
                  <Button variant="danger" onClick={handleDownloadTemplate}>
                    Download Template
                  </Button>
                </Col>
              </Row>

              {snackbar.open && (
                <Alert
                  className="mt-3"
                  variant={
                    snackbar.severity === "success" ? "success" : "danger"
                  }
                  dismissible
                  onClose={handleCloseSnackbar}
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
          searchFields={[]}
          setSearchFields={() => {}}
          dateFilter={{}}
          setDateFilter={() => {}}
          onSearch={() => {}}
          onReset={() => {}}
          onDownloadExcel={() => {}}
          searchOptions={[
            { value: "clientName", label: "Client Name" },
            { value: "name", label: "Name" },
          ]}
        />
      )}
      <div className="attendance-table-section">
        <Card>
          <h1 className="card-header mb-4">Monthly Attendance Data</h1>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            <div>
              <Table hover responsive bordered>
                <thead className="table-secondary">
                  <tr>
                    <th>Sr No.</th>
                    <th>Client Code</th>
                    <th>Name</th>
                    <th>Day</th>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Shift</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Count</th>
                    <th>Rate</th>
                    <th>Supervisior</th>
                    <th>Gang Name</th>
                    <th>OT Hours</th>
                    <th>OT Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={row._id}>
                      <td>{idx + 1}</td>
                      <td>{row.clientCode}</td>
                      <td>{row.name}</td>
                      <td>{row.day}</td>
                      <td>{row.month}</td>
                      <td>{row.year}</td>
                      <td>{row.shift}</td>
                      <td>{row.inTime}</td>
                      <td>{row.outTime}</td>
                      <td>{row.count}</td>
                      <td>{row.rate}</td>
                      <td>{row.supervisior}</td>
                      <td>{row.gangName}</td>
                      <td>{row.otHours}</td>
                      <td>{row.otRate}</td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={15} align="center">
                        No Attendance Data
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default ManpowerAttendance;
