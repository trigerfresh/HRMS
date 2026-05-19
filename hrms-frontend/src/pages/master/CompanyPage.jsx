import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaPen, FaTrashAlt, FaTimes } from "react-icons/fa";
import SearchPanel from "../../utils/FilterPanel";
import {
  Button,
  Card,
  Col,
  Form,
  Row,
  Tab,
  Table,
  Tabs,
  Alert,
} from "react-bootstrap";

const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [activeTab, setActiveTab] = useState("companyDetails");
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    companyName: "",
    contactPersonName: "",
    emailId: "",
    address: "",
    country: "",
    regionState: "",
    city: "",
    pincode: "",
    stateCode: "",
    contactNo: "",
    gstNo: "",
    website: "",
    currency: "INR",
    financialYearFrom: "",
    financialYearTo: "",
    cinNo: "",
    vatTin: "",
    cstTin: "",
    iec: "",
    invoicePrefix: "",
    termsAndCond: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [bankDetails, setBankDetails] = useState([
    {
      bankName: "",
      accountNo: "",
      accountType: "",
      branchCity: "",
      address: "",
      swift: "",
      micr: "",
      ifsc: "",
    },
  ]);

  const [searchFields, setSearchFields] = useState([
    { field: "companyName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const validSearch = searchFields.filter((f) => f.field && f.keyword);
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch);
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from;
        params.toDate = dateFilter.to;
      }
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/companies`,
        {
          params,
          ...getAuthHeaders(),
        },
      );
      setCompanies(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        setError(err.response?.data?.message || "Failed to fetch companies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [searchFields, dateFilter]);

  // --- Form Handlers ---
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleBankChange = (index, e) => {
    const { name, value } = e.target;
    const updatedBanks = [...bankDetails];
    updatedBanks[index][name] = value;
    setBankDetails(updatedBanks);

    // Clear validation error on change
    if (validationErrors[`${name}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${name}_${index}`]: "",
      }));
    }
  };

  const addBankRow = () => {
    setBankDetails([
      ...bankDetails,
      {
        bankName: "",
        accountNo: "",
        accountType: "",
        branchCity: "",
        address: "",
        swift: "",
        micr: "",
        ifsc: "",
      },
    ]);
  };

  const removeBankRow = (index) => {
    setBankDetails(bankDetails.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      contactPersonName: "",
      emailId: "",
      address: "",
      country: "",
      regionState: "",
      city: "",
      pincode: "",
      stateCode: "",
      contactNo: "",
      gstNo: "",
      website: "",
      cinNo: "",
      vatTin: "",
      cstTin: "",
      iec: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setBankDetails([
      {
        bankName: "",
        accountNo: "",
        accountType: "",
        branchCity: "",
        address: "",
        swift: "",
        micr: "",
        ifsc: "",
      },
    ]);
    setIsEditing(null);
    setValidationErrors({});
    // setShowForm(false);
    setActiveTab("companyDetails");
  };

  // Validation logic
  const validateCompanyDetails = () => {
    const errors = {};
    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!formData.companyName.trim())
      errors.companyName = "Company Name is required.";
    if (!formData.emailId.trim()) {
      errors.emailId = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      errors.emailId = "Invalid email format.";
    }
    if (formData.contactNo && !/^\d{10}$/.test(formData.contactNo))
      errors.contactNo = "Contact number must be 10 digits";
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      errors.pincode = "Please enter a valid 6-digit Pincode.";
    }
    if (formData.gstNo && !gstRegex.test(formData.gstNo))
      errors.gstNo = "Invalid GST Format.";

    if (formData.stateCode && isNaN(formData.stateCode)) {
      errors.stateCode = "GST State Code must be a number.";
    }
    if (formData.financialYearFrom && isNaN(formData.financialYearFrom)) {
      errors.financialYearFrom = "Financial Year From must be a number.";
    }
    if (formData.financialYearTo && isNaN(formData.financialYearTo)) {
      errors.financialYearTo = "Financial Year To must be a number.";
    }
    // if (
    //   formData.website &&
    //   !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.website)
    // )
    //   errors.website = "Invalid website URL.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBankDetails = () => {
    const errors = {};
    bankDetails.forEach((bank, idx) => {
      if (!bank.bankName || bank.bankName.trim() === "") {
        errors[`bankName_${idx}`] = "Bank name is required";
      }

      if (!bank.accountNo || bank.accountNo.trim() === "") {
        errors[`accountNo_${idx}`] = "Account number is required";
      } else if (!/^[0-9]{6,18}$/.test(bank.accountNo)) {
        errors[`accountNo_${idx}`] = "Account number must be 6-18 digits";
      }

      if (!bank.ifsc || bank.ifsc.trim() === "") {
        errors[`ifsc_${idx}`] = "IFSC code is required";
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc)) {
        errors[`ifsc_${idx}`] = "Invalid IFSC code";
      }
      if (bank.micr && !/^[0-9]{9}$/.test(bank.micr)) {
        errors[`micr_${idx}`] = "MICR Code must be 9 digits";
      }
      if (!bank.accountType) {
        errors[`accountType_${idx}`] = "Select Account Type";
      }
      if (!bank.branchCity || bank.branchCity.trim() === "") {
        errors[`branchCity_${idx}`] = "Branch City is required";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateCompanyDetails()) {
      setActiveTab("companyDetails");
      alert("Please fix the validation errors before submitting.");
      return;
    } else if (!validateBankDetails()) {
      setActiveTab("bankDetails");
      alert("Please fix the validation errors before submitting.");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) data.append(key, formData[key]);
    });
    if (logoFile) data.append("logo", logoFile);
    data.append("bankDetails", JSON.stringify(bankDetails));

    // Consoling FormData (data)
    // for (let [key, value] of data.entries()) {
    //   console.log(`${key}:`, value);
    // }

    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getAuthHeaders().headers,
        },
      };
      if (isEditing) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/companies/${isEditing._id}`,
          data,
          config,
        );
        alert("Company updated successfully!");
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/companies`,
          data,
          config,
        );
        // console.log(res.data);
        alert("Company created successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
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

  const handleEdit = (company) => {
    setIsEditing(company);
    setValidationErrors({});

    // Set company details form
    setFormData({
      companyName: company.companyName || "",
      contactPersonName: company.contactPersonName || "",
      emailId: company.emailId || "",
      address: company.address || "",
      country: company.country || "",
      regionState: company.regionState || "",
      city: company.city || "",
      pincode: company.pincode || "",
      stateCode: company.stateCode || "",
      contactNo: company.contactNo || "",
      gstNo: company.gstNo || "",
      website: company.website || "",
      currency: company.currency || "",
      financialYearFrom: company.financialYearFrom || "",
      financialYearTo: company.financialYearTo || "",
      cinNo: company.cinNo || "",
      vatTin: company.vatTin || "",
      cstTin: company.cstTin || "",
      iec: company.iec || "",
      invoicePrefix: company.invoicePrefix || "",
      termsAndCond: company.termsAndCond || "",
    });

    // Ensure bankDetails is an array with at least one empty object
    setBankDetails(
      company.bankDetails && company.bankDetails.length
        ? company.bankDetails.map((bank) => ({
            _id: bank._id,
            bankName: bank.bankName || "",
            accountNo: bank.accountNo || "",
            accountType: bank.accountType || "",
            branchCity: bank.branchCity || "",
            address: bank.address || "",
            swift: bank.swift || "",
            micr: bank.micr || "",
            ifsc: bank.ifsc || "",
          }))
        : [
            {
              bankName: "",
              accountNo: "",
              accountType: "",
              branchCity: "",
              address: "",
              swift: "",
              micr: "",
              ifsc: "",
            },
          ],
    );

    // Set logo preview
    setLogoPreview(
      company.logo ? `${import.meta.env.VITE_API_URL}/${company.logo}` : null,
    );

    // Show form and switch to company details tab
    setShowForm(true);
    setShowSearch(false);
    setActiveTab("companyDetails");
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/companies/${id}`,
          getAuthHeaders(),
        );
        alert("Company deleted successfully!");
        fetchCompanies();
      } catch (e) {
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

  const handleSearch = () => fetchCompanies();
  const handleReset = () => {
    setSearchFields([{ field: "companyName", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    setTimeout(() => fetchCompanies(), 0);
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
        `${import.meta.env.VITE_API_URL}/api/companies/export`,
        {
          params,
          responseType: "blob",
          ...getAuthHeaders(),
        },
      );

      // Create Excel File
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Companies_${randomNumber}.xlsx`;
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

  const searchOptions = [
    { value: "companyName", label: "Company Name" },
    { value: "contactPersonName", label: "Contact Person" },
    { value: "emailId", label: "Email ID" },
    { value: "city", label: "City" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          Company Management{" "}
          <span className="text-success">({companies.length})</span>
        </h1>
        <div className="page-actions">
          <button
            type="button"
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowForm(true);
              setShowSearch(false);
            }}
          >
            <FaPlus /> Create New
          </button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <SearchPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={handleReset}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Company - {isEditing.companyName}</span>
            ) : (
              "Create New Company"
            )}
          </h2>

          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}

          <Form className="company-form" onSubmit={handleSubmit}>
            <Tabs
              activeKey={activeTab}
              onSelect={() => {}}
              className="mb-3"
              fill
            >
              {/* Company Details Tab */}
              <Tab eventKey="companyDetails" title="Company Details">
                <Row>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="companyName">
                      <Form.Label>Company Name *</Form.Label>
                      <Form.Control
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        placeholder="Company Name"
                        isInvalid={!!validationErrors.companyName}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.companyName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="contactPersonName">
                      <Form.Label>Contact Person Name</Form.Label>
                      <Form.Control
                        name="contactPersonName"
                        value={formData.contactPersonName}
                        onChange={handleInputChange}
                        placeholder="Contact Person Name"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="emailId">
                      <Form.Label>Email ID *</Form.Label>
                      <Form.Control
                        name="emailId"
                        value={formData.emailId}
                        onChange={handleInputChange}
                        placeholder="Email ID"
                        type="email"
                        isInvalid={!!validationErrors.emailId}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.emailId}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="address">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as={"textarea"}
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Address"
                        rows={3}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="country">
                      <Form.Label>Country</Form.Label>
                      <Form.Control
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Country"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="regionState">
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        name="regionState"
                        value={formData.regionState}
                        onChange={handleInputChange}
                        placeholder="State"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="city">
                      <Form.Label>City</Form.Label>
                      <Form.Control
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="City"
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
                        isInvalid={!!validationErrors.pincode}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.pincode}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="stateCode">
                      <Form.Label>GST State Code</Form.Label>
                      <Form.Control
                        name="stateCode"
                        value={formData.stateCode}
                        onChange={handleInputChange}
                        isInvalid={!!validationErrors.stateCode}
                        placeholder="GST State Code"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.stateCode}
                      </Form.Control.Feedback>
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
                        isInvalid={!!validationErrors.contactNo}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.contactNo}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="currency">
                      <Form.Label>Currency</Form.Label>
                      <Form.Select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                      >
                        <option value={"INR"}>INR</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="gstNo">
                      <Form.Label>GST No</Form.Label>
                      <Form.Control
                        name="gstNo"
                        value={formData.gstNo}
                        onChange={handleInputChange}
                        placeholder="GST No"
                        isInvalid={!!validationErrors.gstNo}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.gstNo}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="website">
                      <Form.Label>Website</Form.Label>
                      <Form.Control
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="Website"
                        isInvalid={!!validationErrors.website}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.website}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="financialYearFrom">
                      <Form.Label>Financial Year From</Form.Label>
                      <Form.Control
                        name="financialYearFrom"
                        value={formData.financialYearFrom}
                        onChange={handleInputChange}
                        placeholder="Financial Year From"
                        isInvalid={!!validationErrors.financialYearFrom}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.financialYearFrom}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="financialYearTo">
                      <Form.Label>Financial Year To</Form.Label>
                      <Form.Control
                        name="financialYearTo"
                        value={formData.financialYearTo}
                        onChange={handleInputChange}
                        placeholder="Financial Year To"
                        isInvalid={!!validationErrors.financialYearTo}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.financialYearTo}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="cinNo">
                      <Form.Label>CIN No.</Form.Label>
                      <Form.Control
                        name="cinNo"
                        value={formData.cinNo}
                        onChange={handleInputChange}
                        placeholder="CIN No."
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="vatTin">
                      <Form.Label>VAT TIN</Form.Label>
                      <Form.Control
                        name="vatTin"
                        value={formData.vatTin}
                        onChange={handleInputChange}
                        placeholder="VAT TIN"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="cstTin">
                      <Form.Label>CST TIN</Form.Label>
                      <Form.Control
                        name="cstTin"
                        value={formData.cstTin}
                        onChange={handleInputChange}
                        placeholder="CST TIN"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="mb-3">
                    <Form.Group controlId="iec">
                      <Form.Label>IEC</Form.Label>
                      <Form.Control
                        name="iec"
                        value={formData.iec}
                        onChange={handleInputChange}
                        placeholder="IEC"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="mb-3">
                    <Form.Group controlId="iec">
                      <Form.Label>Invoice Prefix</Form.Label>
                      <Form.Control
                        name="invoicePrefix"
                        value={formData.invoicePrefix}
                        onChange={handleInputChange}
                        placeholder="Invoice Prefix"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={3} className="mb-3">
                    <Form.Group controlId="formLogo">
                      <Form.Label>Attach Logo</Form.Label>
                      <Form.Control
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        name="logo"
                        onChange={handleFileChange}
                      />
                    </Form.Group>
                  </Col>
                  {logoPreview && (
                    <Col xs={12} sm={6} md={3} className="mb-3 text-center">
                      <img
                        src={logoPreview}
                        alt="logo preview"
                        style={{
                          width: "180px",
                          height: "200px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                        }}
                      />
                    </Col>
                  )}
                  <Col xs={12} sm={12} md={12} className="mb-3">
                    <Form.Group controlId="termsAndCond">
                      <Form.Label>Terms And Conditions</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="termsAndCond"
                        value={formData.termsAndCond}
                        onChange={handleInputChange}
                        placeholder="Terms & Conditions"
                        rows={3}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="form-actions d-flex justify-content-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="me-2"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (validateCompanyDetails()) {
                        setActiveTab("bankDetails"); // switch only if validation passes
                      } else {
                        alert("Please fix the validation errors.");
                      }
                    }}
                    variant="primary"
                    type="button"
                  >
                    Next
                  </Button>
                </div>
              </Tab>

              {/* Bank Details Tab */}
              <Tab eventKey="bankDetails" title="Bank Details">
                <Table bordered hover responsive>
                  <thead className="table-secondary">
                    <tr>
                      <th>Bank Name</th>
                      <th>Account No</th>
                      <th>Account Type</th>
                      <th>Branch City</th>
                      <th>Address</th>
                      <th>Swift A/C No</th>
                      <th>MICR No</th>
                      <th>IFSC Code</th>
                      <th>
                        <button
                          type="button"
                          onClick={addBankRow}
                          className="icon-btn add text-warning"
                        >
                          <FaPlus />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankDetails.map((bank, idx) => (
                      <tr key={idx}>
                        <td>
                          <Form.Control
                            name="bankName"
                            value={bank.bankName}
                            onChange={(e) => handleBankChange(idx, e)}
                            isInvalid={!!validationErrors[`bankName_${idx}`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`bankName_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Control
                            name="accountNo"
                            value={bank.accountNo}
                            onChange={(e) => handleBankChange(idx, e)}
                            isInvalid={!!validationErrors[`accountNo_${idx}`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`accountNo_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Select
                            name="accountType"
                            value={bank.accountType}
                            onChange={(e) => handleBankChange(idx, e)}
                            isInvalid={!!validationErrors[`accountType_${idx}`]}
                          >
                            <option value="">-- Select Account Type --</option>
                            <option value="Savings">Savings</option>
                            <option value="Current">Current</option>
                            <option value="Salary">Salary</option>
                            <option value="Other">Other</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`accountType_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Control
                            name="branchCity"
                            value={bank.branchCity}
                            onChange={(e) => handleBankChange(idx, e)}
                            isInvalid={!!validationErrors[`branchCity_${idx}`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`branchCity_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            name="address"
                            value={bank.address}
                            onChange={(e) => handleBankChange(idx, e)}
                            isInvalid={!!validationErrors[`address_${idx}`]}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`address_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Control
                            name="swift"
                            value={bank.swift}
                            onChange={(e) => handleBankChange(idx, e)}
                          />
                        </td>

                        <td>
                          <Form.Control
                            name="micr"
                            value={bank.micr}
                            isInvalid={!!validationErrors[`micr_${idx}`]}
                            onChange={(e) => handleBankChange(idx, e)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`micr_${idx}`]}
                          </Form.Control.Feedback>
                        </td>

                        <td>
                          <Form.Control
                            name="ifsc"
                            value={bank.ifsc}
                            isInvalid={!!validationErrors[`ifsc_${idx}`]}
                            onChange={(e) => handleBankChange(idx, e)}
                          />
                          <Form.Control.Feedback type="invalid">
                            {validationErrors[`ifsc_${idx}`]}
                          </Form.Control.Feedback>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="icon-btn delete"
                              onClick={() => removeBankRow(idx)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                <div className="form-actions d-flex justify-content-end mt-3">
                  <Button
                    variant="outline-secondary"
                    type="button"
                    className="me-2"
                    onClick={() => setActiveTab("companyDetails")}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="me-2"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    {isEditing ? "Update Company" : "Save Company"}
                  </Button>
                </div>
              </Tab>
            </Tabs>
          </Form>
        </Card>
      )}

      {/* Company List Table */}
      {!showForm && (
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
            <Table bordered hover responsive className="list-table">
              <thead className="table-secondary">
                <tr>
                  <th>Company</th>
                  <th>Contact Person</th>
                  <th>Email ID</th>
                  <th>Contact No</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={6}>No data found</td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company._id}>
                      <td>
                        <div className="info">
                          {company.logo ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}/${company.logo}`}
                              alt={company.companyName}
                              className="company-logo"
                            />
                          ) : (
                            ""
                          )}
                          <div>
                            <span className="company-name">
                              {company.companyName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{company.contactPersonName || ""}</td>
                      <td>
                        <span>{company.emailId}</span>
                      </td>
                      <td>{company.contactNo || ""}</td>
                      <td>{company.city || ""}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleEdit(company)}
                            type="button"
                            className="icon-btn edit"
                          >
                            <FaPen />
                          </button>
                          <button
                            onClick={() => handleDelete(company._id)}
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
          )}
        </Card>
      )}
    </div>
  );
};

export default CompanyPage;
