import React, { useEffect, useState } from "react";
import { Button, Card, Table } from "react-bootstrap";

const SalaryWagesSheet = () => {
  const [totals, setTotals] = useState({
    monthDay: 0,
    presentDays: 0,
    otDay: 0,
    weeklyOff: 0,
    totalSalaryDays: 0,
    fixedGross: { basic: 0, hra: 0, otRate: 0, totalGross: 0 },
    earned: { basic: 0, hra: 0, otAmount: 0, totalEarned: 0 },
    deductions: {
      wagesPf: 0,
      wagesEsic: 0,
      epf: 0,
      esic: 0,
      totalDeduction: 0,
    },
    contributions: { epf: 0, esic: 0, subTotal: 0 },
    netSalary: 0,
    serviceCharges: 0,
    taxBefore: 0,
    cgst: 0,
    sgst: 0,
    taxInvoice: 0,
  });
  // Employee data
  const employees = [
    {
      slNo: 1,
      name: "Ruchita D",
      designation: "ACCOUNT EXECUTIVE",
      empCode: 4792,
      monthDay: 31,
      presentDays: 24,
      otDay: 1,
      weeklyOff: 4,
      totalSalaryDays: 29,
      fixedGross: {
        basic: 20000,
        hra: 1500,
        otRate: 100,
        totalGross: 21500,
      },
      earned: {
        basic: 18709.68,
        hra: 1403.23,
        otAmount: 100,
        totalEarned: 20212.91,
      },
      deductions: {
        wagesPf: 20212.91,
        wagesEsic: 20212.91,
        epf: 2425.55,
        esic: 151.6,
        totalDeduction: 2577.15,
      },
      contributions: {
        epf: 17635.76,
        esic: 2627.68,
        subTotal: 656.92,
      },
      netSalary: 23597.51,
      serviceCharges: 2123.78,
      taxBefore: 25721.29,
      cgst: 2314.92,
      sgst: 2314.92,
      taxInvoice: 30351.12,
    },
  ];

  // Function to calculate totals
  const calculateTotals = (employees) => {
    return employees.reduce(
      (totals, emp) => {
        totals.monthDay += emp.monthDay;
        totals.presentDays += emp.presentDays;
        totals.otDay += emp.otDay;
        totals.weeklyOff += emp.weeklyOff;
        totals.totalSalaryDays += emp.totalSalaryDays;

        totals.fixedGross.basic += emp.fixedGross.basic;
        totals.fixedGross.hra += emp.fixedGross.hra;
        totals.fixedGross.otRate += emp.fixedGross.otRate;
        totals.fixedGross.totalGross += emp.fixedGross.totalGross;

        totals.earned.basic += emp.earned.basic;
        totals.earned.hra += emp.earned.hra;
        totals.earned.otAmount += emp.earned.otAmount;
        totals.earned.totalEarned += emp.earned.totalEarned;

        totals.deductions.wagesPf += emp.deductions.wagesPf;
        totals.deductions.wagesEsic += emp.deductions.wagesEsic;
        totals.deductions.epf += emp.deductions.epf;
        totals.deductions.esic += emp.deductions.esic;
        totals.deductions.totalDeduction += emp.deductions.totalDeduction;

        totals.contributions.epf += emp.contributions.epf;
        totals.contributions.esic += emp.contributions.esic;
        totals.contributions.subTotal += emp.contributions.subTotal;

        totals.netSalary += emp.netSalary;
        totals.serviceCharges += emp.serviceCharges;
        totals.taxBefore += emp.taxBefore;
        totals.cgst += emp.cgst;
        totals.sgst += emp.sgst;
        totals.taxInvoice += emp.taxInvoice;

        return totals;
      },
      {
        monthDay: 0,
        presentDays: 0,
        otDay: 0,
        weeklyOff: 0,
        totalSalaryDays: 0,
        fixedGross: { basic: 0, hra: 0, otRate: 0, totalGross: 0 },
        earned: { basic: 0, hra: 0, otAmount: 0, totalEarned: 0 },
        deductions: {
          wagesPf: 0,
          wagesEsic: 0,
          epf: 0,
          esic: 0,
          totalDeduction: 0,
        },
        contributions: { epf: 0, esic: 0, subTotal: 0 },
        netSalary: 0,
        serviceCharges: 0,
        taxBefore: 0,
        cgst: 0,
        sgst: 0,
        taxInvoice: 0,
      }
    );
  };

  useEffect(() => {
    const totalsResult = calculateTotals(employees);
    setTotals(totalsResult);
    // console.log(totalsResult);
  }, []);

  return (
    <div>
      <Card.Header className="page-header mb-4">
        <p className="fs-5 fw-normal mb-0">Print Wages Sheet (Techbharti) </p>
        <div className="page-actions">
          <Button variant="danger">Print</Button>
          <Button variant="success">Download</Button>
        </div>
      </Card.Header>

      <Table bordered responsive hover>
        <thead className="table-secondary">
          <tr>
            <th rowSpan={2}>SL.NO.</th>
            <th rowSpan={2}>NAME OF EMPLOYEE</th>
            <th rowSpan={2}>DESIGNATION</th>
            <th rowSpan={2}>EMP CODE</th>
            <th rowSpan={2}>MONTH DAY</th>
            <th rowSpan={2}>PRESENT DAYS</th>
            <th rowSpan={2}>OT DAY</th>
            <th rowSpan={2}>WEEKLY OFF</th>
            <th rowSpan={2}>TOTAL SALARY DAYS</th>
            <th colSpan={4} style={{ textAlign: "center" }}>
              FIX GROSS COMPONENTS
            </th>
            <th colSpan={4} style={{ textAlign: "center" }}>
              EARNED COMPONENTS
            </th>
            <th></th>
            <th></th>
            <th colSpan={3} style={{ textAlign: "center" }}>
              DEDUCTIONS
            </th>
            <th rowSpan={2}>NET SALARY</th>
            <th colSpan={3} style={{ textAlign: "center" }}>
              CONTRIBUTIONS
            </th>
            <th rowSpan={2}>SERVICE CHARGES</th>
            <th rowSpan={2}>TAX VALUE BEFORE TAX</th>
            <th rowSpan={2}>CGST</th>
            <th rowSpan={2}>SGST</th>
            <th rowSpan={2}>TAX INVOICE VALUE</th>
          </tr>
          <tr>
            <th>BASIC</th>
            <th>HRA</th>
            <th>OT RATE</th>
            <th>TOTAL GROSS</th>

            <th>BASIC</th>
            <th>HRA</th>
            <th>OT AMOUNT</th>
            <th>TOTAL EARNED</th>

            <th>WAGES FOR PF</th>
            <th>WAGES FOR ESIC</th>
            <th>EPF</th>
            <th>ESIC</th>

            <th>TOTAL DEDUCTION</th>

            <th>EPF</th>
            <th>ESIC</th>
            <th>Sub Total</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.slNo}>
              <td>{emp.slNo}</td>
              <td>{emp.name}</td>
              <td>{emp.designation}</td>
              <td>{emp.empCode}</td>
              <td>{emp.monthDay}</td>
              <td>{emp.presentDays}</td>
              <td>{emp.otDay}</td>
              <td>{emp.weeklyOff}</td>
              <td>{emp.totalSalaryDays}</td>

              <td>{emp.fixedGross.basic}</td>
              <td>{emp.fixedGross.hra}</td>
              <td>{emp.fixedGross.otRate}</td>
              <td>{emp.fixedGross.totalGross}</td>

              <td>{emp.earned.basic}</td>
              <td>{emp.earned.hra}</td>
              <td>{emp.earned.otAmount}</td>
              <td>{emp.earned.totalEarned}</td>

              <td>{emp.deductions.wagesPf}</td>
              <td>{emp.deductions.wagesEsic}</td>
              <td>{emp.deductions.epf}</td>
              <td>{emp.deductions.esic}</td>
              <td>{emp.deductions.totalDeduction}</td>

              <td>{emp.contributions.epf}</td>
              <td>{emp.contributions.esic}</td>
              <td>{emp.contributions.subTotal}</td>

              <td>{emp.netSalary}</td>
              <td>{emp.serviceCharges}</td>
              <td>{emp.taxBefore}</td>
              <td>{emp.cgst}</td>
              <td>{emp.sgst}</td>
              <td>{emp.taxInvoice}</td>
            </tr>
          ))}

          {/* Totals row */}
          {totals && (
            <tr style={{ fontWeight: "bold" }}>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td>{totals.monthDay}</td>
              <td>{totals.presentDays}</td>
              <td>{totals.otDay}</td>
              <td>{totals.weeklyOff}</td>
              <td>{totals.totalSalaryDays}</td>

              <td>{totals.fixedGross.basic}</td>
              <td>{totals.fixedGross.hra}</td>
              <td>{totals.fixedGross.otRate}</td>
              <td>{totals.fixedGross.totalGross}</td>

              <td>{totals.earned.basic}</td>
              <td>{totals.earned.hra}</td>
              <td>{totals.earned.otAmount}</td>
              <td>{totals.earned.totalEarned}</td>

              <td>{totals.deductions.wagesPf}</td>
              <td>{totals.deductions.wagesEsic}</td>
              <td>{totals.deductions.epf}</td>
              <td>{totals.deductions.esic}</td>
              <td>{totals.deductions.totalDeduction}</td>

              <td>{totals.contributions.epf}</td>
              <td>{totals.contributions.esic}</td>
              <td>{totals.contributions.subTotal}</td>

              <td>{totals.netSalary}</td>
              <td>{totals.serviceCharges}</td>
              <td>{totals.taxBefore}</td>
              <td>{totals.cgst}</td>
              <td>{totals.sgst}</td>
              <td>{totals.taxInvoice}</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default SalaryWagesSheet;
