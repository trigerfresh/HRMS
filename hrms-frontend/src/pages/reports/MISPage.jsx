import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Nav, Row, Tab, Tabs } from "react-bootstrap";
import { FaPlus, FaSearch } from "react-icons/fa";
import BillFormat from "../../components/reports/MISPage/BillFormat";
import SalaryWagesSheet from "../../components/reports/MISPage/SalaryWagesSheet";
import BankTrfSheet from "../../components/reports/MISPage/BankTrfSheet";
import AllPaySlip from "../../components/reports/MISPage/AllPaySlip";
import SinglePaySlip from "../../components/reports/MISPage/SinglePaySlip";
import CsvForPf from "../../components/reports/MISPage/CsvForPf";
import CsvForEsic from "../../components/reports/MISPage/CsvForEsic";
import MIS from "../../components/reports/MISPage/MIS";

const MISPage = () => {
  const monthList = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [searchFields, setSearchFields] = useState({
    clientName: "",
    siteName: "",
    employeeName: "",
    month: monthList[new Date().getMonth()],
    year: new Date().getFullYear(),
  });
  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [dataFetched, setDataFetched] = useState(false); // controls tabs visibility
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("billFormat");

  // Helper: Token ghenyasathi
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // Data Fetch Function (Search Logic sobat)
  const fetchClients = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/clients`,
        getAuthHeaders(),
      );
      setClients(data.data || data);
    } catch (err) {
      setError("Failed to fetch clients. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const tabs = [
    "billFormat",
    "salaryWagesSheet",
    "bankTrfSheet",
    "allPaySlip",
    "singlePaySlip",
    "csvForPf",
    "csvForEsic",
    "mis",
  ];

  const tabTitles = {
    billFormat: "Bill Format",
    salaryWagesSheet: "Salary Wages Sheet",
    bankTrfSheet: "Bank TRF Sheet",
    allPaySlip: "All Pay Slip",
    singlePaySlip: "Single Pay Slip",
    csvForPf: "CSV FOR PF",
    csvForEsic: "CSV FOR ESIC",
    mis: "MIS",
  };

  const resetForm = () => {
    setSearchFields({
      clientName: "",
      employeeName: "",
      siteName: "",
      month: monthList[new Date().getMonth()],
      year: new Date().getFullYear(),
    });
    setSites([]);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      // const { data } = await axios.get(
      //   `${import.meta.env.VITE_API_URL}/api/salaries?client=${searchFields.clientName}&site=${searchFields.siteName}&month=${searchFields.month}&year=${searchFields.year}`,
      //   getAuthHeaders()
      // );
      // setSalaryData(data); // store salary/employees list
      setDataFetched(true); // show tabs
    } catch (err) {
      setError("Failed to fetch salary data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setSearchFields((prev) => ({
      ...prev,
      clientName: clientId,
      siteName: "",
    }));

    // Find the selected client in the clients array
    const selectedClient = clients.find((c) => c._id === clientId);

    // Update sites dropdown
    setSites(selectedClient?.sites || []); // each client has a `sites` array
  };

  const renderTabContent = () => {
    // const props = { searchFields, clients, sites, salaryData };
    switch (activeTab) {
      case "billFormat":
        return <BillFormat />;
      case "salaryWagesSheet":
        return <SalaryWagesSheet />;
      case "bankTrfSheet":
        return <BankTrfSheet />;
      case "allPaySlip":
        return <AllPaySlip />;
      case "singlePaySlip":
        return <SinglePaySlip />;
      case "csvForPf":
        return <CsvForPf />;
      case "csvForEsic":
        return <CsvForEsic />;
      case "mis":
        return <MIS />;
      default:
        return <div>Select a tab to see content.</div>;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">MIS</h1>
      </div>
      {/* Search Form */}
      <Card>
        <Form>
          <Row>
            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group controlId="client_company_name">
                <Form.Label>Client/Company</Form.Label>
                <Form.Select
                  value={searchFields.clientName}
                  onChange={handleClientChange}
                >
                  <option value="">Select</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.companyName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group controlId="client_site">
                <Form.Label>Select Site</Form.Label>
                <Form.Select
                  value={searchFields.siteName}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      siteName: e.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  {sites.map((site) => (
                    <option key={site._id} value={site._id}>
                      {site.siteName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {activeTab === "singlePaySlip" && (
              <Col xs={12} sm={6} md={3} className="mb-3">
                <Form.Group controlId="employee">
                  <Form.Label>Select Employee</Form.Label>
                  <Form.Select
                    value={searchFields.employeeName}
                    onChange={(e) =>
                      setSearchFields((prev) => ({
                        ...prev,
                        employeeName: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {[].map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group controlId="month">
                <Form.Label>Select Month</Form.Label>
                <Form.Select
                  value={searchFields.month}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      month: e.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  {monthList.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6} md={3} className="mb-3">
              <Form.Group controlId="year">
                <Form.Label>Select Year</Form.Label>
                <Form.Select
                  value={searchFields.year}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="d-flex align-items-center my-3">
            <Col xs={12} sm="auto" className="mb-2 mb-sm-0">
              <Button variant="danger" className="me-2" onClick={handleSearch}>
                <FaSearch /> Search
              </Button>
            </Col>
            <Col xs={12} sm="auto">
              <Button variant="primary" onClick={resetForm}>
                Reset
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {dataFetched && (
        <Card>
          <Tab.Container
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
          >
            <Nav variant="pills" fill className="mb-3">
              {tabs.map((tab) => (
                <Nav.Item key={tab}>
                  <Nav.Link eventKey={tab}>{tabTitles[tab]}</Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            <Tab.Content>{renderTabContent()}</Tab.Content>
          </Tab.Container>
        </Card>
      )}

      {/* <Card>
        <Tab.Container defaultActiveKey="billFormat">
          <Nav
            variant="pills"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            fill
            className="mb-3"
          >
            {tabs.map((tab) => (
              <Nav.Item key={tab}>
                <Nav.Link eventKey={tab}>{tabTitles[tab]}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <Tab.Content>{renderTabContent(activeTab)}</Tab.Content>
        </Tab.Container>
      </Card> */}
    </div>
  );
};

export default MISPage;
