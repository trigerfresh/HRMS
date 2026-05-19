import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row, Table } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

const Ledger = () => {
  const [searchFields, setSearchFields] = useState({
    clientName: "",
    siteName: "",
    fromDate: "",
    toDate: "",
  });
  const [clients, setClients] = useState([]);
  const [sites, setSites] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("billFormat");

  // months list

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

  const resetForm = () => {
    setSearchFields({
      clientName: "",
      siteName: "",
      fromDate: "",
      toDate: "",
    });
    setSites([]);
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
    setSites(selectedClient?.sites || []); // assuming each client has a `sites` array
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Ledger</h1>
      </div>
      {/* Search Form */}
      <Card>
        <Form>
          <Row>
            <Col md={3} className="mb-3">
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
            <Col md={3} className="mb-3">
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
            <Col md={3} className="mb-3">
              <Form.Group controlId="fromDate">
                <Form.Label>From Date</Form.Label>
                <Form.Control
                  type="date"
                  value={searchFields.fromDate}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      fromDate: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
            <Col md={3} className="mb-3">
              <Form.Group controlId="toDate">
                <Form.Label>To Date</Form.Label>
                <Form.Control
                  type="date"
                  value={searchFields.toDate}
                  onChange={(e) =>
                    setSearchFields((prev) => ({
                      ...prev,
                      toDate: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="d-flex align-items-center my-3">
            <Col md="auto">
              <Button variant="danger" className="me-2">
                <FaSearch /> Search
              </Button>
            </Col>
            <Col md="auto">
              <Button variant="primary" onClick={resetForm}>
                Reset
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            Ledger detail of {searchFields.clientName} <br /> Period :{" "}
            {`${searchFields.fromDate} - ${searchFields.toDate}`}
          </div>
          <div>
            <Button variant="danger" className="me-2">
              Print
            </Button>
            <Button variant="success">Download</Button>
          </div>
        </div>

        <Card.Title className="mb-3 text-center">
          Ledger detail of {searchFields.clientName}
          <br /> Period : {`${searchFields.fromDate} to ${searchFields.toDate}`}
        </Card.Title>
        <Table hover bordered responsive>
          <thead className="table-secondary">
            <tr>
              <th>Date</th>
              <th>Invoice No</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>Daily Attendane Bill</td>
              <td>60703</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>TAX VALUE</td>
              <td>9260</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>SALARY AMOUNT</td>
              <td>35272</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>EPF AMOUNT(Employer)</td>
              <td>5255</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>EPF ADMIN CHARGES</td>
              <td>53</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>ESIC AMOUNT(Employer)</td>
              <td>1314</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV / 1778 / 2025-26</td>
              <td style={{ fontWeight: "bold" }}>Amount Received ()</td>
              <td>(+)20000.00</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>Customize Bill</td>
              <td>50303</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>TAX VALUE</td>
              <td>9260</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>SALARY AMOUNT</td>
              <td>35272</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>EPF AMOUNT(Employer)</td>
              <td>5255</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>EPF ADMIN CHARGES</td>
              <td>53</td>
            </tr>

            <tr>
              <td>2025-10-27</td>
              <td>SV/2025-26/158</td>
              <td style={{ fontWeight: "bold" }}>ESIC AMOUNT(Employer)</td>
              <td>1314</td>
            </tr>

            <tr>
              <td style={{ fontWeight: "bold" }} colSpan="3">
                Grand Total
              </td>
              <td style={{ fontWeight: "bold" }}>28698</td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default Ledger;
