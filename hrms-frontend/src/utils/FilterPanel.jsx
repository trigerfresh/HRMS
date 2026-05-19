import React from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { FaPlus, FaTimes } from "react-icons/fa";

const FilterPanel = ({
  searchFields,
  setSearchFields,
  dateFilter,
  setDateFilter,
  // monthYearFilter,
  // setMonthYearFilter,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onSearch,
  onReset,
  onDownloadExcel,
  searchOptions,
  filterMode = "date",
  showDownload = true,
}) => {
  const handleFieldChange = (index, e) => {
    const updated = [...searchFields];
    updated[index][e.target.name] = e.target.value;
    setSearchFields(updated);
  };

  const addField = () => {
    setSearchFields([
      ...searchFields,
      { field: searchOptions[0]?.value || "", keyword: "" },
    ]);
  };

  const removeField = (index) => {
    setSearchFields(searchFields.filter((_, i) => i !== index));
  };

  return (
    <Card className="filter-card">
      {/* --- Keyword Search Row --- */}
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(e);
        }}
      >
        {searchFields.map((item, index) => (
          <Row key={index} className="filter-row align-items-center g-3 mb-2">
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Select
                name="field"
                id="field"
                value={item.field}
                onChange={(e) => handleFieldChange(index, e)}
              >
                {searchOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col xs={12} sm={6} md={6} className="mb-3">
              <Form.Control
                type="text"
                name="keyword"
                id="keyword"
                placeholder="Enter Keyword"
                value={item.keyword}
                onChange={(e) => handleFieldChange(index, e)}
              />
            </Col>

            <Col xs="auto" className="mb-3">
              {index === searchFields.length - 1 ? (
                <Button
                  variant="success"
                  onClick={addField}
                  className="filter-btn-add"
                >
                  <FaPlus />
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => removeField(index)}
                  className="filter-btn-remove"
                >
                  <FaTimes />
                </Button>
              )}
            </Col>
          </Row>
        ))}

        {/* --- Date Filter Row --- */}
        {/* <Row className="filter-row align-items-end g-3">
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>Date Filter</Form.Label>
            <Form.Select>
              <option>Created On</option>
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>From</Form.Label>
            <Form.Control
              type="date"
              value={dateFilter.from}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, from: e.target.value })
              }
            />
          </Col>

          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>To</Form.Label>
            <Form.Control
              type="date"
              value={dateFilter.to}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, to: e.target.value })
              }
            />
          </Col>
        </Row> */}

        {/* --- Conditional Filter Section --- */}
        {filterMode === "date" && (
          <Row className="filter-row align-items-end g-3">
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Label>Date Filter</Form.Label>
              <Form.Select>
                <option>Created On</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Label>From</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter.from}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, from: e.target.value })
                }
              />
            </Col>

            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Label>To</Form.Label>
              <Form.Control
                type="date"
                value={dateFilter.to}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, to: e.target.value })
                }
              />
            </Col>
          </Row>
        )}

        {filterMode === "month-year" && (
          <Row className="filter-row align-items-end g-3">
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Label>Month</Form.Label>
              <Form.Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">Select Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </Form.Select>
            </Col>

            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Label>Year</Form.Label>
              <Form.Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Select Year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </Form.Select>
            </Col>
          </Row>
        )}

        {/* --- Action Buttons --- */}
        <Row className="form-actions g-2 d-flex justify-content-end">
          <Col xs="auto">
            <Button
              type="submit"
              variant="warning"
              className="filter-btn-primary"
              onClick={onSearch}
            >
              Search
            </Button>
          </Col>
          <Col xs="auto">
            <Button
              variant="danger"
              className="filter-btn-secondary"
              onClick={onReset}
            >
              Reset
            </Button>
          </Col>
          {showDownload && (
            <Col xs="auto">
              <Button
                variant="success"
                className="filter-btn-excel"
                onClick={onDownloadExcel}
              >
                Download Excel
              </Button>
            </Col>
          )}
        </Row>
      </Form>
    </Card>
  );
};

export default FilterPanel;
