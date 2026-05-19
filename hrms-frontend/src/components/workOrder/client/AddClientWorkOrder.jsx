import axios from "axios";
import React, { useState } from "react";
import { useEffect } from "react";
import Select from "react-select";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";
import { customSelectStyles } from "../../../utils/utils";

const COMPANY_API = `${import.meta.env.VITE_API_URL}/api/clients`;
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const AddClientWorkOrder = ({ onSave, onBack }) => {
  const [showPkgDetailModal, setShowPkgDetailModal] = useState(false);
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

  const [orderItems, setOrderItems] = useState([
    {
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
    },
  ]);

  useEffect(() => {
    const totalPkg = orderItems.reduce((sum, order) => {
      return (
        sum +
        (order.totalCargoPkg || []).reduce(
          (s, p) => s + Number(p.value || 0),
          0,
        )
      );
    }, 0);

    const totalWgt = orderItems.reduce((sum, order) => {
      return (
        sum +
        (order.totalCargoWgt || []).reduce(
          (s, w) => s + Number(w.value || 0),
          0,
        )
      );
    }, 0);

    setFormData((prev) => ({
      ...prev,
      totalCargoPkg: totalPkg,
      totalCargoWgt: totalWgt,
    }));
  }, [orderItems]);

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
      //   console.log(data);
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

  const handleOrderItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedOrders = [...orderItems];
    updatedOrders[index][name] = value;
    setOrderItems(updatedOrders);

    if (validationErrors[`${name}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${name}_${index}`]: "",
      }));
    }
  };

  const addOrderItems = () => {
    setOrderItems([
      ...orderItems,
      {
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
      },
    ]);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handlePackageChange = (field, index, value) => {
    setOrderItems((prev) => {
      const updated = [...prev];

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: updated[currentOrderIndex][field].map((item, i) =>
          i === index ? { ...item, value } : item,
        ),
      };

      return updated;
    });

    if (validationErrors[`${field}_${currentOrderIndex}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${field}_${currentOrderIndex}_${index}`]: "",
      }));
    }
  };

  const handlePackageAdd = (field) => {
    setOrderItems((prev) => {
      const updated = [...prev];

      const currentField = updated[currentOrderIndex][field] || [];

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: [...currentField, { value: "" }],
      };

      return updated;
    });
  };

  const handlePackageRemove = (field) => {
    setOrderItems((prev) => {
      const updated = [...prev];

      const currentField = updated[currentOrderIndex][field];

      if (!currentField || currentField.length <= 1) return prev;

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: currentField.slice(0, -1),
      };

      return updated;
    });
  };

  const handleSelectChange = (field, selected) => {
    setOrderItems((prev) => {
      const updated = [...prev];
      updated[currentOrderIndex][field] = selected;
      return updated;
    });
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
    orderItems.forEach((orderItem, idx) => {
      if (!orderItem.itemNo || orderItem.itemNo.trim() === "") {
        errors[`itemNo_${idx}`] = "Item No is required";
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCargoTotals = () => {
    let valid = true;
    const errors = {};

    orderItems.forEach((order, orderIndex) => {
      (order.totalCargoPkg || []).forEach((pkg, i) => {
        if (!pkg.value && isNaN(pkg.value)) {
          errors[`totalCargoPkg_${orderIndex}_${i}`] = "PKG must be a number";
          valid = false;
        }
      });

      (order.totalCargoWgt || []).forEach((wgt, i) => {
        if (!wgt.value && isNaN(wgt.value)) {
          errors[`totalCargoWgt_${orderIndex}_${i}`] =
            "Weight must be a number";
          valid = false;
        }
      });
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getTotalFromArray = (arr) => {
    if (!Array.isArray(arr)) return 0;

    return arr.reduce((sum, item) => {
      const num = parseFloat(item.value);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateCompanyDetails()) {
      alert("Please fix the validation errors before submitting.");
      return;
    } else if (!validateOrderItems()) {
      alert("Please fix the validation errors before submitting.");
      return;
    } else if (!validateCargoTotals()) {
      alert("Cargo PKG and Weight must be valid numbers.");
      return;
    }

    const formattedOrderItems = orderItems.map((item) => ({
      ...item,
      totalCargoPkgSum: getTotalFromArray(item.totalCargoPkg),
      totalCargoWgtSum: getTotalFromArray(item.totalCargoWgt),
    }));

    const data = {
      ...formData,
      formattedOrderItems,
    };

    onSave(data);
  };

  return (
    <div>
      <Card>
        <h2 className="card-header mb-4">Add Work Order</h2>

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
                  <th>Allow Pkg</th>
                  <th>Allow Weight</th>
                  <th>Exporter Name</th>
                  <th>Status</th>
                  <th>
                    <div className="table-actions">
                      <button
                        type="button"
                        onClick={addOrderItems}
                        className="icon-btn add text-warning"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((orderItem, idx) => (
                  <tr key={idx}>
                    <td className="sticky-col bg-white" style={{ left: 0 }}>
                      {idx + 1}
                    </td>
                    <td
                      className="sticky-col bg-white"
                      style={{ left: "70px" }}
                    >
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="itemNo"
                        value={orderItem.itemNo || ""}
                        isInvalid={!!validationErrors[`itemNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`itemNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="containerNo"
                        value={orderItem.containerNo || ""}
                        isInvalid={!!validationErrors[`containerNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`containerNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        name="size"
                        type="text"
                        value={orderItem.size || ""}
                        isInvalid={!!validationErrors[`size_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`size_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="invoiceNo"
                        value={orderItem.invoiceNo || ""}
                        isInvalid={!!validationErrors[`invoiceNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`invoiceNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="vehichleNo"
                        value={orderItem.vehichleNo || ""}
                        isInvalid={!!validationErrors[`vehichleNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`vehichleNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="destuffPkgs"
                        value={orderItem.destuffPkgs || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="destuffWgt"
                        value={orderItem.destuffWgt || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        name="exam"
                        type="text"
                        value={orderItem.exam || ""}
                        isInvalid={!!validationErrors[`exam_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`exam_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        name="remarks"
                        type="text"
                        value={orderItem.remarks || ""}
                        isInvalid={!!validationErrors[`remarks_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`remarks_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        name="hours"
                        value={orderItem.hours || ""}
                        isInvalid={!!validationErrors[`hours_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`hours_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        name="cbm"
                        type="text"
                        value={orderItem.cbm || ""}
                        isInvalid={!!validationErrors[`cbm_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`cbm_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="sealNo"
                        value={orderItem.sealNo || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="date"
                        name="arrivalDate"
                        value={orderItem.arrivalDate || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="allowPkg"
                        value={orderItem.allowPkg || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="allowWgt"
                        value={orderItem.allowWgt || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Control
                        style={{ width: "auto" }}
                        type="text"
                        name="exporterName"
                        value={orderItem.exporterName || ""}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                    </td>
                    <td>
                      <Form.Select
                        name="status"
                        value={orderItem.status}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                        style={{ width: "auto" }}
                      >
                        <option value="">Select</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </Form.Select>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentOrderIndex(idx);
                            if (!orderItems[idx].totalCargoPkg)
                              orderItems[idx].totalCargoPkg = [{ value: "" }];
                            if (!orderItems[idx].totalCargoWgt)
                              orderItems[idx].totalCargoWgt = [{ value: "" }];
                            setShowPkgDetailModal(true);
                            fetchGangs();
                            fetchEquipmentTypes();
                          }}
                          className="icon-btn view "
                        >
                          <FaPlus />
                        </button>
                        {orderItems.length > 1 && (
                          <button
                            type="button"
                            className="icon-btn delete"
                            onClick={() => removeOrderItem(idx)}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      <Modal
        show={showPkgDetailModal}
        onHide={() => setShowPkgDetailModal(false)}
        size="lg"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Package Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentOrderIndex !== null && (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <Form.Label>Total Cargo PKGS = </Form.Label>
                </Col>
                {orderItems[currentOrderIndex].totalCargoPkg.map(
                  (item, index) => (
                    <Col
                      md={3}
                      sm={6}
                      xs={12}
                      key={index}
                      className="d-flex pe-0 align-items-center mb-2"
                    >
                      <div>
                        <Form.Control
                          type="text"
                          value={item.value}
                          isInvalid={
                            !!validationErrors[
                              `totalCargoPkg_${currentOrderIndex}_${index}`
                            ]
                          }
                          onChange={(e) =>
                            handlePackageChange(
                              "totalCargoPkg",
                              index,
                              e.target.value,
                            )
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {
                            validationErrors[
                              `totalCargoPkg_${currentOrderIndex}_${index}`
                            ]
                          }
                        </Form.Control.Feedback>
                      </div>
                      {orderItems[currentOrderIndex].totalCargoPkg.length ===
                      index + 1 ? (
                        <span className="mx-2 fw-bold fs-5 text-muted"> </span>
                      ) : (
                        <span className="mx-2 fw-bold fs-5 text-muted">+</span>
                      )}
                    </Col>
                  ),
                )}
                {orderItems[currentOrderIndex].totalCargoPkg.length === 1 ? (
                  ""
                ) : (
                  <Col md="auto" sm="auto" xs={12} className="mb-2">
                    <Button
                      className="d-flex  align-items-center gap-2"
                      variant="danger"
                      onClick={() => handlePackageRemove("totalCargoPkg")}
                    >
                      <FaTimes />
                      <span>Remove PKG</span>
                    </Button>
                  </Col>
                )}
                <Col md="auto" sm="auto" xs={12} className="mb-2">
                  <Button
                    className="d-flex align-items-center gap-2"
                    variant="primary"
                    onClick={() => handlePackageAdd("totalCargoPkg")}
                  >
                    <FaPlus />
                    <span>Add PKG</span>
                  </Button>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={12}>
                  <Form.Label>Total Cargo Weight = </Form.Label>
                </Col>
                {orderItems[currentOrderIndex].totalCargoWgt.map(
                  (item, index) => (
                    <Col
                      md={3}
                      sm={6}
                      xs={12}
                      key={index}
                      className="d-flex pe-0 align-items-center mb-2"
                    >
                      <div>
                        <Form.Control
                          type="text"
                          value={item.value}
                          isInvalid={
                            !!validationErrors[
                              `totalCargoWgt_${currentOrderIndex}_${index}`
                            ]
                          }
                          onChange={(e) =>
                            handlePackageChange(
                              "totalCargoWgt",
                              index,
                              e.target.value,
                            )
                          }
                        />
                        <Form.Control.Feedback type="invalid">
                          {
                            validationErrors[
                              `totalCargoWgt_${currentOrderIndex}_${index}`
                            ]
                          }
                        </Form.Control.Feedback>
                      </div>
                      {orderItems[currentOrderIndex].totalCargoWgt.length ===
                      index + 1 ? (
                        <span className="mx-2 fw-bold fs-5 text-muted"> </span>
                      ) : (
                        <span className="mx-2 fw-bold fs-5 text-muted">+</span>
                      )}
                    </Col>
                  ),
                )}
                {orderItems[currentOrderIndex].totalCargoWgt.length === 1 ? (
                  ""
                ) : (
                  <Col md="auto" sm="auto" xs={12} className="mb-2">
                    <Button
                      className="d-flex  align-items-center gap-2"
                      variant="danger"
                      onClick={() => handlePackageRemove("totalCargoWgt")}
                    >
                      <FaTimes />
                      <span>Remove PKG</span>
                    </Button>
                  </Col>
                )}
                <Col md="auto" sm="auto" xs={12} className="mb-2">
                  <Button
                    className="d-flex align-items-center gap-2"
                    variant="primary"
                    onClick={() => handlePackageAdd("totalCargoWgt")}
                  >
                    <FaPlus />
                    <span>Add PKG</span>
                  </Button>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <Form.Label>Select Equipments:</Form.Label>
                  <Select
                    isMulti
                    options={equipmentTypes.map((e) => ({
                      value: e._id,
                      label: e.equipmentType,
                    }))}
                    value={orderItems[currentOrderIndex].equipmentType}
                    onChange={(selected) =>
                      handleSelectChange("equipmentType", selected)
                    }
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <Form.Label>Select Gangs:</Form.Label>
                  <Select
                    isMulti
                    options={gangs.map((g) => ({
                      value: g._id,
                      label: g.name,
                    }))}
                    value={orderItems[currentOrderIndex].gang}
                    onChange={(selected) =>
                      handleSelectChange("gang", selected)
                    }
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="warning"
            // className="text-white"
            type="button"
            onClick={() => setShowPkgDetailModal(false)}
          >
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AddClientWorkOrder;
