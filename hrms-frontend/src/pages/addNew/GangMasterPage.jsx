import React, { useEffect, useState } from "react";
import axios from "axios";

import FilterPanel from "../../utils/FilterPanel";
import { FaPen, FaPlus, FaSearch, FaTrashAlt } from "react-icons/fa";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GangMasterPage = () => {
  const token = localStorage.getItem("token");
  const [gangs, setGangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [input, setInput] = useState({
    name: "",
    contactNo: "",
  });

  const [searchFields, setSearchFields] = useState([
    { field: "name", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const searchOptions = [
    { value: "name", label: "Gang Name" },
    { value: "contactNo", label: "Contact No" },
  ];

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchGangs = async () => {
    setLoading(true);
    setError(null);

    try {
      let params = {};
      const validSearch = searchFields.filter((f) => f.field && f.keyword);
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch);
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from;
        params.toDate = dateFilter.to;
      }
      const { data } = await axios.get(`${API_URL}/api/gangs`, {
        params,
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
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInput({ ...input, [name]: value });

    const key = name;
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: "",
      }));
    }
  };

  const resetForm = () => {
    setInput({ name: "", contactNo: "" });
    setEditingId(null);
    setValidationErrors({});
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (g) => {
    setEditingId(g);
    setInput({
      name: g.name || "",
      contactNo: g.contactNo || "",
    });
    setShowSearch(false);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.name.trim()) {
      alert("Please fix the validation error.");
      setValidationErrors((prev) => ({
        ...prev,
        name: "Gang Name is required",
      }));
      return;
    }

    if (input.contactNo && !/^\d{10}$/.test(input.contactNo)) {
      alert("Please fix the validation error.");
      setValidationErrors((prev) => ({
        ...prev,
        contactNo: "Contact number must be 10 digits",
      }));
      return;
    }

    try {
      if (editingId) {
        await axios.put(
          `${API_URL}/api/gangs/${editingId._id}`,
          {
            name: input.name,
            contactNo: input.contactNo,
          },
          getAuthHeaders(),
        );
        alert("Gang updated successfully!");
      } else {
        await axios.post(
          `${API_URL}/api/gangs`,
          {
            name: input.name,
            contactNo: input.contactNo,
          },
          getAuthHeaders(),
        );
        alert("Gang created successfully!");
      }
      setShowForm(false);
      resetForm();
      fetchGangs();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else alert(error.response?.data?.message || "Failed to add gang.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this gang?")) {
      try {
        await axios.delete(`${API_URL}/api/gangs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchGangs();
      } catch (e) {
        if (e.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else
          alert(
            `Error: ${e.response?.data?.message || "Failed to delete gang."}`,
          );
      }
    }
  };

  const handleSearch = () => {
    fetchGangs();
  };

  useEffect(() => {
    fetchGangs();
  }, [searchFields, dateFilter]);

  const handleReset = () => {
    setSearchFields([{ field: "name", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchGangs();
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

      const response = await axios.get(`${API_URL}/api/gangs/export`, {
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
      link.download = `Gangs_${randomNumber}.xlsx`;
      link.click();
    } catch (error) {
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
          Gang Master <span className="text-success">({gangs.length})</span>
        </h1>
        <div className="page-actions">
          <button
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
            <FaPlus /> Add New
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
            {editingId ? (
              <span>Edit Gang - {editingId.name}</span>
            ) : (
              "Add New Gang"
            )}
          </h2>
          <Form className="gang-form" onSubmit={handleSubmit}>
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="gang">
                  <Form.Label className="gang-label">Gang Name *</Form.Label>
                  <Form.Control
                    className="gang-input"
                    type="text"
                    value={input.name}
                    name="name"
                    onChange={handleInputChange}
                    placeholder="Gang Name"
                    isInvalid={!!validationErrors.name}
                  />

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group controlId="gang">
                  <Form.Label className="gang-contact">Contact No</Form.Label>
                  <Form.Control
                    className="gang-contact-no"
                    name="contactNo"
                    type="text"
                    value={input.contactNo}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.contactNo}
                    placeholder="Contact No"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <div className="form-actions d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingId ? "Update" : "Submit"}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {!showForm && (
        <Card className="card table-card">
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <Table hover responsive bordered>
              <thead className="table-secondary">
                <tr>
                  <th>GANG NAME</th>
                  <th>CONTACT NO</th>
                  <th>CREATED DETAIL</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {gangs.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={4}>No data found</td>
                  </tr>
                ) : (
                  gangs.map((et) => (
                    <tr key={et._id}>
                      <td>{et.name}</td>
                      <td>{et.contactNo}</td>
                      <td>
                        {et.created_by ? et.created_by.name : ""}
                        <br />
                        {et.created_on &&
                          new Date(et.created_on).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="gang-edit icon-btn edit"
                            onClick={() => handleEdit(et)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(et._id)}
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

export default GangMasterPage;
