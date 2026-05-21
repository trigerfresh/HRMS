// src/components/UserRoleAccess.jsx

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Card, Form, Table, Button } from 'react-bootstrap'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_BASE_URL = `${API_URL}/api/permissions`

const UserAccess = () => {
  const [roles, setRoles] = useState([])
  const [allModules, setAllModules] = useState([])
  const [groupedModules, setGroupedModules] = useState([])

  const [selectedRole, setSelectedRole] = useState(null)

  const [assignedModules, setAssignedModules] = useState(new Set())

  const [detailedPermissions, setDetailedPermissions] = useState({})

  const [loading, setLoading] = useState(false)

  // =========================================
  // FETCH ROLES + MODULES
  // =========================================
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token')

      const [rolesRes, modulesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),

        axios.get(`${API_BASE_URL}/modules`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setRoles(rolesRes.data)
      setAllModules(modulesRes.data)

      // =========================================
      // GROUP MODULES
      // =========================================

      const groupedMap = {}
      const groupedArray = []

      modulesRes.data.forEach((m) => {
        const mainModule = m.main_module

        if (!groupedMap[mainModule]) {
          groupedMap[mainModule] = {
            module_name: mainModule,
            submodules: [],
          }

          groupedArray.push(groupedMap[mainModule])
        }

        groupedMap[mainModule].submodules.push(m)
      })

      setGroupedModules(groupedArray)
    } catch (err) {
      console.error(err)

      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
  }

  // =========================================
  // ROLE SELECT
  // =========================================

  const handleRoleSelect = async (roleName) => {
    setSelectedRole(roleName)

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      const { data } = await axios.get(`${API_BASE_URL}/${roleName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // Assigned Modules
      setAssignedModules(new Set(data.assignedModules || []))

      // Permissions Map
      const detailsMap = {}

      ;(data.detailedPermissions || []).forEach((p) => {
        detailsMap[p.module_id] = {
          ...p,
        }
      })

      setDetailedPermissions(detailsMap)
    } catch (err) {
      console.error(err)

      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    setLoading(false)
  }

  // =========================================
  // TOGGLE MODULE
  // =========================================

  const handleModuleAssign = (moduleId) => {
    const updated = new Set(assignedModules)

    if (updated.has(moduleId)) {
      updated.delete(moduleId)
    } else {
      updated.add(moduleId)
    }

    setAssignedModules(updated)
  }

  // =========================================
  // PERMISSION CHANGE
  // =========================================

  const handlePermissionChange = (submodule, permName) => {
    const existing = detailedPermissions[submodule.module_id] || {
      role: selectedRole,
      segment: submodule.segment,
      main_module: submodule.main_module,
      submodule_id: submodule.module_id,
      module_id: submodule.module_id,
    }

    setDetailedPermissions((prev) => ({
      ...prev,
      [submodule.module_id]: {
        ...existing,
        [permName]: existing[permName] ? 0 : 1,
      },
    }))
  }

  // =========================================
  // SAVE
  // =========================================

  const handleSave = async () => {
    if (!selectedRole) return

    try {
      setLoading(true)

      const token = localStorage.getItem('token')

      // ONLY SAVE SELECTED MODULES
      const filteredPermissions = Object.values(detailedPermissions).filter(
        (p) => assignedModules.has(p.module_id),
      )

      await axios.post(
        `${API_BASE_URL}`,
        {
          role: selectedRole,
          permissions: filteredPermissions,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      alert('Permissions saved successfully!')
    } catch (err) {
      console.error(err)

      alert('Failed to save permissions')

      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }

    setLoading(false)
  }

  // =========================================
  // VISIBLE SUBMODULES
  // =========================================

  const visibleSubmodules = allModules.filter((m) =>
    assignedModules.has(m.module_id),
  )

  return (
    <div className="page-container">
      {/* ========================================= */}
      {/* ROLES */}
      {/* ========================================= */}

      <Card className="p-3 mb-3">
        <div className="d-flex flex-wrap gap-3">
          {roles.map((role) => (
            <div
              key={role.role_name}
              className={`role-box ${
                selectedRole === role.role_name ? 'active' : ''
              }`}
              onClick={() => handleRoleSelect(role.role_name)}
              style={{
                cursor: 'pointer',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '10px',
                minWidth: '140px',
                textAlign: 'center',
                background:
                  selectedRole === role.role_name ? '#0d6efd' : '#fff',
                color: selectedRole === role.role_name ? '#fff' : '#000',
              }}
            >
              <div style={{ fontSize: '25px' }}>👤</div>

              <div>{role.role_name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ========================================= */}
      {/* MODULES */}
      {/* ========================================= */}

      {selectedRole && (
        <>
          <Card className="p-3 mb-3">
            <h4 className="mb-4">{selectedRole} - Module Access</h4>

            <div className="row">
              {groupedModules.map((module) => (
                <div className="col-md-3 mb-3" key={module.module_name}>
                  <Card className="p-3 h-100">
                    <Form.Check
                      type="checkbox"
                      label={module.module_name}
                      checked={module.submodules.every((s) =>
                        assignedModules.has(s.module_id),
                      )}
                      onChange={(e) => {
                        const checked = e.target.checked

                        const updated = new Set(assignedModules)

                        module.submodules.forEach((s) => {
                          if (checked) {
                            updated.add(s.module_id)
                          } else {
                            updated.delete(s.module_id)
                          }
                        })

                        setAssignedModules(updated)
                      }}
                    />

                    <hr />

                    {module.submodules.map((sub) => (
                      <Form.Check
                        key={sub.module_id}
                        type="checkbox"
                        label={sub.module_name}
                        checked={assignedModules.has(sub.module_id)}
                        onChange={() => handleModuleAssign(sub.module_id)}
                        className="ms-3 mb-2"
                      />
                    ))}
                  </Card>
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Permissions'}
            </Button>
          </Card>

          {/* ========================================= */}
          {/* PERMISSION TABLE */}
          {/* ========================================= */}

          <Card className="p-3">
            <h4 className="mb-4">{selectedRole} - Permission Access</h4>

            <Table bordered hover responsive>
              <thead className="table-dark">
                <tr>
                  <th>Main Module</th>
                  <th>Submodule</th>
                  <th>Add</th>
                  <th>Edit</th>
                  <th>Delete</th>
                  <th>Print</th>
                  <th>Export</th>
                </tr>
              </thead>

              <tbody>
                {visibleSubmodules.map((sm) => (
                  <tr key={sm.module_id}>
                    <td>{sm.main_module}</td>

                    <td>{sm.module_name}</td>

                    {[
                      'add_access',
                      'edit_access',
                      'delete_access',
                      'print_access',
                      'export_access',
                    ].map((perm) => (
                      <td key={perm}>
                        <input
                          type="checkbox"
                          checked={!!detailedPermissions[sm.module_id]?.[perm]}
                          onChange={() => handlePermissionChange(sm, perm)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

export default UserAccess
