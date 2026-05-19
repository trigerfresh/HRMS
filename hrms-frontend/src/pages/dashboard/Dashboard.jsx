import { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'

export default function Dashboard() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (!user) {
    return <p className="loading-text">Unauthorized. Please login.</p>
  }

  return (
    <div className="page-container dashboard-container">
      <Card>
        <div className="dashboard-header">
          <h1 className="welcome-title">Welcome, {user.name}</h1>
          <p className="role-text">
            Role: <span className="role-name">{user.role}</span>
          </p>
        </div>
      </Card>

      {/* Role-based logic */}
      {user.role === 'Admin' && (
        <Card className="dashboard-card">
          <h2 className="card-header mb-4">Admin Dashboard</h2>
          <ul className="card-list">
            <li>Manage Users</li>
            <li>Access All Modules</li>
          </ul>
        </Card>
      )}

      {user.role === 'HR' && (
        <Card className="dashboard-card">
          <h2 className="card-header mb-4">HR Dashboard</h2>
          <ul className="card-list">
            <li>Manage Employees</li>
            <li>Attendance Reports</li>
          </ul>
        </Card>
      )}

      {user.role === 'Client' && (
        <Card className="dashboard-card">
          <h2 className="card-header mb-4">Client Dashboard</h2>
          <ul className="card-list">
            <li>Billing</li>
            <li>Reports</li>
          </ul>
        </Card>
      )}

      {user.role === 'Employees' && (
        <Card className="dashboard-card">
          <h2 className="card-header mb-4">Employee Dashboard</h2>
          <ul className="card-list">
            <li>My Attendance</li>
            <li>My Salary</li>
          </ul>
        </Card>
      )}
    </div>
  )
}
