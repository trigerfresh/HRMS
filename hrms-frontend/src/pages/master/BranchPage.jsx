import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaPen, FaTrashAlt } from "react-icons/fa"; // Import icons
import SearchPanel from "../../utils/FilterPanel";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";

const BranchPage = () => {
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const initialFormData = {
    branchName: "",
    areaName: "",
    email: "",
    costingMethod: "FIFO",
    defSalesAccount: "",
    defBranchDispAccount: "",
    address: "",
    pincode: "",
    contactNo: "",
    defPurchaseAccount: "",
    defBranchRecvAccount: "",
    companyId: [],
  };
  const [formData, setFormData] = useState(initialFormData);

  const [searchFields, setSearchFields] = useState([
    { field: "branchName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const branchSearchOptions = [
    { value: "branchName", label: "Branch Name" },
    { value: "areaName", label: "Area Name" },
    { value: "pincode", label: "Pincode" },
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const validSearchFields = searchFields.filter(
        (f) => f.field && f.keyword,
      );
      if (validSearchFields.length > 0) {
        params.searchFields = JSON.stringify(validSearchFields);
      }
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from;
        params.toDate = dateFilter.to;
      }
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/branches`,
        {
          params,
          ...getAuthHeaders(),
        },
      );
      setBranches(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load branches.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/companies`,
        getAuthHeaders(),
      );
      setCompanies(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Error fetching companies");
      console.error("Error fetching companies:", err);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchCompanies();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    const key = name;
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const handleCompanySelection = (companyId) => {
    const selectedCompanies = [...formData.companyId];
    const index = selectedCompanies.indexOf(companyId);
    if (index > -1) {
      selectedCompanies.splice(index, 1);
    } else {
      selectedCompanies.push(companyId);
    }
    setFormData({ ...formData, companyId: selectedCompanies });

    if (validationErrors.companyId) {
      setValidationErrors((prev) => ({
        ...prev,
        companyId: "",
      }));
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setValidationErrors({});
    setIsEditing(null);
    // setShowForm(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.branchName.trim()) {
      errors.branchName = "Branch name is required.";
    }

    if (!formData.companyId || formData.companyId.length === 0) {
      errors.companyId = "Please select at least one company.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    } else {
      setValidationErrors({});
    }

    // console.log(formData.companyId);

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (Array.isArray(formData[key])) {
        data.append(key, JSON.stringify(formData[key]));
      } else if (formData[key]) data.append(key, formData[key]);
    });

    // for (let [key, value] of data.entries()) {
    //   console.log(`${key}:`, value);
    // }

    try {
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/api/branches/${isEditing._id}`
        : `${import.meta.env.VITE_API_URL}/api/branches`;
      const method = isEditing ? "put" : "post";
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders().headers,
        },
      };
      await axios[method](url, data, config);
      alert(`Branch ${isEditing ? "updated" : "created"} successfully!`);
      resetForm();
      setShowForm(false);
      fetchBranches();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      console.error(err);
    }
  };

  const handleEdit = (branch) => {
    setIsEditing(branch);
    setValidationErrors({});
    setFormData({
      ...initialFormData,
      ...branch,
      companyId: branch.companyId.map((c) => c._id),
    });
    setShowForm(true);
    setShowSearch(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this branch?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/branches/${id}`,
          getAuthHeaders(),
        );
        alert("Branch deleted successfully!");
        fetchBranches();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Delete operation failed!");
      }
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [searchFields, dateFilter]);

  const handleSearch = () => fetchBranches();

  const resetSearch = () => {
    setSearchFields([{ field: "branchName", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchBranches();
  };

  const handleDownloadExcel = async () => {
    try {
      const params = {};
      const validSearch = searchFields.filter((f) => f.field && f.keyword);
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch);

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from;
        params.toDate = dateFilter.to;
      }

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/branches/export`,
        {
          params,
          responseType: "blob", // IMPORTANT
          ...getAuthHeaders(),
        },
      );

      // Create Excel File
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Branches_${randomNumber}.xlsx`;
      link.click();
    } catch (error) {
      // Axios sends 401 here
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
        <h1 className="page-title">
          Branch Management{" "}
          <span className="text-success">({branches.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn" // Changed class name
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <button
            className="btn-primary" // Changed class name
            onClick={() => {
              resetForm();
              // setIsEditing(null);
              setShowSearch(false);
              setShowForm(true);
            }}
          >
            <FaPlus /> Create New
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
          searchOptions={branchSearchOptions}
        />
      )}

      {showForm && (
        <Card className="branch-card">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Branch - {isEditing.branchName}</span>
            ) : (
              "Create New Branch"
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form className="branch-form" onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branchName">
                  <Form.Label>Branch Name *</Form.Label>
                  <Form.Control
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    placeholder="Enter Branch name"
                    isInvalid={!!validationErrors.branchName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branchName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="areaName">
                  <Form.Label>Area Name</Form.Label>
                  <Form.Control
                    name="areaName"
                    value={formData.areaName}
                    onChange={handleInputChange}
                    placeholder="Enter your area name"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pincode">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Pincode"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="email">
                  <Form.Label>Email ID</Form.Label>
                  <Form.Control
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email ID"
                    type="text"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="contactNo"
                    value={formData.contactNo}
                    onChange={handleInputChange}
                    placeholder="Contact No"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="costingMethod">
                  <Form.Label>Costing Method</Form.Label>
                  <Form.Select
                    name="costingMethod"
                    value={formData.costingMethod}
                    onChange={handleInputChange}
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defPurchaseAccount">
                  <Form.Label>Def. Purchase Account</Form.Label>
                  <Form.Control
                    name="defPurchaseAccount"
                    value={formData.defPurchaseAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Purchase Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defSalesAccount">
                  <Form.Label>Def. Sales Account</Form.Label>
                  <Form.Control
                    name="defSalesAccount"
                    value={formData.defSalesAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Sales Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defBranchRecvAccount">
                  <Form.Label>Def. Branch Recv. Account</Form.Label>
                  <Form.Control
                    name="defBranchRecvAccount"
                    value={formData.defBranchRecvAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Branch Recv. Account"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="defBranchDispAccount">
                  <Form.Label>Def. Branch Disp. Account</Form.Label>
                  <Form.Control
                    name="defBranchDispAccount"
                    value={formData.defBranchDispAccount}
                    onChange={handleInputChange}
                    placeholder="Def. Branch Disp. Account"
                  />
                </Form.Group>
              </Col>
            </Row>
            <hr />
            <div className="mb-3 branch-company-selection">
              <h4 className="fs-5">Select Company *</h4>
              {companies.map((company) => (
                <Form.Check
                  key={company._id}
                  type="checkbox"
                  id={`company-${company._id}`}
                  label={company.companyName}
                  checked={formData.companyId.includes(company._id)}
                  onChange={() => handleCompanySelection(company._id)}
                  className="mb-2"
                  isInvalid={!!validationErrors.companyId}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCompanySelection(company._id); // ✅ call directly
                    }
                  }}
                />
              ))}
              {validationErrors.companyId && (
                <div className="invalid-feedback d-block">
                  {validationErrors.companyId}
                </div>
              )}
            </div>

            <div className="form-actions d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmit}>
                {isEditing ? "Update Company" : "Save Company"}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Branch List Table */}
      {!showForm && (
        <Card className="branch-card">
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <Table hover bordered responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Pincode</th>
                  <th>Companies</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={5}>No data found</td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch._id}>
                      <td>{branch.branchName}</td>
                      <td>{branch.address}</td>
                      <td>{branch.pincode}</td>
                      <td>
                        {branch.companyId.map((c) => c.companyName).join(", ")}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(branch)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(branch._id)}
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
          )}
        </Card>
      )}
    </div>
  );
};

export default BranchPage;
