import React, { useState, useEffect } from 'react'
import axios from 'axios'
import SearchPanel from '../../utils/FilterPanel'
import { FaPen, FaTrashAlt, FaEye, FaPlus, FaSearch } from 'react-icons/fa' // Added FaPlus, FaSearch
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
} from 'react-bootstrap'
import defaultImg from './download.jfif'

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const UserPage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)

  // Dropdown and Form state
  const [roles, setRoles] = useState([])
  const [companies, setCompanies] = useState([])
  const [clients, setClients] = useState([])
  const [sites, setSites] = useState([])
  const [branches, setBranches] = useState([])
  const [profileImageFile, setProfileImageFile] = useState(null)
  const initialFormData = {
    first_name: '',
    last_name: '',
    fullname: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    address: '',
    city: '',
    pincode: '',
    company_id: '',
    branch_id: '',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [viewUser, setViewUser] = useState(null) // For the view modal

  // Dual list box state
  const [availableClients, setAvailableClients] = useState([])
  const [selectedClients, setSelectedClients] = useState([])

  // Search Panel State
  const [searchFields, setSearchFields] = useState([
    { field: 'name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const userSearchOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'contactNo', label: 'Contact No' },
  ]

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  }

  // --- Data Fetching ---
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch)
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }
      const res = await axios.get(`${API_BASE_URL}/users`, {
        params,
        ...getAuthHeaders(),
      })
      setUsers(res.data)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to load branches.')
      // console.error("Failed to fetch users", error);
    } finally {
      setLoading(false)
    }
  }

  // Single useEffect for all initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const companiesRes = await axios.get(
          `${API_BASE_URL}/companies`,
          getAuthHeaders(),
        )

        console.log('companiesRes', companiesRes.data)

        const rolesRes = await axios.get(
          `${API_BASE_URL}/users/roles`,
          getAuthHeaders(),
        )

        console.log('rolesRes', rolesRes.data)

        const clientsRes = await axios.get(
          `${API_BASE_URL}/clients`,
          getAuthHeaders(),
        )

        console.log('clientsRes', clientsRes.data)

        setCompanies(companiesRes.data)
        setRoles(rolesRes.data)
        setClients(clientsRes.data.data)
        setAvailableClients(clientsRes.data.data)
      } catch (error) {
        console.log('FULL ERROR =>', error)

        console.log('ERROR RESPONSE =>', error.response)

        console.log('ERROR DATA =>', error.response?.data)

        console.log('ERROR STATUS =>', error.response?.status)

        setError('Failed to fetch dropdown data')
      } finally {
        await fetchUsers()
      }
    }
    fetchInitialData()
    // console.log(clients, availableClients);
  }, [])

  // Fetch branches only when the selected company changes
  useEffect(() => {
    if (formData.company) {
      const fetchBranches = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/branches/by-company/${formData.company}`,
            getAuthHeaders(),
          )

          setBranches(res.data)
        } catch (error) {
          console.error('Failed to fetch branches', error)
          setBranches([])
        }
      }

      fetchBranches()
    } else {
      setBranches([])
    }
  }, [formData.company])
  // --- Form Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target

    let updatedData = {
      ...formData,
      [name]: value,
    }

    // Auto generate fullname
    if (name === 'first_name' || name === 'last_name') {
      updatedData.fullname =
        `${updatedData.first_name} ${updatedData.last_name}`.trim()
    }

    setFormData(updatedData)

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    setProfileImageFile(e.target.files[0])
    setLogoPreview(file ? URL.createObjectURL(file) : null)
  }
  const resetForm = () => {
    setFormData(initialFormData)
    setIsEditing(null)
    setLogoPreview(null)
    setValidationErrors({})
    setSelectedClients([])
    setProfileImageFile(null)
    setAvailableClients(clients)
  }

  const validateForm = () => {
    const newErrors = {}

    // Full Name
    if (!formData.fullname.trim()) {
      newErrors.fullname = 'Full name is required'
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    // Password
    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required'
    }

    // Phone
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Contact number must be 10 digits'
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    // Company
    if (!formData.company_id) {
      newErrors.company_id = 'Company is required'
    }

    // Branch
    if (!formData.branch_id) {
      newErrors.branch_id = 'Branch is required'
    }

    // Pincode
    const pincodeRegex = /^[1-9][0-9]{5}$/

    if (formData.pincode && !pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = 'Please enter valid 6 digit pincode'
    }

    setValidationErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fix validation errors')
      return
    }

    try {
      const data = new FormData()

      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key])
      })

      if (profileImageFile) {
        data.append('profileImage', profileImageFile)
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...getAuthHeaders().headers,
        },
      }

      if (isEditing) {
        await axios.put(`${API_BASE_URL}/users/${isEditing.id}`, data, config)

        alert('User updated successfully')
      } else {
        await axios.post(`${API_BASE_URL}/users`, data, config)

        alert('User created successfully')
      }

      setShowForm(false)

      resetForm()

      fetchUsers()
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to save user')
    }
  }

  // === ACTION HANDLERS (UPDATED) ===
  const handleEdit = (user) => {
    setIsEditing(user)

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      fullname: user.fullname || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || '',
      address: user.address || '',
      city: user.city || '',
      pincode: user.pincode || '',
      company_id: user.company_id || '',
      branch_id: user.branch_id || '',
    })

    setLogoPreview(
      user.profile_image
        ? `${import.meta.env.VITE_API_URL}/${user.profile_image.replace(/\\/g, '/')}`
        : null,
    )

    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`${API_BASE_URL}/users/${id}`, getAuthHeaders())
        alert('User deleted successfully')
        fetchUsers()
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else alert('Failed to delete user')
        // console.error(error);
      }
    }
  }
  const handleView = (user) => setViewUser(user)

  // --- Search and Dual List Box Handlers ---
  const handleSearch = () => {
    fetchUsers()
  }

  useEffect(() => {
    fetchUsers()
  }, [searchFields, dateFilter])

  const resetSearch = () => {
    setSearchFields([{ field: 'email', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchUsers()
  }

  const handleDownloadExcel = async () => {
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch)

      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/export`,
        {
          params,
          responseType: 'blob', // IMPORTANT
          ...getAuthHeaders(),
        },
      )

      // Create Excel File
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `Users_${randomNumber}.xlsx`
      link.click()
    } catch (error) {
      // Axios sends 401 here
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      console.error('Excel download error:', error)
      alert('Failed to download Excel. Please try again.')
    }
  }

  const moveItems = (source, dest, setSource, setDest, itemIds) => {
    const itemsToMove = source.filter((item) => itemIds.includes(item._id))
    const remainingSource = source.filter((item) => !itemIds.includes(item._id))
    setSource(remainingSource)
    setDest(
      [...dest, ...itemsToMove].sort((a, b) =>
        a.companyName.localeCompare(b.companyName),
      ),
    )
  }
  const handleSelectClients = (all = false) => {
    const selectedIds = all
      ? availableClients.map((c) => c._id)
      : Array.from(
          document.getElementById('availableClients').selectedOptions,
        ).map((opt) => opt.value)
    moveItems(
      availableClients,
      selectedClients,
      setAvailableClients,
      setSelectedClients,
      selectedIds,
    )
  }
  const handleDeselectClients = (all = false) => {
    const selectedIds = all
      ? selectedClients.map((c) => c._id)
      : Array.from(
          document.getElementById('selectedClients').selectedOptions,
        ).map((opt) => opt.value)
    moveItems(
      selectedClients,
      availableClients,
      setSelectedClients,
      setAvailableClients,
      selectedIds,
    )
  }

  // === FETCH SITES BY SELECTED CLIENTS ===
  const fetchSitesByClientIds = async (selectedClientList) => {
    if (!selectedClientList || selectedClientList.length === 0) {
      console.log('No clients selected for site fetch.')
      return []
    }

    try {
      const clientIds = selectedClientList.map((c) => ({ $oid: c._id }))
      const res = await axios.post(
        `${API_BASE_URL}/clients/sites/by-client-ids`,
        { clientIds },
        getAuthHeaders(),
      )
      // console.log("Fetched Sites:", res.data.data);
      return res.data.data
    } catch (error) {
      console.error('Failed to fetch sites by client IDs:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return []
    }
  }

  // Inside handleSelectClients or handleDeselectClients
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sites = await fetchSitesByClientIds(selectedClients)
        // console.log("Sites for selected clients:", sites);
        setSites(sites)
      } catch (error) {
        console.error('Failed to fetch sites by client IDs:', error)
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
    }

    if (selectedClients.length > 0) {
      fetchSites()
    }
  }, [selectedClients])

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
                <strong>Name:</strong> {viewUser.first_name}{' '}
                {viewUser.last_name}
              </p>
              <p>
                <strong>Email:</strong> {viewUser.email}
              </p>
              <p>
                <strong>Role:</strong> {viewUser.role || 'N/A'}
              </p>
              <p>
                <strong>Company:</strong>{' '}
                {viewUser.company_name_actual || 'N/A'}
              </p>
              <p>
                <strong>Branch:</strong> {viewUser.branch_name_actual || 'N/A'}
              </p>

              {viewUser.profileImage && (
                <div className="text-center mt-3">
                  <Image
                    src={`${import.meta.env.VITE_API_URL}/${viewUser.profileImage.replace(
                      /\\/g,
                      '/',
                    )}`}
                    alt={viewUser.name}
                    roundedCircle
                    fluid
                    style={{
                      width: '120px',
                      height: '120px',
                      objectFit: 'cover',
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
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              resetForm()
              setIsEditing(null)
              setShowForm(true)
              setShowSearch(false)
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
              'Create New User'
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
                    value={formData.fullname || ''}
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
                    value={formData.email || ''}
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
                    {isEditing ? 'New password (optional)' : 'Password *'}
                  </Form.Label>
                  <Form.Control
                    name="password"
                    placeholder={
                      isEditing ? 'Enter new password (optional)' : 'Password'
                    }
                    type="password"
                    value={formData.password || ''}
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
                    name="phone"
                    placeholder="Contact No"
                    value={formData.phone || ''}
                    isInvalid={!!validationErrors.phone}
                    onChange={handleInputChange}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="address">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    name="address"
                    as={'textarea'}
                    placeholder="Address"
                    value={formData.address || ''}
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
                    value={formData.city || ''}
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
                    value={formData.pincode || ''}
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
                    name="role"
                    value={formData.role || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.role}
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.role_name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.role}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="company">
                  <Form.Label>Company *</Form.Label>
                  <Form.Select
                    name="company"
                    value={formData.company_id || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.company_id}
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name}
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
                    value={formData.branch_id || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.branch_id}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branch_name}
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
                      width: '180px',
                      height: '200px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
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
                      <option key={c.id} value={c.id}>
                        {c.company_name}
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
                        <option key={c?.id} value={c?.id}>
                          {c?.company_name}
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
                  setShowForm(false)
                  setIsEditing(null)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="primary">
                {isEditing ? 'Update User' : 'Save User'}
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
                    <tr key={user.id}>
                      <td>
                        <div className="info">
                          <img
                            src={
                              user.profile_image
                                ? `${import.meta.env.VITE_API_URL}/${user.profile_image.replace(
                                    /\\/g,
                                    '/',
                                  )}`
                                : defaultImg
                            }
                            alt={user.first_name}
                            className="user-avatar"
                            onError={(e) => {
                              e.target.src = defaultImg
                            }}
                          />
                          <div className="user-details">
                            <span className="user-name">
                              {user.first_name} {user.last_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{user.email || 'N/A'}</td>
                      <td>{user.role_name || 'N/A'}</td>
                      <td>{user.branch_name || 'N/A'}</td>
                      <td>{user.phone || 'N/A'}</td>
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
                            onClick={() => handleDelete(user.id)}
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
  )
}

export default UserPage
