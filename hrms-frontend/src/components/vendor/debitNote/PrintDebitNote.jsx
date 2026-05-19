import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Form, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/images/logo2.jpg"; // 👈 tuza logo src/assets madhye
import { formatDDMMYYYY, numberToWords } from "../../../utils/utils";

const PrintDebitNote = () => {
  const printData = useRef();
  const hasPrinted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [debitNoteData, setDebitNoteData] = useState({});
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = new URLSearchParams(location.search);
  const debitNoteId = params.get("debitNoteId");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchDebitNote = async () => {
    setLoading(true);
    setError(null);
    const noteId = debitNoteId;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/b2b/debit-note/${noteId}`,
        getAuthHeaders(),
      );

      // console.log(res.data, "asda");
      setDebitNoteData(res.data.notes || {});
      setProductDetails(res.data.productDetails || []);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(e.response?.data?.message || "Failed to Fetch Invoice Data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebitNote();
  }, []);

  const fromCompany = debitNoteData?.fromId || {};
  const fromCompanyBank = debitNoteData?.fromId?.bankDetails || {};
  const toCompany = debitNoteData?.toId || {};

  useEffect(() => {
    // console.log(
    //   !loading && billData && location.state?.autoPrint && !hasPrinted.current,
    // );
    if (
      !loading &&
      debitNoteData &&
      location.state?.autoPrint &&
      !hasPrinted.current
    ) {
      hasPrinted.current = true;
      handlePrint();
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [loading, debitNoteData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          Print Invoice - {debitNoteData.invoiceNo}
        </h1>
        <div className="page-actions">
          <Button variant="danger" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="success" onClick={() => navigate("/b2b/debit-note")}>
            Go Back
          </Button>
        </div>
      </div>
      <div className="print-area" ref={printData}>
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
            <div>
              <Table bordered>
                <tbody className="table-secondary">
                  <tr>
                    <td>
                      <div className="d-flex align-items-center justify-content-around">
                        <div>
                          <img src={logo} alt="Logo" width={"100px"} />
                        </div>
                        <div
                          className="text-center px-3"
                          // style={{ fontSize: "18px" }}
                        >
                          <h3>{fromCompany.companyName}</h3>
                          <span>
                            <b>Email: {fromCompany.emailId}</b> |{" "}
                            <b>Phone : {fromCompany.contactNo}</b>
                          </span>
                          <br />
                          <span>
                            <b>GST NO: {fromCompany.gstNo}</b>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <Form.Check
                            type="checkbox"
                            id="original"
                            name="original"
                            label="Original"
                            //   checked={!!siteDetails.roundOffAmount}
                            //   onChange={handleSiteDetailChange}
                          />
                          <Form.Check
                            type="checkbox"
                            id="duplicate"
                            name="duplicate"
                            label="Duplicate"
                            //   checked={!!siteDetails.roundOffAmount}
                            //   onChange={handleSiteDetailChange}
                          />
                          <Form.Check
                            type="checkbox"
                            id="triplicate"
                            name="triplicate"
                            label="Triplicate"
                            //   checked={!!siteDetails.roundOffAmount}
                            //   onChange={handleSiteDetailChange}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Table bordered>
                <thead className="table-secondary">
                  <tr>
                    <th colSpan={2} className="text-center">
                      Debit Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ verticalAlign: "top" }}>
                    <td>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td className="fw-bold">Document No:</td>
                            <td className="fw-bold">
                              {debitNoteData.documentNo || ""}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Date Of Issue:</td>
                            <td className="fw-bold">
                              {formatDDMMYYYY(debitNoteData.issueOfDate) || ""}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">
                              State: {debitNoteData.state}
                            </td>
                            <td className="fw-bold">
                              State Code: {debitNoteData.stateCode || ""}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                    <td>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td className="fw-bold">Against Invoice:</td>
                            <td className="fw-bold">
                              {debitNoteData.invoiceNo}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Date of Invoice</td>
                            <td className="fw-bold">
                              {formatDDMMYYYY(debitNoteData.invoiceDate)}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Table bordered>
                <thead className="table-secondary">
                  <tr>
                    <th className="text-center">
                      Detail of Receiver(Billed to)
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td width={"50%"}>
                      <Table bordered>
                        <tbody>
                          <tr>
                            <td className="fw-bold">Name:</td>
                            <td className="fw-bold">{toCompany.vendorName}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Address:</td>
                            <td className="">{toCompany.address}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">GST No:</td>
                            <td className="fw-bold">{toCompany.gstNo}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">
                              State: {toCompany.state}
                            </td>
                            <td className="fw-bold">
                              State Code: {toCompany.stateCode}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                </tbody>
              </Table>

              <Table bordered>
                <thead style={{ verticalAlign: "top" }}>
                  <tr>
                    <th>Sr.</th>
                    <th className="text-wrap" width="15%">
                      Particulars (Design No & Design Name)
                    </th>
                    <th>HSN</th>
                    <th>Qty/Mtr</th>
                    <th>Rate</th>
                    <th>Taxable Value</th>
                    <th colSpan={2}>CGST</th>
                    <th colSpan={2}>SGST</th>
                    <th colSpan={2}>IGST</th>
                    <th>Total</th>
                  </tr>
                  <tr>
                    <th colSpan={6}></th>
                    <th>Rate%</th>
                    <th>Amount</th>
                    <th>Rate%</th>
                    <th>Amount</th>
                    <th>Rate%</th>
                    <th>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails.length === 0 ? (
                    <tr className="text-center">
                      <td colSpan={7}>No data found</td>
                    </tr>
                  ) : (
                    productDetails.map((p, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{p.description}</td>
                        <td>{p.hsn}</td>
                        <td>{p.quantity}</td>
                        <td>{p.rate}</td>
                        <td>{p.amount}</td>
                        <td>{p.CGST}</td>
                        <td>{p.cgstAmt}</td>
                        <td>{p.SGST}</td>
                        <td>{p.sgstAmt}</td>
                        <td>{p.IGST}</td>
                        <td>{p.igstAmt}</td>
                        <td>{p.totalAmt}</td>
                      </tr>
                    ))
                  )}

                  <tr className="fw-bold table-secondary">
                    <td style={{ textAlign: "right" }} colSpan={3}>
                      Total
                    </td>
                    <td>
                      {productDetails.reduce(
                        (total, p) => total + (p.quantity || 0),
                        0,
                      )}
                    </td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                      {productDetails.reduce(
                        (total, p) => total + (p.cgstAmt || 0),
                        0,
                      )}
                    </td>
                    <td></td>
                    <td>
                      {productDetails.reduce(
                        (total, p) => total + (p.sgstAmt || 0),
                        0,
                      )}
                    </td>
                    <td></td>
                    <td>
                      {productDetails.reduce(
                        (total, p) => total + (p.igstAmt || 0),
                        0,
                      )}
                    </td>
                    <td>
                      {productDetails.reduce(
                        (total, p) => total + (p.totalAmt || 0),
                        0,
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={13}>
                      <div
                        className="float-start fw-bold"
                        style={{ width: "75%" }}
                      >
                        Total Amount in Words:{" "}
                        {numberToWords(debitNoteData.totalPayableAmount)}
                      </div>
                      <div className="float-end" style={{ width: "25%" }}>
                        <Table bordered>
                          <tbody>
                            <tr>
                              <td>Total Amount Before Tax</td>
                              <td>{debitNoteData.discountedAmount}</td>
                            </tr>
                            <tr>
                              <td>Total CGST</td>
                              <td>
                                {productDetails.reduce(
                                  (total, p) => total + (p.cgstAmt || 0),
                                  0,
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Total SGST</td>
                              <td>
                                {productDetails.reduce(
                                  (total, p) => total + (p.sgstAmt || 0),
                                  0,
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td>Total IGST</td>
                              <td>
                                {productDetails.reduce(
                                  (total, p) => total + (p.igstAmt || 0),
                                  0,
                                )}
                              </td>
                            </tr>
                            <tr className="fw-bold">
                              <td>Grand Total</td>
                              <td>{debitNoteData.totalPayableAmount}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </Table>
              <Table bordered>
                <thead className="table-secondary">
                  <tr>
                    <th>Bank Details</th>
                    <th style={{ width: "35%" }}>GST on Reverse Charge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    style={{
                      verticalAlign: "top",
                    }}
                  >
                    <td>
                      Bank Name: {fromCompanyBank.bankName}
                      <br />
                      A/C No: {fromCompanyBank.accountNo}
                      <br />
                      Bank IFSC: {fromCompanyBank.ifsc}
                    </td>
                    <td align="right">
                      <p>
                        <b>For {fromCompany.companyName}</b>
                      </p>
                      <br />
                      <br />
                      <br />
                      <br />
                      <p>
                        <b>Authorised Signatory</b>
                      </p>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PrintDebitNote;
