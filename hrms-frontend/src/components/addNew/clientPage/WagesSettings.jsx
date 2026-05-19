import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { Alert, Button, Card, Col, Form, Row, Table } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const WagesSettings = ({ siteData, onBackForm, onWagesSetSuccess }) => {
  const [siteDetails, setSiteDetails] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  useEffect(() => {
    if (siteData) setSiteDetails(siteData);
  }, [siteData]);

  const getWagesSettings = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/clients/getWagesSettings/${siteData._id}`,
        getAuthHeaders(),
      );
      // console.log(data);
      setSiteDetails(data.data || {});
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        console.log(e);
        setError(
          e.response?.data?.message || "Failed to fetch Wages Settings.",
        );
      }
    }
  };
  const globalRef = React.useRef(null);

  useEffect(() => {
    if (!globalRef.current) return;

    globalRef.current.indeterminate = isGlobalIndeterminate();
  }, [siteDetails]);

  const PRIMARY_KEYS = [
    "srNo",
    "nameOfEmployee",
    "dob",
    "mobileNo",
    "aadhar",
    "pan",
    "bankName",
    "acNo",
    "ifsc",
    "doj",
    "designation",
    "empCode",
    "pf",
    "uan",
    "esicIp",
    "monthDay",
    "presentDays",
    "absentDays",
    "otDay",
    "weeklyOff",
    "paidLeaves",
    "halfDay",
    "totalSalaryDays",
  ];

  const FIX_GROSS_KEYS = [
    "basic",
    "vda",
    "hra",
    "specialAllowance",
    "otherAllowance",
    "otRate",
    "lww",
    "bonus",
    "leaveWages",
    "rateOrDay",
    "anyOther",
    "totalGross",
  ];

  const EARNED_COMPONENTS_KEYS = [
    "basic",
    "vda",
    "hra",
    "specialAllowance",
    "otherAllowance",
    "otAmount",
    "lww",
    "bonus",
    "leaveWages",
    "anyOther",
    "totalEarned",
  ];

  const DEDUCTIONS_KEYS = [
    "epf",
    "esic",
    "pt",
    "mlwf",
    "advance",
    "loan",
    "uniform",
    "id",
    "recovery",
    "installments",
    "anyother",
    "totalDeduction",
  ];

  const CONTRIBUTIONS_KEYS = ["epf", "esic", "mlwf", "uniform", "subtotal"];

  const GLOBAL_ROOT_KEYS = [
    "multiplyOTHours",
    "calculateUniformDays",
    "calculateEarnedGrossWithoutOT",
  ];

  const ALL_SINGLE_KEYS = [
    "wagesForPf",
    "wagesForEsic",
    "netSalary",
    "arrearsPayable",
    "salaryPayable",
    "serviceCharges",
    "taxValueBeforeTax",
    "cgst",
    "sgst",
    "igst",
    "taxInvoiceValue",
  ];

  const ALL_GROUPS = {
    primaryDetail: PRIMARY_KEYS,
    fixGrossComponents: FIX_GROSS_KEYS,
    earnedComponents: EARNED_COMPONENTS_KEYS,
    deductions: DEDUCTIONS_KEYS,
    contributions: CONTRIBUTIONS_KEYS,
  };

  const toggleGlobalSelectAll = () => {
    setSiteDetails((prev) => {
      const updatedWages = prev.wagesSettings || {};
      let isAnyUnchecked = false;

      // ✅ Check grouped wagesSettings
      Object.entries(ALL_GROUPS).forEach(([section, keys]) => {
        keys.forEach((k) => {
          if (!updatedWages?.[section]?.[k]) {
            isAnyUnchecked = true;
          }
        });
      });

      // ✅ Check single wagesSettings keys
      ALL_SINGLE_KEYS.forEach((k) => {
        if (!updatedWages?.[k]) {
          isAnyUnchecked = true;
        }
      });

      // ✅ Check ROOT-LEVEL flags (your 3 checkboxes)
      GLOBAL_ROOT_KEYS.forEach((k) => {
        if (!prev?.[k]) {
          isAnyUnchecked = true;
        }
      });

      // ✅ Apply the new value everywhere
      const newWages = { ...updatedWages };

      Object.entries(ALL_GROUPS).forEach(([section, keys]) => {
        newWages[section] = { ...(newWages[section] || {}) };
        keys.forEach((k) => {
          newWages[section][k] = isAnyUnchecked;
        });
      });

      ALL_SINGLE_KEYS.forEach((k) => {
        newWages[k] = isAnyUnchecked;
      });

      return {
        ...prev,
        // ✅ Update root keys also
        ...Object.fromEntries(GLOBAL_ROOT_KEYS.map((k) => [k, isAnyUnchecked])),
        wagesSettings: newWages,
      };
    });
  };

  const isGlobalChecked = () => {
    const wagesChecked =
      Object.entries(ALL_GROUPS).every(([section, keys]) =>
        keys.every((k) => siteDetails?.wagesSettings?.[section]?.[k]),
      ) && ALL_SINGLE_KEYS.every((k) => siteDetails?.wagesSettings?.[k]);

    const rootChecked = GLOBAL_ROOT_KEYS.every((k) => siteDetails?.[k]);

    return wagesChecked && rootChecked;
  };

  const isGlobalIndeterminate = () => {
    let checked = 0;
    let total = 0;

    // grouped
    Object.entries(ALL_GROUPS).forEach(([section, keys]) => {
      keys.forEach((k) => {
        total++;
        if (siteDetails?.wagesSettings?.[section]?.[k]) checked++;
      });
    });

    // single wagesSettings
    ALL_SINGLE_KEYS.forEach((k) => {
      total++;
      if (siteDetails?.wagesSettings?.[k]) checked++;
    });

    // ✅ ROOT 3
    GLOBAL_ROOT_KEYS.forEach((k) => {
      total++;
      if (siteDetails?.[k]) checked++;
    });

    return checked > 0 && checked < total;
  };

  const handleToggle = (field) => {
    setSiteDetails((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleWagesToggle = (section, key) => {
    setSiteDetails((prev) => ({
      ...prev,
      wagesSettings: {
        ...prev.wagesSettings,
        [section]: {
          ...prev.wagesSettings?.[section],
          [key]: !prev.wagesSettings?.[section]?.[key],
        },
      },
    }));
  };

  const handleKeyToggle = (e, callback) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  const toggleWholeSection = (sectionName, keys) => {
    setSiteDetails((prev) => {
      const currentSection = prev.wagesSettings?.[sectionName] || {};

      const isAnyUnchecked = keys.some((k) => !currentSection[k]);

      const updatedSection = {};
      keys.forEach((k) => {
        updatedSection[k] = isAnyUnchecked; // if any unchecked → check all
      });

      return {
        ...prev,
        wagesSettings: {
          ...prev.wagesSettings,
          [sectionName]: {
            ...currentSection,
            ...updatedSection,
          },
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        multiplyOTHours: siteDetails.multiplyOTHours,
        calculateUniformDays: siteDetails.calculateUniformDays,
        calculateEarnedGrossWithoutOT:
          siteDetails.calculateEarnedGrossWithoutOT,
        pfWagesCalculatedOn: siteDetails.pfWagesCalculatedOn,
        ESICWagesCalculatedOn: siteDetails.ESICWagesCalculatedOn,
        CTCCalculate: siteDetails.CTCCalculate,
        wagesSettings: siteDetails.wagesSettings,
      };

      const config = {
        headers: {
          ...getAuthHeaders().headers,
        },
      };
      await axios.put(
        `${API_URL}/api/clients/updateWagesSettings/${siteDetails.clientId?._id}/${siteDetails._id}`,
        payload,
        config,
      );
      alert("Wages Settings updated successfully!");
      getWagesSettings();
      onWagesSetSuccess(siteDetails.clientId?._id, siteDetails._id);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        alert(
          `Operation failed: ${err.response?.data?.message || "Server error"}`,
        );
      }
    }
  };

  return (
    <Card>
      <div>
        <h2 className="form-title card-header mb-4">
          Wages Setting - ({siteDetails.clientId?.companyName}) -{" "}
          {siteDetails.siteName} ({siteDetails.clientCode})
        </h2>
      </div>
      {error ? (
        <Alert variant="danger" className="mb-3 text-center">
          {error}
        </Alert>
      ) : (
        ""
      )}

      <Form>
        <Row>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Check
              type="checkbox"
              name="multiplyOTHours"
              label="Multiply OT wages with working hours"
              checked={!!siteDetails.multiplyOTHours}
              onChange={() => handleToggle("multiplyOTHours")}
              onKeyDown={(e) =>
                handleKeyToggle(e, () => handleToggle("multiplyOTHours"))
              }
            />
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Check
              type="checkbox"
              name="calculateUniformDays"
              label="Calculate uniform/other charges based on days"
              checked={!!siteDetails.calculateUniformDays}
              onChange={() => handleToggle("calculateUniformDays")}
              onKeyDown={(e) =>
                handleKeyToggle(e, () => handleToggle("calculateUniformDays"))
              }
            />
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Check
              type="checkbox"
              name="calculateEarnedGrossWithoutOT"
              label="Calculate earned gross without OT"
              checked={!!siteDetails.calculateEarnedGrossWithoutOT}
              onChange={() => handleToggle("calculateEarnedGrossWithoutOT")}
              onKeyDown={(e) =>
                handleKeyToggle(e, () =>
                  handleToggle("calculateEarnedGrossWithoutOT"),
                )
              }
            />
          </Col>
        </Row>

        <hr />

        <Row>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>PF Wages Calculated On</Form.Label>
            <Form.Select
              value={siteDetails.pfWagesCalculatedOn || ""}
              onChange={(e) =>
                setSiteDetails({
                  ...siteDetails,
                  pfWagesCalculatedOn: e.target.value,
                })
              }
            >
              <option value="">Select</option>
              <option>GROSS</option>
              <option>BASIC</option>
              <option>GROSS-HRA</option>
              <option>GROSS-HRA-BONUS</option>
              <option>BASIC+SPECIAL ALLOW</option>
              <option>BASIC+OTHER ALLOW</option>
            </Form.Select>
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>ESIC Wages Calculated On</Form.Label>
            <Form.Select
              value={siteDetails.ESICWagesCalculatedOn || ""}
              onChange={(e) =>
                setSiteDetails({
                  ...siteDetails,
                  ESICWagesCalculatedOn: e.target.value,
                })
              }
            >
              <option value="">Select</option>
              <option>GROSS</option>
              <option>BASIC</option>
              <option>GROSS-OTHER ALLOW</option>
              <option>BASIC+HRA</option>
            </Form.Select>
          </Col>
          <Col xs={12} sm={6} md={4} className="mb-3">
            <Form.Label>CTC Calculated On</Form.Label>
            <Form.Select
              value={siteDetails.CTCCalculate || ""}
              onChange={(e) =>
                setSiteDetails({
                  ...siteDetails,
                  CTCCalculate: e.target.value,
                })
              }
            >
              <option value="">Select</option>
              <option>NET SALARY+SERVICE CHARGES</option>
              <option>NET SALARY+TOTAL CONTRIBUTION+BONUS</option>
            </Form.Select>
          </Col>
        </Row>
        <hr />

        <Form.Check className="fw-bold mb-3 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="globalSelectAll"
            checked={isGlobalChecked()}
            // ref={(el) => {
            //   if (el) el.indeterminate = isGlobalIndeterminate();
            // }}
            onChange={toggleGlobalSelectAll}
            onKeyDown={(e) => handleKeyToggle(e, toggleGlobalSelectAll)}
          />

          <Form.Check.Label htmlFor="globalSelectAll" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">Select All</p>
          </Form.Check.Label>
        </Form.Check>

        <Form.Check className="fw-bold mb-2 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="selectAllPrimary"
            checked={PRIMARY_KEYS.every(
              (k) => siteDetails?.wagesSettings?.primaryDetail?.[k],
            )}
            onChange={() => toggleWholeSection("primaryDetail", PRIMARY_KEYS)}
            onKeyDown={(e) =>
              handleKeyToggle(e, () =>
                toggleWholeSection("primaryDetail", PRIMARY_KEYS),
              )
            }
          />

          <Form.Check.Label htmlFor="selectAllPrimary" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">Primary Detail</p>
          </Form.Check.Label>
        </Form.Check>

        <Row>
          {[
            ["srNo", "SR.NO."],
            ["nameOfEmployee", "NAME OF EMPLOYEE"],
            ["dob", "DOB"],
            ["mobileNo", "MOBILE NO"],
            ["aadhar", "AADHAR"],
            ["pan", "PAN"],
            ["bankName", "BANK NAME"],
            ["acNo", "AC NO"],
            ["ifsc", "IFSC"],
            ["doj", "DOJ"],
            ["designation", "DESIGNATION"],
            ["empCode", "EMP CODE"],
            ["pf", "PF"],
            ["uan", "UAN"],
            ["esicIp", "ESIC IP"],
            ["monthDay", "MONTH DAY"],
            ["presentDays", "PRESENT DAYS"],
            ["absentDays", "ABSENT DAYS"],
            ["otDay", "OT DAY"],
            ["weeklyOff", "WEEKLY OFF"],
            ["paidLeaves", "PAID LEAVES"],
            ["halfDay", "HALF DAY"],
            ["totalSalaryDays", "TOTAL SALARY DAYS"],
          ].map(([key, label]) => (
            <Col md={3} key={key}>
              <Form.Check
                label={label}
                checked={!!siteDetails?.wagesSettings?.primaryDetail?.[key]}
                onChange={() => handleWagesToggle("primaryDetail", key)}
                onKeyDown={(e) =>
                  handleKeyToggle(e, () =>
                    handleWagesToggle("primaryDetail", key),
                  )
                }
              />
            </Col>
          ))}
        </Row>
        <hr />

        <Form.Check className="fw-bold mb-2 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="selectAllFixGross"
            checked={FIX_GROSS_KEYS.every(
              (k) => siteDetails?.wagesSettings?.fixGrossComponents?.[k],
            )}
            onChange={() =>
              toggleWholeSection("fixGrossComponents", FIX_GROSS_KEYS)
            }
            onKeyDown={(e) =>
              handleKeyToggle(e, () =>
                toggleWholeSection("fixGrossComponents", FIX_GROSS_KEYS),
              )
            }
          />

          <Form.Check.Label htmlFor="selectAllFixGross" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">FIX GROSS COMPONENTS</p>
          </Form.Check.Label>
        </Form.Check>
        <Row>
          {[
            ["basic", "BASIC"],
            ["vda", "VDA"],
            ["hra", "HRA"],
            ["specialAllowance", "SPECIAL ALLOWANCE"],
            ["otherAllowance", "OTHER ALLOWANCE"],
            ["otRate", "OT RATE"],
            ["lww", "LWW"],
            ["bonus", "BONUS"],
          ].map(([key, label]) => (
            <Col md={3} key={key}>
              <Form.Check
                label={label}
                checked={
                  !!siteDetails?.wagesSettings?.fixGrossComponents?.[key]
                }
                onChange={() => handleWagesToggle("fixGrossComponents", key)}
                onKeyDown={(e) =>
                  handleKeyToggle(e, () =>
                    handleWagesToggle("fixGrossComponents", key),
                  )
                }
              />
            </Col>
          ))}
        </Row>
        <hr />
        <Form.Check className="fw-bold mb-2 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="selectAllEarnedComp"
            checked={EARNED_COMPONENTS_KEYS.every(
              (k) => siteDetails?.wagesSettings?.earnedComponents?.[k],
            )}
            onChange={() =>
              toggleWholeSection("earnedComponents", EARNED_COMPONENTS_KEYS)
            }
            onKeyDown={(e) =>
              handleKeyToggle(e, () =>
                toggleWholeSection("earnedComponents", EARNED_COMPONENTS_KEYS),
              )
            }
          />

          <Form.Check.Label htmlFor="selectAllEarnedComp" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">EARNED COMPONENTS</p>
          </Form.Check.Label>
        </Form.Check>
        <Row>
          {[
            ["basic", "BASIC"],
            ["vda", "VDA"],
            ["hra", "HRA"],
            ["specialAllowance", "SPECIAL ALLOWANCE"],
            ["otherAllowance", "OTHER ALLOWANCE"],
            ["otAmount", "OT AMOUNT"],
            ["lww", "LWW"],
            ["bonus", "BONUS"],
            ["leaveWages", "LEAVE WAGES"],
            ["anyOther", "ANY OTHER"],
            ["totalEarned", "TOTAL EARNED"],
          ].map(([key, label]) => (
            <Col md={3} key={key}>
              <Form.Check
                label={label}
                checked={!!siteDetails?.wagesSettings?.earnedComponents?.[key]}
                onChange={() => handleWagesToggle("earnedComponents", key)}
                onKeyDown={(e) =>
                  handleKeyToggle(e, () =>
                    handleWagesToggle("earnedComponents", key),
                  )
                }
              />
            </Col>
          ))}
        </Row>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="wagesForPf"
            checked={!!siteDetails?.wagesSettings?.wagesForPf}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  wagesForPf: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    wagesForPf: !prev?.wagesSettings?.wagesForPf,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="wagesForPf" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">WAGES FOR PF</p>
          </Form.Check.Label>
        </Form.Check>
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="wagesForEsic"
            checked={!!siteDetails?.wagesSettings?.wagesForEsic}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  wagesForEsic: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    wagesForEsic: !prev?.wagesSettings?.wagesForEsic,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="wagesForEsic" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">WAGES FOR ESIC</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="fw-bold mb-2 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="selectAllDeductions"
            checked={DEDUCTIONS_KEYS.every(
              (k) => siteDetails?.wagesSettings?.deductions?.[k],
            )}
            onChange={() => toggleWholeSection("deductions", DEDUCTIONS_KEYS)}
            onKeyDown={(e) =>
              handleKeyToggle(e, () =>
                toggleWholeSection("deductions", DEDUCTIONS_KEYS),
              )
            }
          />

          <Form.Check.Label htmlFor="selectAllDeductions" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">DEDUCTIONS</p>
          </Form.Check.Label>
        </Form.Check>
        <Row>
          {[
            ["epf", "EPF"],
            ["esic", "ESIC"],
            ["pt", "PT"],
            ["mlwf", "MLWF"],
            ["advance", "ADVANCE"],
            ["loan", "LOAN"],
            ["uniform", "UNIFORM"],
            ["id", "ID"],
            ["recovery", "RECOVERY"],
            ["installments", "INSTALLMETS"],
            ["anyother", "ANY OTHER"],
            ["totalDeduction", "TOTAL DEDUCTION"],
          ].map(([key, label]) => (
            <Col md={3} key={key}>
              <Form.Check
                label={label}
                checked={!!siteDetails?.wagesSettings?.deductions?.[key]}
                onChange={() => handleWagesToggle("deductions", key)}
                onKeyDown={(e) =>
                  handleKeyToggle(e, () => handleWagesToggle("deductions", key))
                }
              />
            </Col>
          ))}
        </Row>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="netSalary"
            checked={!!siteDetails?.wagesSettings?.netSalary}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  netSalary: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    netSalary: !prev?.wagesSettings?.netSalary,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="netSalary" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">NET SALARY</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="arrearsPayable"
            checked={!!siteDetails?.wagesSettings?.arrearsPayable}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  arrearsPayable: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    arrearsPayable: !prev?.wagesSettings?.arrearsPayable,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="arrearsPayable" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">ARREARS PAYABLE</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="salaryPayable"
            checked={!!siteDetails?.wagesSettings?.salaryPayable}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  salaryPayable: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    salaryPayable: !prev?.wagesSettings?.salaryPayable,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="salaryPayable" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">SALARY PAYABLE</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="fw-bold mb-2 d-flex align-items-center">
          <Form.Check.Input
            type="checkbox"
            id="selectAllContributions"
            checked={CONTRIBUTIONS_KEYS.every(
              (k) => siteDetails?.wagesSettings?.contributions?.[k],
            )}
            onChange={() =>
              toggleWholeSection("contributions", CONTRIBUTIONS_KEYS)
            }
            onKeyDown={(e) =>
              handleKeyToggle(e, () =>
                toggleWholeSection("contributions", CONTRIBUTIONS_KEYS),
              )
            }
          />

          <Form.Check.Label
            htmlFor="selectAllContributions"
            className="ms-2 m-0"
          >
            <p className="mb-0 form-subtitle">CONTRIBUTIONS</p>
          </Form.Check.Label>
        </Form.Check>
        <Row>
          {[
            ["epf", "EPF"],
            ["esic", "ESIC"],
            ["mlwf", "MLWF"],
            ["uniform", "Uniform/Helmet/TShirt/Any Other"],
            ["subtotal", "SUB TOTAL"],
          ].map(([key, label]) => (
            <Col md={3} key={key}>
              <Form.Check
                label={label}
                checked={!!siteDetails?.wagesSettings?.contributions?.[key]}
                onChange={() => handleWagesToggle("contributions", key)}
                onKeyDown={(e) =>
                  handleKeyToggle(e, () =>
                    handleWagesToggle("contributions", key),
                  )
                }
              />
            </Col>
          ))}
        </Row>

        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="serviceCharges"
            checked={!!siteDetails?.wagesSettings?.serviceCharges}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  serviceCharges: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    serviceCharges: !prev?.wagesSettings?.serviceCharges,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="serviceCharges" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">SERVICE CHARGES</p>
          </Form.Check.Label>
        </Form.Check>

        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="taxValueBeforeTax"
            checked={!!siteDetails?.wagesSettings?.taxValueBeforeTax}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  taxValueBeforeTax: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    taxValueBeforeTax: !prev?.wagesSettings?.taxValueBeforeTax,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="taxValueBeforeTax" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">TAX VALUE BEFORE TAX</p>
          </Form.Check.Label>
        </Form.Check>

        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="cgst"
            checked={!!siteDetails?.wagesSettings?.cgst}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  cgst: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    cgst: !prev?.wagesSettings?.cgst,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="cgst" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">CGST</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="sgst"
            checked={!!siteDetails?.wagesSettings?.sgst}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  sgst: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    sgst: !prev?.wagesSettings?.sgst,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="sgst" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">SGST</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="igst"
            checked={!!siteDetails?.wagesSettings?.igst}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  igst: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    igst: !prev?.wagesSettings?.igst,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="igst" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">IGST</p>
          </Form.Check.Label>
        </Form.Check>
        <hr />
        <Form.Check className="d-flex align-items-center mb-3">
          <Form.Check.Input
            type="checkbox"
            id="taxInvoiceValue"
            checked={!!siteDetails?.wagesSettings?.taxInvoiceValue}
            onChange={(e) =>
              setSiteDetails((prev) => ({
                ...prev,
                wagesSettings: {
                  ...prev.wagesSettings,
                  taxInvoiceValue: e.target.checked,
                },
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSiteDetails((prev) => ({
                  ...prev,
                  wagesSettings: {
                    ...prev.wagesSettings,
                    taxInvoiceValue: !prev?.wagesSettings?.taxInvoiceValue,
                  },
                }));
              }
            }}
          />

          <Form.Check.Label htmlFor="taxInvoiceValue" className="ms-2 m-0">
            <p className="mb-0 form-subtitle">TAX INVOICE VALUE</p>
          </Form.Check.Label>
        </Form.Check>
      </Form>
      <div className="form-actions d-flex justify-content-end align-items-center mt-3">
        <Button
          variant="secondary"
          type="button"
          className="me-2"
          onClick={onBackForm}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          className="me-2"
          onClick={handleSubmit}
        >
          Submit
        </Button>
      </div>
    </Card>
  );
};

export default WagesSettings;
