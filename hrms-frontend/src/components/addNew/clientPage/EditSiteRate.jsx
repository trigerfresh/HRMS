import axios from "axios";
import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { FaMinus, FaPlus } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EditSiteRate = ({ siteData, onBackSite, updateSite }) => {
  const [siteDetails, setSiteDetails] = useState({});
  const [otherDetails, setOtherDetails] = useState([]);
  const [rateRows, setRateRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [chargeTypes, setChargeTypes] = useState([]);

  // Auth helper function
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

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // Fetch employee types
        try {
          const { data } = await axios.get(
            `${API_URL}/api/employee-types?simple=true`,
            getAuthHeaders()
          );
          setEmployeeTypes(Array.isArray(data) ? data : []);
        } catch (empError) {
          console.warn("Failed to fetch employee types:", empError);
          setEmployeeTypes([]);
        }

        // Fetch charge types
        try {
          const { data } = await axios.get(
            `${API_URL}/api/charges?simple=true`,
            getAuthHeaders()
          );
          setChargeTypes(Array.isArray(data) ? data : []);
        } catch (chargeError) {
          console.warn("Failed to fetch charge types:", chargeError);
          setChargeTypes([]);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
        }
        console.error("Error in fetchDropdownData:", err);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    // console.log(siteData);
    setSiteDetails({
      ...siteData,
      locationStartDate: siteData.locationStartDate
        ? new Date(siteData.locationStartDate).toISOString().split("T")[0]
        : "",
    });

    setOtherDetails(siteData.otherDetails);
    setRateRows(siteData.rates);
  }, []);

  const handleSiteDetailChange = (e) => {
    const { name, value, type, checked } = e.target;
    const key = name;
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
    setSiteDetails((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleRateRowChange = (index, field, value) => {
    setRateRows((prevRows) => {
      const updated = [...prevRows];
      const row = { ...updated[index], [field]: value };

      if (validationErrors?.rateRowErrors?.[index]?.[field]) {
        setValidationErrors((prev) => {
          const newRateRowErrors = [...(prev.rateRowErrors || [])];
          if (newRateRowErrors[index]) {
            newRateRowErrors[index][field] = "";
          }
          return { ...prev, rateRowErrors: newRateRowErrors };
        });
      }

      const num = (v) => (v && !isNaN(v) ? parseFloat(v) : 0);

      const grossFields = [
        "basic",
        "hra",
        "da",
        "specialAllowance",
        "otherAllowance",
        "lww",
        "bonus",
      ];

      if (grossFields.includes(field)) {
        const totalGross = grossFields.reduce(
          (sum, key) => sum + num(row[key]),
          0
        );
        row.costPerHeadGross = Number(totalGross).toFixed(2);

        const days = siteDetails?.daysForBilling
          ? num(siteDetails.daysForBilling)
          : 30;

        row.perDayRate = days > 0 ? Number((totalGross / days).toFixed(2)) : 0;
      }

      updated[index] = row;
      return updated;
    });
  };

  const addRateRow = () => {
    setRateRows((prev) => [
      ...prev,
      {
        empType: "",
        hours: "",
        nos: "",
        basic: "",
        hra: "",
        da: "",
        specialAllowance: "",
        otherAllowance: "",
        lww: "",
        bonus: "",
        costPerHeadGross: "",
        serviceChargesType: "",
        serviceCharges: "",
        perDayRate: "",
        otRate: "",
        leaveWages: "",
        uniformWashing: "",
        anyOther: "",
      },
    ]);
  };

  // Delete a row
  const deleteRateRow = (index) => {
    setRateRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle changes in a specific row/field
  const handleOtherDetailChange = (index, field, value) => {
    const updated = [...otherDetails];
    updated[index][field] = value;

    if (validationErrors?.otherDetailErrors?.[index]?.[field]) {
      setValidationErrors((prev) => {
        const newErrors = [...(prev.otherDetailErrors || [])];
        if (newErrors[index]) {
          newErrors[index][field] = "";
        }
        return { ...prev, otherDetailErrors: newErrors };
      });
    }
    setOtherDetails(updated);
  };

  // Add a new row
  const addOtherDetailRow = () => {
    setOtherDetails((prev) => [
      ...prev,
      {
        typeOfServ: "",
        chargesType: "",
        charges: "",
        calcOn: "",
        calcOperation: "",
        amountToCompare: "",
      },
    ]);
  };

  // Delete a specific row
  const deleteOtherDetailRow = (index) => {
    setOtherDetails((prev) => prev.filter((_, i) => i !== index));
  };

  const getTableErrorMessages = (validationErrors) => {
    const messages = [];
    // console.log(validationErrors);
    // Rate rows
    if (validationErrors?.rateRowErrors?.length) {
      validationErrors.rateRowErrors.forEach((rowErr, i) => {
        if (rowErr) {
          Object.entries(rowErr).forEach(([field, msg]) => {
            if (msg) messages.push(`Rate Row ${i + 1}: ${msg}`);
          });
        }
      });
    }

    // Other details
    if (validationErrors?.otherDetailErrors?.length) {
      validationErrors.otherDetailErrors.forEach((rowErr, i) => {
        if (rowErr) {
          Object.entries(rowErr).forEach(([field, msg]) => {
            if (msg) messages.push(`Other Detail Row ${i + 1}: ${msg}`);
          });
        }
      });
    }
    // console.log(messages);
    return messages;
  };

  const validateStep3 = () => {
    const errors = {};
    const rateRowErrors = [];
    const otherDetailErrors = [];

    // --- SITE DETAILS VALIDATION ---
    if (!siteDetails.siteName?.trim()) {
      errors.siteName = "Site Name is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (siteDetails.emailId && !emailRegex.test(siteDetails.emailId)) {
      errors.emailId = "Invalid Email ID format.";
    }
    if (
      siteDetails.salesPersonEmailId &&
      !emailRegex.test(siteDetails.salesPersonEmailId)
    ) {
      errors.salesPersonEmailId = "Invalid Sales Person Email format.";
    }

    const contactRegex = /^[0-9]{10}$/;
    if (siteDetails.contactNo && !contactRegex.test(siteDetails.contactNo)) {
      errors.contactNo = "Contact number must be 10 digits.";
    }
    if (
      siteDetails.salesPersonContactNo &&
      !contactRegex.test(siteDetails.salesPersonContactNo)
    ) {
      errors.salesPersonContactNo = "Sales Person contact must be 10 digits.";
    }

    // --- TAX / NUMERIC FIELDS ---
    const taxFields = ["cgst", "sgst", "igst"];
    taxFields.forEach((field) => {
      const val = siteDetails[field];
      if (val !== "" && val !== undefined && val !== null) {
        if (isNaN(val) || val < 0 || val > 100) {
          errors[field] = `${field.toUpperCase()} must be between 0 and 100.`;
        }
      }
    });

    if (
      siteDetails.expectedBillingAmount &&
      (isNaN(siteDetails.expectedBillingAmount) ||
        Number(siteDetails.expectedBillingAmount) < 0)
    ) {
      errors.expectedBillingAmount =
        "Expected billing amount must be a valid number.";
    }

    if (
      siteDetails.daysForBilling &&
      (isNaN(siteDetails.daysForBilling) ||
        Number(siteDetails.daysForBilling) < 0)
    ) {
      errors.daysForBilling = "Days for billing must be a valid number.";
    }

    // --- RATE ROWS VALIDATION ---
    // rateRows.forEach((row, i) => {
    //   const rowErr = {};
    //   if (!row.empType?.trim()) rowErr.empType = "Employee type is required.";
    //   if (!row.basic || isNaN(row.basic))
    //     rowErr.basic = "Basic must be a valid number.";
    //   if (!row.hra || isNaN(row.hra))
    //     rowErr.hra = "HRA must be a valid number.";
    //   if (!row.serviceChargesType?.trim())
    //     rowErr.serviceChargesType = "Service charge type is required.";
    //   if (row.serviceCharges && isNaN(row.serviceCharges))
    //     rowErr.serviceCharges = "Service charges must be a number.";
    //   if (Object.keys(rowErr).length > 0) rateRowErrors[i] = rowErr;
    // });

    // --- OTHER DETAILS VALIDATION ---
    otherDetails.forEach((row, i) => {
      const rowErr = {};
      // console.log(row.amountToCompare);
      if (row.amountToCompare?.trim()) {
        const amt = row.amountToCompare.trim();

        // Case 1: Single number (integer or decimal)
        if (/^\d+(\.\d+)?$/.test(amt)) {
          const num = Number(amt);
          if (isNaN(num)) {
            rowErr.amountToCompare =
              "Amount to Compare must be a valid number.";
          }
          // console.log("1");
        }

        // Case 2: Range — two valid numbers separated by a hyphen
        else if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(amt)) {
          const [min, max] = amt.split("-").map((v) => Number(v));
          if (isNaN(min) || isNaN(max)) {
            rowErr.amountToCompare = "Both values in range must be numbers.";
          } else if (min >= max) {
            rowErr.amountToCompare =
              "Invalid range: first value must be less than second value.";
          }
          // console.log("2gh");
        }

        // Case 3: Anything else (invalid format)
        else {
          // console.log("3");
          rowErr.amountToCompare =
            "Enter a valid number or range (e.g., 5000 or 4000-6000).";
        }
      }

      //   if (!row.typeOfServ?.trim())
      //     rowErr.typeOfServ = "Type of Service is required.";
      //   if (!row.chargesType?.trim())
      //     rowErr.chargesType = "Charges Type is required.";
      //   if (!row.charges || isNaN(row.charges))
      //     rowErr.charges = "Charges must be a valid number.";
      //   if (!row.calcOperation?.trim())
      //     rowErr.calcOperation = "Calculation Operation is required.";
      //   if (row.amountToCompare && isNaN(row.amountToCompare))
      //     rowErr.amountToCompare = "Amount to compare must be a number.";
      if (Object.keys(rowErr).length > 0) otherDetailErrors[i] = rowErr;
    });

    // --- FINALIZE ERRORS ---
    const hasRowErrors =
      rateRowErrors.length > 0 || otherDetailErrors.length > 0;
    if (hasRowErrors) errors.tableRows = "Please fix table row errors.";

    // Store structured error details (optional, for highlighting individual cells)
    setValidationErrors({
      ...errors,
      rateRowErrors,
      otherDetailErrors,
    });

    // console.log(errors, rateRowErrors, otherDetailErrors);
    return Object.keys(errors).length === 0 && !hasRowErrors;
  };

  const handleUpdateSite = (e) => {
    e.preventDefault();
    if (!validateStep3()) {
      alert("Please fix the validation errors.");
      return;
    }
    // console.log(validationErrors);
    updateSite({
      ...siteDetails,
      otherDetails,
      rates: rateRows,
    });
  };

  const renderRateRows = () =>
    rateRows.map((row, idx) => (
      <tr key={idx}>
        <td>
          <Form.Select
            value={row.empType}
            name={`empType_${idx}`}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "empType", e.target.value)
            }
          >
            <option value="">Select Employee Type</option>
            {employeeTypes.map((emp) => (
              <option key={emp._id || emp.id} value={emp.name}>
                {emp.name}
              </option>
            ))}
          </Form.Select>
        </td>
        <td>
          <Form.Select
            value={row.hours}
            style={{ width: "auto" }}
            onChange={(e) => handleRateRowChange(idx, "hours", e.target.value)}
          >
            <option value="">Select Hours</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="12">12</option>
          </Form.Select>
        </td>
        <td>
          <Form.Control
            type="number"
            style={{ width: "auto" }}
            value={row.nos}
            onChange={(e) => handleRateRowChange(idx, "nos", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.basic}
            style={{ width: "auto" }}
            onChange={(e) => handleRateRowChange(idx, "basic", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.hra}
            style={{ width: "auto" }}
            onChange={(e) => handleRateRowChange(idx, "hra", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.da}
            style={{ width: "auto" }}
            onChange={(e) => handleRateRowChange(idx, "da", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.specialAllowance}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "specialAllowance", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.otherAllowance}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "otherAllowance", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.lww}
            style={{ width: "auto" }}
            onChange={(e) => handleRateRowChange(idx, "lww", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            style={{ width: "auto" }}
            value={row.bonus}
            onChange={(e) => handleRateRowChange(idx, "bonus", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.costPerHeadGross}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "costPerHeadGross", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Select
            value={row.serviceChargesType}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "serviceChargesType", e.target.value)
            }
          >
            <option value="">Select</option>
            <option value="%">%</option>
            <option value="Rs">Rs</option>
          </Form.Select>
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.serviceCharges}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "serviceCharges", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={row.perDayRate}
            style={{ width: "auto" }}
            onChange={(e) =>
              handleRateRowChange(idx, "perDayRate", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            style={{ width: "auto" }}
            type="number"
            value={row.otRate}
            onChange={(e) => handleRateRowChange(idx, "otRate", e.target.value)}
          />
        </td>
        <td>
          <Form.Control
            type="number"
            style={{ width: "auto" }}
            value={row.leaveWages}
            onChange={(e) =>
              handleRateRowChange(idx, "leaveWages", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            type="number"
            style={{ width: "auto" }}
            value={row.uniformWashing}
            onChange={(e) =>
              handleRateRowChange(idx, "uniformWashing", e.target.value)
            }
          />
        </td>
        <td>
          <Form.Control
            type="number"
            style={{ width: "auto" }}
            value={row.anyOther}
            onChange={(e) =>
              handleRateRowChange(idx, "anyOther", e.target.value)
            }
          />
        </td>
        <td>
          <div className="table-actions">
            {idx === rateRows.length - 1 && (
              <button
                type="button"
                onClick={addRateRow}
                className="icon-btn add"
              >
                <FaPlus />
              </button>
            )}
            {rateRows.length > 1 && (
              <button
                type="button"
                onClick={() => deleteRateRow(idx)}
                className="icon-btn delete"
              >
                <FaMinus />
              </button>
            )}
          </div>
        </td>
      </tr>
    ));

  const hasValidationErrors = (errors) => {
    if (!errors || typeof errors !== "object") return false;

    // 🔹 Check field-level errors
    const fieldErrorsExist = Object.entries(errors)
      .filter(([key]) => key !== "rateRowErrors" && key !== "otherDetailErrors")
      .some(([_, msg]) => msg && msg.toString().trim() !== "");

    // 🔹 Check rate row errors
    const rateErrorsExist = Array.isArray(errors.rateRowErrors)
      ? errors.rateRowErrors.some(
          (row) =>
            row &&
            Object.values(row).some(
              (val) => val && val.toString().trim() !== ""
            )
        )
      : false;

    // 🔹 Check other details errors
    const otherErrorsExist = Array.isArray(errors.otherDetailErrors)
      ? errors.otherDetailErrors.some(
          (row) =>
            row &&
            Object.values(row).some(
              (val) => val && val.toString().trim() !== ""
            )
        )
      : false;

    return fieldErrorsExist || rateErrorsExist || otherErrorsExist;
  };

  return (
    <div>
      <Card className="card form-panel">
        <div>
          <h2 className="form-title card-header mb-4">
            Edit Client Site & Rate - {siteDetails.clientId?.companyName}
          </h2>
          {hasValidationErrors(validationErrors) && (
            <Alert variant="danger" className="mt-3">
              <Alert.Heading>
                Please fix the validation errors below:
              </Alert.Heading>
              <ul className="mb-0">
                {getTableErrorMessages(validationErrors).map((msg, idx) => (
                  <li key={`table-${idx}`}>{msg}</li>
                ))}
              </ul>
            </Alert>
          )}
          <Row>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="siteName">
                <Form.Label>Site Name *</Form.Label>
                <Form.Control
                  name="siteName"
                  value={siteDetails.siteName || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Site Name"
                  isInvalid={!!validationErrors.siteName}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.siteName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="workOrderNo">
                <Form.Label>Work Order No</Form.Label>
                <Form.Control
                  name="workOrderNo"
                  value={siteDetails.workOrderNo || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Work Order No"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="contactPersonRates">
                <Form.Label>Contact Person Name</Form.Label>
                <Form.Control
                  name="contactPersonName"
                  value={siteDetails.contactPersonName || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Contact Person Name"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="address">
                <Form.Label>Address</Form.Label>
                <Form.Control
                  name="address"
                  as={"textarea"}
                  value={siteDetails.address || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Address"
                  rows={3}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="billingAddress">
                <Form.Label>Billing Address</Form.Label>
                <Form.Control
                  name="billingAddress"
                  as={"textarea"}
                  value={siteDetails.billingAddress || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Billing Address"
                  rows={3}
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="contactNo">
                <Form.Label>Contact No</Form.Label>
                <Form.Control
                  name="contactNo"
                  value={siteDetails.contactNo || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Contact No"
                  isInvalid={!!validationErrors.contactNo}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.contactNo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="emailId">
                <Form.Label>Email ID</Form.Label>
                <Form.Control
                  name="emailId"
                  type="email"
                  value={siteDetails.emailId || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Email ID"
                  isInvalid={!!validationErrors.emailId}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.emailId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="city">
                <Form.Label>City</Form.Label>
                <Form.Control
                  name="city"
                  value={siteDetails.city || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="City"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="state">
                <Form.Label>State</Form.Label>
                <Form.Control
                  name="state"
                  value={siteDetails.state || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="State"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="country">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  name="country"
                  value={siteDetails.country || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Country"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="locationName">
                <Form.Label>Location Name</Form.Label>
                <Form.Control
                  name="locationName"
                  value={siteDetails.locationName || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Location Name"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="locationStartDate">
                <Form.Label>Location Start Date</Form.Label>
                <Form.Control
                  name="locationStartDate"
                  type="date"
                  value={siteDetails.locationStartDate || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Location Start Date"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="salesPersonName">
                <Form.Label>Sales Person Name</Form.Label>
                <Form.Control
                  name="salesPersonName"
                  value={siteDetails.salesPersonName || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Sales Person Name"
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="salesPersonEmail">
                <Form.Label>Sales Person Email ID</Form.Label>
                <Form.Control
                  name="salesPersonEmailId"
                  type="email"
                  value={siteDetails.salesPersonEmailId || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Sales Person Email ID"
                  isInvalid={!!validationErrors.salesPersonEmailId}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.salesPersonEmailId}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="salesPersonContactNo">
                <Form.Label>Sales Person Contact No</Form.Label>
                <Form.Control
                  name="salesPersonContactNo"
                  value={siteDetails.salesPersonContactNo || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Sales Person Contact No"
                  isInvalid={!!validationErrors.salesPersonContactNo}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.salesPersonContactNo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="billCycleDate">
                <Form.Label>Bill Cycle Date</Form.Label>
                <Form.Select
                  name="billCycleDate"
                  value={siteDetails.billCycleDate || ""}
                  onChange={handleSiteDetailChange}
                >
                  <option value="">Select Bill Cycle Date</option>
                  <option value="1">1st of Month</option>
                  <option value="15">15th of Month</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="status">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={siteDetails.status || ""}
                  onChange={handleSiteDetailChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="cgst">
                <Form.Label>CGST (%)</Form.Label>
                <Form.Control
                  name="cgst"
                  value={siteDetails.cgst || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="CGST (%)"
                  isInvalid={!!validationErrors.cgst}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.cgst}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="sgst">
                <Form.Label>SGST (%)</Form.Label>
                <Form.Control
                  name="sgst"
                  value={siteDetails.sgst || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="SGST (%)"
                  isInvalid={!!validationErrors.sgst}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.sgst}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="igst">
                <Form.Label>IGST (%)</Form.Label>
                <Form.Control
                  name="igst"
                  value={siteDetails.igst || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="IGST (%)"
                  isInvalid={!!validationErrors.igst}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.igst}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="expectedBillingAmount">
                <Form.Label>Expected Billing Amount</Form.Label>
                <Form.Control
                  name="expectedBillingAmount"
                  value={siteDetails.expectedBillingAmount || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Expected Billing Amount"
                  isInvalid={!!validationErrors.expectedBillingAmount}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.expectedBillingAmount}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="daysForBilling">
                <Form.Label>Total No Of Days For Billing</Form.Label>
                <Form.Control
                  name="daysForBilling"
                  value={siteDetails.daysForBilling || ""}
                  onChange={handleSiteDetailChange}
                  placeholder="Total No Of Days For Billing"
                  isInvalid={!!validationErrors.daysForBilling}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.daysForBilling}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Row className="mt-3">
              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="viewOTHours"
                  name="viewOTHours"
                  label="View OT Hours"
                  checked={!!siteDetails.viewOTHours}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "viewOTHours",
                          type: "checkbox",
                          checked: !siteDetails.viewOTHours,
                        },
                      });
                    }
                  }}
                />
              </Col>

              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="attachWagesSHeet"
                  name="attachWagesSHeet"
                  label="Attach Wages Sheet"
                  checked={!!siteDetails.attachWagesSHeet}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "attachWagesSHeet",
                          type: "checkbox",
                          checked: !siteDetails.attachWagesSHeet,
                        },
                      });
                    }
                  }}
                />
              </Col>

              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="roundOffAmount"
                  name="roundOffAmount"
                  label="Round Off Amount"
                  checked={!!siteDetails.roundOffAmount}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "roundOffAmount",
                          type: "checkbox",
                          checked: !siteDetails.roundOffAmount,
                        },
                      });
                    }
                  }}
                />
              </Col>

              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="billWithoutRank"
                  name="billWithoutRank"
                  label="Bill Without Rank"
                  checked={!!siteDetails.billWithoutRank}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "billWithoutRank",
                          type: "checkbox",
                          checked: !siteDetails.billWithoutRank,
                        },
                      });
                    }
                  }}
                />
              </Col>
              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="nonComplianceSite"
                  name="nonComplianceSite"
                  label="Non Compliance Site"
                  checked={!!siteDetails.nonComplianceSite}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "nonComplianceSite",
                          type: "checkbox",
                          checked: !siteDetails.nonComplianceSite,
                        },
                      });
                    }
                  }}
                />
              </Col>
              <Col xs={12} sm={6} md={3} className="mb-2">
                <Form.Check
                  type="checkbox"
                  id="applyLeave"
                  name="applyLeave"
                  label="Apply Leave"
                  checked={!!siteDetails.applyLeave}
                  onChange={handleSiteDetailChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSiteDetailChange({
                        target: {
                          name: "applyLeave",
                          type: "checkbox",
                          checked: !siteDetails.applyLeave,
                        },
                      });
                    }
                  }}
                />
              </Col>
            </Row>
          </Row>
          <hr />

          <div className="rates-section mb-4">
            <h5 className="card-subtitle mt-3 mb-4">Charges By Rank</h5>
            <Table responsive hover bordered>
              <thead className="table-secondary">
                <tr>
                  <th>Emp Type</th>
                  <th>Hours</th>
                  <th>Nos</th>
                  <th>BASIC</th>
                  <th>HRA</th>
                  <th>DA</th>
                  <th>Special Allowance</th>
                  <th>Other Allowance</th>
                  <th>LWW</th>
                  <th>Bonus</th>
                  <th>Cost Per Head(Gross)</th>
                  <th>Service Charges Type</th>
                  <th>Service Charges</th>
                  <th>Per Day Rate</th>
                  <th>OT Rate</th>
                  <th>Leave Wages</th>
                  <th>Uniform Washing</th>
                  <th>Any Other</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{renderRateRows()}</tbody>
            </Table>
          </div>
          <hr />
          <div className="other-charges-section">
            <h5 className="card-subtitle mt-3 mb-4">Other Charges</h5>

            <Table bordered hover responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Type of Service</th>
                  <th>Charges Type</th>
                  <th>Charges</th>
                  <th>Calculate On</th>
                  <th>Select</th>
                  <th>
                    Amount to Compare
                    <br /> (enter two values with '-')
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {otherDetails.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <Form.Select
                        style={{ width: "auto" }}
                        value={row.typeOfServ ?? ""}
                        onChange={(e) =>
                          handleOtherDetailChange(
                            idx,
                            "typeOfServ",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select Type of Service</option>
                        {chargeTypes.map((type) => (
                          <option key={type.id} value={type.name}>
                            {type.name}
                          </option>
                        ))}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        type="text"
                        style={{ width: "auto" }}
                        value={row.chargesType}
                        onChange={(e) =>
                          handleOtherDetailChange(
                            idx,
                            "chargesType",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select</option>
                        <option value="Rs">Rs</option>
                        <option value="%">%</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        style={{ width: "auto" }}
                        value={row.charges}
                        onChange={(e) =>
                          handleOtherDetailChange(
                            idx,
                            "charges",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td>
                      <Form.Select
                        style={{ width: "auto" }}
                        className="form-control"
                        name="calcOn"
                        value={row.calcOn}
                        onChange={(e) =>
                          handleOtherDetailChange(idx, "calcOn", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="On Gross Salary">On Gross Salary</option>
                        <option value="On calculated salary by days">
                          On calculated salary by days
                        </option>
                        <option value="BASIC">BASIC</option>
                        <option value="HRA">HRA</option>
                        <option value="OT DAYS">OT DAYS</option>
                        <option value="AT ACTUAL">AT ACTUAL</option>
                        <option value="PF Wages">PF Wages</option>
                        <option value="ESIC Wages">ESIC Wages</option>
                        <option value="Amount to compare">
                          Amount to compare
                        </option>
                        <option value="GROSS-OTHER+OT AMT">
                          GROSS-OTHER+OT AMT
                        </option>
                        <option value="GROSS-HRA">GROSS-HRA</option>
                        <option value="GROSS-HRA-BONUS">GROSS-HRA-BONUS</option>
                        <option value="BASIC+SPECIAL ALLOW">
                          BASIC+SPECIAL ALLOW
                        </option>
                        <option value="GROSS-OTHER ALLOW">
                          GROSS-OTHER ALLOW
                        </option>
                        <option value="BASIC+DA">BASIC+DA</option>
                        <option value="BASIC+DA+SPECIAL ALLOW+OTHER ALLOW">
                          BASIC+DA+SPECIAL ALLOW+OTHER ALLOW
                        </option>
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select
                        style={{ width: "auto" }}
                        value={row.calcOperation}
                        onChange={(e) =>
                          handleOtherDetailChange(
                            idx,
                            "calcOperation",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select</option>
                        <option value="equal to">equal to</option>
                        <option value="greater than">greater than</option>
                        <option value="greater than or equal to">
                          greater than or equal to
                        </option>
                        <option value="less than">less than</option>
                        <option value="less than or equal to">
                          less than or equal to
                        </option>
                        <option value="between">between</option>
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        style={{ width: "auto" }}
                        value={row.amountToCompare}
                        onChange={(e) =>
                          handleOtherDetailChange(
                            idx,
                            "amountToCompare",
                            e.target.value
                          )
                        }
                        isInvalid={
                          !!validationErrors.otherDetailErrors?.[idx]
                            ?.amountToCompare
                        }
                      />
                      <Form.Control.Feedback type="invalid">
                        {
                          validationErrors.otherDetailErrors?.[idx]
                            ?.amountToCompare
                        }
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <div className="table-actions">
                        {idx === otherDetails.length - 1 && (
                          <button
                            type="button"
                            onClick={addOtherDetailRow}
                            className="icon-btn add"
                          >
                            <FaPlus />
                          </button>
                        )}
                        {otherDetails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deleteOtherDetailRow(idx)}
                            className="icon-btn delete"
                          >
                            <FaMinus />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="form-actions d-flex justify-content-end align-items-center">
            <Button
              variant="secondary"
              type="button"
              className="me-2"
              onClick={onBackSite}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              className="me-2"
              onClick={handleUpdateSite}
            >
              Update
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EditSiteRate;
