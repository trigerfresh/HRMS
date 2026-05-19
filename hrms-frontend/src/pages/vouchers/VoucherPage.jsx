import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchPanel from "../../utils/FilterPanel";
import {
  Form,
  Tabs,
  Tab,
  Table,
  Modal,
  Row,
  Col,
  Button,
  Card,
} from "react-bootstrap";
import { FaPlus, FaSearch } from "react-icons/fa";

const COMPANY_API = `${import.meta.env.VITE_API_URL}/api/companies`;
const BRANCH_API = `${import.meta.env.VITE_API_URL}/api/branches/by-company`; // company id param required
const CHARGE_TYPE_API = `${import.meta.env.VITE_API_URL}/api/charges`; // API for charge types
const EMPLOYEE_API = `${import.meta.env.VITE_API_URL}/api/employees`; // API for employees

export default function VoucherPage() {
  const [key, setKey] = useState("approved");
  const [search, setSearch] = useState("");
  const [vouchers, setVouchers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchFields, setSearchFields] = useState([
    { field: "employeeName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const [form, setForm] = useState({
    client: "",
    site: "",
    employee: "",
    gang: "",
    date: new Date().toISOString().slice(0, 10),
    type: "",
    mode: "",
    particulars: [{ name: "", amount: "" }],
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]); // State for employees
  const [types, setTypes] = useState([]); // State for charge types
  const [modes] = useState(["Cash", "Online", "GPay", "Cheque"]);

  const [bulkCompany, setBulkCompany] = useState("");
  const [bulkBranch, setBulkBranch] = useState("");
  const [bulkFile, setBulkFile] = useState(null);

  // Fetch vouchers when tab key changes or on demand
  useEffect(() => {
    fetchVouchers();
  }, [key]);

  // Fetch companies and charge types on mount
  useEffect(() => {
    fetchCompanies();
    fetchChargeTypes(); // Call the new fetchChargeTypes function
  }, []);

  // New function to fetch companies
  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(COMPANY_API);
      setCompanies(data);
    } catch (err) {
      console.error("Failed to fetch companies", err);
    }
  };

  // New function to fetch charge types
  const fetchChargeTypes = async () => {
    try {
      const res = await axios.get(CHARGE_TYPE_API);
      const data = res.data;
      if (Array.isArray(data)) setTypes(data);
      else if (Array.isArray(data.data))
        setTypes(data.data); // Adjust if your API nests data
      else setTypes([]);
    } catch (err) {
      console.error("Failed to fetch charge types", err);
      setTypes([]);
    }
  };

  // When company changes, fetch branches and clear employees
  const handleCompanyChange = async (e) => {
    const companyId = e.target.value;
    setForm((f) => ({ ...f, client: companyId, site: "", employee: "" })); // Clear employee here
    setBranches([]);
    setEmployees([]); // Clear employees when company changes
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
  const handleBranchChange = (e) => {
    const selectedBranchId = e.target.value;
    setForm((f) => ({
      ...f,
      site: selectedBranchId,
      employee: "", // Clear employee when branch changes
    }));
  };

  // Fetch employees when branch changes (form.site holds the branch ID)
  useEffect(() => {
    if (form.site) {
      axios
        .get(`${EMPLOYEE_API}?branchId=${form.site}`) // Assuming your employee API can filter by branchId
        .then((res) => {
          const data = res.data;
          // Adjust based on your actual employee API response structure
          if (data && Array.isArray(data.data)) setEmployees(data.data);
          else if (Array.isArray(data)) setEmployees(data);
          else setEmployees([]);
        })
        .catch(() => setEmployees([]));
    } else {
      setEmployees([]); // Clear employees if no branch is selected
    }
  }, [form.site]);

  async function fetchVouchers() {
    try {
      const res = await axios.get(`/api/vouchers?status=${key}`);
      setVouchers(Array.isArray(res.data) ? res.data : []);
      // console.log(key);
    } catch {
      console.log("error", key);
      setVouchers([]);
    }
  }

  function handleSearch() {
    fetchVouchers();
  }

  function resetSearch() {
    setSearchFields([{ field: "employeeName", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchVouchers();
  }

  function handleDownloadExcel() {
    window.open("/api/vouchers/export", "_blank");
  }

  function handleFormChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleParticularChange(idx, field, value) {
    const updated = [...form.particulars];
    updated[idx][field] = value;
    setForm((f) => ({ ...f, particulars: updated }));
  }

  function addParticularRow() {
    setForm((f) => ({
      ...f,
      particulars: [...f.particulars, { name: "", amount: "" }],
    }));
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    const totalPaid = form.particulars.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const data = { ...form, totalPaid, paymentDate: form.date };
    try {
      await axios.post("/api/vouchers", data);
      setShowAddModal(false);
      fetchVouchers();
      // Reset form after successful submission
      setForm({
        client: "",
        site: "",
        employee: "",
        gang: "",
        date: new Date().toISOString().slice(0, 10),
        type: "",
        mode: "",
        particulars: [{ name: "", amount: "" }],
      });
      setBranches([]); // Clear branches
      setEmployees([]); // Clear employees
    } catch (error) {
      alert(
        "Failed to add voucher: " +
          (error.response?.data?.message || error.message),
      );
    }
  }

  async function handleBulkUpload(e) {
    e.preventDefault();
    if (!bulkFile) {
      alert("Please select a file");
      return;
    }
    if (!bulkCompany || !bulkBranch) {
      alert("Please select a client and site for bulk upload");
      return;
    }

    const fd = new FormData();
    fd.append("file", bulkFile);
    fd.append("companyId", bulkCompany);
    fd.append("branchId", bulkBranch);

    try {
      await axios.post("/api/vouchers/bulk-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowBulkModal(false);
      fetchVouchers();
      // Reset bulk upload form
      setBulkCompany("");
      setBulkBranch("");
      setBulkFile(null);
    } catch (e) {
      alert("Upload failed: " + (e.response?.data?.message || e.message));
    }
  }

  // Filter vouchers by search text
  const filteredVouchers = vouchers.filter(
    (v) =>
      (v.voucherNo || "").toLowerCase().includes(search) ||
      (v.client?.companyName || "").toLowerCase().includes(search) ||
      (v.site?.branchName || "").toLowerCase().includes(search),
  );

  // Modal overlay and card inline styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: 16,
    overflowY: "auto",
  };

  const tabTitles = {
    approved: "Approved Vouchers",
    pending: "Pending Vouchers",
    cancelled: "Cancelled Vouchers",
  };
  const voucherSummary = () => {
    switch (key) {
      case "approved":
        return `Total: ${0} | Amount: ${0}`; // Replace 0 with your dynamic values
      case "pending":
        return `Total: ${0}`;
      case "cancelled":
        return `Total: ${0} | Amount: ${0}`;
      default:
        return "";
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{tabTitles[key]}</h1>
        <div className="page-actions">
          <span className="text-success">{voucherSummary()}</span>
          <button
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <FaPlus />
            Add Voucher
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowBulkModal(true)}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {showSearch && (
        <SearchPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={resetSearch}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={[
            { field: "employeeName", label: "Employee Name" },
            { field: "employeeCode", label: "Employee Code" },
            { field: "voucherNo", label: "Voucher Number" },
            { field: "client.companyName", label: "Client/Company Name" },
            { field: "site.branchName", label: "Site/Branch Name" },
          ]}
        />
      )}

      <Card>
        <Tabs
          activeKey={key}
          onSelect={(k) => {
            setKey(k);
          }}
          className="mb-3"
          fill
        >
          <Tab eventKey="approved" title="Approved" />
          <Tab eventKey="pending" title="Pending" />
          <Tab eventKey="cancelled" title="Cancelled" />
        </Tabs>

        <Table bordered hover responsive>
          <thead className="table-secondary">
            <tr>
              <th>Voucher No</th>
              <th>Payment Date</th>
              <th>Client/Company</th>
              <th>Site/Branch</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Mode</th>
              <th>Total Paid</th>
            </tr>
          </thead>
          <tbody>
            {filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  No vouchers found
                </td>
              </tr>
            ) : (
              filteredVouchers.map((v) => (
                <tr key={v._id}>
                  <td>{v.voucherNo}</td>
                  <td>{new Date(v.paymentDate).toLocaleDateString()}</td>
                  <td>{v.client?.companyName}</td>
                  <td>{v.site?.branchName}</td>
                  <td>{v.employee?.employeeName || ""}</td>
                  <td>{v.type}</td>
                  <td>{v.mode}</td>
                  <td>{v.totalPaid}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Add Voucher Modal */}
        <Modal
          show={showAddModal}
          onHide={() => setShowAddModal(false)}
          size="lg"
          centered
          scrollable
        >
          <Modal.Header closeButton>
            <Modal.Title>Add New Voucher</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleAddSubmit}>
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Client/Company</Form.Label>
                    <Form.Select
                      value={form.client}
                      onChange={handleCompanyChange}
                      required
                    >
                      <option value="">Select</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.companyName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Site/Branch</Form.Label>
                    <Form.Select
                      value={form.site}
                      onChange={handleBranchChange}
                      disabled={!branches.length}
                      required
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
                <Col>
                  <Form.Group>
                    <Form.Label>Employee</Form.Label>
                    <Form.Select
                      value={form.employee}
                      onChange={(e) =>
                        handleFormChange("employee", e.target.value)
                      }
                      disabled={!employees.length}
                      required
                    >
                      <option value="">Select</option>
                      {employees.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.employeeName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Type</Form.Label>
                    <Form.Select
                      value={form.type}
                      onChange={(e) => handleFormChange("type", e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      {types.map((t) => (
                        <option key={t._id} value={t.title}>
                          {t.title}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Mode</Form.Label>
                    <Form.Select
                      value={form.mode}
                      onChange={(e) => handleFormChange("mode", e.target.value)}
                      required
                    >
                      <option value="">Select</option>
                      {modes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={form.date}
                      onChange={(e) => handleFormChange("date", e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Particulars */}
              <div className="border p-3 mb-3 rounded">
                <h6>Particulars</h6>
                {form.particulars.map((p, idx) => (
                  <Row key={idx} className="mb-2">
                    <Col>
                      <Form.Control
                        placeholder="Particular"
                        value={p.name}
                        onChange={(e) =>
                          handleParticularChange(idx, "name", e.target.value)
                        }
                        required
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        placeholder="Amount"
                        value={p.amount}
                        onChange={(e) =>
                          handleParticularChange(idx, "amount", e.target.value)
                        }
                        required
                      />
                    </Col>
                  </Row>
                ))}
                <Button
                  className="d-flex align-items-center gap-2"
                  onClick={addParticularRow}
                >
                  <FaPlus /> Add Line
                </Button>
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Bulk Upload Modal */}
        <Modal
          show={showBulkModal}
          onHide={() => setShowBulkModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Bulk Upload</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleBulkUpload}>
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Client/Company</Form.Label>
                    <Form.Select
                      value={form.client}
                      onChange={handleCompanyChange}
                      required
                    >
                      <option value="">Select</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.companyName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Site/Branch</Form.Label>
                    <Form.Select
                      value={form.site}
                      onChange={handleBranchChange}
                      disabled={!branches.length}
                      required
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
              </Row>

              <div className="mb-3">
                <a
                  href="/api/vouchers/template"
                  className="btn btn-outline-success me-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Template
                </a>
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  required
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="warning" type="submit">
                  Upload
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowBulkModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Card>
    </div>
  );
}
