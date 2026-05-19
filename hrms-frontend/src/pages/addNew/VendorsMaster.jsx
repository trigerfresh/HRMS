import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { FaPen, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import FilterPanel from "../../utils/FilterPanel";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = `${API_URL}/api`;

const VendorsMaster = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const initialFormData = {
    vendorName: "",
    emailId: "",
    contactNo: "",
    address: "",
    state: "",
    stateCode: "",
    contactablePersonName: "",
    contactablePersonPanNo: "",
    gstNo: "",
    accountNo: "",
    bankName: "",
    ifscCode: "",
    branchName: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const [searchFields, setSearchFields] = useState([
    { field: "vendorName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const searchOptions = [
    { value: "vendorName", label: "Vendor Name" },
    { value: "emailId", label: "Email ID" },
    { value: "contactNo", label: "Contact No" },
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchVendors = async () => {
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
      const res = await axios.get(`${API_BASE_URL}/vendors-master`, {
        params,
        ...getAuthHeaders(),
      });
      setVendors(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load vendors.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVendors();
  };

  useEffect(() => {
    fetchVendors();
  }, [searchFields, dateFilter]);

  const resetSearch = () => {
    setSearchFields([{ field: "email", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchVendors();
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditing(null);
    setValidationErrors({});
  };

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
        `${API_BASE_URL}/vendors-master/export`,
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
      link.download = `Vendors_${randomNumber}.xlsx`;
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

  const handleEdit = (vendor) => {
    setIsEditing(vendor);
    setValidationErrors({});
    setFormData({ ...vendor });
    setShowForm(true);
    setShowSearch(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/vendors-master/${id}`,
          getAuthHeaders(),
        );
        alert("Vendor deleted successfully!");
        fetchVendors();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Failed to delete vendor!");
        // console.error(error);
      }
    }
  };

  const isValidPhone = (phone) => /^\d{10}$/.test(phone);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  const isValidBankAccount = (acc) => /^[0-9]{6,18}$/.test(acc);
  const isValidIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc);
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const validateForm = () => {
    const errors = {};
    // console.log(formData);

    if (!formData.vendorName.trim())
      errors.vendorName = "Vendor/Company Name is required";
    if (formData.emailId && !isValidEmail(formData.emailId)) {
      errors.emailId = "Invalid email address";
    }
    if (formData.contactNo && !isValidPhone(formData.contactNo)) {
      errors.contactNo = "Invalid Contact No";
    }
    if (!formData.stateCode.trim()) errors.stateCode = "State Code is required";
    if (formData.stateCode && isNaN(formData.stateCode)) {
      errors.stateCode = "State Code must be a number.";
    }
    if (
      formData.contactablePersonPanNo &&
      !isValidPAN(formData.contactablePersonPanNo.toUpperCase())
    ) {
      errors.contactablePersonPanNo = "Invalid PAN format";
    }
    if (formData.gstNo && !gstRegex.test(formData.gstNo))
      errors.gstNo = "Invalid GST Format.";
    if (formData.accountNo && !isValidBankAccount(formData.accountNo)) {
      errors.accountNo = "Account number must be 6-18 digits";
    }
    if (formData.ifscCode && !isValidIFSC(formData.ifscCode)) {
      errors.ifscCode = "Invalid IFSC Code";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders().headers,
        },
      };
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/vendors-master/${isEditing._id}`,
          formData,
          config,
        );
        alert("Vendor updated successfully!");
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/vendors-master/`,
          formData,
          config,
        );
        // console.log(res.data);
        alert("Vendor added successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchVendors();
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
        setError(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Vendors <span className="text-success">({vendors.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              resetForm();
              setIsEditing(null);
              setShowForm(true);
              setShowSearch(false);
            }}
          >
            <FaPlus /> Add New
          </button>
        </div>
      </div>

      {showSearch && (
        <FilterPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={resetSearch}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}

      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Vendor - {isEditing.vendorName}</span>
            ) : (
              "Add New Vendor"
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="vendorName">
                  <Form.Label>Vendor/Company Name *</Form.Label>
                  <Form.Control
                    name="vendorName"
                    placeholder="Enter vendor/company name"
                    value={formData.vendorName || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.vendorName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.vendorName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="emailId">
                  <Form.Label>Email ID</Form.Label>
                  <Form.Control
                    name="emailId"
                    placeholder="Enter email ID"
                    value={formData.emailId || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.emailId}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.emailId}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="contactNo"
                    placeholder="Enter contact No"
                    value={formData.contactNo || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.contactNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    placeholder="Enter address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="state">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    name="state"
                    placeholder="Enter state"
                    value={formData.state || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.state}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="stateCode">
                  <Form.Label>State Code *</Form.Label>
                  <Form.Control
                    name="stateCode"
                    placeholder="Enter state code"
                    value={formData.stateCode || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.stateCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.stateCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactablePersonName">
                  <Form.Label>Contactable Person Name</Form.Label>
                  <Form.Control
                    name="contactablePersonName"
                    placeholder="Enter contactable person name"
                    value={formData.contactablePersonName || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.contactablePersonName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactablePersonName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactablePersonPanNo">
                  <Form.Label>Contactable Pan Card No</Form.Label>
                  <Form.Control
                    name="contactablePersonPanNo"
                    placeholder="Enter contactable pan card no"
                    value={formData.contactablePersonPanNo || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.contactablePersonPanNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactablePersonPanNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="gstNo">
                  <Form.Label>GST No</Form.Label>
                  <Form.Control
                    name="gstNo"
                    placeholder="Enter GST No"
                    value={formData.gstNo || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.gstNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.gstNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="accountNo">
                  <Form.Label>Account No</Form.Label>
                  <Form.Control
                    name="accountNo"
                    placeholder="Enter account no"
                    value={formData.accountNo || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.accountNo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.accountNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="bankName">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    name="bankName"
                    placeholder="Enter bank name"
                    value={formData.bankName || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.bankName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.bankName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="ifscCode">
                  <Form.Label>IFSC Code</Form.Label>
                  <Form.Control
                    name="ifscCode"
                    placeholder="Enter ifsc code"
                    value={formData.ifscCode || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.ifscCode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.ifscCode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branchName">
                  <Form.Label>Branch Name</Form.Label>
                  <Form.Control
                    name="branchName"
                    placeholder="Enter branch name"
                    value={formData.branchName || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.branchName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branchName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <div className="form-actions d-flex justify-content-end">
              <Button
                type="button"
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="primary">
                {isEditing ? "Update Vendor" : "Save Vendor"}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {!showForm && (
        <Card className="v-card">
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
                  <th>Vendor/Company Name</th>
                  <th>Contact No</th>
                  <th>Created Detail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={4}>No data found</td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v._id}>
                      <td>{v.vendorName}</td>
                      <td>{v.contactNo}</td>
                      <td>
                        {v.created_by ? v.created_by.name : ""}
                        <br />
                        {v.created_on &&
                          new Date(v.created_on).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(v)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(v._id)}
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

export default VendorsMaster;
