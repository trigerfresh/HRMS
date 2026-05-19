import React, { useEffect, useState } from "react";
import axios from "axios";

import FilterPanel from "../../utils/FilterPanel";
import { FaPen, FaSearch, FaTrashAlt } from "react-icons/fa";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function WorkOrderTypePage() {
  const token = localStorage.getItem("token");
  const [workOrderTypes, setWorkOrderTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editInput, setEditInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [searchFields, setSearchFields] = useState([
    { field: "name", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const searchOptions = [{ value: "name", label: "Work Order Type" }];

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchTypes = async () => {
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
      const { data } = await axios.get(`${API_URL}/api/work-order-type`, {
        params,
        ...getAuthHeaders(),
      });
      // console.log(data);
      setWorkOrderTypes(data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(
          e.response?.data?.message || "Failed to fetch Work Order types.",
        );
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await axios.post(
        `${API_URL}/api/work-order-type`,
        { name: input },
        getAuthHeaders(),
      );
      setInput("");
      fetchTypes();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          error.response?.data?.message || "Failed to add work order type.",
        );
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this work order type?")
    ) {
      try {
        await axios.delete(`${API_URL}/api/work-order-type/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        if (e.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else
          alert(
            `Error: ${
              e.response?.data?.message || "Failed to delete work order type."
            }`,
          );
      }
    }
    fetchTypes();
  };

  const handleEdit = (id, name) => {
    setEditingId(id);
    setEditInput(name);
  };

  const handleUpdate = async (id) => {
    if (!editInput.trim()) return;
    try {
      await axios.put(
        `${API_URL}/api/work-order-type/${id}`,
        { name: editInput },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEditingId(null);
      setEditInput("");
      fetchTypes();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          error.response?.data?.message || "Failed to update work order type.",
        );
    }
  };

  const handleSearch = () => {
    fetchTypes();
  };

  useEffect(() => {
    fetchTypes();
  }, [searchFields, dateFilter]);

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
        `${API_URL}/api/work-order-type/export`,
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
      link.download = `WorkOrderTypes_${randomNumber}.xlsx`;
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

  const handleReset = () => {
    setSearchFields([{ field: "name", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchTypes();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Work Order Type{" "}
          <span className="text-success">({workOrderTypes.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
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

      <Card className="card table-card">
        <div>
          <Form className="work-order-type-form" onSubmit={handleSubmit}>
            <Row className="align-items-end">
              <Col md={6} className="mb-3">
                <Form.Group controlId="work-order-type">
                  <Form.Label className="work-order-type-label">
                    Work Order Type
                  </Form.Label>
                  <Form.Control
                    className="work-order-type-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Work Order Type"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="work-order-type-submit"
                >
                  Submit
                </Button>
              </Col>
            </Row>
          </Form>

          <div className="mt-3">
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
                    <th>WORK ORDER TYPE</th>
                    <th>CREATED DETAIL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrderTypes.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={3}>No data found</td>
                    </tr>
                  ) : (
                    workOrderTypes.map((et) => (
                      <tr key={et._id}>
                        <td>
                          {editingId === et._id ? (
                            <Col md={12}>
                              <Form.Control
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="work-order-type-input"
                                style={{ minWidth: 120 }}
                              />
                            </Col>
                          ) : (
                            et.name
                          )}
                        </td>
                        <td>
                          {et.created_by ? et.created_by.name : ""}
                          <br />
                          {et.created_on &&
                            new Date(et.created_on).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="table-actions">
                            {editingId === et._id ? (
                              <>
                                <Button
                                  className="work-order-type-cancel"
                                  variant="secondary"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="primary"
                                  className="work-order-type-update edit"
                                  onClick={() => handleUpdate(et._id)}
                                >
                                  Update
                                </Button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="work-order-type-edit icon-btn edit"
                                  onClick={() => handleEdit(et._id, et.name)}
                                >
                                  <FaPen />
                                </button>
                                <button
                                  className="icon-btn delete"
                                  onClick={() => handleDelete(et._id)}
                                >
                                  <FaTrashAlt />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
