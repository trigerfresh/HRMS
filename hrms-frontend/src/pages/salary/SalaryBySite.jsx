import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { Button, Card, Table } from "react-bootstrap";
import FilterPanel from "../../utils/FilterPanel";

const API = `${import.meta.env.VITE_API_URL}/api/salary/site`;

export default function SalaryBySite({ data }) {
  const [rows, setRows] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [searchFields, setSearchFields] = useState([
    { field: "clientName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  useEffect(() => {
    setRows(data.rows);
    setSummary(data.summary);
  }, []);

  // months list
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

  return (
    <div className="page-container">
      <div className="my-3">
        {/* Colored summary */}
        <div className="site-main-summary text-center">
          <span className="text-success">
            Total Sites: {summary.totalSites || 0}
          </span>{" "}
          |
          <span className="text-success">
            {" "}
            Total Salary: {summary.totalSalary || 0}
          </span>{" "}
          |
          <span className="text-danger">
            {" "}
            Deduction: {summary.deduction || 0}
          </span>{" "}
          |
          <span className="text-primary">
            {" "}
            Net Payable: {summary.netPayable || 0}
          </span>{" "}
          |
          <span className="text-primary">
            {" "}
            Total Invoice Amount: {summary.totalInvoiceAmount || 0}
          </span>{" "}
          |<span className="text-success"> Total Salary Paid: 0</span> |
          <span className="text-danger">
            {" "}
            Total Salary Unpaid: {summary.netPayable || 0}
          </span>
        </div>
        <hr />
        <div
          className="site-detail-summary text-center"
          style={{ color: "#bc711b" }}
        >
          Total Advance: 0 | Total P.T.: 0 | Total PF: 0 | Total ESIC: 0 | Total
          Uniform Charges: 0 | Total Other Charges: 0
        </div>
        {/* Table */}
        <div className="salarysite-tablebox">
          <Table bordered hover responsive className="mt-3">
            <thead className="table-secondary">
              <tr>
                <th>Sr No.</th>
                <th>Client Name</th>
                <th>Month-Year</th>
                <th>Total Earning(Rs)</th>
                <th>Advance</th>
                <th>PT</th>
                <th>PF</th>
                <th>ESIC</th>
                <th>Uniform</th>
                <th>Other</th>
                <th>Net Payable(Rs)</th>
                <th>Total invoice amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="text-center">
                  <td colSpan={13}>No data</td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={row._id}>
                    <td>{idx + 1}</td>
                    <td>
                      {row.clientName}
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Client Code: {row.clientCode}
                      </div>
                    </td>
                    <td>{row.monthYear}</td>
                    <td>{row.totalEarning}</td>
                    <td>{row.advance}</td>
                    <td>{row.pt}</td>
                    <td>{row.pf}</td>
                    <td>{row.esic}</td>
                    <td>{row.uniform}</td>
                    <td>{row.other}</td>
                    <td>{row.netPayable}</td>
                    <td>{row.totalInvoiceAmount}</td>
                    <td>
                      <div className="table-actions">
                        <button className="tb-action-btn view">By Site</button>
                        <button className="tb-action-btn edit">
                          By Employee
                        </button>
                        <button className="tb-action-btn delete">
                          Update salary paid/unpaid | Hold Salary
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
