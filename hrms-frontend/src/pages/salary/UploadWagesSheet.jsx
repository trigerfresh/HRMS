import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const API = `${import.meta.env.VITE_API_URL}/api/wages`;
const COMPANY_API = `${import.meta.env.VITE_API_URL}/api/companies`;
const BRANCH_API = `${import.meta.env.VITE_API_URL}/api/branches/by-company`; // company id param required

export default function UploadWagesSheet() {
  const [form, setForm] = useState({
    client: "",
    siteName: "",
    clientCode: "",
    month: "",
    year: "",
  });
  const [file, setFile] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [msg, setMsg] = useState("");
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
    fetchSheets();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(COMPANY_API);
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    }
  };

  // When client/company changes fetch branches
  const handleClientChange = async (e) => {
    const companyId = e.target.value;
    setForm((f) => ({ ...f, client: companyId, siteName: "", clientCode: "" }));
    setBranches([]);
    if (companyId) {
      try {
        const { data } = await axios.get(`${BRANCH_API}/${companyId}`);
        setBranches(data);
      } catch (err) {
        console.error("Failed to fetch branches", err);
      }
    }
  };

  // Branch selection handler
  const handleSiteChange = (e) => {
    const selectedBranchId = e.target.value;
    const selectedBranch = branches.find((b) => b._id === selectedBranchId);
    setForm((f) => ({
      ...f,
      siteName: selectedBranch ? selectedBranch.branchName : "",
      clientCode: selectedBranch ? selectedBranch.clientCode : "",
    }));
  };

  const fetchSheets = async () => {
    try {
      const { data } = await axios.get(API);
      setSheets(data);
    } catch (err) {
      console.error("Failed to fetch sheets", err);
      setSheets([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMsg("Select Excel file");
      return;
    }
    if (!form.client || !form.siteName || !form.month || !form.year) {
      setMsg("Please fill all fields");
      return;
    }
    setMsg("");
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("excelFile", file);
    try {
      const { data } = await axios.post(`${API}/upload`, fd);
      setMsg(data.message);
      fetchSheets();
      setFile(null);
      setForm({
        client: "",
        siteName: "",
        clientCode: "",
        month: "",
        year: "",
      });
      setBranches([]);
    } catch (error) {
      setMsg("Upload failed");
      console.error(error);
    }
  };

  const handleAction = async (type, id) => {
    try {
      if (type === "delete") await axios.delete(`${API}/${id}`);
      else if (type === "approve") await axios.put(`${API}/approve/${id}`);
      fetchSheets();
    } catch (err) {
      setMsg("Action failed");
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Upload Wages Sheet</h1>
      </div>
      <div className="mb-3">
        <Row>
          <Col className="mb-3" md={3}>
            <Form.Group controlId="companyName">
              <Form.Label>Client/Company</Form.Label>
              <Form.Select value={form.client} onChange={handleClientChange}>
                <option value="">Select</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group controlId="siteName">
              <Form.Label>Select Site</Form.Label>
              <Form.Select
                value={form.siteName}
                onChange={handleSiteChange}
                disabled={!branches.length}
              >
                <option value="">Select</option>
                {branches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.branchName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group controlId="month">
              <Form.Label>Select Month</Form.Label>
              <Form.Control
                type="month"
                value={form.month}
                onChange={(e) =>
                  setForm((f) => ({ ...f, month: e.target.value }))
                }
              />
            </Form.Group>
          </Col>
          <Col md={3} className="mb-3">
            <Form.Group controlId="Name">
              <Form.Label>Select Year</Form.Label>
              <Form.Control
                type="number"
                min="2000"
                max="2100"
                value={form.year}
                onChange={(e) =>
                  setForm((f) => ({ ...f, year: e.target.value }))
                }
              />
            </Form.Group>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col md={12} className="mb-3">
            <Form.Group controlId="excelFile">
              <Form.Label>Select Excel File:</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={12} className="mb-3">
            <Form.Group controlId="excelUpload" className="text-center">
              <Button
                variant="danger"
                className="btn-red"
                onClick={handleUpload}
              >
                Upload
              </Button>
              <span style={{ color: "red", marginLeft: 10 }}>{msg}</span>
            </Form.Group>
          </Col>
        </Row>
      </div>
      {/* <hr /> */}
      <Card>
        <h2 className="card-header mb-4">Uploaded Wages Sheet</h2>
        <div>
          <Table hover bordered responsive>
            <thead className="table-secondary">
              <tr>
                <th>Table Name</th>
                <th>Client</th>
                <th>Site Name</th>
                <th>Client Code</th>
                <th>Month-Year</th>
                <th>Uploaded At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sheets.length === 0 ? (
                <tr className="text-center">
                  <td colSpan={7}>No data</td>
                </tr>
              ) : (
                sheets.map((row) => (
                  <tr key={row._id}>
                    <td>{row.tableName}</td>
                    <td>{row.client}</td>
                    <td>{row.siteName}</td>
                    <td>{row.clientCode}</td>
                    <td>{row.monthYear}</td>
                    <td>{row.uploadedAt}</td>
                    <td>
                      <div className="table-actions">
                        <a
                          href={`${API}/download/${row._id}`}
                          target="_blank"
                          className="text-decoration-none"
                          rel="noopener noreferrer"
                        >
                          <button className="tb-action-btn view">
                            Download
                          </button>
                        </a>
                        <button className="tb-action-btn edit">Setting</button>
                        <button
                          className="tb-action-btn delete"
                          onClick={() => handleAction("delete", row._id)}
                        >
                          Delete
                        </button>
                        <button
                          className="tb-action-btn add"
                          onClick={() => handleAction("approve", row._id)}
                        >
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
