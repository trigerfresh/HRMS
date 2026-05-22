import React, { useState, useEffect } from 'react'
import EmployeeTable from '../../components/employee/employeePage/EmployeeTable'
import FilterPanel from '../../utils/FilterPanel'
import AddEmployee from '../../components/employee/employeePage/AddEmployee'
import { FaMinus, FaPlus, FaSearch } from 'react-icons/fa'
import { Alert, Button, Card, Col, Form, Modal, Row } from 'react-bootstrap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const EmployeePages = () => {
  const [employees, setEmployees] = useState([])
  const [workingCount, setWorkingCount] = useState(0)
  const [leftCount, setLeftCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showAddEmployee, setShowAddEmployee] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false)
  const [changeEmployeeStatus, setChangeEmployeeStatus] = useState(null)

  // Search and filter states
  const [searchFields, setSearchFields] = useState([
    { field: 'employeeCode', keyword: '' },
  ])
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' })

  // Bulk upload states
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showBulkUploadErr, setShowBulkUploadErr] = useState(false)
  const [showBulkUpdateErr, setShowBulkUpdateErr] = useState(false)
  const [showPanUpdate, setShowPanUpdate] = useState(false)
  const [selectedBulkUploadFile, setSelectedBulkUploadFile] = useState(null)
  const [selectedUpdateFile, setSelectedUpdateFile] = useState(null)
  const [bulkUploadErrMsg, setBulkUploadErrMsg] = useState('')
  const [bulkUploadSucMsg, setBulkUploadSucMsg] = useState('')
  const [bulkUpdateErrMsg, setBulkUpdateErrMsg] = useState('')
  const [bulkUpdateSucMsg, setBulkUpdateSucMsg] = useState('')

  // Search options
  const searchOptions = [
    { value: 'employeeCode', label: 'Employee Code' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: 'emailId', label: 'Email ID' },
    { value: 'designation', label: 'Designation' },
    { value: 'department', label: 'Department' },
    { value: 'panCardNo', label: 'PAN Card No' },
    { value: 'uanNo', label: 'UAN No' },
    { value: 'esisNo', label: 'ESIC No' },
  ]

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      const validSearch = searchFields.filter((f) => f.field && f.keyword)

      if (validSearch.length > 0) params.searchFields = validSearch
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      // Build URL query string
      const queryParams = new URLSearchParams()

      if (params.searchFields) {
        queryParams.append('searchFields', JSON.stringify(params.searchFields))
      }
      if (params.fromDate) queryParams.append('fromDate', params.fromDate)
      if (params.toDate) queryParams.append('toDate', params.toDate)

      const token = localStorage.getItem('token')
      const response = await fetch(
        `${API_URL}/api/employees?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      )

      const result = await response.json()
      setEmployees(result.data || result)

      const working = (result.data || result).filter(
        (emp) => emp.status === 'Working',
      ).length
      const left = (result.data || result).filter(
        (emp) => emp.status === 'Left' || emp.status === 'Terminated',
      ).length
      setWorkingCount(working)
      setLeftCount(left)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else setError(`Failed to fetch employees: ${err.message}`)
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const handleSearch = () => {
    fetchEmployees()
  }

  const handleReset = () => {
    setSearchFields([{ field: 'employeeCode', keyword: '' }])
    setDateFilter({ from: '', to: '' })
    fetchEmployees()
  }

  useEffect(() => {
    fetchEmployees()
  }, [searchFields, dateFilter])

  const handleDownloadExcel = async () => {
    try {
      const params = {}

      const validSearch = searchFields.filter((f) => f.field && f.keyword)

      if (validSearch.length > 0) params.searchFields = validSearch
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      // Build URL query string
      const queryParams = new URLSearchParams()

      if (params.searchFields) {
        queryParams.append('searchFields', JSON.stringify(params.searchFields))
      }
      if (params.fromDate) queryParams.append('fromDate', params.fromDate)
      if (params.toDate) queryParams.append('toDate', params.toDate)
      const token = localStorage.getItem('token')

      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const response = await fetch(
        `${API_URL}/api/employees/export?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        throw new Error(
          `Failed to download update template: ${response.status}`,
        )
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Employees_${randomNumber}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
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

  const handleDownloadUploadTemplate = async () => {
    try {
      const token = localStorage.getItem('token')

      const response = await fetch(
        `${API_URL}/api/employees/uploadtemplate/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'EmployeeTemplate.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download Excel template.')
    }
  }

  const handleDownloadUploadErrorExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      // Corrected URL:
      const response = await fetch(
        `${API_URL}/api/employees/uploaderrortemplate/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ViewUploadedData.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download Excel template.')
    }
  }

  const handleDownloadUpdateTemplate = async () => {
    try {
      const params = {}

      const validSearch = searchFields.filter((f) => f.field && f.keyword)

      if (validSearch.length > 0) params.searchFields = validSearch
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from
        params.toDate = dateFilter.to
      }

      // Build URL query string
      const queryParams = new URLSearchParams()

      if (params.searchFields) {
        queryParams.append('searchFields', JSON.stringify(params.searchFields))
      }
      if (params.fromDate) queryParams.append('fromDate', params.fromDate)
      if (params.toDate) queryParams.append('toDate', params.toDate)

      const token = localStorage.getItem('token')
      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000)

      const response = await fetch(
        `${API_URL}/api/employees/updatetemplate/download?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        throw new Error(
          `Failed to download update template: ${response.status}`,
        )
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Employee_Specific_${randomNumber}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download update template error:', err)
      alert('Failed to download update Excel template.')
    }
  }

  const handleDownloadUpdateErrorExcel = async () => {
    try {
      const token = localStorage.getItem('token')
      // Corrected URL:
      const response = await fetch(
        `${API_URL}/api/employees/updateerrortemplate/download`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ViewUploadedData.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download Excel template.')
    }
  }

  const handleBulkUploadFileChange = (e) => {
    setBulkUploadSucMsg('')
    setBulkUploadErrMsg('')
    setShowBulkUploadErr(false)
    setSelectedBulkUploadFile(e.target.files[0])
  }

  const handleBulkUpload = async () => {
    if (!selectedBulkUploadFile) {
      setBulkUploadSucMsg('')
      setBulkUploadErrMsg('Please select a file to upload.')
      return
    }

    setBulkUploadErrMsg('Uploading...')
    const formData = new FormData()
    formData.append('file', selectedBulkUploadFile)
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_URL}/api/employees/bulk-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (response.ok) {
        setBulkUploadSucMsg(
          result.insertedCount +
            (result.insertedCount < 2 ? ' row' : ' rows') +
            ' uploaded successfully! Click on Verify Data',
        )
        fetchEmployees()
        setBulkUploadErrMsg('')
      } else {
        setBulkUploadSucMsg('')
        setBulkUploadErrMsg('File upload failed!')
      }
    } catch (err) {
      setBulkUploadErrMsg(`Upload failed!`)
      setBulkUploadSucMsg('')
    } finally {
      setSelectedBulkUploadFile(null)
      if (document.getElementById('bulkUploadFileInput')) {
        document.getElementById('bulkUploadFileInput').value = ''
      }
    }
  }

  const handleVerifyBulkUpload = async () => {
    setBulkUploadSucMsg('')
    setBulkUploadErrMsg('Verifying...')
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(
        `${API_URL}/api/employees/verify-bulk-upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      // console.log(result);
      if (response.ok) {
        setBulkUploadErrMsg('')
        setBulkUploadSucMsg(
          result.results
            ? 'Click on view uploaded data to see any error'
            : result.message,
        )
        if (result.results) {
          setShowBulkUploadErr(true)
        } else {
          setShowBulkUploadErr(false)
        }
        fetchEmployees()
      } else {
        setBulkUploadSucMsg('')
        setBulkUploadErrMsg(result.message || 'Verification failed.')
      }
    } catch (err) {
      setBulkUploadErrMsg(`Verification failed: ${err.message}`)
      setBulkUploadSucMsg('')
    }
  }

  const handleBulkUpdateFileChange = (e) => {
    setBulkUpdateErrMsg('')
    setBulkUpdateSucMsg('')
    setShowBulkUpdateErr(false)
    setSelectedUpdateFile(e.target.files[0])
  }

  const handleBulkUpdate = async () => {
    if (!selectedUpdateFile) {
      setBulkUpdateSucMsg('')
      setBulkUpdateErrMsg('Please select a file to upload.')
      return
    }

    setBulkUpdateErrMsg('Uploading...')
    const formData = new FormData()
    formData.append('file', selectedUpdateFile)
    const token = localStorage.getItem('token')

    try {
      const response = await fetch(`${API_URL}/api/employees/bulk-update`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }
      if (response.ok) {
        setBulkUpdateSucMsg(
          result.updatedCount +
            (result.updatedCount < 2 ? ' row' : ' rows') +
            ' uploaded successfully! Click on Verify Data',
        )
        fetchEmployees()
        setBulkUpdateErrMsg('')
      } else {
        setBulkUpdateSucMsg('')
        setBulkUpdateErrMsg('File upload failed!')
      }
    } catch (err) {
      setBulkUpdateErrMsg(`Upload failed!`)
      setBulkUpdateSucMsg('')
    } finally {
      setSelectedUpdateFile(null)
      if (document.getElementById('bulkUpdateFileInput')) {
        document.getElementById('bulkUpdateFileInput').value = ''
      }
    }
  }

  const handleVerifyBulkUpdate = async () => {
    setBulkUpdateSucMsg('')
    setBulkUpdateErrMsg('Verifying...')

    const token = localStorage.getItem('token')

    try {
      const response = await fetch(
        `${API_URL}/api/employees/verify-bulk-update`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }

      if (response.ok) {
        setBulkUpdateErrMsg('')
        setBulkUpdateSucMsg(
          result.results
            ? 'Click on view uploaded data to see any error'
            : result.message,
        )
        if (result.results) {
          setShowBulkUpdateErr(true)
        } else {
          setShowBulkUpdateErr(false)
        }
        fetchEmployees()
      } else {
        setBulkUpdateSucMsg('')
        setBulkUpdateErrMsg(result.message || 'Verification failed.')
      }
    } catch (err) {
      setBulkUpdateErrMsg(`Verification failed: ${err.message}`)
      setBulkUpdateSucMsg('')
    }
  }

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/employees/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.status}`)
      }

      alert('Employee deleted successfully!')
      fetchEmployees()
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      } else {
        alert(`Failed to delete employee: ${err.message}`)
      }
      console.error('Delete error:', err)
    }
  }

  const handleChangeEmployeeStatus = (emp) => {
    setChangeEmployeeStatus(emp)
    setShowChangeStatusModal(true)
  }

  const handleUpdateEmployeeStatus = async () => {
    if (!changeEmployeeStatus) return

    const id = changeEmployeeStatus._id
    const currentStatus = changeEmployeeStatus.status

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/api/employees/${id}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: currentStatus }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`)
      }

      alert('Employee status updated successfully!')
      setChangeEmployeeStatus(false)
      fetchEmployees()
    } catch (err) {
      console.error('Status update error:', err)
      alert(`Failed to update employee status: ${err.message}`)
    }
  }

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee)
    setShowAddEmployee(true)
  }

  const handleUpdateSalary = (employee) => {
    // setEditingEmployee(employee);
    // setShowAddEmployee(true);
  }

  const handleAddEmployeeSuccess = () => {
    setShowAddEmployee(false)
    setEditingEmployee(null)
    fetchEmployees()
  }

  const handleCancelAddEmployee = () => {
    setShowAddEmployee(false)
    setEditingEmployee(null)
  }

  // if (showAddEmployee) {
  //   return (
  //     <AddEmployee
  //       employee={editingEmployee}
  //       onSuccess={handleAddEmployeeSuccess}
  //       onCancel={handleCancelAddEmployee}
  //     />
  //   );
  // }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Employee Management</h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
          >
            <FaSearch /> {showSearchPanel ? 'Hide Search' : 'Search'}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setShowAddEmployee(true)
              setEditingEmployee(null)
              setShowSearchPanel(false)
            }}
          >
            <FaPlus />
            Add New Employee
          </button>
        </div>
      </div>
      {showSearchPanel && (
        <div id="employee-search-panel">
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

      {showAddEmployee ? (
        <AddEmployee
          key={editingEmployee ? editingEmployee.id : 'new'}
          editingEmployee={editingEmployee}
          onSuccess={handleAddEmployeeSuccess}
          onCancel={handleCancelAddEmployee}
        />
      ) : (
        <div>
          {/* Employee Bulk Upload */}
          <Card>
            <Card.Title
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              style={{ cursor: 'pointer' }}
              className="my-0 d-flex align-items-center justify-content-start"
            >
              <span className="me-2">
                {showBulkUpload ? (
                  <FaMinus size={'0.8em'} />
                ) : (
                  <FaPlus size={'0.8em'} />
                )}
              </span>
              <span>Employee Bulk Upload</span>
            </Card.Title>

            {showBulkUpload && (
              <Card.Body>
                <p
                  className=""
                  style={{
                    color: 'var(--red-color)',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                  }}
                >
                  Do not use any special character in your file name
                </p>

                {/* File Input */}
                <Form.Group as={Row} className="align-items-center mb-3">
                  <Col xs="auto">
                    <Form.Label
                      htmlFor="bulkUploadFileInput"
                      className="btn btn-secondary mb-0"
                    >
                      Choose File
                    </Form.Label>
                    <Form.Control
                      id="bulkUploadFileInput"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkUploadFileChange}
                      style={{ display: 'none' }}
                    />
                  </Col>
                  <Col>
                    <span>
                      {selectedBulkUploadFile
                        ? selectedBulkUploadFile.name
                        : 'No file chosen'}
                    </span>
                  </Col>
                </Form.Group>

                <p className="text-muted mb-3">
                  Please Upload Excel Sheet Only.
                </p>

                <Row>
                  <Col xs="auto">
                    <Button variant="primary" onClick={handleBulkUpload}>
                      Start Upload
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button variant="warning" onClick={handleVerifyBulkUpload}>
                      Verify Data
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="danger"
                      onClick={handleDownloadUploadTemplate}
                    >
                      Download Template
                    </Button>
                  </Col>
                  {showBulkUploadErr && (
                    <Col xs="auto">
                      <Button
                        variant="success"
                        onClick={handleDownloadUploadErrorExcel}
                      >
                        View Uploaded Data
                      </Button>
                    </Col>
                  )}
                </Row>
                {bulkUploadErrMsg && (
                  <Alert variant="danger" className="mt-4 mb-0">
                    {bulkUploadErrMsg}
                  </Alert>
                )}
                {bulkUploadSucMsg && (
                  <Alert variant="success" className="mt-4 mb-0">
                    {bulkUploadSucMsg}
                  </Alert>
                )}
              </Card.Body>
            )}
          </Card>

          {/* Employee PAN/ESIC/UAN/BASIC SALARY Update */}
          <Card>
            <Card.Title
              onClick={() => setShowPanUpdate(!showPanUpdate)}
              style={{ cursor: 'pointer' }}
              className="my-0 d-flex align-items-center justify-content-start"
            >
              <span className="me-2">
                {showPanUpdate ? (
                  <FaMinus size={'0.8em'} />
                ) : (
                  <FaPlus size={'0.8em'} />
                )}
              </span>
              <span>Employee PANCARD/ESIS/UAN/BASIC SALARY Update</span>
            </Card.Title>
            {showPanUpdate && (
              <Card.Body>
                <p
                  className=""
                  style={{
                    color: 'var(--red-color)',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                  }}
                >
                  Do not use any special character in your file name
                </p>
                {/* File Input */}
                <Form.Group as={Row} className="align-items-center mb-3">
                  <Col xs="auto">
                    <Form.Label
                      htmlFor="bulkUpdateFileInput"
                      className="btn btn-secondary mb-0"
                    >
                      Choose File
                    </Form.Label>
                    <Form.Control
                      id="bulkUpdateFileInput"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleBulkUpdateFileChange}
                      style={{ display: 'none' }}
                    />
                  </Col>
                  <Col>
                    <span className="file-name-display">
                      {selectedUpdateFile
                        ? selectedUpdateFile.name
                        : 'No file chosen'}
                    </span>
                  </Col>
                </Form.Group>
                <p className="text-muted mb-3">
                  Please Upload Excel Sheet Only.
                </p>
                <Row>
                  <Col xs="auto">
                    <Button variant="primary" onClick={handleBulkUpdate}>
                      Start Upload
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button variant="warning" onClick={handleVerifyBulkUpdate}>
                      Verify Data
                    </Button>
                  </Col>
                  <Col xs="auto">
                    <Button
                      variant="danger"
                      onClick={handleDownloadUpdateTemplate}
                    >
                      Download Template
                    </Button>
                  </Col>
                  {showBulkUpdateErr && (
                    <Col xs="auto">
                      <Button
                        variant="success"
                        onClick={handleDownloadUpdateErrorExcel}
                      >
                        View Uploaded Data
                      </Button>
                    </Col>
                  )}
                </Row>
                {bulkUpdateErrMsg && (
                  <Alert variant="danger" className="mt-4 mb-0">
                    {bulkUpdateErrMsg}
                  </Alert>
                )}
                {bulkUpdateSucMsg && (
                  <Alert variant="success" className="mt-4 mb-0">
                    {bulkUpdateSucMsg}
                  </Alert>
                )}
              </Card.Body>
            )}
          </Card>
          {/* Employee Counts */}
          <Card className="summary-section">
            <div className="employee-counts">
              <span className="working">Working : {workingCount}</span>
              <span className="left">Left : {leftCount}</span>
              <span className="total">Total : {employees.length}</span>
            </div>
          </Card>
          {/* Manage Employee Section */}
          <Card>
            <div className="card-header mb-4">
              Manage Employee{' '}
              <span className="text-success">({employees.length})</span>
            </div>

            {/* Employee Table */}
            <EmployeeTable
              loading={loading}
              error={error}
              employees={employees}
              onEdit={handleEditEmployee}
              onUpdateSalary={handleUpdateSalary}
              onChangeStatus={handleChangeEmployeeStatus}
              onDelete={handleDeleteEmployee}
            />
          </Card>
        </div>
      )}

      {changeEmployeeStatus ? (
        <Modal
          centered
          show={showChangeStatusModal}
          onHide={() => setShowChangeStatusModal(false)}
          size="md"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Change Status -{' '}
              {changeEmployeeStatus.firstName +
                ' ' +
                changeEmployeeStatus.lastName}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col className="mb-3" md={12}>
                <Form.Group controlId="initial">
                  <Form.Label>Employee Status</Form.Label>
                  <Form.Select
                    name="initial"
                    value={changeEmployeeStatus.status}
                    onChange={(e) =>
                      setChangeEmployeeStatus({
                        ...changeEmployeeStatus,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="Working">Working</option>
                    <option value="Left">Left</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowChangeStatusModal(false)}
            >
              Close
            </Button>
            <Button variant="primary" onClick={handleUpdateEmployeeStatus}>
              Update
            </Button>
          </Modal.Footer>
        </Modal>
      ) : (
        ''
      )}
    </div>
  )
}

export default EmployeePages
