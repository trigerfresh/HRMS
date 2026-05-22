// src/App.jsx (Updated with all Master Routes)
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Layout and Authentication
import MainLayout from './layouts/MainLayout'

// Pages
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
// === MASTER Pages ===
import CompanyPage from './pages/master/CompanyPage'
import BranchPage from './pages/master//BranchPage'
import UserPage from './pages/master/UserPage'
import UserAccessPage from './pages/master/UserAccessPage' // <-- IMPORT KARA
import ClientPage from './pages/addNew/ClientPage'
import Holiday from './pages/addNew/Holiday'
import EmployeeTypePage from './pages/employee/EmployeeTypePage'
import EmployeePages from './pages/employee/EmployeePages'
import AddEmployee from './components/employee/employeePage/AddEmployee' // Path to your form import AttendanceByEmployeePage from './pages/AttendanceByEmployeePage'; // <-- IMPORT THIS
import AttendanceByEmployeePage from './pages/attendance/AttendanceByEmployeePage'
import ManpowerAttendance from './pages/attendance/ManpowerAttendance' // <-- IMPORT THIS
import SalaryTemplatePage from './pages/addNew/SalaryTemplatePage'
import ChargesMasterPage from './pages/addNew/ChargesMasterPage'
import BillingPage from './pages/billing/BillingPage'
import UploadWagesSheet from './pages/salary/UploadWagesSheet'
import VoucherPage from './pages/vouchers/VoucherPage'
import SalarySlipByEmployeePage from './pages/salary/SalarySlipByEmployeePage'
import SalarySlipBySitePage from './pages/salary/SalarySlipBySitePage'
import MISPage from './pages/reports/MISPage'
import Ledger from './pages/reports/Ledger'
import Invoice from './components/attendance/Invoice'
import AttendancePrintPage from './components/attendance/AttendancePrintPage'
import PrintPaymentHistory from './components/billing/PrintPaymentHistory'
import PrintInvoice from './components/billing/PrintInvoice'
import ClientWorkOrder from './pages/workOrder/client/ClientWorkOrder'
import WorkOrderTypePage from './pages/addNew/WorkOrderTypePage'
import TotalClientWorkOrder from './components/workOrder/client/TotalClientWorkOrder'
import EquipmentTypeMasterPage from './pages/addNew/EquipmentMasterPage'
import GangMasterPage from './pages/addNew/GangMasterPage'
import VendorsMaster from './pages/addNew/VendorsMaster'
import B2BSaleBill from './pages/vendor/B2BSaleBill'
import B2BPurchaseBill from './pages/vendor/B2BPurchaseBill'
import B2BDebitNote from './pages/vendor/B2BDebitNote'
import B2BCreditNote from './pages/vendor/B2BCreditNote'
import { PrintSaleBill } from './components/vendor/saleBill/PrintSaleBill'
import PrintCreditNote from './components/vendor/creditNote/PrintCreditNote'
import PrintDebitNote from './components/vendor/debitNote/PrintDebitNote'
import PrintClientWorkOrder from './components/workOrder/client/PrintClientWorkOrder'

// PrivateRoute Component (Login check sathi)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Private Routes (Layout sobat) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          {/* Default page */}
          <Route index element={<Dashboard />} />

          {/* ======================================================= */}
          {/* === MASTER Module che 4 Routes ithe define kara === */}
          {/* ======================================================= */}
          <Route path="/master/companies" element={<CompanyPage />} />
          <Route path="/master/branches" element={<BranchPage />} />
          <Route path="/master/users" element={<UserPage />} />
          <Route path="/master/user-role-access" element={<UserAccessPage />} />
          {/* ======================================================= */}

          {/* ADD NEW aani baki modules che routes ithe add karal */}
          <Route path="/add-new/client" element={<ClientPage />} />
          <Route path="/add-new/holidays" element={<Holiday />} />
          <Route
            path="/add-new/salary-template"
            element={<SalaryTemplatePage />}
          />
          <Route path="/add-new/charges-type" element={<ChargesMasterPage />} />
          <Route
            path="/add-new/equipment-type"
            element={<EquipmentTypeMasterPage />}
          />
          <Route
            path="/add-new/work-order-type"
            element={<WorkOrderTypePage />}
          />
          <Route path="/add-new/gang-master" element={<GangMasterPage />} />
          <Route path="/add-new/vendors" element={<VendorsMaster />} />
          <Route
            path="/salary/salary-by-employee"
            element={<SalarySlipByEmployeePage />}
            // element={<SalaryByEmployee />}
          />
          <Route
            path="/salary/salary-by-site"
            // element={<SalaryBySite />}
            element={<SalarySlipBySitePage />}
          />
          <Route
            path="/salary/upload-wages-sheet"
            element={<UploadWagesSheet />}
          />

          <Route
            path="/employee/employee-type"
            element={<EmployeeTypePage />}
          />
          <Route path="/employee/employee" element={<EmployeePages />} />
          <Route path="/employees/add" element={<AddEmployee />} />
          <Route
            path="/attendance/attendance-by-employee"
            element={<AttendanceByEmployeePage />}
          />
          <Route path="/attendance/print" element={<AttendancePrintPage />} />
          <Route
            path="/attendance/time---rokada-base-attendance"
            element={<ManpowerAttendance />}
          />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/billing/review" element={<Invoice />} />
          <Route
            path="/billing/print-payment-history"
            element={<PrintPaymentHistory />}
          />
          <Route path="/billing/print-invoice" element={<PrintInvoice />} />
          <Route path="/vouchers" element={<VoucherPage />} />
          <Route path="/b2b/sale-bill" element={<B2BSaleBill />} />
          <Route path="/b2b/view-sale-bill" element={<PrintSaleBill />} />
          <Route path="/b2b/purchase-bill" element={<B2BPurchaseBill />} />
          <Route path="/b2b/debit-note" element={<B2BDebitNote />} />
          <Route path="/b2b/view-debit-note" element={<PrintDebitNote />} />
          <Route path="/b2b/credit-note" element={<B2BCreditNote />} />
          <Route path="/b2b/view-credit-note" element={<PrintCreditNote />} />
          <Route
            path="/work-order/client-work-order"
            element={<ClientWorkOrder />}
          />
          <Route
            path="/work-order/client-work-order/print"
            element={<PrintClientWorkOrder />}
          />
          <Route
            path="/work-order/total-work-order/:clientId"
            element={<TotalClientWorkOrder />}
          />
          <Route
            path="/work-order/gang-work-order"
            element={<ClientWorkOrder />}
          />
          <Route path="/reports/mis" element={<MISPage />} />
          <Route path="/reports/ledger" element={<Ledger />} />
        </Route>

        {/* Jar konta route match nahi zala tar */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
