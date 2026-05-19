import { useEffect, useRef } from "react";
import { useState } from "react";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import FilterPanel from "../../utils/FilterPanel";
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  DropdownItem,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { formatDateAndTime, formatDateForInput } from "../../utils/utils";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const B2BPurchaseBill = () => {
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [vendorSuggestions, setVendorSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [vendorSearchLoading, setVendorSearchLoading] = useState(false);
  const [PAvalidationErrors, setPAValidationErrors] = useState({});
  const [showPayAmt, setShowPayAmt] = useState(false);
  const [payAmtData, setPayAmtData] = useState(null);

  const fieldRefs = useRef({});

  const [formData, setFormData] = useState({
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
    freightCharges: "",
    freightPercentage: "",
    handlingCharges: "",
    handlingPercentage: "",
    packingCharges: "",
    packingPercentage: "",
  });

  const [productDetails, setProductDetails] = useState([
    {
      productName: "",
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

  const [payForm, setPayForm] = useState({
    amount: "",
    paidDate: "",
    transactionType: "Cash",
    transactionID: "",
    bankName: "",
  });

  const [searchFields, setSearchFields] = useState([
    { field: "invoiceNo", keyword: "" },
  ]);

  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const searchOptions = [
    { value: "invoiceNo", label: "Invoice No" },
    { value: "fromName", label: "Vendor Name" },
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

  const fetchPurchaseBills = async () => {
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
      const res = await axios.get(`${API_BASE_URL}/b2b/purchase-bill`, {
        params,
        ...getAuthHeaders(),
      });
      // console.log(res.data);
      setPurchaseBills(res.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load purchase bills.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceNo = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/b2b/purchase-bill/fetchInvoiceNo`,
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPurchaseBills();
  };

  const loadInitialData = () => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      const userDetails = jwtDecode(token);
      const companyDetails = userDetails.company;

      setFormData((prev) => ({
        ...prev,
        toId: companyDetails._id,
        toName: companyDetails.companyName,
        toAddress: companyDetails.address,
        toGSTin: companyDetails.gstNo,
        toState: companyDetails.regionState,
        toStateCode: companyDetails.stateCode,
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
    fetchPurchaseBills();
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
    fetchPurchaseBills();
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
      freightCharges: "",
      freightPercentage: "",
      handlingCharges: "",
      handlingPercentage: "",
      packingCharges: "",
      packingPercentage: "",
    });
    setProductDetails([
      {
        productName: "",
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

  const handleEdit = (bill) => {
    setIsEditing(bill);
    setValidationErrors({});
    // console.log(bill);
    setFormData({
      invoiceNo: bill.invoiceNo || "",
      autoNo: bill.autoNo || "",
      invoiceDate: formatDateForInput(bill.invoiceDate) || "",
      state: bill.state || "",
      stateCode: bill.stateCode || "",
      transportationMode: bill.transportationMode || "",
      vehicleNo: bill.vehicleNo || "",
      dateOfSupply: formatDateForInput(bill.dateOfSupply) || "",
      placeOfSupply: bill.placeOfSupply || "",
      fromId: bill.fromId || "",
      fromName: bill.fromName || "",
      fromAddress: bill.fromAddress || "",
      fromGSTin: bill.fromGSTin || "",
      fromState: bill.fromState || "",
      fromStateCode: bill.fromStateCode || "",
      toId: bill.toId || "",
      toName: bill.toName || "",
      toAddress: bill.toAddress || "",
      toGSTin: bill.toGSTin || "",
      toState: bill.toState || "",
      toStateCode: bill.toStateCode || "",
      freightCharges: bill.freightCharges || "",
      freightPercentage: bill.freightPercentage || "",
      handlingCharges: bill.handlingCharges || "",
      handlingPercentage: bill.handlingPercentage || "",
      packingCharges: bill.packingCharges || "",
      packingPercentage: bill.packingPercentage || "",
    });

    setProductDetails(
      bill.productDetails &&
        bill.productDetails.length &&
        bill.productDetails.map((b) => ({
          productName: b.productName || "",
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
        productName: "",
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

  const handlePayAmt = (d) => {
    setPayAmtData(d);
    setShowPayAmt(true);
  };

  const handlePayChange = (e) => {
    const { name, value } = e.target;
    setPayForm((prev) => ({ ...prev, [name]: value }));

    const key = name;
    if (PAvalidationErrors[key]) {
      setPAValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    const gstRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!formData.invoiceNo) errors.invoiceNo = "Invoice No is required";
    if (!formData.invoiceDate) errors.invoiceDate = "Invoice Date is required";

    if (formData.stateCode && isNaN(formData.stateCode)) {
      errors.stateCode = "State Code must be a number.";
    }
    if (!formData.fromName) errors.fromName = "Name is required";
    if (formData.fromGSTin && !gstRegex.test(formData.fromGSTin))
      errors.fromGSTin = "Invalid GST Format.";

    if (!formData.fromStateCode.trim())
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
          `${API_BASE_URL}/b2b/purchase-bill/${isEditing._id}`,
          data,
          config,
        );
        alert("Purchase Bill updated successfully!");
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/b2b/purchase-bill/`,
          data,
          config,
        );
        // console.log(res.data);
        alert("Purchase Bill saved successfully!");
      }
      resetForm();
      setShowForm(false);
      fetchPurchaseBills();
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

  const handlePayAmtValid = () => {
    const errors = {};

    if (!payForm.amount) {
      errors.amount = "Amount is required.";
    }
    if (payForm.amount < 0) {
      errors.amount = "Amount should be greater than 0.";
    }
    if (!payForm.paidDate) {
      errors.paidDate = "Paid Date is required.";
    }
    if (payForm.transactionType && payForm.transactionType !== "Cash") {
      if (!payForm.transactionID)
        errors.transactionID = "Trs ID/Cheque No is required.";
    }

    // console.log(errors);
    setPAValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaidSubmit = async () => {
    // console.log(PAvalidationErrors)
    if (!handlePayAmtValid()) {
      alert("Please fill all the fields!");
      return;
    }
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_BASE_URL}/b2b/purchase-bill/payAmt`,
        {
          billId: payAmtData?._id,
          paidAmount: Number(payForm.amount),
          paidDate: new Date(payForm.paidDate),
          transactionType: payForm.transactionType,
          transactionID: payForm.transactionID,
          bankName: payForm.bankName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Payment paid successfully!");

      setShowPayAmt(false);
      setPayForm({
        amount: "",
        paidDate: "",
        transactionType: "Cash",
        transactionID: "",
        bankName: "",
      });

      fetchPurchaseBills();
    } catch (err) {
      alert("Error: Failed to save payment.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this purchase bill?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/b2b/purchase-bill/${id}`,
          getAuthHeaders(),
        );
        alert("Purchase bill removed!");
        fetchPurchaseBills();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Purchase bill remove failed!");
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
        `${API_BASE_URL}/b2b/purchase-bill/export`,
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
      link.download = `PurchaseBills_${randomNumber}.xlsx`;
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
        <h1 className="page-title">B2B Purchase Bill</h1>
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
              <span>Edit Purchase Bill - {isEditing.invoiceNo}</span>
            ) : (
              "Add Purchase Bill"
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

                {/* To & From */}
                <tr>
                  <td style={{ width: "50%" }}>
                    <em>To</em>
                  </td>
                  <td>
                    <em>From</em>
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
                                name="toName"
                                value={formData.toName}
                                ref={(el) => (fieldRefs.current.toName = el)}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.toName}
                              />
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
                    <Table bordered style={{ width: "50%", float: "left" }}>
                      <tbody>
                        <tr>
                          <td>Name:</td>
                          <td>
                            {/* <Form.Group>
                              <Form.Control
                                type="text"
                                name="fromName"
                                value={formData.fromName}
                                onChange={handleChange}
                                isInvalid={!!validationErrors.fromName}
                              />
                              <Form.Control.Feedback type="invalid">
                                {validationErrors.fromName}
                              </Form.Control.Feedback>
                            </Form.Group> */}
                            <Form.Group className="position-relative">
                              <Form.Control
                                type="text"
                                name="fromName"
                                value={formData.fromName}
                                ref={(el) => (fieldRefs.current.fromName = el)}
                                // placeholder="Type vendor name"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    fromName: value,
                                  }));
                                  if (validationErrors.fromName) {
                                    setValidationErrors((prev) => ({
                                      ...prev,
                                      fromName: "",
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
                                isInvalid={!!validationErrors.fromName}
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
                                            fromId: v._id,
                                            fromName: v.vendorName,
                                            fromAddress: v.address || "",
                                            fromGSTin: v.gstNo || "",
                                            fromState: v.state || "",
                                            fromStateCode: v.stateCode || "",
                                          }));
                                          if (validationErrors.fromName) {
                                            setValidationErrors((prev) => ({
                                              ...prev,
                                              fromName: "",
                                            }));
                                          }
                                          if (validationErrors.fromStateCode) {
                                            setValidationErrors((prev) => ({
                                              ...prev,
                                              fromStateCode: "",
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
                                value={formData.fromGSTin}
                                ref={(el) => (fieldRefs.current.fromGSTin = el)}
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
                  </td>
                </tr>
              </tbody>
            </Table>

            {/* Products Table */}
            <Table bordered hover responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Sr no.</th>
                  <th>Name of Product/Service</th>
                  <th>HSN</th>
                  <th>Qty/Mtr</th>
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
                  <td>
                    <div className="form-actions d-flex">
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
                        {isEditing ? "Update" : "Save"}
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
                  <th>Bill No</th>
                  <th>Company Name</th>
                  <th>Bill Date</th>
                  <th>Bill Amount(Rs.)</th>
                  <th>Paid Amount(Rs.)</th>
                  <th>GST(Rs.)</th>
                  <th>Balance Amount(Rs.)</th>
                  <th>Created Detail</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {purchaseBills.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={9}>No data found</td>
                  </tr>
                ) : (
                  purchaseBills.map((b) => (
                    <tr key={b._id}>
                      <td>{b.invoiceNo}</td>
                      <td>{b.fromName}</td>
                      <td>
                        {b.invoiceDate &&
                          new Date(b.invoiceDate).toLocaleDateString()}
                      </td>
                      <td>{b.totalPayableAmount}</td>
                      <td>{b.paidAmt || 0}</td>
                      <td>{b.totalGSTAmount || 0}</td>
                      <td>{b.totalPayableAmount - b.paidAmt || 0}</td>
                      <td>
                        {b.created_by ? b.created_by.name : ""}
                        <br />
                        {b.created_on && formatDateAndTime(b.created_on)}
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
                            <DropdownItem onClick={() => handlePayAmt(b)}>
                              Pay Amt
                            </DropdownItem>
                            <DropdownItem onClick={() => handleEdit(b)}>
                              Edit
                            </DropdownItem>
                            <DropdownItem onClick={() => handleDelete(b._id)}>
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
      {showPayAmt && (
        <Modal
          centered
          show={showPayAmt}
          size="md"
          scrollable
          onHide={() => setShowPayAmt(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>Bill No : {payAmtData.invoiceNo} </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Amount *</Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={payForm.amount}
                    isInvalid={!!PAvalidationErrors.amount}
                    onChange={handlePayChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {PAvalidationErrors.amount}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Paid Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="paidDate"
                    value={payForm.paidDate}
                    onChange={handlePayChange}
                    isInvalid={!!PAvalidationErrors.paidDate}
                  />
                  <Form.Control.Feedback type="invalid">
                    {PAvalidationErrors.paidDate}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Transaction Type</Form.Label>
                  <Form.Select
                    name="transactionType"
                    value={payForm.transactionType}
                    onChange={handlePayChange}
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
                    value={payForm.transactionID}
                    isInvalid={!!PAvalidationErrors.transactionID}
                    onChange={handlePayChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {PAvalidationErrors.transactionID}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={payForm.bankName}
                    onChange={handlePayChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="justify-content-between">
            <div className="d-flex flex-column">
              <b>
                <span className="text-secondary">
                  Bill amount: Rs {payAmtData.totalPayableAmount}
                </span>
              </b>
              <b>
                <span className="text-danger">
                  Balance amount: Rs{" "}
                  {payAmtData.totalPayableAmount - payAmtData.paidAmt}
                </span>
              </b>
            </div>
            <div>
              <Button
                variant="secondary"
                onClick={() => setShowPayAmt(false)}
                className="me-2"
              >
                Close
              </Button>
              <Button variant="primary" onClick={handlePaidSubmit}>
                Pay
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default B2BPurchaseBill;
