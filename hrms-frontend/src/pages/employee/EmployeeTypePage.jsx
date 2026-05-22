// src/pages/EmployeeTypePage.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'

import FilterPanel from '../../utils/FilterPanel'
import { FaPen, FaSearch, FaTrashAlt } from 'react-icons/fa'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function EmployeeTypePage() {
  const token = localStorage.getItem('token')
  const [employeeTypes, setEmployeeTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [input, setInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editInput, setEditInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const [searchFields, setSearchFields] = useState([
    { field: 'emp_type', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })
  const searchOptions = [{ value: 'emp_type', label: 'Employee Type' }]

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token')
    if (!token) return {}
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  const fetchTypes = async () => {
    setLoading(true)
    setError(null)

    try {
      let params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch)
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }
      const { data } = await axios.get(`${API_URL}/api/employee-types`, {
        params,
        ...getAuthHeaders(),
      })
      // console.log(data);
      setEmployeeTypes(data)
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        setError(e.response?.data?.message || 'Failed to fetch Employee types.')
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    try {
      await axios.post(
        `${API_URL}/api/employee-types`,
        { emp_type: input },
        getAuthHeaders(),
      )
      setInput('')
      fetchTypes()
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else
        alert(error.response?.data?.message || 'Failed to add employee type.')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee type?')) {
      try {
        await axios.delete(`${API_URL}/api/employee-types/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (e) {
        if (e.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else
          alert(
            `Error: ${
              e.response?.data?.message || 'Failed to delete employee type.'
            }`,
          )
      }
    }
    fetchTypes()
  }

  const handleEdit = (id, name) => {
    setEditingId(id)
    setEditInput(name)
  }

  const handleUpdate = async (id) => {
    if (!editInput.trim()) return
    try {
      await axios.put(
        `${API_URL}/api/employee-types/${id}`,
        { emp_type: editInput },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setEditingId(null)
      setEditInput('')
      fetchTypes()
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else
        alert(
          error.response?.data?.message || 'Failed to update employee type.',
        )
    }
  }

  const handleSearch = () => {
    fetchTypes()
  }

  useEffect(() => {
    fetchTypes()
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

      const response = await axios.get(`${API_URL}/api/employee-types/export`, {
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
      link.download = `EmployeeTypes_${randomNumber}.xlsx`
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

  const handleReset = () => {
    setSearchFields([{ field: 'name', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchTypes()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Employee Type{' '}
          <span className="text-success">({employeeTypes.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
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
          <Form className="emp-type-form" onSubmit={handleSubmit}>
            <Row className="align-items-end">
              <Col md={6} className="mb-3">
                <Form.Group controlId="emp-type">
                  <Form.Label className="emp-type-label">
                    Employee Type
                  </Form.Label>
                  <Form.Control
                    className="emp-type-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Employee Type"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="mb-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="emp-type-submit"
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
                    <th>EMPLOYEE TYPE</th>
                    <th>CREATED DETAIL</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeTypes.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={3}>No data found</td>
                    </tr>
                  ) : (
                    employeeTypes.map((et) => (
                      <tr key={et.id}>
                        <td>
                          {editingId === et.id ? (
                            <Col md={12}>
                              <Form.Control
                                value={editInput}
                                onChange={(e) => setEditInput(e.target.value)}
                                className="emp-type-input"
                                style={{ minWidth: 120 }}
                              />
                            </Col>
                          ) : (
                            et.emp_type
                          )}
                        </td>
                        <td>
                          {et.created_by ? et.created_by.name : ''}
                          <br />
                          {et.created_on &&
                            new Date(et.created_on).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="table-actions">
                            {editingId === et.id ? (
                              <>
                                <Button
                                  className="emp-type-cancel"
                                  variant="secondary"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="primary"
                                  className="emp-type-update edit"
                                  onClick={() => handleUpdate(et.id)}
                                >
                                  Update
                                </Button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="emp-type-edit icon-btn edit"
                                  onClick={() => handleEdit(et.id, et.emp_type)}
                                >
                                  <FaPen />
                                </button>
                                <button
                                  className="icon-btn delete"
                                  onClick={() => handleDelete(et.id)}
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
  )
}
