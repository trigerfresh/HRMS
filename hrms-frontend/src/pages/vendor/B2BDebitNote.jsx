import React, { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import FilterPanel from "../../utils/FilterPanel";
import {
  Alert,
  Button,
  Card,
  Dropdown,
  DropdownItem,
  Form,
  Table,
} from "react-bootstrap";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { formatDateAndTime, formatDateForInput } from "../../utils/utils";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const B2BDebitNote = () => {
  const navigate = useNavigate();
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [vendorSuggestions, setVendorSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vendorSearchLoading, setVendorSearchLoading] = useState(false);
  const fieldRefs = useRef({});

  const [formData, setFormData] = useState({
    invoiceNo: "",
    autoNo: "",
    invoiceDate: "",
    state: "",
    stateCode: "",
    documentNo: "",
    issueOfDate: "",
    transportationMode: "",
    vehicleNo: "",
    dateOfSupply: "",
    placeOfSupply: "",
    fromId: "",
    fromName: "",
    fromAddress: "",
    fromGSTin: "",
    fromState: "",
    fromStateCode: "",
    toId: "",
    toName: "",
    toAddress: "",
    toGSTin: "",
    toState: "",
    toStateCode: "",
    invRefNo: "",
    debitDate: "",
    freightCharges: "",
    freightPercentage: "",
    handlingCharges: "",
    handlingPercentage: "",
    packingCharges: "",
    packingPercentage: "",
    cashDiscount: "",
  });

  const [productDetails, setProductDetails] = useState([
    {
      description: "",
      hsn: "",
      quantity: "",
      rate: "",
      amount: "",
      discount: "",
      CGST: "",
      SGST: "",
      IGST: "",
    },
  ]);

  const [searchFields, setSearchFields] = useState([
    { field: "invoiceNo", keyword: "" },
  ]);

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const searchOptions = [
    { value: "invoiceNo", label: "Invoice No" },
    { value: "toName", label: "Vendor Name" },
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

  const fetchDebitNotes = async () => {
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
      const res = await axios.get(`${API_BASE_URL}/b2b/debit-note`, {
        params,
        ...getAuthHeaders(),
      });
      // console.log(res.data);
      setDebitNotes(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load debit notes.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceNo = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/b2b/debit-note/fetchInvoiceNo`,
        {
          ...getAuthHeaders(),
        },
      );

      // console.log(res);
      const invoice = res.data.invoiceNo;
      setFormData((prev) => ({
        ...prev,
        autoNo: invoice,
        invoiceNo: invoice,
      }));
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load invoice no.");
    }
  };

  const handleSearch = () => {
    fetchDebitNotes();
  };

  const loadInitialData = () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const userDetails = jwtDecode(token);
      const companyDetails = userDetails.company;

      setFormData((prev) => ({
        ...prev,
        fromId: companyDetails._id,
        fromName: companyDetails.companyName,
        fromAddress: companyDetails.address,
        fromGSTin: companyDetails.gstNo,
        fromState: companyDetails.regionState,
        fromStateCode: companyDetails.stateCode,
      }));
    } catch (err) {
      console.error("Invalid token");
    }

    fetchInvoiceNo();
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchDebitNotes();
  }, [JSON.stringify(searchFields), dateFilter.from, dateFilter.to]);

  const fetchVendorSuggestions = async (value) => {
    if (!value.trim()) {
      setVendorSuggestions([]);
      return;
    }

    try {
      setVendorSearchLoading(true);
      const res = await axios.get(
        `${API_BASE_URL}/vendors-master/searchVendors`,
        {
          params: { keyword: value },
          ...getAuthHeaders(),
        },
      );
      setVendorSuggestions(res.data);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Vendor search failed");
    } finally {
      setVendorSearchLoading(false);
    }
  };

  const handleReset = () => {
    setSearchFields([{ field: "invoiceNo", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchDebitNotes();
  };

  const resetForm = () => {
    setFormData({
      invoiceNo: "",
      autoNo: "",
      invoiceDate: "",
      state: "",
      stateCode: "",
      transportationMode: "",
      vehicleNo: "",
      dateOfSupply: "",
      placeOfSupply: "",
      fromId: "",
      fromName: "",
      fromAddress: "",
      fromGSTin: "",
      fromState: "",
      fromStateCode: "",
      toId: "",
      toName: "",
      toAddress: "",
      toGSTin: "",
      toState: "",
      toStateCode: "",
      invRefNo: "",
      debitDate: "",
      freightCharges: "",
      freightPercentage: "",
      handlingCharges: "",
      handlingPercentage: "",
      packingCharges: "",
      packingPercentage: "",
      cashDiscount: "",
    });
    setProductDetails([
      {
        description: "",
        hsn: "",
        quantity: "",
        rate: "",
        amount: "",
        discount: "",
        CGST: "",
        SGST: "",
        IGST: "",
      },
    ]);
    loadInitialData();
    setIsEditing(null);
    setValidationErrors({});
  };

  const handleEdit = (note) => {
    setIsEditing(note);
    setValidationErrors({});
    // console.log(note);
    setFormData({
      invoiceNo: note.invoiceNo || "",
      autoNo: note.autoNo || "",
      invoiceDate: formatDateForInput(note.invoiceDate) || "",
      state: note.state || "",
      stateCode: note.stateCode || "",
      documentNo: note.documentNo || "",
      issueOfDate: note.issueOfDate ? formatDateForInput(note.issueOfDate) : "",
      transportationMode: note.transportationMode || "",
      vehicleNo: note.vehicleNo || "",
      dateOfSupply: note.dateOfSupply
        ? formatDateForInput(note.dateOfSupply)
        : "",
      placeOfSupply: note.placeOfSupply || "",
      fromId: note.fromId || "",
      fromName: note.fromName || "",
      fromAddress: note.fromAddress || "",
      fromGSTin: note.fromGSTin || "",
      fromState: note.fromState || "",
      fromStateCode: note.fromStateCode || "",
      toId: note.toId || "",
      toName: note.toName || "",
      toAddress: note.toAddress || "",
      toGSTin: note.toGSTin || "",
      toState: note.toState || "",
      toStateCode: note.toStateCode || "",
      invRefNo: note.invRefNo || "",
      debitDate: note.debitDate ? formatDateForInput(note.debitDate) : "",
      freightCharges: note.freightCharges || "",
      freightPercentage: note.freightPercentage || "",
      handlingCharges: note.handlingCharges || "",
      handlingPercentage: note.handlingPercentage || "",
      packingCharges: note.packingCharges || "",
      packingPercentage: note.packingPercentage || "",
      cashDiscount: note.cashDiscount || "",
    });

    setProductDetails(
      note.productDetails &&
        note.productDetails.length &&
        note.productDetails.map((b) => ({
          description: b.description || "",
          hsn: b.hsn || "",
          quantity: b.quantity || "",
          rate: b.rate || "",
          amount: b.amount || "",
          discount: b.discount || "",
          CGST: b.CGST || "",
          SGST: b.SGST || "",
          IGST: b.IGST || "",
        })),
    );
    setShowForm(true);
    setShowSearch(false);
  };

  const handleChange = (e) => {
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

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const updatedProduct = [...productDetails];
    updatedProduct[index][name] = value;

    // ✅ convert to number safely
    const qty = parseFloat(updatedProduct[index].quantity) || 0;
    const rate = parseFloat(updatedProduct[index].rate) || 0;
    // console.log(qty, rate);

    // ✅ auto calculate amount
    updatedProduct[index].amount = (qty * rate).toFixed(2);
    setProductDetails(updatedProduct);

    if (validationErrors[`${name}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${name}_${index}`]: "",
      }));
    }
  };

  const addProductRow = () => {
    setProductDetails([
      ...productDetails,
      {
        description: "",
        hsn: "",
        quantity: "",
        rate: "",
        amount: "",
        discount: "",
        CGST: "",
        SGST: "",
        IGST: "",
      },
    ]);
  };

  const removeProductRow = (index) => {
    setProductDetails(productDetails.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!formData.invoiceDate) errors.invoiceDate = "Invoice Date is required";

    if (formData.stateCode && isNaN(formData.stateCode)) {
      errors.stateCode = "State Code must be a number.";
    }
    if (!formData.fromName) errors.fromName = "Name is required";
    if (formData.fromGSTin && !gstRegex.test(formData.fromGSTin))
      errors.fromGSTin = "Invalid GST Format.";

    if (!formData.fromState.trim())
      errors.fromStateCode = "State Code is required";
    if (formData.fromStateCode && isNaN(formData.fromStateCode)) {
      errors.fromStateCode = "State Code must be a number.";
    }

    if (!formData.toName) errors.toName = "Name is required";
    if (formData.toGSTin && !gstRegex.test(formData.toGSTin))
      errors.toGSTin = "Invalid GST Format.";

    if (!formData.toStateCode.trim())
      errors.toStateCode = "State Code is required";
    if (formData.toStateCode && isNaN(formData.toStateCode)) {
      errors.toStateCode = "State Code must be a number.";
    }
    if (formData.freightCharges && isNaN(formData.freightCharges)) {
      errors.freightCharges = "Charges must be a number.";
    }
    if (formData.handlingCharges && isNaN(formData.handlingCharges)) {
      errors.handlingCharges = "Charges must be a number.";
    }
    if (formData.packingCharges && isNaN(formData.packingCharges)) {
      errors.packingCharges = "Charges must be a number.";
    }
    if (formData.freightPercentage && isNaN(formData.freightPercentage)) {
      errors.freightPercentage = "Percentage must be a number.";
    }
    if (formData.handlingPercentage && isNaN(formData.handlingPercentage)) {
      errors.handlingPercentage = "Percentage must be a number.";
    }
    if (formData.packingPercentage && isNaN(formData.packingPercentage)) {
      errors.packingPercentage = "Percentage must be a number.";
    }
    if (formData.cashDiscount && isNaN(formData.cashDiscount)) {
      errors.cashDiscount = "Cash Discount must be a number.";
    }
    if (formData.receivedAmt && isNaN(formData.receivedAmt)) {
      errors.receivedAmt = "Received Amount must be a number.";
    }
    // setValidationErrors(errors);
    return errors;
  };

  const validateProductDetails = () => {
    const errors = {};

    productDetails.forEach((product, index) => {
      // Quantity
      if (product.quantity && isNaN(product.quantity)) {
        errors[`quantity_${index}`] = "Must be a valid number";
      }

      // Rate
      if (product.rate && isNaN(product.rate)) {
        errors[`rate_${index}`] = "Must be a valid number";
      }

      // Amount
      if (product.amount && isNaN(product.amount)) {
        errors[`amount_${index}`] = "Must be a valid number";
      }

      // Discount
      if (product.discount && isNaN(product.discount)) {
        errors[`discount_${index}`] = "Must be a valid number";
      }

      // CGST
      if (product.CGST && isNaN(product.CGST)) {
        errors[`CGST_${index}`] = "Must be a valid number";
      }

      // SGST
      if (product.SGST && isNaN(product.SGST)) {
        errors[`SGST_${index}`] = "Must be a valid number";
      }

      // IGST
      if (product.IGST && isNaN(product.IGST)) {
        errors[`IGST_${index}`] = "Must be a valid number";
      }
    });

    // setValidationErrors(errors);
    return errors;
  };

  const focusFirstError = (errors) => {
    const firstErrorKey = Object.keys(errors)[0];

    if (firstErrorKey && fieldRefs.current[firstErrorKey]) {
      fieldRefs.current[firstErrorKey].focus();
      fieldRefs.current[firstErrorKey].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    const productErrors = validateProductDetails();

    const allErrors = { ...formErrors, ...productErrors };

    setValidationErrors(allErrors);

    if (Object.keys(allErrors).length > 0) {
      // console.log(allErrors);
      focusFirstError(allErrors);
      // alert("Please fix the validation errors before submitting.");
      return;
    }
    const toDecimal = (val) => Number(parseFloat(val || 0).toFixed(2));

    const formattedProducts = productDetails.map((p) => ({
      ...p,
      quantity: toDecimal(p.quantity) || 0,
      rate: toDecimal(p.rate) || 0,
      amount: toDecimal(p.amount) || 0,
      discount: toDecimal(p.discount) || 0,
      CGST: parseFloat(p.CGST) || 0,
      SGST: parseFloat(p.SGST) || 0,
      IGST: parseFloat(p.IGST) || 0,
    }));
    const data = {
      formData: { ...formData, invoiceDate: new Date(formData.invoiceDate) },
      productDetails: formattedProducts,
    };

    // console.log(data);

    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders().headers,
        },
      };
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/b2b/debit-note/${isEditing._id}`,
          data,
          config,
        );
        alert("Debit Note updated successfully!");
        navigate(`/b2b/view-debit-note?debitNoteId=${isEditing._id}`, {
          state: { autoPrint: true },
        });
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/b2b/debit-note/`,
          data,
          config,
        );
        // console.log(res.data);
        alert("Debit Note saved successfully!");
        navigate(`/b2b/view-debit-note?debitNoteId=${res.data.data}`, {
          state: { autoPrint: true },
        });
      }
      resetForm();
      setShowForm(false);
      fetchDebitNotes();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        // console.log(err);
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
        setError(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this debit note?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/b2b/debit-note/${id}`,
          getAuthHeaders(),
        );
        alert("Debit note removed!");
        fetchDebitNotes();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Debit note remove failed!");
      }
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
        `${API_BASE_URL}/b2b/debit-note/export`,
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
      link.download = `DebitNote_${randomNumber}.xlsx`;
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
        <h1 className="page-title">B2B Debit Note</h1>
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

      {showSearch && (
        <FilterPanel
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

      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Debit Note - {isEditing.invoiceNo}</span>
            ) : (
              "Add Debit Note"
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Table bordered>
              <tbody>
                <tr>
                  <td colSpan={2}>
                    <Table
                      bordered
                      style={{ width: "50%", float: "left", height: "129px" }}
                    >
                      <tbody>
                        <tr>
                          <td>Invoice No:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="invoiceNo"
                                ref={(el) => (fieldRefs.current.invoiceNo = el)}
                                value={formData.invoiceNo}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.invoiceNo}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.invoiceNo}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                          <td>Invoice Date:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="date"
                                name="invoiceDate"
                                ref={(el) =>
                                  (fieldRefs.current.invoiceDate = el)
                                }
                                value={formData.invoiceDate}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.invoiceDate}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.invoiceDate}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                        </tr>
                        <tr>
                          <td>State:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleChange}
                            />
                          </td>
                          <td>State Code:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="stateCode"
                                ref={(el) => (fieldRefs.current.stateCode = el)}
                                value={formData.stateCode}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.stateCode}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.stateCode}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                        </tr>
                        <tr>
                          <td>Document No:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="documentNo"
                              value={formData.documentNo || ""}
                              onChange={handleChange}
                            />
                          </td>
                          <td>Issue of Date:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="date"
                                name="issueOfDate"
                                value={formData.issueOfDate || ""}
                                onChange={handleChange}
                              />
                            </Form.Group>
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    <Table bordered style={{ width: "50%", float: "left" }}>
                      <tbody>
                        <tr>
                          <td>Transportation Mode:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="transportationMode"
                              value={formData.transportationMode}
                              onChange={handleChange}
                            />
                          </td>
                          <td>Vehicle Number:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="vehicleNo"
                              value={formData.vehicleNo}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>Date of Supply:</td>
                          <td>
                            <Form.Control
                              type="date"
                              name="dateOfSupply"
                              value={formData.dateOfSupply}
                              onChange={handleChange}
                            />
                          </td>
                          <td>Place of Supply:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="placeOfSupply"
                              value={formData.placeOfSupply}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </td>
                </tr>

                {/* From & To */}
                <tr>
                  <td style={{ width: "50%" }}>
                    <em>From</em>
                  </td>
                  <td>
                    <em>To</em>
                  </td>
                </tr>
                <tr>
                  <td colSpan={2}>
                    <Table bordered style={{ width: "50%", float: "left" }}>
                      <tbody>
                        <tr>
                          <td>Name:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="fromName"
                                value={formData.fromName}
                                ref={(el) => (fieldRefs.current.fromName = el)}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.fromName}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.fromName}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                          <td>Address:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="fromAddress"
                              value={formData.fromAddress}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>GSTIN:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="fromGSTin"
                                ref={(el) => (fieldRefs.current.fromGSTin = el)}
                                value={formData.fromGSTin}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.fromGSTin}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.fromGSTin}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                          <td>State:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="fromState"
                              value={formData.fromState}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>State Code:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="fromStateCode"
                                value={formData.fromStateCode}
                                ref={(el) =>
                                  (fieldRefs.current.fromStateCode = el)
                                }
                                onChange={handleChange}
                                isInvalid={!!validationErrors.fromStateCode}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.fromStateCode}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                        </tr>
                      </tbody>
                    </Table>

                    <Table bordered style={{ width: "50%", float: "left" }}>
                      <tbody>
                        <tr>
                          <td>Name:</td>
                          <td>
                            {/* <Form.Group>
                              <Form.Control
                                type="text"
                                name="toName"
                                value={formData.toName}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.toName}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.toName}
                              </Form.Control.Feedback>
                            </Form.Group> */}
                            <Form.Group className="position-relative">
                              <Form.Control
                                type="text"
                                name="toName"
                                value={formData.toName}
                                ref={(el) => (fieldRefs.current.toName = el)}
                                // placeholder="Type vendor name"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    toName: value,
                                  }));
                                  if (validationErrors.toName) {
                                    setValidationErrors((prev) => ({
                                      ...prev,
                                      toName: "",
                                    }));
                                  }
                                  fetchVendorSuggestions(value);
                                }}
                                onFocus={() => {
                                  if (vendorSuggestions.length > 0)
                                    setShowSuggestions(true);
                                }}
                                onBlur={() => {
                                  // delay so click works
                                  setTimeout(
                                    () => setShowSuggestions(false),
                                    200,
                                  );
                                }}
                                isInvalid={!!validationErrors.toName}
                              />

                              {/* Bootstrap Suggestion Box */}
                              {showSuggestions && (
                                <div
                                  className="list-group position-absolute w-100 shadow"
                                  style={{ zIndex: 1050 }}
                                >
                                  {vendorSearchLoading ? (
                                    <button className="list-group-item list-group-item-action disabled">
                                      Loading...
                                    </button>
                                  ) : vendorSuggestions.length === 0 ? (
                                    <button className="list-group-item list-group-item-action disabled">
                                      No vendors found
                                    </button>
                                  ) : (
                                    vendorSuggestions.map((v) => (
                                      <button
                                        type="button"
                                        key={v._id}
                                        className="list-group-item list-group-item-action"
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            toId: v._id,
                                            toName: v.vendorName,
                                            toAddress: v.address || "",
                                            toGSTin: v.gstNo || "",
                                            toState: v.state || "",
                                            toStateCode: v.stateCode || "",
                                          }));

                                          if (validationErrors.toName) {
                                            setValidationErrors((prev) => ({
                                              ...prev,
                                              toName: "",
                                            }));
                                          }
                                          if (validationErrors.toStateCode) {
                                            setValidationErrors((prev) => ({
                                              ...prev,
                                              toStateCode: "",
                                            }));
                                          }
                                          setShowSuggestions(false);
                                        }}
                                      >
                                        <strong>{v.vendorName}</strong>
                                      </button>
                                    ))
                                  )}
                                </div>
                              )}

                              <Form.Control.Feedback type="invalid">
                                {validationErrors.toName}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                          <td>Address:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="toAddress"
                              value={formData.toAddress}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>GSTIN:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="toGSTin"
                                value={formData.toGSTin}
                                ref={(el) => (fieldRefs.current.toGSTin = el)}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.toGSTin}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.toGSTin}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                          <td>State:</td>
                          <td>
                            <Form.Control
                              type="text"
                              name="toState"
                              value={formData.toState}
                              onChange={handleChange}
                            />
                          </td>
                        </tr>
                        <tr>
                          <td>State Code:</td>
                          <td>
                            <Form.Group>
                              <Form.Control
                                type="text"
                                name="toStateCode"
                                value={formData.toStateCode}
                                ref={(el) =>
                                  (fieldRefs.current.toStateCode = el)
                                }
                                onChange={handleChange}
                                isInvalid={!!validationErrors.toStateCode}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.toStateCode}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </td>
                </tr>

                <tr>
                  <td>
                    Inv. Ref. No.:
                    <Form.Control
                      type="text"
                      name="invRefNo"
                      value={formData.invRefNo || ""}
                      onChange={handleChange}
                    />
                  </td>
                  <td>
                    Date:
                    <Form.Control
                      type="date"
                      name="debitDate"
                      value={formData.debitDate || ""}
                      onChange={handleChange}
                    />
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* Products Table */}
            <Table bordered hover responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Sr no.</th>
                  <th>Description</th>
                  <th>HSN Code</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Discount(%)</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                  <th>
                    <button
                      type="button"
                      onClick={addProductRow}
                      className="icon-btn add text-warning"
                    >
                      <FaPlus />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {productDetails.map((product, idx) => (
                  <tr key={idx}>
                    <td>
                      <Form.Control type="text" value={idx + 1} readOnly />
                    </td>
                    {Object.keys(product).map((key) => (
                      <td key={key}>
                        <Form.Control
                          type="text"
                          name={key}
                          value={product[key]}
                          ref={(el) =>
                            (fieldRefs.current[`${key}_${idx}`] = el)
                          }
                          onChange={(e) => handleProductChange(idx, e)}
                          isInvalid={!!validationErrors[`${key}_${idx}`]}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors[`${key}_${idx}`]}
                        </Form.Control.Feedback>
                      </td>
                    ))}
                    <td>
                      {productDetails.length > 1 && (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="icon-btn delete"
                            onClick={() => removeProductRow(idx)}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Charges Section */}
            <Table bordered style={{ width: "50%", float: "left" }}>
              <tbody>
                <tr>
                  <th>Freight Charges:</th>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        name="freightCharges"
                        value={formData.freightCharges}
                        onChange={handleChange}
                        placeholder="Charges"
                        isInvalid={!!validationErrors.freightCharges}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.freightCharges}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        placeholder="Percentage"
                        name="freightPercentage"
                        value={formData.freightPercentage}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.freightPercentage}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.freightPercentage}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                </tr>
                <tr>
                  <th>Handling Charges:</th>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        name="handlingCharges"
                        isInvalid={!!validationErrors.handlingCharges}
                        value={formData.handlingCharges}
                        placeholder="Charges"
                        onChange={handleChange}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.handlingCharges}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        name="handlingPercentage"
                        placeholder="Percentage"
                        value={formData.handlingPercentage}
                        isInvalid={!!validationErrors.handlingPercentage}
                        onChange={handleChange}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.handlingPercentage}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                </tr>
                <tr>
                  <th>Packing Charges:</th>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        placeholder="Charges"
                        name="packingCharges"
                        value={formData.packingCharges}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.packingCharges}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.packingCharges}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        name="packingPercentage"
                        placeholder="Percentage"
                        value={formData.packingPercentage}
                        isInvalid={!!validationErrors.packingPercentage}
                        onChange={handleChange}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.packingPercentage}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                </tr>
              </tbody>
            </Table>
            <Table bordered style={{ width: "50%" }}>
              <tbody>
                <tr>
                  <th>Cash Discount:</th>
                  <td>
                    <Form.Group>
                      <Form.Control
                        type="text"
                        placeholder="Amount"
                        name="cashDiscount"
                        value={formData.cashDiscount}
                        onChange={handleChange}
                        isInvalid={!!validationErrors.cashDiscount}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.cashDiscount}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </td>
                </tr>
                <tr>
                  <td colSpan={3}>
                    <div className="form-actions d-flex ">
                      <Button
                        type="button"
                        variant="secondary"
                        className="me-2"
                        onClick={() => {
                          setShowForm(false);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="primary">
                        {isEditing ? "Update Bill" : "Save & Print"}
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </Table>
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
                  <th>Invoice No</th>
                  <th>Company Name</th>
                  <th>Bill Date</th>
                  <th>Bill Amount(Rs.)</th>
                  <th>GST(Rs.)</th>
                  <th>Created Detail</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {debitNotes.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={9}>No data found</td>
                  </tr>
                ) : (
                  debitNotes.map((n) => (
                    <tr key={n._id}>
                      <td>{n.invoiceNo || ""}</td>
                      <td>{n.toName || ""}</td>
                      <td>
                        {(n.invoiceDate && formatDateAndTime(n.invoiceDate)) ||
                          ""}
                      </td>
                      <td>{n.totalPayableAmount || 0}</td>
                      <td>{n.totalGSTAmount || 0}</td>
                      <td>
                        {n.created_by ? n.created_by.name : ""}
                        <br />
                        {n.created_on &&
                          new Date(n.created_on).toLocaleDateString()}
                      </td>
                      <td>
                        <Dropdown align="end">
                          <Dropdown.Toggle variant="primary">
                            Action
                          </Dropdown.Toggle>

                          <Dropdown.Menu
                            popperConfig={{ strategy: "fixed" }}
                            renderOnMount
                          >
                            <DropdownItem
                              onClick={() =>
                                navigate(
                                  `/b2b/view-debit-note?debitNoteId=${n._id}`,
                                  {
                                    state: { autoPrint: true },
                                  },
                                )
                              }
                            >
                              Print Bill
                            </DropdownItem>
                            <DropdownItem onClick={() => handleEdit(n)}>
                              Edit
                            </DropdownItem>
                            <DropdownItem onClick={() => handleDelete(n._id)}>
                              Remove
                            </DropdownItem>
                          </Dropdown.Menu>
                        </Dropdown>
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

export default B2BDebitNote;
