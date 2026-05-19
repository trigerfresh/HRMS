import axios from "axios";
import React from "react";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Alert, Button, Card, Col, Row, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AttendancePrintPage = () => {
  const printRec = useRef();
  const hasPrinted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(window.location.search);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };
  //   console.log(params);
  const fetchPrintData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/api/attendance/printData`, {
        params,
        ...getAuthHeaders(),
      });
      //   console.log(response.data, "data");
      setData(response.data);
    } catch (err) {
      //   console.log(err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else setError(err.response?.data?.message || "Failed to fetch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrintData();
  }, []);

  useEffect(() => {
    if (!loading && data && location.state?.autoPrint && !hasPrinted.current) {
      handlePrint();
      hasPrinted.current = true;
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [loading, data]);

  const clientDetails = data?.clientDetails || {};
  const billingCompany = data?.billingCompanyDetails || {};
  const siteDetails = data?.siteDetails || {};
  const attendanceRec = data?.rec || [];

  const getMonthName = (monthNumber) => {
    return new Date(0, monthNumber - 1).toLocaleString("en-US", {
      month: "long",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    try {
      const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);

      const response = await axios.get(
        `${API_URL}/api/attendance/exportPrintData`,
        {
          params,
          responseType: "blob", // IMPORTANT
          ...getAuthHeaders(),
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `AttendancePrint_${randomNumber}.xlsx`;
      link.click();
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      console.error("Excel download error:", error);
      alert("Failed to download Excel. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Print Attendance Sheet - {clientDetails?.companyName}
        </h1>
        <div className="page-actions">
          <Button variant="danger" onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="success"
            onClick={() => navigate("/attendance/attendance-by-employee")}
          >
            Go Back
          </Button>
          <Button variant="success" onClick={handleDownloadExcel}>
            Download
          </Button>
        </div>
      </div>
      <div ref={printRec} className="print-invoice">
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
            <>
              <h2 className="text-center">{billingCompany?.companyName}</h2>
              <div
                style={{
                  border: "none",
                  fontSize: "18px",
                  textAlign: "center",
                }}
              >
                <p className="mb-0">
                  {billingCompany?.address} {billingCompany?.city} -{" "}
                  {billingCompany?.pinCode}
                </p>
                <p className="mb-0">
                  REGISTER OFFICE: {billingCompany?.address} City:{" "}
                  {billingCompany?.city} State: {billingCompany?.state} Pincode:{" "}
                  {billingCompany?.pinCode}
                </p>
                <p className="mb-0">
                  Tel.: {billingCompany?.contactNo} E-mail:{" "}
                  {billingCompany?.emailId}
                </p>
              </div>
              <hr />
              <Row
                className="mb-3 d-flex justify-content-around flex-nowrap"
                style={{ fontSize: "18px" }}
              >
                <Col className="text-center">
                  <b>Site Name</b> : {siteDetails.siteName}
                </Col>
                <Col className="text-center">
                  <b>Month</b> : {getMonthName(attendanceRec[0]?.month)}
                </Col>
                <Col className="text-center">
                  <b>Year</b> : {attendanceRec[0]?.year}
                </Col>
              </Row>
              <Row className="mb-3">
                <Table bordered responsive hover>
                  <thead className="table-secondary">
                    <tr>
                      <th>Sr.No.</th>
                      <th>Employee Name</th>
                      <th>Employee Code</th>
                      <th>Rank</th>
                      <th>P.F.</th>
                      <th>ESIC.</th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (num) => (
                          <th key={num}>{num}</th>
                        ),
                      )}
                      <th>N.D.</th>
                      <th>O.T.</th>
                      <th>O.T./HRS</th>
                      <th>Off</th>
                      <th>Holiday</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRec.length === 0 ? (
                      <tr className="text-center">
                        <td colSpan={43}>No data found</td>
                      </tr>
                    ) : (
                      <>
                        {attendanceRec.map((a, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{a.employeeName}</td>
                            <td>{a.employeeCode}</td>
                            <td>{a.designation}</td>
                            <td>{a.pf}</td>
                            <td>{a.esic}</td>
                            {Object.entries(a.attendance).map(
                              ([day, value]) => (
                                <td key={day}>{value}</td>
                              ),
                            )}
                            <td>{a.totalPresentDays || 0}</td>
                            <td>{a.totalOT || 0}</td>
                            <td>{a.totalOTHour || 0}</td>
                            <td>{a.totalWeekOffs || 0}</td>
                            <td>{a.totalOTHolidays || 0}</td>
                            <td>{a.total || 0}</td>
                          </tr>
                        ))}
                        <tr className="fw-bold">
                          <td colSpan={6}></td>

                          {/* <td>
                      {attendanceRec.reduce((sum, a) => sum + (a.pf || 0), 0)}
                    </td>
                    <td>
                      {attendanceRec.reduce((sum, a) => sum + (a.esic || 0), 0)}
                    </td> */}

                          {Array.from({ length: 31 }, (_, i) => {
                            const day = (i + 1).toString();

                            const totalForDay = attendanceRec.reduce(
                              (sum, a) =>
                                sum + (a.attendance?.[day] === "P" ? 1 : 0),
                              0,
                            );

                            return <td key={day}>{totalForDay}</td>;
                          })}

                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.totalPresentDays || 0),
                              0,
                            )}
                          </td>
                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.totalOT || 0),
                              0,
                            )}
                          </td>
                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.totalOTHour || 0),
                              0,
                            )}
                          </td>
                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.totalWeekOffs || 0),
                              0,
                            )}
                          </td>
                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.totalOTHolidays || 0),
                              0,
                            )}
                          </td>
                          <td>
                            {attendanceRec.reduce(
                              (sum, a) => sum + (a.total || 0),
                              0,
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </Table>
              </Row>
              <hr />
              <div className="my-5"></div>
              <Row
                className="mb-3 d-flex justify-content-around flex-nowrap"
                style={{ fontSize: "18px" }}
              >
                <Col className="text-center">
                  <b>Signature of Manager :</b>
                </Col>
                <Col className="text-center">
                  <b>Signature of site incharge :</b>
                </Col>
              </Row>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AttendancePrintPage;
