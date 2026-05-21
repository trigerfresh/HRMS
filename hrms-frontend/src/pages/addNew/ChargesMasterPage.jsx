import React, { useEffect, useState } from 'react'
import axios from 'axios'
import FilterPanel from '../../utils/FilterPanel'
import { FaPen, FaPlus, FaSearch, FaTrashAlt } from 'react-icons/fa'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_URL = `${API_URL}/api/charges`

// Auth helper function
const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    window.location.href = '/login'
    return {}
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

export default function ChargesMasterPage() {
  const [charges, setCharges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCharge, setEditingCharge] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [showSearchPanel, setShowSearchPanel] = useState(false)

  const initialFormData = {
    charges_master: '',
    label_display: '',
  }
  const [formData, setFormData] = useState(initialFormData)
  const [searchFields, setSearchFields] = useState([
    { field: 'charges_master', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  // Search options
  const searchOptions = [
    { value: 'charges_master', label: 'Charges Type' },
    { value: 'label_display', label: 'Label to display' },
  ]
  // Fetch charges with authentication
  const fetchCharges = async () => {
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

      const { data } = await axios.get(API_BASE_URL, {
        params,
        ...getAuthHeaders(),
      })
      setCharges(data.data || data)
    } catch (error) {
      setError('Failed to fetch charges. Please check your authentication.')
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCharges()
  }, [])

  const handleSearch = () => fetchCharges()

  const handleReset = () => {
    setSearchFields([{ field: 'changes_master', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchCharges()
  }

  useEffect(() => {
    fetchCharges()
  }, [searchFields, dateFilter])

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

      const response = await axios.get(`${API_BASE_URL}/export`, {
        params,
        responseType: 'blob', // IMPORTANT
        ...getAuthHeaders(),
      })

      // Create Excel File
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = `ChargesType_${randomNumber}.xlsx`
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

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    const key = name
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({
        ...prev,
        [key]: '',
      }))
    }
  }

  // const handleNestedChange = (parent, field, value) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [parent]: {
  //       ...prev[parent],
  //       [field]: value,
  //     },
  //   }));
  // };

  const resetForm = () => {
    setEditingCharge(null)
    setFormData(initialFormData)
    setValidationErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.charges_master.trim()) {
      alert('Please fix the validation error.')
      setValidationErrors((prev) => ({
        ...prev, // keep existing errors
        charges_master: 'Charges type is required', // add/update this field's error
      }))
      return
    }
    try {
      if (editingCharge) {
        await axios.put(
          `${API_BASE_URL}/${editingCharge.id}`,
          formData,
          getAuthHeaders(),
        )
        alert('Charge updated successfully!')
      } else {
        await axios.post(API_BASE_URL, formData, getAuthHeaders())
        alert('Charge created successfully!')
      }
      setShowForm(false)
      resetForm()
      fetchCharges()
    } catch (error) {
      // console.error("Error saving charge:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert(
          `Error: ${error.response?.data?.message || 'Failed to save charge.'}`,
        )
      }
    }
  }

  const handleEdit = (charge) => {
    setEditingCharge(charge)

    setFormData({
      charges_master: charge.charges_master || '',
      label_display: charge.label_display || '',
    })

    setShowSearchPanel(false)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this charge?')) return
    try {
      await axios.delete(`${API_BASE_URL}/${id}`, getAuthHeaders())
      alert('Charge deleted successfully!')
      fetchCharges()
    } catch (error) {
      // console.error("Error deleting charge:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert('Failed to delete charge.')
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Charges Master{' '}
          <span className="text-success">({charges.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => {
              setShowSearchPanel(!showSearchPanel)
            }}
          >
            <FaSearch />{' '}
            <span>{showSearchPanel ? 'Hide Search' : 'Search'}</span>
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setShowSearchPanel(false)
              resetForm()
              setShowForm(true)
            }}
          >
            <FaPlus />
            <span>Add New</span>
          </button>
        </div>
      </div>

      {showSearchPanel && (
        <div id="charges-search-panel">
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
        </div>
      )}

      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {editingCharge ? (
              <span>Edit Charge - {editingCharge.charges_master}</span>
            ) : (
              'Add New Charge'
            )}
          </h2>

          <Form onSubmit={handleSubmit} className="charges-master-form">
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group controlId="charges_master">
                  <Form.Label>Charges Type *</Form.Label>
                  <Form.Control
                    name="charges_master"
                    value={formData.charges_master}
                    onChange={handleChange}
                    placeholder="Charges Type"
                    isInvalid={!!validationErrors.charges_master}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.charges_master}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6} className="mb-3">
                <Form.Group controlId="label_display">
                  <Form.Label>Label to display</Form.Label>
                  <Form.Control
                    name="label_display"
                    value={formData.label_display}
                    onChange={handleChange}
                    placeholder="Label to display"
                  />
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
                {editingCharge ? 'Update' : 'Submit'}
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
                  <th>Sr No.</th>
                  <th>Charges Type</th>
                  <th>Label to display</th>
                  <th>Created Detail</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {charges.length > 0 ? (
                  charges.map((charge, index) => (
                    <tr key={charge.id}>
                      <td>{index + 1}</td>
                      <td>{charge.charges_master || ''}</td>
                      <td>{charge.label_display || ''}</td>
                      <td>
                        {charge.created_on
                          ? (() => {
                              const date = new Date(charge.created_on)

                              return isNaN(date.getTime())
                                ? charge.created_on
                                : date.toLocaleDateString('en-GB')
                            })()
                          : ''}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(charge)}
                            title="Edit Charge"
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(charge.id)}
                            title="Delete Charge"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="text-center">
                    <td colSpan={4}>No data found</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  )
}
