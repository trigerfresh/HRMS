import React, { useState, useEffect } from "react";
import { Button, Card, Tab, Tabs } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import SalaryByEmployee from "./SalaryByEmployee";
import SalaryBySite from "./SalaryBySite";
import FilterPanel from "../../utils/FilterPanel";

const API_EMP_SALARY = `${import.meta.env.VITE_API_URL}/api/salary/employee`;
const API_SITE_SALARY = `${import.meta.env.VITE_API_URL}/api/salary/site`;

const SalarySlipByEmployeePage = () => {
  const [activeTab, setActiveTab] = useState("salaryByEmployee");
  const [showSearch, setShowSearch] = useState(false);

  // Separate filters for both tabs
  const [employeeFilters, setEmployeeFilters] = useState({
    searchFields: [{ field: "employeeName", keyword: "" }],
    dateFilter: { from: "", to: "" },
  });

  const [siteFilters, setSiteFilters] = useState({
    searchFields: [{ field: "clientName", keyword: "" }],
    dateFilter: { from: "", to: "" },
  });

  // Data for both tabs
  const [employeeData, setEmployeeData] = useState([]);
  const [siteData, setSiteData] = useState({ rows: [], summary: {} });

  // Fetch salary by employee
  const fetchEmployeeData = async () => {
    const { searchFields, dateFilter } = employeeFilters;
    const params = [];
    const searchVal = searchFields.map((f) => f.keyword).join(" ");
    if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);
    if (dateFilter.from && dateFilter.to)
      params.push(`from=${dateFilter.from}&to=${dateFilter.to}`);

    const { data } = await axios.get(
      `${API_EMP_SALARY}${params.length ? `?${params.join("&")}` : ""}`,
    );
    setEmployeeData(data);
  };

  // Fetch salary by site
  const fetchSiteData = async () => {
    const { searchFields, dateFilter } = siteFilters;
    const params = [];
    const searchVal = searchFields.map((f) => f.keyword).join(" ");
    if (searchVal) params.push(`search=${encodeURIComponent(searchVal)}`);
    if (dateFilter.from && dateFilter.to)
      params.push(`from=${dateFilter.from}&to=${dateFilter.to}`);

    const { data } = await axios.get(
      `${API_SITE_SALARY}${params.length ? `?${params.join("&")}` : ""}`,
    );
    setSiteData(data);
  };

  // Handle search
  const handleSearch = () => {
    if (activeTab === "salaryByEmployee") fetchEmployeeData();
    else fetchSiteData();
  };

  // Handle reset
  const handleReset = () => {
    if (activeTab === "salaryByEmployee") {
      setEmployeeFilters({
        searchFields: [{ field: "employeeName", keyword: "" }],
        dateFilter: { from: "", to: "" },
      });
      fetchEmployeeData();
    } else {
      setSiteFilters({
        searchFields: [{ field: "clientName", keyword: "" }],
        dateFilter: { from: "", to: "" },
      });
      fetchSiteData();
    }
  };

  // Handle download
  const handleDownload = () => {
    if (activeTab === "salaryByEmployee")
      window.open("/api/salary/employee/excel-template", "_blank");
    else window.open("/api/salary/site/excel-template", "_blank");
  };

  // Fetch both on mount
  useEffect(() => {
    fetchEmployeeData();
    fetchSiteData();
  }, []);

  // Select filters dynamically based on active tab
  const currentFilters =
    activeTab === "salaryByEmployee" ? employeeFilters : siteFilters;
  const setCurrentFilters =
    activeTab === "salaryByEmployee" ? setEmployeeFilters : setSiteFilters;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Salary Slip</h1>
        <div className="page-actions">
          <button
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            <FaSearch /> {showSearch ? "Hide Search" : "Search"}
          </button>
          <Button variant="danger" onClick={handleDownload}>
            Download Report
          </Button>
        </div>
      </div>

      {/* 🔍 Filter Panel (Above Tabs) */}
      {showSearch && (
        <FilterPanel
          searchFields={currentFilters.searchFields}
          setSearchFields={(fields) =>
            setCurrentFilters((prev) => ({ ...prev, searchFields: fields }))
          }
          dateFilter={currentFilters.dateFilter}
          setDateFilter={(dates) =>
            setCurrentFilters((prev) => ({ ...prev, dateFilter: dates }))
          }
          onSearch={handleSearch}
          onReset={handleReset}
          onDownloadExcel={handleDownload}
          searchOptions={
            activeTab === "salaryByEmployee"
              ? [
                  { label: "Employee Name", value: "employeeName" },
                  { label: "Employee Code", value: "employeeCode" },
                  { label: "Rank", value: "rank" },
                ]
              : [
                  { label: "Client Name", value: "clientName" },
                  { label: "Client Code", value: "clientCode" },
                  { label: "Site Name", value: "siteName" },
                ]
          }
        />
      )}

      {/* Tabs Section */}
      <Card>
        <Tabs
          activeKey={activeTab}
          fill
          className="mb-3"
          id="salary-tabs"
          onSelect={(k) => setActiveTab(k)}
        >
          <Tab eventKey="salaryByEmployee" title="Salary By Employee">
            <SalaryByEmployee data={employeeData} />
          </Tab>
          <Tab eventKey="salaryBySite" title="Salary By Site">
            <SalaryBySite data={siteData} />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
};

export default SalarySlipByEmployeePage;
