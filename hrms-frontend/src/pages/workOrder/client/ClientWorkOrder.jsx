import React from 'react'
import { useState } from 'react'
import { FaPlus, FaSearch, FaTimes } from 'react-icons/fa'
import FilterPanel from '../../../utils/FilterPanel'
import {
  Alert,
  Button,
  Card,
  Dropdown,
  DropdownItem,
  Modal,
  Tab,
  Table,
  Tabs,
} from 'react-bootstrap'
import axios from 'axios'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AddClientWorkOrder from '../../../components/workOrder/client/AddClientWorkOrder'
import { formatDateAndTime, formatDDMMYYYY } from '../../../utils/utils'
import EditClientWorkOrder from '../../../components/workOrder/client/EditClientWorkOrder'

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const ClientWorkOrder = () => {
  const navigate = useNavigate()
  const [clientWorkOrder, setClientWorkOrder] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Pending')
  const [showViewModal, setShowViewModal] = useState(false)
  const [orderDetails, setOrderDetails] = useState(null)

  const [counts, setCounts] = useState({
    Approved: 0,
    Pending: 0,
    Rejected: 0,
    JobQueue: 0,
  })
  const [searchFields, setSearchFields] = useState([
    { field: 'clientName', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  const getStatusClass = (status) => {
    switch (status) {
      case 'Approved':
        return 'approved'
      case 'Pending':
        return 'pending'
      case 'Rejected':
        return 'rejected'
      case 'JobQueue':
        return 'jobqueue'
      default:
        return 'default'
    }
  }

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
      const params = {
        status: activeTab,
      }
      const validSearch = searchFields.filter((f) => f.field && f.keyword)
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch)
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }
      const response = await axios.get(`${API_BASE_URL}/work-orders`, {
        params,
        ...getAuthHeaders(),
      })
      // console.log(response.data.data);
      const workOrders = response.data.data || response.data || []

      setClientWorkOrder(workOrders)

      setCounts({
        Approved: workOrders.filter((x) => x.status === 'Approved').length,
        Pending: workOrders.filter((x) => x.status === 'Pending').length,
        Rejected: workOrders.filter((x) => x.status === 'Rejected').length,
        JobQueue: workOrders.filter((x) => x.status === 'JobQueue').length,
      })
      console.log(response.data)
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

  useEffect(() => {
    fetchAllClientWorkOrders()
  }, [searchFields, dateFilter])

  useEffect(() => {
    fetchAllClientWorkOrders()
  }, [activeTab])

  const handleSearch = () => {
    fetchAllClientWorkOrders()
  }

  const handleReset = () => {
    setSearchFields([{ field: 'clientName', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchAllClientWorkOrders()
  }

  const searchOptions = [
    { value: 'client_name', label: 'Client Name' },
    { value: 'client_id', label: 'Client Code' },
    { value: 'work_order_no', label: 'Work Order No' },
    { value: 'work_order_type', label: 'Work Order Type' },
    { value: 'container_no', label: 'Container No' },
    { value: 'vehicle_no', label: 'Vehicle No' },
    { value: 'gang_name', label: 'Gang Name' },
  ]

  const handleSubmit = async (data) => {
    // console.log(data);
    // return;
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders().headers,
        },
      }
      const res = await axios.post(
        `${API_BASE_URL}/work-orders/${data.work_order_no}`,
        data,
        config,
      )
      // console.log(res.data);
      alert('Client Work Order created successfully!')

      // resetForm();
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

  const handleSaveEdit = async (data) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders().headers,
        },
      }

      const res = await axios.put(
        `${API_BASE_URL}/work-orders/${data.work_order_id}`,
        data,
        config,
      )

      alert('Client Work Order updated successfully!')

      setShowEditForm(false)
      setOrderDetails(null)

      fetchAllClientWorkOrders()
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

  // const handleView = async (c) => {
  //   try {
  //     const response = await axios.get(
  //       `${API_BASE_URL}/work-orders/${c.work_order_id}`,
  //       getAuthHeaders(),
  //     )

  //     setOrderDetails(response.data.data || response.data)
  //     setShowViewModal(true)
  //   } catch (err) {
  //     console.log(err)
  //     alert('Failed to fetch work order details')
  //   }
  // }

  const handleEdit = async (c) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/work-orders/${c.work_order_id}`,
        getAuthHeaders(),
      )

      console.log(response.data)

      if (response.data.success) {
        setOrderDetails(response.data.data)
        setShowEditForm(true)
      }
    } catch (error) {
      console.log(error)
      alert('Failed to fetch work order details')
    }
  }

  const handleView = async (c) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/work-orders/${c.work_order_id}`,
        getAuthHeaders(),
      )

      console.log(response.data)

      if (response.data.success) {
        setOrderDetails(response.data.data)
        setShowViewModal(true)
      }
    } catch (error) {
      console.log(error)
      alert('Failed to fetch work order details')
    }
  }

  const handleStatusChange = async (id, status) => {
    if (
      window.confirm(
        `Are you sure you want to ${
          status === 'Approved' ? 'Approve' : 'Reject'
        } work order?`,
      )
    ) {
      try {
        await axios.put(
          `${API_BASE_URL}/work-orders/status/${id}`,
          { status },
          getAuthHeaders(),
        )

        alert(`Work order ${status} successfully`)

        fetchAllClientWorkOrders()
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else {
          alert('Failed to update status')
        }
      }
    }
  }

  const handleDelete = async (c) => {
    console.log(c)

    if (window.confirm('Are you sure you want to delete this data?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/work-orders/${c.work_order_id}`,
          getAuthHeaders(),
        )

        alert('Client Work Order deleted successfully!')
        fetchAllClientWorkOrders()
      } catch (error) {
        console.error(error)
        alert('Failed to delete client work order.')
      }
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Client Work Order Total</h1>
        <div className="page-actions">
          <button
            type="button"
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? 'Hide Search' : 'Search'}
          </button>
          <Button variant="info" style={{ fontWeight: '600' }}>
            Bulk Upload
          </Button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              // resetForm();
              setShowForm(true)
              setShowSearch(false)
            }}
          >
            <FaPlus /> Add New Client Work Order
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
          showDownload={false}
          searchOptions={searchOptions}
        />
      )}

      {showForm && (
        <AddClientWorkOrder
          onSave={handleSubmit}
          onBack={() => {
            setShowForm(false)
            fetchAllClientWorkOrders()
          }}
        />
      )}
      {!showForm && !showEditForm && (
        <>
          <Card>
            <Tabs
              activeKey={activeTab}
              className="mb-3"
              onSelect={(k) => setActiveTab(k)}
              fill
            >
              <Tab
                eventKey="Approved"
                title={
                  <>
                    Approved{' '}
                    <span className="tab-badge approved">
                      {counts.Approved || 0}
                    </span>
                  </>
                }
              />
              <Tab
                eventKey="Pending"
                title={
                  <>
                    Pending{' '}
                    <span className="tab-badge pending">
                      {counts.Pending || 0}
                    </span>
                  </>
                }
              />

              <Tab
                eventKey="Rejected"
                title={
                  <>
                    Rejected{' '}
                    <span className="tab-badge rejected">
                      {counts.Rejected || 0}
                    </span>
                  </>
                }
              />

              <Tab
                eventKey="JobQueue"
                title={
                  <>
                    Job Queue{' '}
                    <span className="tab-badge jobqueue">
                      {counts.JobQueue || 0}
                    </span>
                  </>
                }
              />
            </Tabs>
            {/* {!showForm && */}
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
                    <th>
                      Client Name
                      <br />
                      WO Type | WO No
                      <br />
                      Date
                    </th>
                    <th>
                      Total Cargo Pkg <br />
                      Total Cargo Weight
                    </th>
                    {/* <th>Created Detail</th> */}
                    <th>Approved Detail</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientWorkOrder.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={7}>No data found</td>
                    </tr>
                  ) : (
                    clientWorkOrder.map((c, i) => (
                      <tr key={c.work_order_id}>
                        <td>{i + 1}</td>
                        <td>
                          {c.client_name || ''}
                          <br />
                          {c.work_order_type || ''} | {c.work_order_no || ''}
                          <br />
                          {c.work_order_date
                            ? formatDDMMYYYY(c.work_order_date)
                            : ''}
                        </td>
                        <td>
                          <b>Cargo Pkg</b> {c.total_cargo_pkgs || 'NA'} <br />
                          <b>Cargo Weight</b> {c.total_cargo_weight || 'NA'}
                        </td>
                        {/* <td>
                        {c.created_by?.name || ''}
                        <br />
                        {c.created_on ? formatDDMMYYYY(c.created_on) : ''}{' '}
                      </td>
                      <td>
                        {c.approved_by?.name || ''}
                        <br />
                        {c.approved_on
                          ? formatDDMMYYYY(c.approved_on)
                          : ''}{' '}
                      </td> */}
                        <td>{c.status || ''}</td>
                        <td>
                          <span
                            className={`tab-badge ${getStatusClass(c.status)}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <Dropdown align={'end'}>
                            <Dropdown.Toggle variant="primary">
                              Action
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              popperConfig={{ strategy: 'fixed' }}
                              renderOnMount
                            >
                              <DropdownItem onClick={() => handleView(c)}>
                                View
                              </DropdownItem>
                              <DropdownItem onClick={() => handleEdit(c)}>
                                Edit With Excel View
                              </DropdownItem>
                              {c.status === 'Pending' && (
                                <>
                                  <DropdownItem
                                    onClick={() =>
                                      handleStatusChange(
                                        c.work_order_id,
                                        'Approved',
                                      )
                                    }
                                  >
                                    Approve
                                  </DropdownItem>
                                  <DropdownItem
                                    onClick={() =>
                                      handleStatusChange(
                                        c.work_order_id,
                                        'Rejected',
                                      )
                                    }
                                  >
                                    Reject
                                  </DropdownItem>
                                </>
                              )}
                              <DropdownItem onClick={() => handleDelete(c)}>
                                Delete Forever
                              </DropdownItem>
                              <DropdownItem
                                onClick={() =>
                                  navigate(
                                    `/work-order/client-work-order/print?orderId=${c.work_order_id}`,
                                    {
                                      state: { autoPrint: true },
                                    },
                                  )
                                }
                              >
                                Print
                              </DropdownItem>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card>
        </>
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
                  {orderDetails.client_name || orderDetails.client_id}
                </p>
                <p>
                  <strong>Order No:</strong> {orderDetails.work_order_no}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {orderDetails?.work_order_date
                    ? formatDateAndTime(orderDetails.work_order_date)
                    : 'N/A'}
                </p>
                <p>
                  <strong>IGM No:</strong> {orderDetails.igm_no || 'N/A'}
                </p>
                <p>
                  <strong>Importer Name:</strong>{' '}
                  {orderDetails.importer_name || 'N/A'}
                </p>
                <p>
                  <strong>CHA Name:</strong> {orderDetails.cha_name || 'N/A'}
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

      {showEditForm && (
        <EditClientWorkOrder
          editingData={orderDetails}
          onBack={() => {
            setShowEditForm(false)
            setOrderDetails(null)
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  )
}

export default ClientWorkOrder
