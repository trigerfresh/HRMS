import React, { useEffect, useState } from "react";
import axios from "axios";
import FilterPanel from "../../utils/FilterPanel";
import { FaSearch } from "react-icons/fa";
import { Button, Card, Table } from "react-bootstrap";

const API_EMP_SALARY = `${import.meta.env.VITE_API_URL}/api/salary/employee`;

export default function SalaryByEmployee({ data }) {
  const [salaries, setSalaries] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchOptions = [
    { label: "Employee Name", value: "employeeName" },
    { label: "Employee Code", value: "employeeCode" },
    { label: "Rank", value: "rank" },
  ];
  const [searchFields, setSearchFields] = useState([
    { field: "employeeName", keyword: "" },
  ]);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  useEffect(() => {
    // fetchSalaries();
    setSalaries(data);
  }, []);

  return (
    <div className="page-container">
      <div className="my-3">
        <Table hover bordered responsive className="salary-table">
          <thead className="table-secondary">
            <tr>
              <th>Sr. No.</th>
              <th>Employee Name</th>
              <th>Employee Code</th>
              <th>Rank</th>
              <th>Month-Year</th>
              <th>Total Earning(Rs)</th>
              <th>Total Deduction(Rs)</th>
              <th>Net Payable(Rs)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {salaries.length === 0 ? (
              <tr className="text-center">
                <td colSpan={9}>No data</td>
              </tr>
            ) : (
              salaries.map((s, idx) => (
                <tr key={s._id}>
                  <td>{idx + 1}</td>
                  <td>{s.employeeName}</td>
                  <td>{s.employeeCode}</td>
                  <td>{s.rank}</td>
                  <td>{s.monthYear}</td>
                  <td>{s.totalEarning}</td>
                  <td>{s.totalDeduction}</td>
                  <td>{s.netPayable}</td>
                  <td>
                    <button
                      className="salary-print-btn"
                      onClick={() => window.print()}
                    >
                      Print
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
