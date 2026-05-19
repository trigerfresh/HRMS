import axios from "axios";
import React, { useEffect, useState } from "react";
import { Card, Form, Button, Alert, Table } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Invoice = () => {
  const navigate = useNavigate();
  const [empWages, setEmpWages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const params = new URLSearchParams(window.location.search);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchEmpWages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/attendance/emp-wages`, {
        params,
        ...getAuthHeaders(),
      });
      setEmpWages(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError(err.response?.data?.message || "Failed to fetch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmpWages();
  }, []);

  const clientDetails = empWages?.clientDetails || {};
  const billingCompany = empWages?.billingCompanyDetails || {};
  const siteDetails = empWages?.siteDetails || {};

  const orderInfo = empWages?.order_info || [];

  const pf = empWages?.order_info_pf?.[0] || {};
  const pt = empWages?.order_info_pt?.[0] || {};
  const ot = empWages?.order_info_ot?.[0] || {};
  const esic = empWages?.order_info_esic?.[0] || {};
  const bonus = empWages?.order_info_bonus?.[0] || {};
  const serviceCharges = empWages?.order_info_service_charges?.[0] || {};
  const actualCharges = empWages?.atactual_charges?.[0] || {};

  const handleOrderInfoChange = (index, field, value) => {
    setEmpWages((prev) => {
      const updated = { ...prev };
      const rows = [...updated.order_info];
      rows[index] = {
        ...rows[index],
        [field]: field === "rank" ? value : Number(value),
      };
      updated.order_info = rows;
      return updated;
    });
  };

  const handleExtraRowChange = (key, field, value) => {
    setEmpWages((prev) => {
      const updated = { ...prev };

      const map = {
        pf: "order_info_pf",
        pt: "order_info_pt",
        ot: "order_info_ot",
        esic: "order_info_esic",
        bonus: "order_info_bonus",
        service: "order_info_service_charges",
        actual: "atactual_charges",
      };

      const arrayKey = map[key];
      if (!arrayKey) return prev;

      const arr = [...(updated[arrayKey] || [{}])];
      arr[0] = {
        ...arr[0],
        [field]: field === "label" ? value : Number(value),
      };

      updated[arrayKey] = arr;
      return updated;
    });
  };

  const safeTotal = (obj) => Number(obj?.total || 0);

  const grandTotal =
    safeTotal(pf) +
    safeTotal(pt) +
    safeTotal(ot) +
    safeTotal(esic) +
    safeTotal(bonus) +
    safeTotal(serviceCharges) +
    safeTotal(actualCharges) +
    orderInfo.reduce((sum, r) => sum + (r.total || 0), 0);

  const getMonthName = (monthNumber) => {
    return new Date(0, monthNumber - 1).toLocaleString("en-US", {
      month: "long",
    });
  };

  const saveUpdatedWages = async () => {
    if (!empWages) return;

    const payload = {
      clientDetails,
      siteDetails,
      queryParams: Object.fromEntries(params.entries()),
      empRows: empWages.empRows,
      order_info: empWages.order_info,
      order_info_pf: empWages.order_info_pf,
      order_info_pt: empWages.order_info_pt,
      order_info_ot: empWages.order_info_ot,
      order_info_esic: empWages.order_info_esic,
      order_info_bonus: empWages.order_info_bonus,
      order_info_service_charges: empWages.order_info_service_charges,
      atactual_charges: empWages.atactual_charges,
      grossAmount: grandTotal,
    };

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/api/attendance/generate-invoice`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        window.location.href = `/billing`;
      } else {
        alert("Error generating Invoice: " + response.data.message);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else alert("Error generating Invoice!");
    }
  };

  return (
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
        <>
          <Card.Header className="page-header">
            <p className="fs-5 fw-normal mb-0">View Charges History</p>
            <div>
              <Button variant="danger me-2" onClick={saveUpdatedWages}>
                Generate Final
              </Button>
              <Button
                variant="success"
                onClick={() => navigate("/attendance/attendance-by-employee")}
              >
                Go Back
              </Button>
            </div>
          </Card.Header>

          <div className="text-center form-subtitle my-3">TAX INVOICE</div>

          <Table>
            <tbody>
              <tr>
                <td
                  style={{
                    border: "none",
                    fontSize: "34px",
                    textAlign: "center",
                    color: "red",
                    fontWeight: 700,
                    backgroundColor: "#f0f2f5",
                  }}
                >
                  {billingCompany?.companyName}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "none",
                    textAlign: "center",
                    fontWeight: 650,
                    backgroundColor: "#f0f2f5",
                  }}
                >
                  SPECIALISED IN PROVIDING ALL TYPES OF SKILLED AND UNSKILLED
                  LABOUR SUPPLIER IN MIDC &amp; WAREHOUSE AREAS AT PAN INDIA
                  LEVEL SINCE 12 YRS
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "none",
                    textAlign: "center",
                    backgroundColor: "#f0f2f5",
                    fontWeight: "bold",
                  }}
                >
                  {billingCompany?.address} City: {billingCompany?.city} State:{" "}
                  {billingCompany?.state} Pincode: {billingCompany?.pinCode}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    border: "none",
                    textAlign: "center",
                    backgroundColor: "#f0f2f5",
                    fontWeight: "bold",
                  }}
                >
                  E-mail: {billingCompany?.emailId} | Ph.:{" "}
                  {billingCompany?.contactNo}
                </td>
              </tr>

              <tr>
                <td
                  style={{
                    textAlign: "center",
                    backgroundColor: "#f0f2f5",
                    fontWeight: "bold",
                  }}
                >
                  GSTIN: {billingCompany?.gstNo}
                </td>
              </tr>
            </tbody>
          </Table>
          <div className="mb-3 d-flex align-items-center gap-2">
            <label className="fw-semibold">Attach Supportings:</label>

            <Button
              variant="secondary"
              onClick={() => document.getElementById("uploadInput").click()}
            >
              Choose File
            </Button>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              id="uploadInput"
              style={{ display: "none" }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />

            <span>{selectedFile ? selectedFile.name : "No file chosen"}</span>
          </div>
          <Table bordered>
            <tbody>
              <tr>
                <td
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#f0f2f5",
                    textAlign: "center",
                  }}
                >
                  Billing Client Details
                </td>

                <td
                  style={{
                    fontWeight: 600,
                    backgroundColor: "#f0f2f5",
                    textAlign: "center",
                    width: "300px",
                  }}
                >
                  Invoice Details
                </td>
              </tr>

              <tr>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  <Table bordered className="mb-0">
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Name:</td>
                        <td>{clientDetails?.companyName}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Add.:</td>
                        <td>{clientDetails?.address}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>GSTIN:</td>
                        <td>{clientDetails?.gstNo}</td>
                      </tr>
                      <tr>
                        <td colSpan={2} style={{ fontWeight: 600 }}>
                          KINDLY ATTN: {clientDetails?.contactPersonName}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </td>

                <td style={{ padding: 0, verticalAlign: "top" }}>
                  <Table bordered className="mb-0">
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Invoice No.</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Invoice Date</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Invoice Type</td>
                        <td>State</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Site Name</td>
                        <td style={{ fontWeight: 600 }}>
                          {siteDetails?.siteName}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 600 }}>Services Period</td>
                        <td style={{ fontWeight: 600 }}>
                          {getMonthName(empWages?.empRows?.attendanceMonth)} -{" "}
                          {empWages?.empRows?.attendanceYear}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </td>
              </tr>
            </tbody>
          </Table>

          <Table bordered>
            <thead>
              <tr>
                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  Sr. No.
                </th>

                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  Item Description
                </th>

                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  HSN / SAC
                </th>

                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  QTY / TON / DAY
                </th>

                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  Rate
                </th>

                <th style={{ fontWeight: 600, backgroundColor: "#f0f2f5" }}>
                  Net Amount
                </th>
              </tr>
            </thead>

            <tbody>
              {orderInfo.map((row, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>

                  <td>
                    <Form.Control
                      type="text"
                      value={row.rank}
                      onChange={(e) =>
                        handleOrderInfoChange(i, "rank", e.target.value)
                      }
                    />
                  </td>

                  <td>{clientDetails?.sacCode}</td>

                  <td>
                    <Form.Control
                      type="number"
                      value={row.totaldays}
                      onChange={(e) =>
                        handleOrderInfoChange(i, "totaldays", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <Form.Control
                      type="number"
                      value={row.gross}
                      onChange={(e) =>
                        handleOrderInfoChange(i, "gross", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <Form.Control
                      type="number"
                      value={row.total}
                      onChange={(e) =>
                        handleOrderInfoChange(i, "total", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}

              {[
                { key: "pf", data: pf },
                { key: "pt", data: pt },
                { key: "ot", data: ot },
                { key: "esic", data: esic },
                { key: "bonus", data: bonus },
                { key: "service", data: serviceCharges },
                { key: "actual", data: actualCharges },
              ].map((item, i) =>
                item.data.total > 0 ? (
                  <tr key={item.key}>
                    <td>{orderInfo.length + i + 1}</td>

                    <td>
                      <Form.Control
                        type="text"
                        value={item.data.label}
                        onChange={(e) =>
                          handleExtraRowChange(
                            item.key,
                            "label",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    <td>{clientDetails?.sacCode}</td>

                    <td>
                      <Form.Control
                        type="number"
                        value={item.data?.total_nos || 0}
                        onChange={(e) =>
                          handleExtraRowChange(
                            item.key,
                            "total_nos",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <Form.Control
                        type="number"
                        value={item.data?.ot_rate || 0}
                        onChange={(e) =>
                          handleExtraRowChange(
                            item.key,
                            "ot_rate",
                            e.target.value,
                          )
                        }
                      />
                    </td>

                    <td>
                      <Form.Control
                        type="number"
                        value={item.data?.total || 0}
                        onChange={(e) =>
                          handleExtraRowChange(
                            item.key,
                            "total",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  ""
                ),
              )}

              <tr>
                <td colSpan="4"></td>
                <td colSpan="2" style={{ padding: 0 }}>
                  <Table bordered className="mb-0">
                    <thead>
                      <tr>
                        <th
                          style={{
                            fontWeight: 600,
                            backgroundColor: "#f0f2f5",
                          }}
                        >
                          Summary
                        </th>

                        <th
                          style={{
                            fontWeight: 600,
                            backgroundColor: "#f0f2f5",
                          }}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Gross Amount</td>
                        <td>₹ {grandTotal}</td>
                      </tr>
                    </tbody>
                  </Table>
                </td>
              </tr>
            </tbody>
          </Table>
        </>
      )}
    </Card>
  );
};

export default Invoice;
