import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch, FaPen, FaTrashAlt } from "react-icons/fa";
import SearchPanel from "../../utils/FilterPanel";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const Holiday = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employeeTypes, setEmployeeTypes] = useState([]); // Add state for employee types
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const initialFormData = {
    state: "",
    rank: "All",
    holidays: [{ name: "", date: "" }],
  };
  const [formData, setFormData] = useState(initialFormData);
  const [holidayFiles, setHolidayFiles] = useState({});
  const [imagePreview, setImagePreview] = useState({});

  const [searchFields, setSearchFields] = useState([
    { field: "state", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const holidaySearchOptions = [
    { value: "state", label: "State" },
    { value: "rank", label: "Rank" },
    { value: "holidays.name", label: "Holiday Name" },
  ];

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // Fetch employee types for rank dropdown
  useEffect(() => {
    const fetchEmployeeTypes = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/api/employee-types?simple=true`,
          getAuthHeaders(),
        );
        setEmployeeTypes(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        console.warn("Failed to fetch employee types:", err);
        setEmployeeTypes([]);
      }
    };

    fetchEmployeeTypes();
  }, []);

  const fetchHolidays = async () => {
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
      const res = await axios.get(`${API_URL}/api/holidays`, {
        params,
        ...getAuthHeaders(),
      });
      setHolidays(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showForm) {
      fetchHolidays();
    }
  }, [showForm]);

  useEffect(() => {
    fetchHolidays();
  }, [searchFields, dateFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [e.target.name]: e.target.value });
    const key = name; // for company details, usually just the field name
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };
  const handleHolidayRowChange = (index, field, value) => {
    const updated = [...formData.holidays];
    updated[index][field] = value;
    setFormData({ ...formData, holidays: updated });

    const key = `holiday${
      field.charAt(0).toUpperCase() + field.slice(1)
    }_${index}`;
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };
  const handleFileChange = (index, file) => {
    setHolidayFiles((prev) => ({ ...prev, [index]: file }));

    // Create preview
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview((prev) => ({ ...prev, [index]: previewUrl }));
    } else {
      setImagePreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[index];
        return newPreview;
      });
    }
  };

  const addHolidayRow = () =>
    setFormData({
      ...formData,
      holidays: [...formData.holidays, { name: "", date: "" }],
    });

  const removeHolidayRow = (index) => {
    const updatedHolidays = formData.holidays.filter((_, i) => i !== index);
    setFormData({ ...formData, holidays: updatedHolidays });

    // Rebuild files and previews with corrected indices
    const newFiles = {};
    const newPreviews = {};

    updatedHolidays.forEach((_, i) => {
      if (holidayFiles[i >= index ? i + 1 : i]) {
        newFiles[i] = holidayFiles[i >= index ? i + 1 : i];
      }
      if (imagePreview[i >= index ? i + 1 : i]) {
        newPreviews[i] = imagePreview[i >= index ? i + 1 : i];
      }
    });

    setHolidayFiles(newFiles);
    setImagePreview(newPreviews);
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setHolidayFiles({});
    setIsEditing(null);
    setValidationErrors({});
    setShowForm(false);
    setImagePreview({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.state.trim()) {
      errors.state = "State Name is required";
    }

    formData.holidays.forEach((h, index) => {
      if (!h.name.trim())
        errors[`holidayName_${index}`] = "Holiday name is required";
      if (!h.date) errors[`holidayDate_${index}`] = "Holiday date is required";
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    }

    const payload = new FormData();
    payload.append("state", formData.state);
    payload.append("rank", formData.rank);

    payload.append("holidaysData", JSON.stringify(formData.holidays));

    Object.keys(holidayFiles).forEach((index) => {
      payload.append(`holiday_image_${index}`, holidayFiles[index]);
    });

    // for (let [key, value] of payload.entries()) {
    //   console.log(`${key}:`, value);
    // }

    try {
      const config = {
        ...getAuthHeaders(),
        headers: {
          "Content-Type": "multipart/form-data",
          ...getAuthHeaders().headers,
        },
      };
      if (isEditing) {
        await axios.put(
          `${API_URL}/api/holidays/${isEditing._id}`,
          payload,
          config,
        );
        alert("Holiday updated successfully!");
      } else {
        await axios.post(`${API_URL}/api/holidays`, payload, config);
        alert("Holiday created successfully!");
      }
      resetForm();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
    }
  };

  const handleEdit = (holiday) => {
    setIsEditing(holiday);
    setValidationErrors({});
    setFormData({
      state: holiday.state,
      rank: holiday.rank,
      holidays: holiday.holidays.map((h) => ({
        _id: h._id, // keep for backend reference
        name: h.name,
        date: h.date ? h.date.split("T")[0] : "",
        image: h.image || "",
      })),
    });
    // console.log(holiday);
    const previews = {};
    holiday.holidays.forEach((h, index) => {
      if (h.image) {
        // console.log(h.image);
        previews[index] = `${API_URL}/uploads/holidays/${h.image}`; // Adjust if needed
      }
    });
    setImagePreview(previews);
    setHolidayFiles({});
    setShowForm(true);
    setShowSearch(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await axios.delete(`${API_URL}/api/holidays/${id}`, getAuthHeaders());
        alert("Holiday deleted!");
        fetchHolidays();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Delete failed!");
      }
    }
  };

  const handleSearch = () => fetchHolidays();
  const handleReset = () => {
    setSearchFields([{ field: "state", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    setTimeout(() => fetchHolidays(), 0);
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

      const response = await axios.get(`${API_URL}/api/holidays/export`, {
        params,
        responseType: "blob", // IMPORTANT
        ...getAuthHeaders(),
      });

      // Create Excel File
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Holidays_${randomNumber}.xlsx`;
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
        <h1 className="page-title">
          Holiday Master{" "}
          <span className="text-success">({holidays.length})</span>
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
              setShowSearch(false);
              resetForm();
              setShowForm(true);
            }}
          >
            <FaPlus /> Add New Holiday
          </button>
        </div>
      </div>

      {showSearch && (
        <SearchPanel
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          onSearch={handleSearch}
          onReset={handleReset}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={holidaySearchOptions}
        />
      )}

      {showForm && (
        <Card className="card form-panel">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Holiday - {isEditing.state}</span>
            ) : (
              "Add New Holiday"
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Row className="form-grid">
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="state">
                  <Form.Label>State Name *</Form.Label>
                  <Form.Control
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="State Name "
                    isInvalid={!!validationErrors.state}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="rank">
                  <Form.Label>Rank</Form.Label>
                  <Form.Select
                    name="rank"
                    value={formData.rank}
                    onChange={handleInputChange}
                  >
                    <option value="All">All Ranks</option>
                    {employeeTypes.map((emp) => (
                      <option key={emp._id || emp.id} value={emp.name}>
                        {emp.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div>
              <h5 className="card-subtitle mt-3 mb-4">Holiday Details</h5>
              {formData.holidays.map((h, index) => (
                <Row key={index} className="mb-3">
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId="name">
                      <Form.Label>Holiday Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={h.name}
                        placeholder="Holiday Name"
                        onChange={(e) =>
                          handleHolidayRowChange(index, "name", e.target.value)
                        }
                        isInvalid={!!validationErrors[`holidayName_${index}`]}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`holidayName_${index}`]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={2} className="mb-3">
                    <Form.Group controlId="date">
                      <Form.Label>Holiday Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={h.date}
                        onChange={(e) =>
                          handleHolidayRowChange(index, "date", e.target.value)
                        }
                        isInvalid={!!validationErrors[`holidayDate_${index}`]}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`holidayDate_${index}`]}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} sm={6} md={4} className="mb-3">
                    <Form.Group controlId={`holidayFile${index}`}>
                      <Form.Label>Attach Image</Form.Label>
                      <Form.Control
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp"
                        name={`holidayFile${index}`}
                        onChange={(e) =>
                          handleFileChange(index, e.target.files[0])
                        }
                      />
                    </Form.Group>
                    {imagePreview[index] && (
                      <div className="text-center image-preview mt-2">
                        <img
                          src={imagePreview[index]}
                          alt={`Preview ${index}`}
                          style={{
                            width: "180px",
                            height: "200px",
                            // objectFit: "cover",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    )}
                  </Col>
                  <Col className="mb-3" md="auto">
                    <div
                      className="holiday-row-actions"
                      style={{ paddingTop: "32px" }}
                    >
                      {formData.holidays.length > 1 && (
                        <Button
                          type="button"
                          className="me-2"
                          variant="danger"
                          onClick={() => removeHolidayRow(index)}
                        >
                          Remove
                        </Button>
                      )}
                      {index === formData.holidays.length - 1 && (
                        <Button
                          type="button"
                          onClick={addHolidayRow}
                          variant="primary"
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              ))}
            </div>

            <div className="form-actions d-flex justify-content-end">
              <Button
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
                {isEditing ? "Update Holiday" : "Save Holiday"}
              </Button>
            </div>
          </Form>
        </Card>
      )}

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
            <Table responsive hover bordered className="cool-table">
              <thead className="table-secondary">
                <tr>
                  <th>State</th>
                  <th>Rank</th>
                  <th>Holidays Count</th>
                  <th>Created Detail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={5}>No data found</td>
                  </tr>
                ) : (
                  holidays.map((h) => (
                    <tr key={h._id}>
                      <td className="state-cell">{h.state}</td>
                      <td>{h.rank}</td>
                      <td>{h.holidays.length}</td>
                      <td>
                        {h.created_by ? h.created_by.name : ""}
                        <br />
                        {h.created_on &&
                          new Date(h.created_on).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleEdit(h)}
                            className="icon-btn edit"
                            title="Edit"
                          >
                            <FaPen />
                          </button>
                          <button
                            onClick={() => handleDelete(h._id)}
                            className="icon-btn delete"
                            title="Delete"
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

export default Holiday;
