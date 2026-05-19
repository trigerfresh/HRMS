import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDDMMYYYY, numberToWords } from "../../../utils/utils";

export const PrintSaleBill = () => {
  const printData = useRef();
  const hasPrinted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [billData, setBillData] = useState({});
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = new URLSearchParams(location.search);
  const billId = params.get("saleBillId");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchBill = async () => {
    setLoading(true);
    setError(null);
    const saleBillId = billId;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/b2b/sales-bill/${saleBillId}`,
        getAuthHeaders(),
      );

      //   console.log(res.data, "asda");
      setBillData(res.data.bills[0]);
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
    fetchBill();
  }, []);

  const billingFromCompany = billData?.fromId || {};
  const billingToCompany = billData?.toId || {};

  useEffect(() => {
    // console.log(
    //   !loading && billData && location.state?.autoPrint && !hasPrinted.current,
    // );
    if (
      !loading &&
      billData &&
      location.state?.autoPrint &&
      !hasPrinted.current
    ) {
      hasPrinted.current = true;
      handlePrint();
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [loading, billData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Print Sale Bill - {billData.invoiceNo}</h1>
        <div className="page-actions">
          <Button variant="danger" onClick={handlePrint}>
            Print
          </Button>
          <Button variant="success" onClick={() => navigate("/b2b/sale-bill")}>
            Go Back
          </Button>
        </div>
      </div>
      <div ref={printData} className="print-area">
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
                <tbody>
                  <tr style={{ verticalAlign: "top" }}>
                    <td>
                      <h3>{billingFromCompany.companyName}</h3>
                      {/* <br /> */}
                      <span>{billingFromCompany.address}</span>
                      <br />
                      <span>{billingFromCompany.emailId}</span>
                      <br />
                      <span>Tel: {billingFromCompany.contactNo}</span>
                      <br />
                      <span>State: {billingFromCompany.regionState}</span>
                      <br />
                      <span>GST No: {billingFromCompany.gstNo}</span>
                      <br />
                      <span>State Code: {billingFromCompany.stateCode}</span>
                    </td>
                    <td>
                      <strong>Company Name: </strong>{" "}
                      {billingToCompany.vendorName}
                      <br />
                      <strong>Contactable Person: </strong>
                      {billingToCompany.contactablePersonName}
                      <br />
                      <strong>Address: </strong>
                      {billingToCompany.address}
                      <br />
                      <strong>State: </strong>
                      {billingToCompany.state}
                      <br />
                      <strong>State Code: </strong>
                      {billingToCompany.stateCode}
                    </td>
                    <td width={"30%"}>
                      <strong>Tax Invoice No: </strong>
                      {billData.invoiceNo}
                      <br />
                      <strong>Invoice Date: </strong>
                      {formatDDMMYYYY(billData.invoiceDate)}
                      <br />
                      <strong>Date of Supply: </strong>
                      {formatDDMMYYYY(billData.dateOfSupply)}
                      <br />
                      <strong>Place of Supply: </strong>
                      {billData.placeOfSupply}
                      <br />
                      <strong>GST No: </strong>
                      {billData.toGSTin}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <Table bordered>
                        <thead>
                          <tr>
                            <th>Sr.</th>
                            <th>Particulars</th>
                            <th>HSN</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Disc</th>
                            <th>Amount</th>
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
                                <td>
                                  {p.productName}
                                  <br />
                                  {p.CGST && `CGST: ${p.CGST} `}
                                  {p.SGST && `SGST: ${p.SGST} `}
                                  {p.IGST && `IGST: ${p.IGST} `}
                                </td>
                                <td>{p.hsn}</td>
                                <td>{p.quantity}</td>
                                <td>{p.rate}</td>
                                <td>{p.discount}</td>
                                <td>{p.amount}</td>
                              </tr>
                            ))
                          )}
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>GROSS AMT</b>
                            </td>
                            <td>{billData.grossAmount}</td>
                          </tr>
                          <tr>
                            <td></td>
                            {productDetails.reduce(
                              (total, p) => total + (p.igstAmt || 0),
                              0,
                            ) > 0 ? (
                              <>
                                <td align="right">
                                  <b>Total Paid - IGST</b>
                                </td>
                                <td>
                                  {productDetails.reduce(
                                    (total, p) => total + (p.igstAmt || 0),
                                    0,
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td align="right">
                                  <b>Total Paid - CGST</b>
                                </td>
                                <td>
                                  {productDetails.reduce(
                                    (total, p) => total + (p.cgstAmt || 0),
                                    0,
                                  )}
                                </td>
                              </>
                            )}
                            <td colSpan={3} align="right">
                              <b>Discount</b>
                            </td>
                            <td>
                              {billData.discountAmount + billData.cashDiscount}
                            </td>
                          </tr>
                          <tr>
                            <td></td>
                            {productDetails.reduce(
                              (total, p) => total + (p.igstAmt || 0),
                              0,
                            ) > 0 ? (
                              <>
                                <td></td>
                                <td></td>
                              </>
                            ) : (
                              <>
                                <td align="right">
                                  <b>Total Paid - SGST</b>
                                </td>
                                <td>
                                  {productDetails.reduce(
                                    (total, p) => total + (p.sgstAmt || 0),
                                    0,
                                  )}
                                </td>
                              </>
                            )}
                            <td colSpan={3} align="right">
                              <b>Total GST</b>
                            </td>
                            <td>{billData.totalGSTAmount}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>Round off</b>
                            </td>
                            <td>{billData.roundOff}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>Freight Charges</b>
                            </td>
                            <td>{billData.freightChargAmt}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>Handling Charges</b>
                            </td>
                            <td>{billData.handlingChargAmt}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>Packing Charges</b>
                            </td>
                            <td>{billData.packingChargAmt}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td width={"40%"}>
                              Received Date:{" "}
                              {formatDDMMYYYY(billData.receivedDate)} <br />
                              Description: {billData.description}{" "}
                            </td>
                            <td
                              colSpan={4}
                              style={{ verticalAlign: "top" }}
                              align="right"
                            >
                              <b>Received Amount</b>
                            </td>
                            <td>{billData.receivedAmt}</td>
                          </tr>
                          <tr>
                            <td></td>
                            <td colSpan={5} align="right">
                              <b>Total Payable Amount</b>
                            </td>
                            <td>{billData.totalPayableAmount}</td>
                          </tr>
                          <tr>
                            <td colSpan={7}>
                              <b>Amount in words:</b>{" "}
                              {numberToWords(billData.totalPayableAmount)}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <p>
                        <b>Terms: {billingFromCompany.termsAndCond}</b>
                      </p>
                      <center>
                        <b>Subject to Mumbai Juridiction</b>
                      </center>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ verticalAlign: "top" }}>
                      I/We here by certify that my/our registration certificate
                      under the Maharashtra GST act 2017 is in force on the on
                      which the sales of the goods specified in this tax invoice
                      ins made by me/us and that the transactions of sale
                      covered by this tax invoice has been affected by me/us and
                      it shall be accounted for in the turn over of sales while
                      filling my/our return and due tax, if any, payble on the
                      sale has been paid or shall be paid.
                      <p style={{ float: "right" }}>
                        <b>E & O.E.</b>
                      </p>
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                      }}
                      align="right"
                    >
                      <p>
                        <b>For {billingFromCompany.companyName}</b>
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
