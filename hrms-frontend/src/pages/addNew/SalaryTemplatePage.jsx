import React, { useEffect, useState } from 'react'
import axios from 'axios'
import FilterPanel from '../../utils/FilterPanel'
import {
  FaPen,
  FaMinus,
  FaPlus,
  FaSearch,
  FaTrash,
  FaTrashAlt,
} from 'react-icons/fa'
import { Button, Card, Col, Form, Row, Table } from 'react-bootstrap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_URL = `${API_URL}/api/salary-templates`

export default function SalaryTemplatePage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const initialFormData = {
    templateName: '',
    rank: '',

    grossSalary: '',
    basicSalary: '',
    perDaySalary: '',
    hra: '',

    earnings: [
      {
        name: '',
        rate: '',
        amount: '',
        from: '',
        to: '',
        calculateOn: '',
        select: '',
        compare: '',
      },
    ],

    deductions: [
      {
        name: '',
        rate: '',
        amount: '',
        from: '',
        to: '',
        calculateOn: '',
        select: '',
        compare: '',
      },
    ],
  }
  const [formData, setFormData] = useState(initialFormData)

  const [searchFields, setSearchFields] = useState([
    { field: 'templateName', keyword: '' },
  ])

  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  // Auth helper function (inline)
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

  // Search options
  const searchOptions = [
    { value: 'templateName', label: 'Template Name' },
    { value: 'rank', label: 'Rank' },
    { value: 'grossSalary', label: 'Gross Salary' },
    { value: 'basicSalary', label: 'Basic Salary' },
  ]

  // Fetch salary templates with authentication
  const fetchTemplates = async () => {
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
      setTemplates(data.data || data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      setError('Failed to fetch templates. Please check your authentication.')
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSearch = () => fetchTemplates()
  const handleReset = () => {
    setSearchFields([{ field: 'templateName', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchTemplates()
  }

  // Add/Remove rows for earnings and deductions
  const addEarningRow = () =>
    setFormData({
      ...formData,
      earnings: [
        ...formData.earnings,
        {
          name: '',
          rate: '',
          amount: '',
          from: '',
          to: '',
          calculateOn: '',
          select: '',
          compare: '',
        },
      ],
    })

  const addDeductionRow = () =>
    setFormData({
      ...formData,
      deductions: [
        ...formData.deductions,
        {
          name: '',
          rate: '',
          amount: '',
          from: '',
          to: '',
          calculateOn: '',
          select: '',
          compare: '',
        },
      ],
    })

  const removeEarningRow = (idx) =>
    setFormData({
      ...formData,
      earnings: formData.earnings.filter((_, i) => i !== idx),
    })

  const removeDeductionRow = (idx) =>
    setFormData({
      ...formData,
      deductions: formData.deductions.filter((_, i) => i !== idx),
    })

  // Handle input changes
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleRowChange = (arr, idx, field, value) => {
    const updated = [...formData[arr]]
    updated[idx][field] = value
    setFormData({ ...formData, [arr]: updated })
  }

  // Calculate per day salary
  useEffect(() => {
    if (formData.grossSalary) {
      const gross = parseFloat(formData.grossSalary) || 0
      const perDay = gross / 30
      setFormData((prev) => ({ ...prev, perDaySalary: perDay.toFixed(2) }))
    }
  }, [formData.grossSalary])

  const resetForm = () => {
    setEditingTemplate(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        template_name: formData.templateName,
        rank: formData.rank,

        gross_salary: formData.grossSalary,
        gross_salary_type: 'Monthly',

        basic_salary: formData.basicSalary,
        basic_salary_type: 'Monthly',

        perday_salary: formData.perDaySalary,

        hra: formData.hra,

        earnings: formData.earnings.map((e) => ({
          earning_name: e.name,
          earning_rate: e.rate,
          earning_amount: e.amount,
          ea_from_date: e.from,
          ea_to_date: e.to,
          ea_calculateon: e.calculateOn,
          ea_operator: e.select,
          ea_comp_operator: e.compare,
        })),

        deductions: formData.deductions.map((d) => ({
          deduction_name: d.name,
          deduction_rate: d.rate,
          deduction_amount: d.amount,
          from_date: d.from,
          to_date: d.to,
          dd_calculateon: d.calculateOn,
          dd_operator: d.select,
          dd_comp_operator: d.compare,
        })),
      }

      if (editingTemplate) {
        await axios.put(
          `${API_BASE_URL}/${editingTemplate.id}`,
          payload,
          getAuthHeaders(),
        )

        alert('Template updated successfully!')
      } else {
        await axios.post(API_BASE_URL, payload, getAuthHeaders())

        alert('Template created successfully!')
      }

      setShowForm(false)
      resetForm()
      fetchTemplates()
    } catch (error) {
      console.error(error)

      alert(error.response?.data?.message || 'Failed to save template')
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      templateName: template.template_name || '',
      rank: template.rank || '',
      grossSalary: template.gross_salary || '',
      basicSalary: template.basic_salary || '',
      perDaySalary: template.perday_salary || '',
      hra: template.hra || '',
      earnings:
        template.earnings?.map((e) => ({
          name: e.earning_name || '',
          rate: e.earning_rate || '',
          amount: e.earning_amount || '',
          from: e.ea_from_date || '',
          to: e.ea_to_date || '',
          calculateOn: e.ea_calculateon || '',
          select: e.ea_operator || '',
          compare: e.ea_comp_operator || '',
        })) || [],

      deductions:
        template.deductions?.map((d) => ({
          name: d.deduction_name || '',
          rate: d.deduction_rate || '',
          amount: d.deduction_amount || '',
          from: d.from_date || '',
          to: d.to_date || '',
          calculateOn: d.dd_calculateon || '',
          select: d.dd_operator || '',
          compare: d.dd_comp_operator || '',
        })) || [],
    })
    setShowForm(true)
    setShowSearch(false) // Hide search panel when editing
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?'))
      return
    try {
      await axios.delete(`${API_BASE_URL}/${id}`, getAuthHeaders())
      alert('Template deleted successfully!')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert('Failed to delete template.')
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
          Salary Template{' '}
          <span className="text-success">({templates.length})</span>
        </h1>
        <div className="page-actions">
          <button
            className="search-btn" // Changed class name
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>

          <button
            className="btn-primary"
            onClick={() => {
              setShowSearch(false)
              resetForm()
              setShowForm(true)
            }}
          >
            <FaPlus /> Add New
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showSearch && (
        <div id="salary-search-panel">
          <FilterPanel
            searchFields={searchFields}
            setSearchFields={setSearchFields}
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
            onSearch={handleSearch}
            onReset={handleReset}
            onDownloadExcel={() => window.open(`${API_BASE_URL}/export`)}
            searchOptions={searchOptions}
          />
        </div>
      )}

      {showForm ? (
        <Card>
          <h2 className="card-header mb-4">
            {editingTemplate ? (
              <span>Edit Salary Template - {formData.templateName}</span>
            ) : (
              'Add New Salary Template'
            )}
          </h2>

          <Form onSubmit={handleSubmit} className="salary-template-form">
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="templateName">
                  <Form.Label>Template Name *</Form.Label>
                  <Form.Control
                    name="templateName"
                    value={formData.templateName}
                    onChange={handleChange}
                    placeholder="Template Name"
                    isInvalid={!!validationErrors.templateName}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.templateName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="rank">
                  <Form.Label>Rank *</Form.Label>
                  <Form.Control
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    placeholder="Rank"
                    isInvalid={!!validationErrors.rank}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.rank}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="grossSalary">
                  <Form.Label>Gross Salary *</Form.Label>
                  <Form.Control
                    name="grossSalary"
                    type="number"
                    value={formData.grossSalary}
                    onChange={handleChange}
                    placeholder="Gross Salary"
                    isInvalid={!!validationErrors.grossSalary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.grossSalary}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="basicSalary">
                  <Form.Label>Basic Salary *</Form.Label>
                  <Form.Control
                    name="basicSalary"
                    type="number"
                    value={formData.basicSalary}
                    onChange={handleChange}
                    placeholder="Basic Salary"
                    isInvalid={!!validationErrors.basicSalary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.basicSalary}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="perDaySalary">
                  <Form.Label>Per Day Salary</Form.Label>
                  <Form.Control
                    name="perDaySalary"
                    type="number"
                    value={formData.perDaySalary}
                    onChange={handleChange}
                    placeholder="Per Day Salary"
                    readOnly
                    isInvalid={!!validationErrors.perDaySalary}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.perDaySalary}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-3">
                <Form.Group controlId="hra">
                  <Form.Label>HRA</Form.Label>
                  <Form.Control
                    name="hra"
                    type="number"
                    value={formData.hra}
                    onChange={handleChange}
                    placeholder="HRA"
                    isInvalid={!!validationErrors.hra}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.hra}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
            <div className="p-3 mb-3">
              <Row className="align-items-center text-center">
                <Col md={4} xs={12} sm={4} className="mb-2 mb-md-0 mb-sm-0">
                  <strong>Gross Salary:</strong> {formData.grossSalary || 0}
                </Col>

                <Col md={4} xs={12} sm={4} className="mb-2 mb-md-0 mb-sm-0">
                  <strong>Basic Salary:</strong> {formData.basicSalary || 0}
                </Col>

                <Col md={4} xs={12} sm={4} className="mb-2 mb-md-0 mb-sm-0">
                  <strong>Balance:</strong>{' '}
                  {(
                    parseFloat(formData.grossSalary || 0) -
                    parseFloat(formData.basicSalary || 0)
                  ).toFixed(2)}
                </Col>
              </Row>
            </div>
            <div>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-subtitle mt-3 mb-4">Earnings</h5>
                <Button
                  type="button"
                  className="d-flex align-items-center gap-2 add-earning-row"
                  onClick={addEarningRow}
                >
                  <FaPlus />
                  <span>Add Earning Row</span>
                </Button>
              </div>
              <Table hover bordered responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Name</th>
                    <th>Rate (%)</th>
                    <th>Amount</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Calculate On</th>
                    <th>Select</th>
                    <th>Amount to Compare (enter two values with '-')</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.earnings.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <Form.Select
                          value={row.name}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'name',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="Basic">Basic</option>
                          <option value="HRA">HRA</option>
                          <option value="DA">DA</option>
                          <option value="Conveyance">Conveyance</option>
                          <option value="Medical">Medical</option>
                          <option value="Special Allowance">
                            Special Allowance
                          </option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          placeholder="Rate (%)"
                          value={row.rate}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'rate',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          placeholder="Amount"
                          value={row.amount}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'amount',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="date"
                          value={row.from}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'from',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="date"
                          value={row.to}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'to',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Select
                          value={row.calculateOn}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'calculateOn',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="Gross">Gross Salary</option>
                          <option value="Basic">Basic Salary</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select
                          value={row.select}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'select',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="Fixed">Fixed</option>
                          <option value="Percentage">Percentage</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          placeholder="Amount to compare"
                          value={row.compare}
                          onChange={(e) =>
                            handleRowChange(
                              'earnings',
                              idx,
                              'compare',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn delete"
                            onClick={() => removeEarningRow(idx)}
                            title="Delete"
                          >
                            <FaMinus />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-subtitle mt-3 mb-4">Deductions</h5>
                <Button
                  type="button"
                  className="d-flex align-items-center gap-2 add-deduction-row"
                  onClick={addDeductionRow}
                >
                  <FaPlus />
                  <span>Add Deduction Row</span>
                </Button>
              </div>

              <Table hover bordered responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Name</th>
                    <th>Rate(%)</th>
                    <th>Amount</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Calculate On</th>
                    <th>Select</th>
                    <th>Amount to compare (enter two values with '-')</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.deductions.map((row, idx) => (
                    <tr key={idx}>
                      <td>
                        <Form.Select
                          value={row.name}
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'name',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="PF">PF</option>
                          <option value="ESIC">ESIC</option>
                          <option value="Professional Tax">
                            Professional Tax
                          </option>
                          <option value="TDS">TDS</option>
                          <option value="Loan">Loan</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={row.rate}
                          placeholder="Rate (%)"
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'rate',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          value={row.amount}
                          placeholder="Amount"
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'amount',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="date"
                          value={row.from}
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'from',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="date"
                          value={row.to}
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'to',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <Form.Select
                          value={row.calculateOn}
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'calculateOn',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="Gross">Gross Salary</option>
                          <option value="Basic">Basic Salary</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Select
                          value={row.select}
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'select',
                              e.target.value,
                            )
                          }
                        >
                          <option value="">Select</option>
                          <option value="Fixed">Fixed</option>
                          <option value="Percentage">Percentage</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          value={row.compare}
                          placeholder="Amount to compare"
                          onChange={(e) =>
                            handleRowChange(
                              'deductions',
                              idx,
                              'compare',
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="icon-btn delete"
                            title="Delete"
                            onClick={() => removeDeductionRow(idx)}
                          >
                            <FaMinus />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="form-actions d-flex justify-content-end">
              <Button
                type="button"
                variant="secondary"
                className="me-2"
                onClick={() => handleCancel()}
              >
                Cancel
              </Button>
              <Button type="submit" className="primary">
                {editingTemplate ? 'Update' : 'Submit'}
              </Button>
            </div>
          </Form>
        </Card>
      ) : (
        <Card>
          <div className="table-responsive">
            {loading ? (
              <div className="loading-cell">Loading templates...</div>
            ) : (
              <Table hover bordered responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Sr No.</th>
                    <th>Template Name</th>
                    <th>Rank</th>
                    <th>Gross Salary</th>
                    <th>Basic Salary</th>
                    <th>Per day salary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.length > 0 ? (
                    templates.map((template, index) => (
                      <tr key={template.id}>
                        <td>{index + 1}</td>
                        <td>{template.template_name || '-'}</td>
                        <td>{template.rank || '-'}</td>
                        <td>
                          {template.gross_salary
                            ? `${template.gross_salary} Per month`
                            : '-'}
                        </td>
                        <td>
                          {template.basic_salary
                            ? `${template.basic_salary} (Rs.)`
                            : '-'}
                        </td>
                        <td>{template.perday_salary || '-'}</td>
                        <td className="table-actions">
                          <button
                            className="icon-btn edit"
                            onClick={() => handleEdit(template)}
                            title="Edit Template"
                          >
                            <FaPen />
                          </button>
                          <button
                            className="icon-btn delete"
                            onClick={() => handleDelete(template.id)}
                            title="Delete Template"
                          >
                            <FaTrashAlt />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="no-data-cell">
                        No templates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
