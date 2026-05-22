import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { FaPen, FaPlus, FaSearch, FaTrashAlt } from 'react-icons/fa'
import FilterPanel from '../../utils/FilterPanel'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_URL = `${API_URL}/api`

const VendorsMaster = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const initialFormData = {
    vendor_name: '',
    email_id: '',
    phone: '',
    address: '',
    state: '',
    statecode: '',
    contactable_person: '',
    pancard_no: '',
    gst_no: '',
    ac_no: '',
    bank_name: '',
    ifsc_code: '',
    branch_name: '',
  }
  const [formData, setFormData] = useState(initialFormData)

  const [searchFields, setSearchFields] = useState([
    { field: 'vendor_name', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const searchOptions = [
    { value: 'vendor_name', label: 'Vendor Name' },
    { value: 'email_id', label: 'Email ID' },
    { value: 'phone', label: 'Contact No' },
  ]

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No token found in localStorage')
      return {}
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }

  const fetchVendors = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const validSearchFields = searchFields.filter((f) => f.field && f.keyword)
      if (validSearchFields.length > 0) {
        params.searchFields = JSON.stringify(validSearchFields)
      }
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }
      const res = await axios.get(`${API_BASE_URL}/vendors-master`, {
        params,
        ...getAuthHeaders(),
      })
      setVendors(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to load vendors.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchVendors()
  }

  useEffect(() => {
    fetchVendors()
  }, [searchFields, dateFilter])

  const resetSearch = () => {
    setSearchFields([{ field: 'email', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchVendors()
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setIsEditing(null)
    setValidationErrors({})
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target

    setFormData({ ...formData, [name]: value })

    const key = name
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: '',
      }))
    }
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
        `${API_BASE_URL}/vendors-master/export`,
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
      link.download = `Vendors_${randomNumber}.xlsx`
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

  const handleEdit = (vendor) => {
    setIsEditing(vendor)
    setValidationErrors({})
    setFormData({
      vendor_name: vendor.vendor_name || '',
      email_id: vendor.email_id || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      state: vendor.state || '',
      statecode: vendor.statecode || '',
      contactable_person: vendor.contactable_person || '',
      pancard_no: vendor.pancard_no || '',
      gst_no: vendor.gst_no || '',
      ac_no: vendor.ac_no || '',
      bank_name: vendor.bank_name || '',
      ifsc_code: vendor.ifsc_code || '',
      branch_name: vendor.branch_name || '',
    })
    setShowForm(true)
    setShowSearch(false)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/vendors-master/${id}`,
          getAuthHeaders(),
        )
        alert('Vendor deleted successfully!')
        fetchVendors()
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else alert('Failed to delete vendor!')
        // console.error(error);
      }
    }
  }

  const isValidPhone = (phone) => /^\d{10}$/.test(phone)
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPAN = (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)
  const isValidBankAccount = (acc) => /^[0-9]{6,18}$/.test(acc)
  const isValidIFSC = (ifsc) => /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

  const validateForm = () => {
    const errors = {}

    if (!formData.vendor_name.trim()) {
      errors.vendor_name = 'Vendor/Company Name is required'
    }

    if (formData.email_id && !isValidEmail(formData.email_id)) {
      errors.email_id = 'Invalid email address'
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      errors.phone = 'Invalid Contact No'
    }

    if (!formData.statecode.trim()) {
      errors.statecode = 'State Code is required'
    }

    if (formData.statecode && isNaN(formData.statecode)) {
      errors.statecode = 'State Code must be numeric'
    }

    if (formData.pancard_no && !isValidPAN(formData.pancard_no.toUpperCase())) {
      errors.pancard_no = 'Invalid PAN format'
    }

    if (formData.gst_no && !gstRegex.test(formData.gst_no)) {
      errors.gst_no = 'Invalid GST format'
    }

    if (formData.ac_no && !isValidBankAccount(formData.ac_no)) {
      errors.ac_no = 'Account number must be 6-18 digits'
    }

    if (formData.ifsc_code && !isValidIFSC(formData.ifsc_code)) {
      errors.ifsc_code = 'Invalid IFSC Code'
    }

    setValidationErrors(errors)

    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fix the validation errors before submitting.')
      return
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders().headers,
        },
      }
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/vendors-master/${isEditing.id}`,
          formData,
          config,
        )
        alert('Vendor updated successfully!')
      } else {
        const res = await axios.post(
          `${API_BASE_URL}/vendors-master/`,
          formData,
          config,
        )
        // console.log(res.data);
        alert('Vendor added successfully!')
      }
      resetForm()
      setShowForm(false)
      fetchVendors()
    } catch (err) {
      console.log(err)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || 'Server error'}`,
        )
        setError(
          `Operation failed: ${err.response?.data?.message || 'Server error'}`,
        )
      }
    }
  }
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Vendors <span className="text-success">({vendors.length})</span>
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
          onReset={resetSearch}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}

      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Vendor - {isEditing.vendor_name}</span>
            ) : (
              'Add New Vendor'
            )}
          </h2>
          {Object.keys(validationErrors).length > 0 && (
            <Alert variant="danger">
              Please fix the validation errors below.
            </Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="vendorName">
                  <Form.Label>Vendor/Company Name *</Form.Label>
                  <Form.Control
                    name="vendor_name"
                    placeholder="Enter vendor/company name"
                    value={formData.vendor_name || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.vendor_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.vendor_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="emailId">
                  <Form.Label>Email ID</Form.Label>
                  <Form.Control
                    name="email_id"
                    placeholder="Enter email ID"
                    value={formData.email_id || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.email_id}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactNo">
                  <Form.Label>Contact No</Form.Label>
                  <Form.Control
                    name="phone"
                    placeholder="Enter contact No"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.phone}
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
                    placeholder="Enter address"
                    value={formData.address || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.address}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.address}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="state">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    name="state"
                    placeholder="Enter state"
                    value={formData.state || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.state}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.state}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="stateCode">
                  <Form.Label>State Code *</Form.Label>
                  <Form.Control
                    name="statecode"
                    placeholder="Enter state code"
                    value={formData.statecode || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.statecode}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.statecode}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="contactable_person">
                  <Form.Label>Contactable Person Name</Form.Label>

                  <Form.Control
                    name="contactable_person"
                    placeholder="Enter contactable person name"
                    value={formData.contactable_person || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.contactable_person}
                  />

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.contactable_person}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="pancard_no">
                  <Form.Label>Pan Card No</Form.Label>

                  <Form.Control
                    name="pancard_no"
                    placeholder="Enter PAN Card No"
                    value={formData.pancard_no || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.pancard_no}
                  />

                  <Form.Control.Feedback type="invalid">
                    {validationErrors.pancard_no}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="gstNo">
                  <Form.Label>GST No</Form.Label>
                  <Form.Control
                    name="gst_no"
                    placeholder="Enter GST No"
                    value={formData.gst_no || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.gst_no}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.gst_no}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="accountNo">
                  <Form.Label>Account No</Form.Label>
                  <Form.Control
                    name="ac_no"
                    placeholder="Enter account no"
                    value={formData.ac_no || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.ac_no}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.ac_no}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="bankName">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    name="bank_name"
                    placeholder="Enter bank name"
                    value={formData.bank_name || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.bank_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.bank_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="ifscCode">
                  <Form.Label>IFSC Code</Form.Label>
                  <Form.Control
                    name="ifsc_code"
                    placeholder="Enter ifsc code"
                    value={formData.ifsc_code || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.ifsc_code}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.ifsc_code}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="branchName">
                  <Form.Label>Branch Name</Form.Label>
                  <Form.Control
                    name="branch_name"
                    placeholder="Enter branch name"
                    value={formData.branch_name || ''}
                    onChange={handleInputChange}
                    isInvalid={!!validationErrors.branch_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.branch_name}
                  </Form.Control.Feedback>
                </Form.Group>
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
                {isEditing ? 'Update Vendor' : 'Save Vendor'}
              </Button>
            </div>
          </Form>
        </Card>
      )}

      {!showForm && (
        <Card className="v-card">
          {loading ? (
            <Alert variant="warning" className="mb-0 text-center">
              Loading...
            </Alert>
          ) : error ? (
            <Alert variant="danger" className="mb-0 text-center">
              {error}
            </Alert>
          ) : (
            <Table hover bordered responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Vendor/Company Name</th>
                  <th>Contact No</th>
                  <th>Created Detail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={4}>No data found</td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v._id}>
                      <td>{v.vendor_name}</td>
                      <td>{v.phone}</td>
                      <td>
                        {v.created_by ? v.created_by.name : ''}
                        <br />
                        {v.created_on &&
                          new Date(v.created_on).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(v)}
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(v.id)}
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

export default VendorsMaster
