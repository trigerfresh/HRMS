import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";
import { Alert, Button, Card, Table } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { formatDDMMYYYY } from "../../../utils/utils";

const PrintClientWorkOrder = () => {
  const printData = useRef();
  const hasPrinted = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [orderData, setOrderData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const params = new URLSearchParams(location.search);
  const orderItemId = params.get("orderId");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    const orderId = orderItemId;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/client-work-order/${orderId}`,
        getAuthHeaders(),
      );

      //   console.log(res.data, "asda");
      setOrderData(res.data || {});
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError(e.response?.data?.message || "Failed to Fetch Order Data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  useEffect(() => {
    // console.log(
    //   !loading && billData && location.state?.autoPrint && !hasPrinted.current,
    // );
    if (
      !loading &&
      orderData &&
      location.state?.autoPrint &&
      !hasPrinted.current
    ) {
      hasPrinted.current = true;
      handlePrint();
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [loading, orderData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Print Work Order</h1>
        <div className="page-actions">
          <Button variant="danger" onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="success"
            onClick={() => navigate("/work-order/client-work-order")}
          >
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
                <tbody>
                  <tr>
                    <td className="p-0">
                      <Table bordered className="m-0">
                        <tbody>
                          <tr>
                            <td className="border-start border-end"></td>
                            <td className="border-start border-end"></td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="text-center fw-bold p-1">
                        Import-Hub - Work Order For -{" "}
                        {orderData?.workOrderType?.name}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-0">
                      <Table bordered className="m-0">
                        <tbody>
                          <tr>
                            <td className="border-start border-end">
                              <b>Work Order No: </b>{" "}
                              {orderData?.cliWorkOrderId?.workOrderNo}
                            </td>
                            <td className="border-start border-end">
                              <b>Work Order Date: </b>{" "}
                              {orderData?.cliWorkOrderId?.workOrderDate
                                ? formatDDMMYYYY(
                                    orderData.cliWorkOrderId.workOrderDate,
                                  )
                                : ""}
                            </td>
                          </tr>
                          <tr>
                            <td className="border-start border-end">
                              <b>IGM No: </b> {orderData?.cliWorkOrderId?.igmNo}
                            </td>
                            <td className="border-start border-end">
                              <b>Importer Name: </b>{" "}
                              {orderData?.cliWorkOrderId?.importerName}
                            </td>
                          </tr>
                          <tr>
                            <td className="border-start border-end">
                              <b>CHA Name: </b>{" "}
                              {orderData?.cliWorkOrderId?.chaName}
                            </td>
                            <td className="border-start border-end">
                              <b>Vendor: </b>{" "}
                              {orderData?.cliWorkOrderId?.vendor}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <Table bordered>
                        <thead>
                          <tr>
                            <th>Sr No</th>
                            <th>Item No.</th>
                            <th>Container No.</th>
                            <th>Size</th>
                            <th>Seal No</th>
                            <th>Vehicle No</th>
                            <th>Arrival Date</th>
                            <th>Total Cargo Pkgs</th>
                            <th>Total Cargo Weight</th>
                            <th>Destuff Pkgs</th>
                            <th>Destuff Weight</th>
                            <th>% Exam</th>
                            <th>Equipment Name</th>
                            <th>Remarks</th>
                            <th>Hours</th>
                            <th>CBM</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>1</td>
                            <td>{orderData?.itemNo}</td>
                            <td>{orderData?.containerNo}</td>
                            <td>{orderData?.size}</td>
                            <td>{orderData?.sealNo}</td>
                            <td>{orderData?.vehichleNo}</td>
                            <td>
                              {orderData?.arrivalDate
                                ? formatDDMMYYYY(orderData.arrivalDate)
                                : ""}
                            </td>

                            <td>{orderData?.totalCargoPkgSum}</td>
                            <td>{orderData?.totalCargoWgtSum}</td>
                            <td>{orderData?.destuffPkgs}</td>
                            <td>{orderData?.destuffWgt}</td>
                            <td>{orderData?.exam}</td>
                            <td>
                              {orderData?.equipmentType?.length
                                ? orderData.equipmentType.map((e, i) => (
                                    <span key={e._id || i}>
                                      {e.label}
                                      {i !== orderData.equipmentType.length - 1
                                        ? " / "
                                        : ""}
                                    </span>
                                  ))
                                : ""}
                            </td>
                            <td>{orderData?.remarks}</td>
                            <td>{orderData?.hours}</td>
                            <td>{orderData?.cbm}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-0">
                      <Table bordered className="m-0">
                        <tbody>
                          <tr>
                            <td
                              className="border-0"
                              style={{ paddingTop: "100px" }}
                            >
                              <b>
                                Signature
                                <br />
                                (Of CHA)
                              </b>
                            </td>
                            <td
                              className="border-0"
                              style={{ paddingTop: "100px" }}
                            >
                              <b>
                                Signature
                                <br />
                                (Executive)
                              </b>
                            </td>
                            <td
                              className="border-0"
                              style={{ paddingTop: "100px" }}
                            >
                              <b>Vendor</b>
                            </td>
                            <td
                              className="border-0"
                              style={{ paddingTop: "100px" }}
                            >
                              <b>( Signature Of Custom Officer)</b>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
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

export default PrintClientWorkOrder;
