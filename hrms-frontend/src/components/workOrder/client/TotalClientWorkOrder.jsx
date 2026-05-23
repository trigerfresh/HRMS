import React from 'react'
import { useState } from 'react'
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa'
import FilterPanel from '../../../utils/FilterPanel'
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from 'react-bootstrap'
import Select from 'react-select'
import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  customSelectStyles,
  formatDateAndTime,
  formatDateForInput,
  formatDDMMYYYY,
} from '../../../utils/utils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const COMPANY_API = `${API_URL}/api/clients`
const API_BASE_URL = `${API_URL}/api`

const TotalClientWorkOrder = () => {
  const navigate = useNavigate()
  const [showPkgDetailModal, setShowPkgDetailModal] = useState(false)
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null)
  const [gangs, setGangs] = useState([])
  const [equipmentTypes, setEquipmentTypes] = useState([])
  const [companies, setCompanies] = useState([])
  const [workOrderTypes, setWorkOrderTypes] = useState([])
  const [clientWorkOrder, setClientWorkOrder] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  const initialFormData = {
    clientId: '',
    workOrderType: '',
    workOrderNo: '',
    workOrderDate: '',
    igmNo: '',
    importerName: '',
    chaName: '',
    vendor: '',
    totalCargoPkg: 0,
    totalCargoWgt: 0,
  }
  const [formData, setFormData] = useState(initialFormData)

  const [orderItems, setOrderItems] = useState([
    {
      itemNo: '',
      containerNo: '',
      size: '',
      vehichleNo: '',
      exam: '',
      remarks: '',
      hours: '',
      cbm: '',
      totalCargoPkg: [{ value: '' }],
      totalCargoWgt: [{ value: '' }],
      equipmentType: [],
      gang: [],
    },
  ])

  const { clientId } = useParams()
  // console.log(clientId);

  useEffect(() => {
    const totalPkg = orderItems.reduce((sum, order) => {
      const pkgArray = Array.isArray(order.totalCargoPkg)
        ? order.totalCargoPkg
        : []

      return sum + pkgArray.reduce((s, p) => s + Number(p.value || 0), 0)
    }, 0)

    const totalWgt = orderItems.reduce((sum, order) => {
      const wgtArray = Array.isArray(order.totalCargoWgt)
        ? order.totalCargoWgt
        : []

      return sum + wgtArray.reduce((s, w) => s + Number(w.value || 0), 0)
    }, 0)

    setFormData((prev) => ({
      ...prev,
      totalCargoPkg: totalPkg,
      totalCargoWgt: totalWgt,
    }))
  }, [orderItems])

  const [searchFields, setSearchFields] = useState([
    { field: 'clientName', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

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

  const fetchAllClientWorkOrders = async () => {
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
      const response = await axios.get(
        `${API_BASE_URL}/client-work-order/${clientId}`,
        {
          params,
          ...getAuthHeaders(),
        },
      )
      // console.log(response.data);
      setClientWorkOrder(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else
        setError(
          err.response?.data?.message || 'Failed to fetch client work orders.',
        )
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(COMPANY_API, getAuthHeaders())
      setCompanies(data.data || data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to fetch clients. Please try again.')

      console.error('Failed to fetch companies', err)
    }
  }

  const fetchWorkOrderTypes = async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/work-order-type`,
        getAuthHeaders(),
      )
      // console.log(data);
      setWorkOrderTypes(data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError('Failed to fetch clients. Please try again.')

      console.error('Failed to fetch companies', err)
    }
  }

  const fetchEquipmentTypes = async () => {
    try {
      // console.log("hello");
      const { data } = await axios.get(`${API_BASE_URL}/equipment-type`, {
        ...getAuthHeaders(),
      })
      // console.log(data);
      setEquipmentTypes(data)
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        setError(
          e.response?.data?.message || 'Failed to fetch Equipment Types.',
        )
      }
    }
  }

  const fetchGangs = async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/gangs`, {
        ...getAuthHeaders(),
      })
      // console.log(data);
      setGangs(data)
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        setError(e.response?.data?.message || 'Failed to fetch Gangs.')
      }
    }
  }

  useEffect(() => {
    fetchCompanies()
    fetchWorkOrderTypes()
    fetchAllClientWorkOrders()
  }, [])

  useEffect(() => {
    fetchAllClientWorkOrders()
  }, [searchFields, dateFilter])

  const handleSearch = () => {
    fetchAllClientWorkOrders()
  }

  const handleReset = () => {
    setSearchFields([{ field: 'clientName', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchAllClientWorkOrders()
  }

  const searchOptions = [
    { value: 'clientName', label: 'Client Name' },
    { value: 'workOrderNo', label: 'Work Order No' },
    { value: 'workOrderType', label: 'Work Order Type' },
    { value: 'containerNo', label: 'Container No' },
    { value: 'vehichleNo', label: 'Vehicle No' },
    { value: 'igmNo', label: 'IGM No' },
  ]

  const handleView = (c) => {
    setOrderDetails(c)
    setShowViewModal(true)
  }

  const resetForm = () => {
    setFormData({
      clientId: '',
      workOrderType: '',
      workOrderNo: '',
      workOrderDate: '',
      igmNo: '',
      importerName: '',
      chaName: '',
      vendor: '',
      totalCargoPkg: 0,
      totalCargoWgt: 0,
    })

    setOrderItems([
      {
        itemNo: '',
        containerNo: '',
        size: '',
        vehichleNo: '',
        exam: '',
        remarks: '',
        hours: '',
        cbm: '',
        totalCargoPkg: [{ value: '' }],
        totalCargoWgt: [{ value: '' }],
        equipmentType: [],
        gang: [],
      },
    ])

    setIsEditing(null)
    setValidationErrors({})
  }

  const handleEdit = (c) => {
    // console.log(c);
    setIsEditing(c._id)
    setOrderDetails(c)
    setFormData({
      ...initialFormData,
      clientId: c.client?._id || '',
      workOrderType: c.workOrderType || '',
      workOrderNo: c.workOrderNo || '',
      workOrderDate: formatDateForInput(c.workOrderDate) || '',
      igmNo: c.igmNo || '',
      importerName: c.importerName || '',
      chaName: c.chaName || '',
      vendor: c.vendor || '',
    })

    setOrderItems(
      c.orderItems && c.orderItems.length
        ? c.orderItems.map((order) => ({
            _id: order._id,
            cliWorkOrderId: order.cliWorkOrderId || '',
            itemNo: order.itemNo || '',
            containerNo: order.containerNo || '',
            size: order.size || '',
            vehichleNo: order.vehichleNo || '',
            exam: order.exam || '',
            remarks: order.remarks || '',
            hours: order.hours || '',
            cbm: order.cbm || '',
            totalCargoPkg: order.totalCargoPkg || '',
            totalCargoWgt: order.totalCargoWgt || '',
            equipmentType: order.equipmentType || '',
            gang: order.gang || '',
          }))
        : [
            {
              itemNo: '',
              containerNo: '',
              size: '',
              vehichleNo: '',
              exam: '',
              remarks: '',
              hours: '',
              cbm: '',
              totalCargoPkg: [{ value: '' }],
              totalCargoWgt: [{ value: '' }],
              equipmentType: [],
              gang: [],
            },
          ],
    )
    setShowForm(true)
  }

  const handleDelete = async (order) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      try {
        await axios.delete(`${API_BASE_URL}/client-work-order/${order}`, {
          ...getAuthHeaders(),
        })
        alert('Work Order deleted successfully!')
        fetchAllClientWorkOrders()
      } catch (e) {
        console.log(e)
        if (e.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else
          alert(`Delete failed: ${e.response?.data?.message || 'Server error'}`)
      }
    }
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

  const handleOrderItemChange = (index, e) => {
    const { name, value } = e.target
    const updatedOrders = [...orderItems]
    updatedOrders[index][name] = value
    setOrderItems(updatedOrders)

    if (validationErrors[`${name}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${name}_${index}`]: '',
      }))
    }
  }

  const addOrderItems = () => {
    setOrderItems([
      ...orderItems,
      {
        itemNo: '',
        containerNo: '',
        size: '',
        vehichleNo: '',
        exam: '',
        remarks: '',
        hours: '',
        cbm: '',
        totalCargoPkg: [{ value: '' }],
        totalCargoWgt: [{ value: '' }],
        equipmentType: [],
        gang: [],
      },
    ])
  }

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handlePackageChange = (field, index, value) => {
    setOrderItems((prev) => {
      const updated = [...prev]

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: updated[currentOrderIndex][field].map((item, i) =>
          i === index ? { ...item, value } : item,
        ),
      }

      return updated
    })

    if (validationErrors[`${field}_${currentOrderIndex}_${index}`]) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${field}_${currentOrderIndex}_${index}`]: '',
      }))
    }
  }

  const handlePackageAdd = (field) => {
    setOrderItems((prev) => {
      const updated = [...prev]

      const currentField = updated[currentOrderIndex][field] || []

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: [...currentField, { value: '' }],
      }

      return updated
    })
  }

  const handlePackageRemove = (field) => {
    setOrderItems((prev) => {
      const updated = [...prev]

      const currentField = updated[currentOrderIndex][field]

      if (!currentField || currentField.length <= 1) return prev

      updated[currentOrderIndex] = {
        ...updated[currentOrderIndex],
        [field]: currentField.slice(0, -1),
      }

      return updated
    })
  }

  const handleSelectChange = (field, selected) => {
    setOrderItems((prev) => {
      const updated = [...prev]
      updated[currentOrderIndex][field] = selected
      return updated
    })
  }

  const validateCompanyDetails = () => {
    const errors = {}

    if (!formData.clientId) {
      errors.clientId = 'Client is required.'
    }
    if (!formData.workOrderType) {
      errors.workOrderType = 'Work order type is required.'
    }
    if (!formData.workOrderNo.trim())
      errors.workOrderNo = 'Work Order No is required.'

    // if (!formData.companyName.trim())
    //   errors.companyName = "Company Name is required.";

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateOrderItems = () => {
    const errors = {}
    orderItems.forEach((orderItem, idx) => {
      if (!orderItem.itemNo || orderItem.itemNo.trim() === '') {
        errors[`itemNo_${idx}`] = 'Item No is required'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCargoTotals = () => {
    const errors = {}

    orderItems.forEach((order, orderIndex) => {
      ;(order.totalCargoPkg || []).forEach((pkg, i) => {
        if (!pkg.value && isNaN(pkg.value)) {
          errors[`totalCargoPkg_${orderIndex}_${i}`] = 'PKG must be a number'
        }
      })

      ;(order.totalCargoWgt || []).forEach((wgt, i) => {
        if (!wgt.value && isNaN(wgt.value)) {
          errors[`totalCargoWgt_${orderIndex}_${i}`] = 'Weight must be a number'
        }
      })
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const getTotalFromArray = (arr) => {
    if (!Array.isArray(arr)) return 0

    return arr.reduce((sum, item) => {
      const num = parseFloat(item.value)
      return sum + (isNaN(num) ? 0 : num)
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateCompanyDetails()) {
      alert('Please fix the validation errors before submitting.')
      return
    } else if (!validateOrderItems()) {
      alert('Please fix the validation errors before submitting.')
      return
    } else if (!validateCargoTotals()) {
      alert('Cargo PKG and Weight must be valid numbers.')
      return
    }

    const formattedOrderItems = orderItems.map((item) => ({
      ...item,
      totalCargoPkgSum: getTotalFromArray(item.totalCargoPkg),
      totalCargoWgtSum: getTotalFromArray(item.totalCargoWgt),
    }))

    const data = {
      ...formData,
      workOrderDate: new Date(formData.workOrderDate),
      formattedOrderItems,
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders().headers,
        },
      }
      await axios.put(
        `${API_BASE_URL}/client-work-order/${isEditing}`,
        data,
        config,
      )
      // console.log(res.data);
      alert('Client Work Order updated successfully!')

      resetForm()
      setShowForm(false)
      fetchAllClientWorkOrders()
    } catch (err) {
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
          {isEditing ? (
            'Work Order Detail'
          ) : (
            <>
              Work Order List{' '}
              <span className="fs-4 text-success">
                ({clientWorkOrder[0]?.client?.companyName} -{' '}
                {clientWorkOrder.length})
              </span>
            </>
          )}
        </h1>
        <div className="page-actions">
          <button
            type="button"
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
          {isEditing ? (
            ''
          ) : (
            <Button
              variant="success"
              onClick={() => navigate('/work-order/client-work-order')}
            >
              Go Back
            </Button>
          )}
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
          // onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}

      {showForm && (
        <Card>
          <h2 className="card-header mb-4">
            {isEditing ? (
              <span>Edit Work Order - {formData.workOrderNo}</span>
            ) : (
              'Add Work Order'
            )}
          </h2>

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
                      <option key={w._id || w.id} value={w.name}>
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

            <Table bordered responsive>
              <thead>
                <tr>
                  <th>Item No.</th>
                  <th>Container No.</th>
                  <th>Size</th>
                  <th>Vehicle No</th>
                  <th>% Exam</th>
                  <th>Remarks</th>
                  <th>Hours</th>
                  <th>CBM</th>
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
                    <td>
                      <Form.Control
                        name="itemNo"
                        value={orderItem.itemNo || ''}
                        isInvalid={!!validationErrors[`itemNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`itemNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="containerNo"
                        value={orderItem.containerNo || ''}
                        isInvalid={!!validationErrors[`containerNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`containerNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="size"
                        value={orderItem.size || ''}
                        isInvalid={!!validationErrors[`size_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`size_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="vehichleNo"
                        value={orderItem.vehichleNo || ''}
                        isInvalid={!!validationErrors[`vehichleNo_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`vehichleNo_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="exam"
                        value={orderItem.exam || ''}
                        isInvalid={!!validationErrors[`exam_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`exam_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="remarks"
                        value={orderItem.remarks || ''}
                        isInvalid={!!validationErrors[`remarks_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`remarks_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="hours"
                        value={orderItem.hours || ''}
                        isInvalid={!!validationErrors[`hours_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`hours_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <Form.Control
                        name="cbm"
                        value={orderItem.cbm || ''}
                        isInvalid={!!validationErrors[`cbm_${idx}`]}
                        onChange={(e) => handleOrderItemChange(idx, e)}
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors[`cbm_${idx}`]}
                      </Form.Control.Feedback>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentOrderIndex(idx)
                            if (!orderItems[idx].totalCargoPkg)
                              orderItems[idx].totalCargoPkg = [{ value: '' }]
                            if (!orderItems[idx].totalCargoWgt)
                              orderItems[idx].totalCargoWgt = [{ value: '' }]
                            setShowPkgDetailModal(true)
                            fetchGangs()
                            fetchEquipmentTypes()
                          }}
                          className="icon-btn view "
                        >
                          <FaPlus />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          onClick={() => removeOrderItem(idx)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <div className="form-actions d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSubmit}>
                {isEditing ? 'Update Work Order' : 'Save Work Order'}
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
            <Table bordered hover responsive>
              <thead className="table-secondary">
                <tr>
                  <th>Sr.No.</th>
                  <th>Client Name</th>
                  <th>WO Type</th>
                  <th>WO No</th>
                  <th>Date</th>
                  <th>IGM No</th>
                  <th>CHA Name</th>
                  <th>Total Cargo Pkg</th>
                  <th>Total Cargo Weight</th>
                  <th>Created Detail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clientWorkOrder.length === 0 ? (
                  <tr className="text-center">
                    <td colSpan={11}>No data found</td>
                  </tr>
                ) : (
                  clientWorkOrder.map((c, i) => (
                    <tr key={c._id}>
                      <td>{i + 1}</td>
                      <td>{c.client?.companyName || ''}</td>
                      <td>{c.workOrderType || ''}</td>
                      <td>{c.workOrderNo || ''}</td>
                      <td>{formatDDMMYYYY(c.workOrderDate) || ''}</td>
                      <td>{c.igmNo || ''}</td>
                      <td>{c.chaName || ''}</td>
                      <td>{c.totalCargoPkg || ''}</td>
                      <td>{c.totalCargoWgt || ''}</td>
                      <td>
                        {c.created_by?.name || ''} <br />
                        {c.created_on ? formatDateAndTime(c.created_on) : ''}
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="tb-action-btn view"
                            onClick={() => handleView(c)}
                          >
                            View
                          </button>
                          <button
                            className="tb-action-btn edit"
                            onClick={() => handleEdit(c)}
                          >
                            Edit
                          </button>
                          <button
                            className="tb-action-btn delete"
                            onClick={() => handleDelete(c._id)}
                          >
                            Delete
                          </button>
                          <button
                            className="tb-action-btn add"
                            onClick={() => handleAction('approve', c._id)}
                          >
                            Approve
                          </button>
                          <button
                            className="tb-action-btn edit"
                            onClick={() => handleAction('approve', c._id)}
                          >
                            Print
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
      {showViewModal ? (
        <Modal
          centered
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
        >
          <Modal.Header closeButton>
            <Modal.Title>View Detail</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {orderDetails && (
              <>
                <p>
                  <strong>Client Name:</strong>{' '}
                  {orderDetails.client?.companyName}
                </p>
                <p>
                  <strong>Order No:</strong> {orderDetails.workOrderNo}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {orderDetails.workOrderDate
                    ? formatDateAndTime(orderDetails.workOrderDate)
                    : 'N/A'}
                </p>
                <p>
                  <strong>IGM No:</strong> {orderDetails.igmNo || 'N/A'}
                </p>
                <p>
                  <strong>Importer Name:</strong>{' '}
                  {orderDetails.importerName || 'N/A'}
                </p>
                <p>
                  <strong>CHA Name:</strong> {orderDetails.chaName || 'N/A'}
                </p>
                <p>
                  <strong>Vendor Name:</strong> {orderDetails.vendor || 'N/A'}
                </p>
              </>
            )}
          </Modal.Body>
        </Modal>
      ) : (
        ''
      )}

      <Modal
        show={showPkgDetailModal}
        onHide={() => setShowPkgDetailModal(false)}
        size="lg"
        scrollable
        centered
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
                {Array.isArray(orderItems[currentOrderIndex]?.totalCargoPkg)
                  ? orderItems[currentOrderIndex].totalCargoPkg.map(
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
                                  'totalCargoPkg',
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
                          {orderItems[currentOrderIndex].totalCargoPkg
                            .length ===
                          index + 1 ? (
                            <span className="mx-2 fw-bold fs-5 text-muted">
                              {' '}
                            </span>
                          ) : (
                            <span className="mx-2 fw-bold fs-5 text-muted">
                              +
                            </span>
                          )}
                        </Col>
                      ),
                    )
                  : ''}
                {orderItems[currentOrderIndex].totalCargoPkg.length === 1 ? (
                  ''
                ) : (
                  <Col md="auto" sm="auto" xs={12} className="mb-2">
                    <Button
                      className="d-flex  align-items-center gap-2"
                      variant="danger"
                      onClick={() => handlePackageRemove('totalCargoPkg')}
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
                    onClick={() => handlePackageAdd('totalCargoPkg')}
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
                {Array.isArray(orderItems[currentOrderIndex]?.totalCargoWgt)
                  ? orderItems[currentOrderIndex].totalCargoWgt.map(
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
                                  'totalCargoWgt',
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
                          {orderItems[currentOrderIndex].totalCargoWgt
                            .length ===
                          index + 1 ? (
                            <span className="mx-2 fw-bold fs-5 text-muted">
                              {' '}
                            </span>
                          ) : (
                            <span className="mx-2 fw-bold fs-5 text-muted">
                              +
                            </span>
                          )}
                        </Col>
                      ),
                    )
                  : ''}
                {orderItems[currentOrderIndex].totalCargoWgt.length === 1 ? (
                  ''
                ) : (
                  <Col md="auto" sm="auto" xs={12} className="mb-2">
                    <Button
                      className="d-flex  align-items-center gap-2"
                      variant="danger"
                      onClick={() => handlePackageRemove('totalCargoWgt')}
                    >
                      <FaTimes />
                      <span>Remove WGT</span>
                    </Button>
                  </Col>
                )}
                <Col md="auto" sm="auto" xs={12} className="mb-2">
                  <Button
                    className="d-flex align-items-center gap-2"
                    variant="primary"
                    onClick={() => handlePackageAdd('totalCargoWgt')}
                  >
                    <FaPlus />
                    <span>Add WGT</span>
                  </Button>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col>
                  <Form.Label>Select Equipments:</Form.Label>
                  <Select
                    isMulti
                    options={equipmentTypes.map((e) => ({
                      value: e.equipmentType,
                      label: e.equipmentType,
                    }))}
                    value={orderItems[currentOrderIndex].equipmentType}
                    onChange={(selected) =>
                      handleSelectChange('equipmentType', selected)
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
                      value: g.name,
                      label: g.name,
                    }))}
                    value={orderItems[currentOrderIndex].gang}
                    onChange={(selected) =>
                      handleSelectChange('gang', selected)
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
  )
}

export default TotalClientWorkOrder
