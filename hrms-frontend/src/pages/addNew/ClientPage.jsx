import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaSearch } from "react-icons/fa";
import ClientForm from "../../components/addNew/clientPage/ClientForm";
import ClientList from "../../components/addNew/clientPage/ClientList";
import SearchPanel from "../../utils/FilterPanel";
import { Button, Modal } from "react-bootstrap";
import EditSiteRate from "../../components/addNew/clientPage/EditSiteRate";
import WORateChartForm from "../../components/addNew/clientPage/WORateChartForm";
import WagesSettings from "../../components/addNew/clientPage/WagesSettings";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = `${API_URL}/api/clients`;
const COMPANIES_API_URL = `${API_URL}/api/companies`;

const ClientPage = () => {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSiteForm, setShowSiteForm] = useState(false);
  const [showWORateForm, setShowWORateForm] = useState(false);
  const [showWagesSettingsForm, setShowWagesSettingsForm] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [viewClient, setViewClient] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Search State
  const [searchFields, setSearchFields] = useState([
    { field: "companyName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  // Helper: Token ghenyasathi
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Fetch companies for billing company dropdown
  const fetchCompanies = async () => {
    try {
      const { data } = await axios.get(COMPANIES_API_URL, getAuthHeaders());
      setCompanies(data.data || data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      console.error("Failed to fetch companies:", err);
    }
  };

  // Data Fetch Function (Search Logic sobat)
  const fetchClients = async () => {
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

      const { data } = await axios.get(API_BASE_URL, {
        params,
        ...getAuthHeaders(),
      });
      setClients(data.data || data);
      // console.log(data.data || data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError("Failed to fetch clients. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchCompanies();
  }, []);

  const handleView = (client) => {
    setViewClient(client);
    setShowViewModal(true);
  };

  const handleUpdate = async (clientId) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/${clientId}`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setEditingClient(data.data);
      setShowForm(true);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Error: ${
            error.response?.data?.message || "Failed to save site details."
          }`,
        );
    }
  };

  const handleEditSite = (siteData) => {
    setShowSiteForm(true);
    setShowForm(false);
    setEditingSite(siteData);
  };

  const handleWORateChart = (siteData) => {
    setShowWORateForm(true);
    setShowForm(false);
    setEditingSite(siteData);
  };

  const handleWagesSettings = (siteData) => {
    setShowWagesSettingsForm(true);
    setShowForm(false);
    setEditingSite(siteData);
  };

  const handleSiteUpdate = async (updatedSiteData) => {
    // console.log(updatedSiteData);
    const id = updatedSiteData.clientId?._id;
    try {
      await axios.put(
        `${API_BASE_URL}/updateClientSite/${updatedSiteData.clientId?._id}/${updatedSiteData._id}`,
        updatedSiteData,
        getAuthHeaders(),
      );
      alert("Site and Rates updated successfully!");

      const { data } = await axios.get(`${API_BASE_URL}/${id}`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setEditingClient(data.data);
      setShowForm(true);
      setShowSiteForm(false);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Error: ${
            error.response?.data?.message || "Failed to save site details."
          }`,
        );
    }
  };

  const onWagesSetSuccess = async (clientId, siteId) => {
    // console.log(siteId, clientId);
    try {
      const { data } = await axios.get(`${API_BASE_URL}/${clientId}`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setEditingClient(data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Error: ${
            error.response?.data?.message || "Failed to fetch site details."
          }`,
        );
    }
  };

  const handleDeleteSite = async (siteId, clientId) => {
    // console.log(siteId, clientId);
    const id = clientId._id;
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await axios.delete(
          `${API_BASE_URL}/deleteClientSite/${siteId}`,
          getAuthHeaders(),
        );
        // console.log("hello", res);
        alert("Site deleted successfully!");
        const { data } = await axios.get(`${API_BASE_URL}/${id}`, {
          ...getAuthHeaders(),
        });
        // console.log(data);
        setEditingClient(data.data);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          // console.log(error);
          alert(
            `Error: ${
              error.response?.data?.message || "Failed to delete client."
            }`,
          );
        }
      }
    }
  };

  // Save/Update Handler
  const handleSave = async (clientData) => {
    // console.log(clientData);
    try {
      if (editingClient) {
        await axios.put(
          `${API_BASE_URL}/${editingClient._id}`,
          clientData,
          getAuthHeaders(),
        );
        alert("Client updated successfully!");
      } else {
        await axios.post(API_BASE_URL, clientData, getAuthHeaders());
        alert("Client created successfully!");
      }
      setShowForm(false);
      setEditingClient(null);
      fetchClients();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else
        alert(
          `Error: ${error.response?.data?.message || "Failed to save client."}`,
        );
    }
  };

  // Edit Handler
  const handleEdit = async (id) => {
    // console.log(id);

    try {
      const { data } = await axios.get(`${API_BASE_URL}/${id}`, {
        ...getAuthHeaders(),
      });
      // console.log(data);
      setEditingClient(data.data);
      setShowForm(true);
      setShowSearch(false);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else alert("Failed to fetch client details.");
      console.log(err);
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await axios.delete(`${API_BASE_URL}/${id}`, getAuthHeaders());
        alert("Client deleted successfully!");
        fetchClients();
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else alert("Failed to delete client.");
      }
    }
  };

  // Search Handlers
  const handleSearch = () => {
    fetchClients();
  };

  useEffect(() => {
    fetchClients();
  }, [searchFields, dateFilter]);

  const handleReset = () => {
    setSearchFields([{ field: "companyName", keyword: "" }]);
    setDateFilter({ from: "", to: "" });
    setTimeout(() => fetchClients(), 0);
  };

  // Excel Export Handler
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

      const response = await axios.get(`${API_BASE_URL}/export`, {
        params,
        responseType: "blob", // IMPORTANT
        ...getAuthHeaders(),
      });

      // Create Excel File
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Clients_${randomNumber}.xlsx`;
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

  // Dropdown options for SearchPanel
  const searchOptions = [
    { value: "companyName", label: "Client Name" },
    { value: "contactPersonName", label: "Contact Person" },
    { value: "emailId", label: "Email ID" },
    { value: "city", label: "City" },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Client Management{" "}
          <span className="text-success">({clients.length})</span>
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
              setEditingClient(null);
              setShowSearch(false);
              setShowForm(true);
            }}
          >
            <FaPlus /> Add New
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
          onReset={handleReset}
          onDownloadExcel={handleDownloadExcel}
          searchOptions={searchOptions}
        />
      )}
      {showForm ? (
        <ClientForm
          key={editingClient ? editingClient._id : "new"}
          onSave={handleSave}
          onBack={() => {
            setShowForm(false);
            fetchClients();
            setStep(1);
          }}
          clientToEdit={editingClient}
          companies={companies}
          onUpdate={handleUpdate}
          stepCount={step}
          editSite={handleEditSite}
          woRateChart={handleWORateChart}
          wagesSettings={handleWagesSettings}
          deleteSite={handleDeleteSite}
        />
      ) : showSiteForm ? (
        <EditSiteRate
          siteData={editingSite}
          onBackSite={() => {
            setShowSiteForm(false);
            setShowForm(true);
            setStep(4);
          }}
          updateSite={handleSiteUpdate}
        />
      ) : showWORateForm ? (
        <WORateChartForm
          key={editingSite ? editingSite : "new"}
          siteData={editingSite}
          onBackForm={() => {
            setShowWORateForm(false);
            setShowForm(true);
            setStep(4);
          }}
        />
      ) : showWagesSettingsForm ? (
        <WagesSettings
          key={editingSite ? editingSite : "new"}
          siteData={editingSite}
          onBackForm={() => {
            setShowWagesSettingsForm(false);
            setShowForm(true);
            setStep(4);
          }}
          onWagesSetSuccess={onWagesSetSuccess}
        />
      ) : (
        <ClientList
          loading={loading}
          error={error}
          clients={clients}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}
      {/* Add this inside ClientPage return, after ClientList */}
      <Modal
        show={showViewModal}
        scrollable
        centered
        onHide={() => setShowViewModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Client Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewClient ? (
            <div>
              <p>
                <strong>Company Name:</strong> {viewClient.companyName}
              </p>
              <p>
                <strong>Contact No:</strong> {viewClient.contactNo || ""}
              </p>
              <p>
                <strong>Email ID:</strong> {viewClient.emailId}
              </p>
              <p>
                <strong>Contact Person:</strong> {viewClient.contactPersonName}
              </p>
              <p>
                <strong>Address:</strong> {viewClient.address || ""}
              </p>
              <p>
                <strong>City:</strong> {viewClient.city || ""}
              </p>
              <p>
                <strong>State:</strong> {viewClient.state}
              </p>
              <p>
                <strong>Pincode:</strong>
                {viewClient.pincode}
              </p>
              <p>
                <strong>GST No:</strong> {viewClient.gstNo || ""}
              </p>
            </div>
          ) : (
            <p>No data available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ClientPage;
