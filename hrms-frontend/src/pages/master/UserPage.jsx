import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchPanel from "../../utils/FilterPanel";
import { FaPen, FaTrashAlt, FaEye, FaPlus, FaSearch } from "react-icons/fa"; // Added FaPlus, FaSearch
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Modal,
  Row,
  Table,
} from "react-bootstrap";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const UserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);

  // Dropdown and Form state
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);
  const [branches, setBranches] = useState([]);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const initialFormData = {
    name: "",
    email: "",
    password: "",
    contactNo: "",
    roleId: "",
    address: "",
    city: "",
    pincode: "",
    company: "",
    branch: "",
    selectedClients: [],
  };
  const [formData, setFormData] = useState(initialFormData);
  const [viewUser, setViewUser] = useState(null); // For the view modal

  // Dual list box state
  const [availableClients, setAvailableClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);

  // Search Panel State
  const [searchFields, setSearchFields] = useState([
    { field: "name", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const userSearchOptions = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "contactNo", label: "Contact No" },
  ];

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  // --- Data Fetching ---
  const fetchUsers = async () => {
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
      const res = await axios.get(`${API_BASE_URL}/users`, {
        params,
        ...getAuthHeaders(),
      });
      setUsers(res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to load branches.");
      // console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  // Single useEffect for all initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch users and dropdown data in parallel for speed
        const [companiesRes, rolesRes, clientsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/companies`, getAuthHeaders()),
          axios.get(`${API_BASE_URL}/users/roles`, getAuthHeaders()),
          axios.get(`${API_BASE_URL}/clients`, getAuthHeaders()),
        ]);
        setCompanies(companiesRes.data);
        setRoles(rolesRes.data);
        setClients(clientsRes.data.data);
        // console.log(clientsRes);
        setAvailableClients(clientsRes.data.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else setError("Failed to fetch dropdown data");
        console.error("Failed to fetch dropdown data", error);
      } finally {
        await fetchUsers();
      }
    };
    fetchInitialData();
    // console.log(clients, availableClients);
  }, []);
  // Fetch branches only when the selected company changes
  useEffect(() => {
    if (formData.company) {
      const fetchBranches = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/branches/by-company/${formData.company}`,
            getAuthHeaders(),
          );
          setBranches(res.data);
        } catch (error) {
          if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
          } else setError("Failed to fetch branches");
          console.error("Failed to fetch branches", error);
          setBranches([]); // Clear branches on error
        }
      };
      fetchBranches();
    } else {
      setBranches([]); // Clear branches if no company is selected
    }
  }, [formData.company]);

  // --- Form Handlers ---
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfileImageFile(e.target.files[0]);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };
  const resetForm = () => {
    setFormData(initialFormData);
    setIsEditing(null);
    setLogoPreview(null);
    setValidationErrors({});
    setSelectedClients([]);
    setProfileImageFile(null);
    setAvailableClients(clients);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) newErrors.name = "Full name is required";

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Password validation (required only when creating new user)
    if (!isEditing && !formData.password) {
      newErrors.password = "Password is required";
    }

    // Contact number validation (optional, but must be numeric if filled)
    if (formData.contactNo && !/^\d{10}$/.test(formData.contactNo))
      newErrors.contactNo = "Contact number must be 10 digits";

    // Role validation
    if (!formData.roleId) newErrors.roleId = "Role is required";

    // Company & Branch validation
    if (!formData.company) newErrors.company = "Company is required";
    if (!formData.branch) newErrors.branch = "Branch is required";

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = "Please enter a valid 6-digit Pincode.";
    }
    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true if valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fix the validation errors before submitting.");
      return;
    } else {
      setValidationErrors({});
    }
    const data = new FormData();
    // Append form data
    for (const key in formData) {
      if (key === "selectedClients") {
        const validClientIds = selectedClients
          .filter((c) => c && c._id) // only valid objects
          .map((c) => c._id);

        data.append(key, JSON.stringify(validClientIds));
      } else if (formData[key]) {
        data.append(key, formData[key]);
      }
    }
    if (profileImageFile) {
      data.append("profileImage", profileImageFile);
    }

    // for (let [key, value] of data.entries()) {
    //   console.log(`${key}:`, value);
    // }
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          ...getAuthHeaders().headers,
        },
      };
      if (isEditing) {
        // UPDATE user logic
        await axios.put(`${API_BASE_URL}/users/${isEditing._id}`, data, config);
        alert("User updated successfully!");
      } else {
        // CREATE user logic
        await axios.post(`${API_BASE_URL}/users`, data, config);
        alert("User created successfully!");
      }
      setShowForm(false);
      setIsEditing(null); // Reset editing state
      resetForm();
      fetchUsers();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Failed to ${isEditing ? "update" : "create"} user: ${
            error.response?.data?.message || "Server error"
          }`,
        );
      // console.error(error);
    }
  };

  // === ACTION HANDLERS (UPDATED) ===
  const handleEdit = (user) => {
    setIsEditing(user); // Store the ID of the user being edited
    setValidationErrors({});

    setFormData({
      ...user,
      company: user.company?._id || "",
      branch: user.branch?._id || "",
      roleId: user.roleId?._id || "",
      password: "", // Clear password field for security
    });
    const selectedIds = new Set(
      (user.selectedClients || []).filter((c) => c && c._id).map((c) => c._id),
    );
    // console.log(user);
    setAvailableClients(clients.filter((c) => c && !selectedIds.has(c._id)));
    setSelectedClients(user.selectedClients || []);
    setLogoPreview(
      user.profileImage
        ? `${import.meta.env.VITE_API_URL}/${user.profileImage.replace(/\\/g, "/")}`
        : null,
    );
    setProfileImageFile(
      user.profileImage ? `${user.profileImage.replace(/\\/g, "/")}` : null,
    );
    setShowForm(true);
    setShowSearch(false); // Hide search panel when editing
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${id}`, getAuthHeaders());
        alert("User deleted successfully");
        fetchUsers();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Failed to delete user");
        // console.error(error);
      }
    }
  };
  const handleView = (user) => setViewUser(user);

  // --- Search and Dual List Box Handlers ---
  const handleSearch = () => {
    fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, [searchFields, dateFilter]);

  const resetSearch = () => {
    setSearchFields([{ field: "email", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchUsers();
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
        `${import.meta.env.VITE_API_URL}/api/users/export`,
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
      link.download = `Users_${randomNumber}.xlsx`;
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

  const moveItems = (source, dest, setSource, setDest, itemIds) => {
    const itemsToMove = source.filter((item) => itemIds.includes(item._id));
    const remainingSource = source.filter(
      (item) => !itemIds.includes(item._id),
    );
    setSource(remainingSource);
    setDest(
      [...dest, ...itemsToMove].sort((a, b) =>
        a.companyName.localeCompare(b.companyName),
      ),
    );
  };
  const handleSelectClients = (all = false) => {
    const selectedIds = all
      ? availableClients.map((c) => c._id)
      : Array.from(
          document.getElementById("availableClients").selectedOptions,
        ).map((opt) => opt.value);
    moveItems(
      availableClients,
      selectedClients,
      setAvailableClients,
      setSelectedClients,
      selectedIds,
    );
  };
  const handleDeselectClients = (all = false) => {
    const selectedIds = all
      ? selectedClients.map((c) => c._id)
      : Array.from(
          document.getElementById("selectedClients").selectedOptions,
        ).map((opt) => opt.value);
    moveItems(
      selectedClients,
      availableClients,
      setSelectedClients,
      setAvailableClients,
      selectedIds,
    );
  };

  // === FETCH SITES BY SELECTED CLIENTS ===
  const fetchSitesByClientIds = async (selectedClientList) => {
    if (!selectedClientList || selectedClientList.length === 0) {
      console.log("No clients selected for site fetch.");
      return [];
    }

    try {
      const clientIds = selectedClientList.map((c) => ({ $oid: c._id }));
      const res = await axios.post(
        `${API_BASE_URL}/clients/sites/by-client-ids`,
        { clientIds },
        getAuthHeaders(),
      );
      // console.log("Fetched Sites:", res.data.data);
      return res.data.data;
    } catch (error) {
      console.error("Failed to fetch sites by client IDs:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      return [];
    }
  };

  // Inside handleSelectClients or handleDeselectClients
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sites = await fetchSitesByClientIds(selectedClients);
        // console.log("Sites for selected clients:", sites);
        setSites(sites);
      } catch (error) {
        console.error("Failed to fetch sites by client IDs:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    };

    if (selectedClients.length > 0) {
      fetchSites();
    }
  }, [selectedClients]);

  // --- RENDER ---
  return (
    <div className="page-container">
      <Modal
        show={!!viewUser}
        onHide={() => setViewUser(null)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {viewUser && (
            <>
              <p>
                <strong>Name:</strong> {viewUser.name}
              </p>
              <p>
                <strong>Email:</strong> {viewUser.email}
              </p>
              <p>
                <strong>Role:</strong> {viewUser.roleId?.name || "N/A"}
              </p>
              <p>
                <strong>Company:</strong>{" "}
                {viewUser.company?.companyName || "N/A"}
              </p>
              <p>
                <strong>Branch:</strong> {viewUser.branch?.branchName || "N/A"}
              </p>

              {viewUser.profileImage && (
                <div className="text-center mt-3">
                  <Image
                    src={`${import.meta.env.VITE_API_URL}/${viewUser.profileImage.replace(
                      /\\/g,
                      "/",
                    )}`}
                    alt={viewUser.name}
                    roundedCircle
                    fluid
                    style={{
                      width: "120px",
                      height: "120px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setViewUser(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="page-header">
        <h1 className="page-title">
          User Management <span className="text-success">({users.length})</span>
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
              resetForm();
              setIsEditing(null);
              setShowForm(true);
              setShowSearch(false);
            }}
          >
            <FaPlus /> Create New
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
          onReset={resetSearch}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={userSearchOptions}
        />
      )}
      {showForm && (
        <Card className="user-card">
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit User - {isEditing.name}</span>
            ) : (
              "Create New User"
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form className="user-form" onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="name">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="email">
                  <Form.Label>Email ID *</Form.Label>
                  <Form.Control
                    name="email"
                    placeholder="Email"
                    type="text"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="password">
                  <Form.Label>
                    {isEditing ? "New password (optional)" : "Password *"}
                  </Form.Label>
                  <Form.Control
                    name="password"
                    placeholder={
                      isEditing ? "Enter new password (optional)" : "Password"
                    }
                    type="password"
                    value={formData.password || ""}
                    onChange={handleInputChange}
                    isInvalid={!isEditing && !!validationErrors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="contactNo"
                    placeholder="Contact No"
                    value={formData.contactNo || ""}
                    isInvalid={!!validationErrors.contactNo}
                    onChange={handleInputChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactNo}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    as={"textarea"}
                    placeholder="Address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="city">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    name="city"
                    placeholder="City"
                    value={formData.city || ""}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pincode">
                  <Form.Label>Pincode</Form.Label>
                  <Form.Control
                    name="pincode"
                    placeholder="Pincode"
                    value={formData.pincode || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.pincode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.pincode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="roleId">
                  <Form.Label>Role *</Form.Label>
                  <Form.Select
                    name="roleId"
                    value={formData.roleId || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.roleId}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.roleId}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="company">
                  <Form.Label>Company *</Form.Label>
                  <Form.Select
                    name="company"
                    value={formData.company || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.company}
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.company}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branch">
                  <Form.Label>Branch *</Form.Label>
                  <Form.Select
                    name="branch"
                    id="branch"
                    value={formData.branch || ""}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.branch}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.branchName}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branch}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="profileImage">
                  <Form.Label>Profile Image</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    name="logo"
                    onChange={handleFileChange}
                  />
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="logo preview"
                    style={{
                      width: "180px",
                      height: "200px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                )}
              </Col>
            </Row>

            <Row
              className="d-flex justify-content-center align-items-center text-center"
              // style={{ minHeight: "250px" }}
            >
              <Col
                xs={12}
                md={5}
                className="d-flex justify-content-center align-items-center"
              >
                <Card className="user-card  w-100 p-3">
                  <Form.Label>Available Clients</Form.Label>
                  <Form.Select
                    id="availableClients"
                    multiple
                    className="dual-list-select"
                  >
                    {availableClients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.companyName}
                      </option>
                    ))}
                  </Form.Select>
                </Card>
              </Col>
              <Col
                // md={2}
                className="d-flex flex-column mb-3 gap-2 align-items-center justify-content-center"
              >
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleSelectClients(true)}
                >
                  &gt;&gt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleSelectClients(false)}
                >
                  &gt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleDeselectClients(false)}
                >
                  &lt;
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-100"
                  onClick={() => handleDeselectClients(true)}
                >
                  &lt;&lt;
                </Button>
              </Col>
              <Col
                xs={12}
                md={5}
                className="d-flex justify-content-center align-items-center"
              >
                <Card className="user-card  w-100 p-3">
                  <Form.Label>Assigned Clients</Form.Label>
                  <Form.Select
                    id="selectedClients"
                    multiple
                    className="dual-list-select"
                  >
                    {selectedClients
                      .filter((c) => c)
                      .map((c) => (
                        <option key={c?._id} value={c?._id}>
                          {c?.companyName}
                          {/* {c?._id} */}
                        </option>
                      ))}
                  </Form.Select>
                </Card>
              </Col>
            </Row>

            <div className="form-actions d-flex justify-content-end">
              <Button
                type="button"
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowForm(false);
                  setIsEditing(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="primary">
                {isEditing ? "Update User" : "Save User"}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {/* Users List Table */}
      {!showForm && (
        <Card className="user-card">
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <Table responsive bordered hover className="list-table">
              <thead className="table-secondary">
                <tr>
                  <th>Name</th>
                  <th>Email ID</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Contact No</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={6}>No data found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div className="info">
                          <img
                            src={
                              user.profileImage
                                ? `${import.meta.env.VITE_API_URL}/${user.profileImage.replace(
                                    /\\/g,
                                    "/",
                                  )}`
                                : ""
                            }
                            alt={user.name}
                            className="user-avatar"
                          />
                          <div className="user-details">
                            <span className="user-name">{user.name}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || "N/A"}</td>
                      <td>{user.roleId?.name || "N/A"}</td>
                      <td>{user.branch?.branchName || "N/A"}</td>
                      <td>{user.contactNo || "N/A"}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn view"
                            onClick={() => handleView(user)}
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(user)}
                            title="Edit"
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(user._id)}
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

export default UserPage;
