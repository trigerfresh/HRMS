import React from "react";
import { useState } from "react";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import FilterPanel from "../../../utils/FilterPanel";
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
} from "react-bootstrap";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddClientWorkOrder from "../../../components/workOrder/client/AddClientWorkOrder";
import { formatDateAndTime, formatDDMMYYYY } from "../../../utils/utils";
import EditClientWorkOrder from "../../../components/workOrder/client/EditClientWorkOrder";

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const ClientWorkOrder = () => {
  const navigate = useNavigate();
  const [clientWorkOrder, setClientWorkOrder] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("Approved");
  const [showViewModal, setShowViewModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  const [counts, setCounts] = useState({
    Approved: 0,
    Pending: 0,
    Rejected: 0,
    JobQueue: 0,
  });
  const [searchFields, setSearchFields] = useState([
    { field: "clientName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  const getStatusClass = (status) => {
    switch (status) {
      case "Approved":
        return "approved";
      case "Pending":
        return "pending";
      case "Rejected":
        return "rejected";
      case "JobQueue":
        return "jobqueue";
      default:
        return "default";
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found in localStorage");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchAllClientWorkOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        status: activeTab,
      };
      const validSearch = searchFields.filter((f) => f.field && f.keyword);
      if (validSearch.length > 0)
        params.searchFields = JSON.stringify(validSearch);
      if (dateFilter.from && dateFilter.to) {
        params.fromDate = dateFilter.from;
        params.toDate = dateFilter.to;
      }
      const response = await axios.get(`${API_BASE_URL}/client-work-order`, {
        params,
        ...getAuthHeaders(),
      });
      // console.log(response.data.data);
      setClientWorkOrder(response.data.data);
      setCounts(response.data.counts);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        setError(
          err.response?.data?.message || "Failed to fetch client work orders.",
        );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllClientWorkOrders();
  }, [searchFields, dateFilter]);

  useEffect(() => {
    fetchAllClientWorkOrders();
  }, [activeTab]);

  const handleSearch = () => {
    fetchAllClientWorkOrders();
  };

  const handleReset = () => {
    setSearchFields([{ field: "clientName", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    fetchAllClientWorkOrders();
  };

  const searchOptions = [
    { value: "clientName", label: "Client Name" },
    { value: "clientCode", label: "Client Code" },
    { value: "workOrderNo", label: "Work Order No" },
    { value: "workOrderType", label: "Work Order Type" },
    { value: "containerNo", label: "Container No" },
    { value: "vehichleNo", label: "Vehicle No" },
    { value: "gangName", label: "Gang Name" },
  ];

  const handleSubmit = async (data) => {
    // console.log(data);
    // return;
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders().headers,
        },
      };
      const res = await axios.post(
        `${API_BASE_URL}/client-work-order/`,
        data,
        config,
      );
      // console.log(res.data);
      alert("Client Work Order created successfully!");

      // resetForm();
      setShowForm(false);
      fetchAllClientWorkOrders();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
        setError(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };

  const handleSaveEdit = async (data) => {
    console.log(data);
    // return;
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders().headers,
        },
      };
      const res = await axios.put(
        `${API_BASE_URL}/client-work-order/single`,
        data,
        config,
      );
      // console.log(res.data);
      alert("Client Work Order updated successfully!");

      // resetForm();
      setShowEditForm(false);
      fetchAllClientWorkOrders();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
        setError(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };

  const handleView = (c) => {
    // console.log(c);
    setOrderDetails(c);
    setShowViewModal(true);
  };

  const handleEdit = (c) => {
    // console.log(c);
    setOrderDetails(c);
    setShowEditForm(true);
  };

  const handleStatusChange = async (id, status) => {
    // console.log(id, status);
    if (
      window.confirm(
        `Are you sure you want to ${status === "Approved" ? "Approve" : "Reject"} work order?`,
      )
    ) {
      try {
        await axios.put(
          `${API_BASE_URL}/client-work-order/status/${id}`,
          { status },
          getAuthHeaders(),
        );

        alert(`Work order ${status} successfully`);
        fetchAllClientWorkOrders();
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          alert("Failed to update status");
        }
      }
    }
  };

  const handleDelete = async (c) => {
    // console.log(c);
    if (window.confirm("Are you sure you want to delete this data?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/client-work-order/${c._id}`,
          getAuthHeaders(),
        );
        alert("Client Work Order deleted successfully!");
        fetchAllClientWorkOrders();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Failed to delete client work order.");
      }
    }
  };

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
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <Button variant="info" style={{ fontWeight: "600" }}>
            Bulk Upload
          </Button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              // resetForm();
              setShowForm(true);
              setShowSearch(false);
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
            setShowForm(false);
            fetchAllClientWorkOrders();
          }}
        />
      )}
      {!showForm && !showEditForm && (
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
                  Approved{" "}
                  <span className="tab-badge approved">{counts.Approved}</span>
                </>
              }
            />
            <Tab
              eventKey="Pending"
              title={
                <>
                  Pending{" "}
                  <span className="tab-badge pending">{counts.Pending}</span>
                </>
              }
            />

            <Tab
              eventKey="Rejected"
              title={
                <>
                  Rejected{" "}
                  <span className="tab-badge rejected">{counts.Rejected}</span>
                </>
              }
            />

            <Tab
              eventKey="JobQueue"
              title={
                <>
                  Job Queue{" "}
                  <span className="tab-badge jobqueue">{counts.JobQueue}</span>
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
                  <th>Created Detail</th>
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
                    <tr key={c._id}>
                      <td>{i + 1}</td>
                      <td>
                        {c.client?.companyName || ""}
                        <br />
                        {c.workOrderType?.name || ""} |{" "}
                        {c.cliWorkOrderId?.workOrderNo || ""}
                        <br />
                        {c.cliWorkOrderId?.workOrderDate
                          ? formatDDMMYYYY(c.cliWorkOrderId?.workOrderDate)
                          : ""}
                      </td>
                      <td>
                        <b>Cargo Pkg</b> {c.totalCargoPkgSum || ""} <br />
                        <b>Cargo Weight</b> {c.totalCargoWgtSum || ""}
                      </td>
                      <td>
                        {c.created_by?.name || ""}
                        <br />
                        {c.created_on ? formatDDMMYYYY(c.created_on) : ""}{" "}
                      </td>
                      <td>
                        {c.approved_by?.name || ""}
                        <br />
                        {c.approved_on
                          ? formatDDMMYYYY(c.approved_on)
                          : ""}{" "}
                      </td>
                      {/* <td>{c.status || ""}</td> */}
                      <td>
                        <span
                          className={`tab-badge ${getStatusClass(c.status)}`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <Dropdown align={"end"}>
                          <Dropdown.Toggle variant="primary">
                            Action
                          </Dropdown.Toggle>
                          <Dropdown.Menu
                            popperConfig={{ strategy: "fixed" }}
                            renderOnMount
                          >
                            <DropdownItem onClick={() => handleView(c)}>
                              View
                            </DropdownItem>
                            <DropdownItem onClick={() => handleEdit(c)}>
                              Edit With Excel View
                            </DropdownItem>
                            {c.status === "Pending" && (
                              <>
                                <DropdownItem
                                  onClick={() =>
                                    handleStatusChange(c._id, "Approved")
                                  }
                                >
                                  Approve
                                </DropdownItem>
                                <DropdownItem
                                  onClick={() =>
                                    handleStatusChange(c._id, "Rejected")
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
                                  `/work-order/client-work-order/print?orderId=${c._id}`,
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
                  <strong>Client Name:</strong>{" "}
                  {orderDetails.client?.companyName}
                </p>
                <p>
                  <strong>Order No:</strong>{" "}
                  {orderDetails.cliWorkOrderId.workOrderNo}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {orderDetails?.cliWorkOrderId?.workOrderDate
                    ? formatDateAndTime(
                        orderDetails.cliWorkOrderId.workOrderDate,
                      )
                    : "N/A"}
                </p>
                <p>
                  <strong>IGM No:</strong>{" "}
                  {orderDetails.cliWorkOrderId.igmNo || "N/A"}
                </p>
                <p>
                  <strong>Importer Name:</strong>{" "}
                  {orderDetails.importerName || "N/A"}
                </p>
                <p>
                  <strong>CHA Name:</strong>{" "}
                  {orderDetails.cliWorkOrderId.chaName || "N/A"}
                </p>
                <p>
                  <strong>Vendor Name:</strong>{" "}
                  {orderDetails.cliWorkOrderId.vendor || "N/A"}
                </p>
              </>
            )}
          </Modal.Body>
        </Modal>
      ) : (
        ""
      )}

      {showEditForm && (
        <EditClientWorkOrder
          editingData={orderDetails}
          onBack={() => {
            setShowEditForm(false);
            setOrderDetails(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default ClientWorkOrder;
