import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import axios from 'axios'
import {
  FaTachometerAlt,
  FaChevronDown,
  FaThLarge,
  FaLayerGroup,
  FaUser,
  FaCalendarCheck,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaTicketAlt,
  FaChartBar,
  FaPlus,
  FaClipboard,
  FaStore,
  FaEnvelopeOpenText,
} from 'react-icons/fa'
import logo from '../assets/images/logo2.jpg' // 👈 tuza logo src/assets madhye

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const Sidebar = ({ isCollapsed, isMobileOpen, closeSidebar }) => {
  const moduleIcons = {
    Master: <FaLayerGroup />,
    'Add New': <FaPlus />,
    Employee: <FaUser />,
    Attendance: <FaCalendarCheck />,
    Billing: <FaFileInvoiceDollar />,
    Salary: <FaMoneyBillWave />,
    Vouchers: <FaTicketAlt />,
    'Work Order': <FaClipboard />,
    Vendor: <FaStore />,
    'Raise Ticket': <FaEnvelopeOpenText />,
    Reports: <FaChartBar />,
  }

  const modulePaths = {
    Attendance: ['/attendance/print'],
    Billing: [
      '/billing/review',
      '/billing/print-payment-history',
      '/billing/print-invoice',
    ],
  }

  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openModules, setOpenModules] = useState({})

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setError('No token found.')
          setLoading(false)
          return
        }
        const config = { headers: { Authorization: `Bearer ${token}` } }
        const { data } = await axios.get(
          `${API_URL}/api/permissions/mymenu`,
          config,
        )

        if (Array.isArray(data)) {
          setMenuItems(data)
          // console.log(data);
          const initialOpenState = data.reduce((acc, module) => {
            acc[module.moduleName] = false
            return acc
          }, {})
          setOpenModules(initialOpenState)
        } else {
          setMenuItems([])
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else setError('Failed to load.')
        console.error('Failed to fetch menu:', err)
        setMenuItems([])
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

  // const toggleModule = (moduleName) => {
  //   setOpenModules((prev) => ({ ...prev, [moduleName]: !prev[moduleName] }));
  // };

  const toggleModule = (moduleName) => {
    setOpenModules((prev) => {
      const newState = {}

      Object.keys(prev).forEach((key) => {
        newState[key] = key === moduleName ? !prev[key] : false
      })

      return newState
    })
  }

  return (
    <nav
      className={`sidebar 
    ${isCollapsed ? 'collapsed' : ''} 
    ${isMobileOpen ? 'mobile-open' : ''}
  `}
    >
      <div className="sidebar-header">
        <img
          src={logo}
          alt="Logo"
          className={`sidebar-logo ${isCollapsed ? 'small' : 'large'}`}
        />
      </div>

      <ul className="menu-list">
        {loading && <li className="loading-text">Loading Menu...</li>}
        {error && <li className="error-text">{error}</li>}

        {/* Dashboard link */}
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'menu-link active' : 'menu-link'
            }
            onClick={() => isMobileOpen && closeSidebar()}
            end
          >
            <FaTachometerAlt className="menu-icon" />
            {!isCollapsed && <span className="menu-text">Dashboard</span>}
          </NavLink>
        </li>

        {/* Dynamic menu */}
        {menuItems.map((module) => (
          <li key={module.moduleId} className="module-item">
            <div
              className="module-name"
              onClick={() => toggleModule(module.moduleName)}
            >
              <span className="menu-icon">
                {moduleIcons[module.moduleName] || <FaThLarge />}{' '}
              </span>
              {!isCollapsed && (
                <span className="menu-text">{module.moduleName}</span>
              )}
              {!isCollapsed && (
                <FaChevronDown
                  className={`arrow ${
                    openModules[module.moduleName] ? 'open' : ''
                  }`}
                />
              )}
            </div>

            {!isCollapsed &&
              openModules[module.moduleName] &&
              module.submodules && (
                <ul className="submodule-list">
                  {module.submodules.map((submodule) => (
                    <li key={submodule.submoduleId}>
                      <NavLink
                        to={submodule.path}
                        className={({ isActive }) =>
                          isActive
                            ? 'menu-link submodule-link active'
                            : 'menu-link submodule-link'
                        }
                        onClick={() => isMobileOpen && closeSidebar()}
                      >
                        <span className="menu-text">
                          {submodule.submoduleName}
                        </span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Sidebar
