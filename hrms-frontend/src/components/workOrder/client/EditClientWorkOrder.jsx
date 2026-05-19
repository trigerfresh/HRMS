import axios from "axios";
import React, { useState } from "react";
import { useEffect } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import { formatDateForInput } from "../../../utils/utils";
import Select from "react-select";
import { customSelectStyles } from "../../../utils/utils";

const COMPANY_API = `${import.meta.env.VITE_API_URL}/api/clients`;
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const EditClientWorkOrder = ({ editingData, onSave, onBack }) => {
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null);
  const [gangs, setGangs] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [workOrderTypes, setWorkOrderTypes] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    clientId: "",
    workOrderType: "",
    workOrderNo: "",
    workOrderDate: "",
    igmNo: "",
    importerName: "",
    chaName: "",
    vendor: "",
    totalCargoPkg: 0,
    totalCargoWgt: 0,
  });

  const [orderItems, setOrderItems] = useState({
    itemNo: "",
    containerNo: "",
    size: "",
    invoiceNo: "",
    vehichleNo: "",
    destuffPkgs: "",
    destuffWgt: "",
    exam: "",
    remarks: "",
    hours: "",
    cbm: "",
    sealNo: "",
    arrivalDate: "",
    allowPkg: "",
    allowWgt: "",
    exporterName: "",
    status: "Pending",
    totalCargoPkg: [{ value: "" }],
    totalCargoWgt: [{ value: "" }],
    equipmentType: [],
    gang: [],
    totalCargoPkgSum: "",
    totalCargoWgtSum: "",
  });

  useEffect(() => {
    if (!editingData) return;
    // console.log(editingData);

    setFormData({
      clientId: editingData.cliWorkOrderId?.clientId || "",
      workOrderType: editingData.cliWorkOrderId?.workOrderType || "",
      workOrderNo: editingData.cliWorkOrderId?.workOrderNo || "",
      workOrderDate: editingData.cliWorkOrderId?.workOrderDate
        ? formatDateForInput(editingData.cliWorkOrderId?.workOrderDate)
        : "",
      igmNo: editingData.cliWorkOrderId?.igmNo || "",
      importerName: editingData.cliWorkOrderId?.importerName || "",
      chaName: editingData.cliWorkOrderId?.chaName || "",
      vendor: editingData.cliWorkOrderId?.vendor || "",
    });

    setOrderItems({
      _id: editingData._id,
      cliWorkOrderId: editingData.cliWorkOrderId._id || "",
      itemNo: editingData.itemNo || "",
      containerNo: editingData.containerNo || "",
      size: editingData.size || "",
      invoiceNo: editingData.invoiceNo || "",
      vehichleNo: editingData.vehichleNo || "",
      destuffPkgs: editingData.destuffPkgs || "",
      destuffWgt: editingData.destuffWgt || "",
      exam: editingData.exam || "",
      remarks: editingData.remarks || "",
      hours: editingData.hours || "",
      cbm: editingData.cbm || "",
      sealNo: editingData.sealNo || "",
      arrivalDate: editingData.arrivalDate
        ? formatDateForInput(editingData.arrivalDate)
        : "",
      allowPkg: editingData.allowPkg || "",
      allowWgt: editingData.allowWgt || "",
      exporterName: editingData.exporterName || "",
      status: editingData.status || "Pending",
      totalCargoPkgSum: editingData.totalCargoPkgSum || "",
      totalCargoWgtSum: editingData.totalCargoWgtSum || "",
      // equipmentType:
      //   editingData.equipmentType?.map((e) => ({
      //     value: e.value || "",
      //     label: e.label || "",
      //   })) || [],
      // gang:
      //   editingData.gang?.map((g) => ({
      //     value: g.value || "",
      //     label: g.label || "",
      //   })) || [],
      // equipmentType: editingData.equipmentType || [],
      // gang: editingData.gang || [],
    });
  }, [editingData]);

  useEffect(() => {
    if (!editingData) return;
    if (!equipmentTypes.length || !gangs.length) return;

    setOrderItems((prev) => ({
      ...prev,

      equipmentType:
        editingData.equipmentType?.map((sel) => {
          const match = equipmentTypes.find((e) => e._id === sel.value);
          return match ? { value: match._id, label: match.equipmentType } : sel; // fallback if master not loaded yet
        }) || [],

      gang:
        editingData.gang?.map((sel) => {
          const match = gangs.find((g) => g._id === sel.value);
          return match ? { value: match._id, label: match.name } : sel;
        }) || [],
    }));
  }, [editingData, equipmentTypes, gangs]);

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

  const fetchWorkOrderTypes = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/work-order-type`,
        getAuthHeaders(),
      );
      // console.log(data);
      setWorkOrderTypes(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to fetch clients. Please try again.");

      console.error("Failed to fetch companies", err);
    }
  };

  const fetchEquipmentTypes = async () => {
    try {
      // console.log("hello");
      const { data } = await axios.get(`${API_BASE_URL}/equipment-type`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setEquipmentTypes(data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(
          e.response?.data?.message || "Failed to fetch Equipment Types.",
        );
      }
    }
  };

  const fetchGangs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/gangs`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setGangs(data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(e.response?.data?.message || "Failed to fetch Gangs.");
      }
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchGangs();
    fetchEquipmentTypes();
    fetchWorkOrderTypes();
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

  const handleOrderItemChange = (e) => {
    const { name, value } = e.target;

    setOrderItems((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (field, selected) => {
    setOrderItems((prev) => ({
      ...prev,
      [field]: selected || [],
    }));
  };

  const validateCompanyDetails = () => {
    const errors = {};

    if (!formData.clientId) {
      errors.clientId = "Client is required.";
    }
    if (!formData.workOrderType) {
      errors.workOrderType = "Work order type is required.";
    }
    if (!formData.workOrderNo.trim())
      errors.workOrderNo = "Work Order No is required.";

    // if (!formData.companyName.trim())
    //   errors.companyName = "Company Name is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateOrderItems = () => {
    const errors = {};

    if (!orderItems.itemNo || orderItems.itemNo.trim() === "") {
      errors.itemNo = "Item No is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateCompanyDetails()) {
      alert("Please fix the validation errors before submitting.");
      return;
    } else if (!validateOrderItems()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }
    const payload = {
      ...formData,
      orderItems: {
        ...orderItems,
      },
    };

    onSave(payload);
  };

  return (
    <div>
      <Card>
        <h2 className="card-header mb-4">Edit Work Order With Excel</h2>

        {Object.keys(validationErrors).length > 0 && (
          <Alert variant="danger">
            Please fix the validation errors below.
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <p className="form-subtitle">Work Order Detail</p>

          <Row>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="clientId">
                <Form.Label>Client *</Form.Label>
                <Form.Select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleInputChange}
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
              <Form.Group controlId="workOrderType">
                <Form.Label>Work Order Type *</Form.Label>
                <Form.Select
                  name="workOrderType"
                  value={formData.workOrderType}
                  onChange={handleInputChange}
                  isInvalid={!!validationErrors.workOrderType}
                >
                  <option value="">Select</option>
                  {workOrderTypes.map((w) => (
                    <option key={w._id || w.id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {validationErrors.workOrderType}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="workOrderNo">
                <Form.Label>Work Order No *</Form.Label>
                <Form.Control
                  type="text"
                  name="workOrderNo"
                  value={formData.workOrderNo}
                  onChange={handleInputChange}
                  placeholder="Work Order No"
                  isInvalid={!!validationErrors.workOrderNo}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.workOrderNo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group className="workOrderDate">
                <Form.Label>Work Order Date</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.workOrderDate}
                  onChange={handleInputChange}
                  name="workOrderDate"
                  isInvalid={!!validationErrors.workOrderDate}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.workOrderDate}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="igmNo">
                <Form.Label>IGM No</Form.Label>
                <Form.Control
                  type="text"
                  name="igmNo"
                  value={formData.igmNo}
                  onChange={handleInputChange}
                  placeholder="IGM No"
                  isInvalid={!!validationErrors.igmNo}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.igmNo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="importerName">
                <Form.Label>Importer Name</Form.Label>
                <Form.Control
                  type="text"
                  name="importerName"
                  value={formData.importerName}
                  onChange={handleInputChange}
                  placeholder="Importer Name"
                  isInvalid={!!validationErrors.importerName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.importerName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="chaName">
                <Form.Label>CHA Name</Form.Label>
                <Form.Control
                  type="text"
                  name="chaName"
                  value={formData.chaName}
                  onChange={handleInputChange}
                  placeholder="CHA Name"
                  isInvalid={!!validationErrors.chaName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.chaName}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="vendor">
                <Form.Label>Vendor</Form.Label>
                <Form.Control
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Vendor"
                  isInvalid={!!validationErrors.vendor}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.vendor}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <hr />
          <p className="form-subtitle">Work Order</p>

          <div className="table-responsive">
            <Table bordered className="mb-0 border-left-1">
              <thead className="table-secondary">
                <tr>
                  <th
                    className="sticky-col"
                    style={{ left: 0, minWidth: "70px" }}
                  >
                    Sr. No.
                  </th>
                  <th
                    className="sticky-col"
                    style={{ left: "70px", minWidth: "150px" }}
                  >
                    Item No.
                  </th>
                  <th>Container No.</th>
                  <th>Size</th>
                  <th>Invoice No</th>
                  <th>Vehicle No</th>
                  <th>Destuff PKGS</th>
                  <th>Destuff Weight</th>
                  <th>% Exam</th>
                  <th>Remarks</th>
                  <th>Hours</th>
                  <th>CBM</th>
                  <th>Seal No</th>
                  <th>Arrival Date</th>
                  <th>Total Cargo Pkg</th>
                  <th>Total Cargo Weight</th>
                  <th>Allow Pkg</th>
                  <th>Allow Weight</th>
                  <th style={{ minWidth: "300px" }}>Equipment Name</th>
                  <th style={{ minWidth: "300px" }}>Gang Name</th>
                  <th>Exporter Name</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sticky-col bg-white" style={{ left: 0 }}>
                    {1}
                  </td>
                  <td className="sticky-col bg-white" style={{ left: "70px" }}>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="itemNo"
                      value={orderItems.itemNo || ""}
                      isInvalid={!!validationErrors.clientId}
                      onChange={handleOrderItemChange}
                    />
                    <Form.Control.Feedback type="invalid"></Form.Control.Feedback>
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="containerNo"
                      value={orderItems.containerNo || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      name="size"
                      type="text"
                      value={orderItems.size || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="invoiceNo"
                      value={orderItems.invoiceNo || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="vehichleNo"
                      value={orderItems.vehichleNo || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="destuffPkgs"
                      value={orderItems.destuffPkgs || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="destuffWgt"
                      value={orderItems.destuffWgt || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      name="exam"
                      type="text"
                      value={orderItems.exam || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      name="remarks"
                      type="text"
                      value={orderItems.remarks || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      name="hours"
                      value={orderItems.hours || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      name="cbm"
                      type="text"
                      value={orderItems.cbm || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="sealNo"
                      value={orderItems.sealNo || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="date"
                      name="arrivalDate"
                      value={orderItems.arrivalDate || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="totalCargoPkgSum"
                      value={orderItems.totalCargoPkgSum || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="totalCargoWgtSum"
                      value={orderItems.totalCargoWgtSum || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="allowPkg"
                      value={orderItems.allowPkg || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="allowWgt"
                      value={orderItems.allowWgt || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    {/* <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="equipmentName"
                        value={orderItem.equipmentType || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                        /> */}
                    <Select
                      style={{ width: "auto" }}
                      isMulti
                      hideSelectedOptions
                      name="equipmentType"
                      options={equipmentTypes.map((e) => ({
                        value: e._id,
                        label: e.equipmentType,
                      }))}
                      value={orderItems.equipmentType || []}
                      onChange={(selected) =>
                        handleSelectChange("equipmentType", selected)
                      }
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </td>
                  <td>
                    {/* <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="gangName"
                        value={orderItem.gangName || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                        /> */}
                    <Select
                      isMulti
                      name="gang"
                      hideSelectedOptions
                      options={gangs.map((g) => ({
                        value: g._id,
                        label: g.name,
                      }))}
                      value={orderItems.gang || []}
                      onChange={(selected) =>
                        handleSelectChange("gang", selected)
                      }
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </td>
                  <td>
                    <Form.Control
                      style={{ width: "auto" }}
                      type="text"
                      name="exporterName"
                      value={orderItems.exporterName || ""}
                      onChange={handleOrderItemChange}
                    />
                  </td>
                  <td>
                    <Form.Select
                      name="status"
                      value={orderItems.status || ""}
                      onChange={handleOrderItemChange}
                      style={{ width: "auto" }}
                    >
                      <option value="">Select</option>
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </Form.Select>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>

          <div className="form-actions d-flex justify-content-end">
            <Button variant="secondary" className="me-2" onClick={onBack}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit}>
              Save Work Order
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditClientWorkOrder;
