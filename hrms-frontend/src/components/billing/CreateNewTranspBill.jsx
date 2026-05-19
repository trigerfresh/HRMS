import axios from "axios";
import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";

const COMPANY_API = "http://localhost:5000/api/clients";
const API_BASE_URL = "http://localhost:5000/api/bills";

const CreateNewTranspBill = ({ onCancel, isEditing, onSuccess }) => {
  const [companies, setCompanies] = useState([]);
  const [availableSites, setAvailableSites] = useState([]);
  const [billData, setBillData] = useState({});
  const [ordersData, setOrdersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
  const currentYear = String(currentDate.getFullYear());

  const [formData, setFormData] = useState({
    clientId: "",
    siteId: "",
    invoiceDate: currentDate.toISOString().split("T")[0],
    invoiceNo: "",
    invoiceMonth: currentMonth,
    invoiceYear: currentYear,
  });

  const [rows, setRows] = useState([
    {
      tbDate: "",
      sacCode: "",
      tbFrom: "",
      tbTo: "",
      lrNo: "",
      tbVehicleNo: "",
      tbWeight: "",
      tbInvoiceNo: "",
      total: "",
    },
  ]);

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

  const handleClientChange = async (e) => {
    const clientId = e.target.value;

    setFormData((prevData) => ({
      ...prevData,
      clientId: clientId,
      siteId: "",
    }));

    if (!clientId) {
      setAvailableSites([]);
      return;
    }

    try {
      const res = await axios.get(
        `${COMPANY_API}/client/${clientId}`,
        getAuthHeaders()
      );
      if (res.data.success) {
        setAvailableSites(res.data.data);
      } else {
        setAvailableSites([]);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
      setAvailableSites([]);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(COMPANY_API, getAuthHeaders());
      setCompanies(data.data || data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to fetch clients. Please try again.");

      console.error("Failed to fetch companies", err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/getInvoiceData?invoiceNo=${isEditing}`,
        { ...getAuthHeaders() }
      );
      //   console.log(res.data.bills[0]);
      setBillData(res.data.bills[0]);
      setOrdersData(res.data.orders);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        console.log(e);
        setError(e.response?.data?.message || "Failed to Fetch Receipt Data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditing && companies.length > 0) {
      fetchBill();
    }
  }, [companies]);

  useEffect(() => {
    if (billData && ordersData.length > 0) {
      handleEditBill();
    }
    // console.log(billData, ordersData);
  }, [billData, ordersData]);

  const handleEditBill = async () => {
    // console.log(billData, ordersData);

    const clientId = billData?.clientId?._id || "";
    let fetchedSites = [];

    if (clientId) {
      try {
        const res = await axios.get(
          `${COMPANY_API}/client/${clientId}`,
          getAuthHeaders()
        );
        if (res.data.success) {
          fetchedSites = res.data.data.filter((s) => s.status === "Active");
          setAvailableSites(fetchedSites);
        } else {
          setAvailableSites([]);
        }
      } catch (error) {
        console.error("Error fetching sites for client:", error);
        setAvailableSites([]);
      }
    } else {
      setAvailableSites([]);
    }

    // console.log(billData.siteId);
    setFormData({
      invoiceNo: billData.invoiceNo,
      invoiceDate: new Date(billData.invoiceDate).toISOString().split("T")[0],
      invoiceMonth: billData.invoiceMonth,
      invoiceYear: billData.invoiceYear,
      clientId,
      siteId: billData.siteId._id,
    });
    // console.log(fetchedSites);
    setRows(
      ordersData.map((row) => ({
        _id: row._id,
        tbDate: row.tbDate || "",
        sacCode: row.sacCode || "",
        tbFrom: row.tbFrom || "",
        tbTo: row.tbTo || "",
        lrNo: row.lrNo || "",
        tbVehicleNo: row.tbVehicleNo || "",
        tbWeight: row.tbWeight || "",
        tbInvoiceNo: row.tbInvoiceNo || "",
        total: row.total || 0,
      }))
    );
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

  const addRow = () => {
    setRows([
      ...rows,
      {
        tbDate: "",
        sacCode: ordersData.length > 0 ? ordersData[0]?.sacCode : "",
        tbFrom: "",
        tbTo: "",
        lrNo: "",
        tbVehicleNo: "",
        tbWeight: "",
        tbInvoiceNo: "",
        total: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    // console.log(updated[index]);
    const qty = Number(updated[index].tbFrom);
    const rate = Number(updated[index].tbTo);

    if (qty > 0 && rate > 0) {
      updated[index].total = qty * rate;
    }

    setRows(updated);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.clientId) {
      errors.clientId = "Client/Company is required.";
    }
    if (!formData.siteId) {
      errors.siteId = "Location/Site is required.";
    }
    if (!formData.invoiceDate) {
      errors.invoiceDate = "Invoice Date is required.";
    }
    if (!formData.invoiceNo.trim()) {
      errors.invoiceNo = "Invoice No is required.";
    }
    if (!formData.invoiceMonth) {
      errors.invoiceMonth = "Invoice Month is required.";
    }
    if (!formData.invoiceYear) {
      errors.invoiceYear = "Invoice Year is required.";
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

    const totalAmt = rows.reduce(
      (sum, row) => sum + (Number(row.total) || 0),
      0
    );

    // console.log(totalAmt);

    const payload = {
      billInv: isEditing ? billData?.invoiceNo : formData.invoiceNo,
      totalAmt,
      ...formData,
      orders: rows,
    };

    try {
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/update-transp-bill?invoiceNo=${isEditing}`,
          payload,
          getAuthHeaders()
        );
        alert("Bill updated successfully!");
        onSuccess();
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/save-new-transp-bill`,
          payload,
          getAuthHeaders()
        );
        // console.log(res.data);
        alert("Bill created successfully!");
        onSuccess();
      }
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`
        );
      }
    }
  };

  return (
    <Card>
      <div className="form-header">
        <h2 className="card-header mb-4">
          {isEditing ? (
            <span>Edit Bill - {isEditing}</span>
          ) : (
            "Create NewTransporter Bill"
          )}
        </h2>
      </div>
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="danger">Please fix the validation errors below.</Alert>
      )}
      <Form>
        {error ? (
          <Alert variant="danger" className="mb-3 text-center">
            {error}
          </Alert>
        ) : (
          ""
        )}
        <Row>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group controlId="client">
              <Form.Label>Client/Company</Form.Label>
              <Form.Select
                name="client"
                value={formData.clientId}
                onChange={handleClientChange}
                isInvalid={!!validationErrors.clientId}
              >
                <option value="">Select</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.companyName}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {validationErrors.clientId}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group>
              <Form.Label>Location / Site</Form.Label>
              <Form.Select
                disabled={!formData.clientId}
                name="siteId"
                value={formData.siteId || ""}
                onChange={handleInputChange}
                isInvalid={
                  formData.clientId ? !!validationErrors.siteId : false
                }
              >
                <option value="">Select Location</option>
                {availableSites.map((site) => (
                  <option key={site._id} value={site._id}>
                    {site.siteName}
                  </option>
                ))}
              </Form.Select>
              {formData.clientId ? (
                <Form.Control.Feedback type="invalid">
                  {validationErrors.siteId}
                </Form.Control.Feedback>
              ) : (
                ""
              )}
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group>
              <Form.Label>Invoice Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.invoiceDate}
                onChange={handleInputChange}
                name="invoiceDate"
                isInvalid={!!validationErrors.invoiceDate}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.invoiceDate}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group>
              <Form.Label>Invoice No</Form.Label>
              <Form.Control
                value={formData.invoiceNo}
                onChange={handleInputChange}
                type="text"
                name="invoiceNo"
                isInvalid={!!validationErrors.invoiceNo}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.invoiceNo}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group>
              <Form.Label>Invoice Month</Form.Label>
              <Form.Select
                value={formData.invoiceMonth}
                onChange={handleInputChange}
                name="invoiceMonth"
                isInvalid={!!validationErrors.invoiceMonth}
              >
                <option value="">Select</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {validationErrors.invoiceMonth}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Group>
              <Form.Label>Invoice Year</Form.Label>
              <Form.Select
                value={formData.invoiceYear}
                onChange={handleInputChange}
                name="invoiceYear"
                isInvalid={!!validationErrors.invoiceYear}
              >
                <option value="">Select Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {validationErrors.invoiceYear}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-4">
          <Col md={12}>
            <Table
              bordered
              hover
              responsive
              id="add_boxes"
              style={{ width: "100%" }}
            >
              <thead className="table-secondary">
                <tr>
                  <th>Sr. No.</th>
                  <th>DATE</th>
                  <th>HSN</th>
                  <th>FROM</th>
                  <th>TO</th>
                  <th>LR NO</th>
                  <th>VEHICLE NO</th>
                  <th>WEIGHT</th>
                  <th>INVOICE NO</th>
                  <th>Net Amount</th>
                  <th>
                    <button
                      type="button"
                      onClick={addRow}
                      className="icon-btn add text-warning"
                    >
                      <FaPlus />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <Form.Control
                        type="date"
                        name="tbDate"
                        value={row.tbDate}
                        onChange={(e) =>
                          handleChange(i, "tbDate", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        name="sac"
                        value={row.sacCode}
                        onChange={(e) =>
                          handleChange(i, "sacCode", e.target.value)
                        }
                        readOnly={isEditing ? true : false}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        name="tbFrom"
                        className="tbFrom"
                        value={row.tbFrom}
                        onChange={(e) =>
                          handleChange(i, "tbFrom", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        name="tbTo"
                        className="tbTo"
                        value={row.tbTo}
                        onChange={(e) =>
                          handleChange(i, "tbTo", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        name="lrNo"
                        className="lrNo"
                        value={row.lrNo}
                        onChange={(e) =>
                          handleChange(i, "lrNo", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        name="tbVehicleNo"
                        className="tbVehicleNo"
                        value={row.tbVehicleNo}
                        onChange={(e) =>
                          handleChange(i, "tbVehicleNo", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        name="tbWeight"
                        className="tbWeight"
                        value={row.tbWeight}
                        onChange={(e) =>
                          handleChange(i, "tbWeight", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        name="tbInvoiceNo"
                        className="tbInvoiceNo"
                        value={row.tbInvoiceNo}
                        onChange={(e) =>
                          handleChange(i, "tbInvoiceNo", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        name="total"
                        className="final_amount"
                        value={row.total}
                        onChange={(e) =>
                          handleChange(i, "total", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => removeRow(i)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Col>
        </Row>

        <div className="form-actions d-flex justify-content-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleSubmit}>
            {isEditing ? "Update Bill" : "Save Bill"}
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default CreateNewTranspBill;
