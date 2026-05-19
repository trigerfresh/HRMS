import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Alert, Button, Card, Form, Table } from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const WORateChartForm = ({ siteData, onBackForm }) => {
  const [siteDetails, setSiteDetails] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [error, setError] = useState(null);
  const [workOrderTypes, setWorkOrderTypes] = useState([]);
  const [woRateRows, setWORateRows] = useState([
    {
      woType: "",
      size: "",
      fromWt: "",
      toWt: "",
      type: "",
      equipmentType: "",
      examPer: "",
      rate: "",
    },
  ]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchWORates = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/clients/getWORates/${siteData._id}`,
        getAuthHeaders(),
      );

      // console.log(data);
      if (data && data.length > 0) {
        setWORateRows(
          data.map((o) => ({
            _id: o._id,
            woType: o.woType || "",
            size: o.size || "",
            fromWt: o.fromWt || "",
            toWt: o.toWt || "",
            type: o.type || "",
            equipmentType: o.equipmentType || "",
            examPer: o.examPer || "",
            rate: o.rate || "",
          })),
        );
      }
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        console.log(e);
        setError(e.response?.data?.message || "Failed to fetch WO Rates.");
      }
    }
  };

  const fetchDropdownData = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/work-order-type`, {
        ...getAuthHeaders(),
      });
      setWorkOrderTypes(data);
      // console.log(data);

      const res = await axios.get(`${API_URL}/api/equipment-type`, {
        ...getAuthHeaders(),
      });
      // console.log(res);
      setEquipmentTypes(res.data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        console.log(e);
        setError(
          e.response?.data?.message || "Failed to fetch Drop Down Data.",
        );
      }
    }
  };

  useEffect(() => {
    // console.log(siteData);
    setSiteDetails(siteData);
    fetchDropdownData();
    fetchWORates();
  }, []);

  const addWoRateRow = () => {
    setWORateRows((prev) => [
      ...prev,
      {
        woType: "",
        size: "",
        fromWt: "",
        toWt: "",
        type: "",
        equipmentType: "",
        examPer: "",
        rate: "",
      },
    ]);
  };

  const deleteWORateRows = (index) => {
    setWORateRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...woRateRows];
    updated[index][field] = value;

    if (validationErrors?.[index]?.[field]) {
      setValidationErrors((prev) => {
        const newErrors = [...(prev || [])];
        if (newErrors[index]) {
          newErrors[index][field] = "";
        }
        return { ...prev, newErrors };
      });
    }
    setWORateRows(updated);
  };

  const validateWORateRows = () => {
    const errors = {};

    woRateRows.forEach((wo, idx) => {
      if (wo.size && isNaN(wo.size)) {
        errors[`size_${idx}`] = "Size must be a number.";
      }
      if (wo.examPer && isNaN(wo.examPer)) {
        errors[`examPer_${idx}`] = "Exam Percentage must be a number.";
      }
      if (wo.rate && isNaN(wo.rate)) {
        errors[`rate_${idx}`] = "Rate must be a number.";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateWORateRows()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    try {
      const config = {
        headers: {
          ...getAuthHeaders().headers,
        },
      };
      await axios.put(
        `${API_URL}/api/clients/addWORates/${siteDetails.clientId?._id}/${siteDetails._id}`,
        woRateRows,
        config,
      );
      alert("Rates added successfully!");
      fetchWORates();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };

  return (
    <Card>
      <div>
        <h2 className="form-title card-header mb-4">
          Add Rate Chart - ({siteDetails.clientId?.companyName}) -{" "}
          {siteDetails.siteName} ({siteDetails.clientCode})
        </h2>
      </div>
      {error ? (
        <Alert variant="danger" className="mb-3 text-center">
          {error}
        </Alert>
      ) : (
        ""
      )}
      {Object.keys(validationErrors).length > 0 && (
        <Alert variant="danger">Please fix the validation errors below.</Alert>
      )}
      <Table bordered hover responsive>
        <thead className="table-secondary">
          <tr>
            <th>WO Type</th>
            <th>Size</th>
            <th>From Wt</th>
            <th>To Wt</th>
            <th>Type</th>
            <th>Equipment</th>
            <th>Exam Percentage</th>
            <th>Rate</th>
            <th>
              <div className="table-actions">
                <button
                  type="button"
                  onClick={addWoRateRow}
                  className="icon-btn add text-warning"
                >
                  <FaPlus />
                </button>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {woRateRows.map((row, i) => (
            <tr key={i}>
              <td>
                <Form.Select
                  style={{ width: "auto" }}
                  value={row.woType}
                  onChange={(e) => handleChange(i, "woType", e.target.value)}
                >
                  <option value="">Select</option>
                  {Array.isArray(workOrderTypes) && workOrderTypes.length > 0
                    ? workOrderTypes.map((w, i) => (
                        <option key={i} value={w.name}>
                          {w.name}
                        </option>
                      ))
                    : ""}
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  style={{ width: "auto" }}
                  type="text"
                  value={row.size}
                  onChange={(e) => handleChange(i, "size", e.target.value)}
                  isInvalid={!!validationErrors[`size_${i}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`size_${i}`]}
                </Form.Control.Feedback>
              </td>
              <td>
                <Form.Control
                  style={{ width: "auto" }}
                  type="text"
                  value={row.fromWt}
                  onChange={(e) => handleChange(i, "fromWt", e.target.value)}
                />
              </td>
              <td>
                <Form.Control
                  style={{ width: "auto" }}
                  type="text"
                  value={row.toWt}
                  onChange={(e) => handleChange(i, "toWt", e.target.value)}
                />
              </td>
              <td>
                <Form.Select
                  style={{ width: "auto" }}
                  value={row.type}
                  onChange={(e) => handleChange(i, "type", e.target.value)}
                >
                  <option value={""}>Select</option>
                  <option value={"Ton Wise"}>Ton Wise</option>
                  <option value={"Container Wise"}>Container Wise</option>
                </Form.Select>
              </td>
              <td>
                <Form.Select
                  style={{ width: "auto" }}
                  value={row.equipmentType}
                  onChange={(e) =>
                    handleChange(i, "equipmentType", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {Array.isArray(equipmentTypes) && equipmentTypes.length > 0
                    ? equipmentTypes.map((e, i) => (
                        <option key={i} value={e.equipmentType}>
                          {e.equipmentType}
                        </option>
                      ))
                    : ""}
                </Form.Select>
              </td>
              <td>
                <Form.Control
                  style={{ width: "auto" }}
                  type="text"
                  value={row.examPer}
                  onChange={(e) => handleChange(i, "examPer", e.target.value)}
                  isInvalid={!!validationErrors[`examPer_${i}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`examPer_${i}`]}
                </Form.Control.Feedback>
              </td>
              <td>
                <Form.Control
                  style={{ width: "auto" }}
                  type="text"
                  value={row.rate}
                  onChange={(e) => handleChange(i, "rate", e.target.value)}
                  isInvalid={!!validationErrors[`rate_${i}`]}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors[`rate_${i}`]}
                </Form.Control.Feedback>
              </td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="icon-btn delete"
                    onClick={() => deleteWORateRows(i)}
                  >
                    <FaTimes />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="form-actions d-flex justify-content-end align-items-center">
        <Button
          variant="secondary"
          type="button"
          className="me-2"
          onClick={onBackForm}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          className="me-2"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </Card>
  );
};

export default WORateChartForm;
