// src/components/UserRoleAccess.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, Form, Table } from "react-bootstrap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE_URL = `${API_URL}/api/permissions`;

const UserAccess = () => {
  const [roles, setRoles] = useState([]);
  const [allModules, setAllModules] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [assignedModules, setAssignedModules] = useState(new Set());
  const [detailedPermissions, setDetailedPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  // ===== Fetch all roles & modules =====
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [rolesRes, modulesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/roles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/modules`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setRoles(rolesRes.data);
        setAllModules(modulesRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        // console.error("Error fetching initial data", err);
      }
    };
    fetchData();
  }, []);

  // ===== Role Select + Fetch Permissions =====
  const handleRoleSelect = async (roleId) => {
    setSelectedRole(roles.find((r) => r._id === roleId));
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE_URL}/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Middle section
      setAssignedModules(new Set(data.assignedModules || []));

      // Bottom section
      const detailsMap = {};
      (data.detailedPermissions || []).forEach((p) => {
        detailsMap[p.submoduleId] = p;
      });
      setDetailedPermissions(detailsMap);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      console.error("Error fetching role permissions", err);
    }
    setLoading(false);
  };

  // ===== Toggle Module Assign =====
  const handleModuleAssign = (moduleId) => {
    const newAssigned = new Set(assignedModules);
    const newDetailedPermissions = { ...detailedPermissions };

    if (newAssigned.has(moduleId)) {
      // 🧹 Remove module
      newAssigned.delete(moduleId);

      // Find all submodules of this module
      const module = allModules.find((m) => m._id === moduleId);
      if (module && module.submodules) {
        // Remove their permissions
        module.submodules.forEach((sub) => {
          delete newDetailedPermissions[sub._id];
        });
      }
    } else {
      // Add module
      newAssigned.add(moduleId);
    }

    setAssignedModules(newAssigned);
    setDetailedPermissions(newDetailedPermissions);
  };

  // ===== Toggle Submodule Permission =====
  const handlePermissionChange = (submodule, permName) => {
    const currentPerms = detailedPermissions[submodule._id] || {
      submoduleId: submodule._id,
      submoduleName: submodule.name,
      path: submodule.path,
    };

    setDetailedPermissions({
      ...detailedPermissions,
      [submodule._id]: {
        ...currentPerms,
        [permName]: !currentPerms[permName],
      },
    });
  };

  // ===== Save Permissions =====
  const handleSave = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // console.log(
      //   selectedRole._id,
      //   Array.from(assignedModules),
      //   Object.values(detailedPermissions)
      // );
      await axios.post(
        `${API_BASE_URL}`,
        {
          roleId: selectedRole._id,
          assignedModules: Array.from(assignedModules),
          detailedPermissions: Object.values(detailedPermissions),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Permissions saved!");
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else alert("Failed to save permissions");
      console.error(err);
    }
    setLoading(false);
  };

  // ===== Filter submodules to show in table =====
  const visibleSubmodules = allModules
    .filter((m) => assignedModules.has(m._id))
    .flatMap((m) =>
      m.submodules.map((sm) => ({ ...sm, parentModuleName: m.name })),
    );

  return (
    <div className="page-container">
      <Card>
        {/* === TOP: ROLES === */}
        <div className="ura-card ura-role-selector">
          {roles.map((role) => (
            <div
              key={role._id}
              className={`role-box ${
                selectedRole?._id === role._id ? "active" : ""
              }`}
              onClick={() => handleRoleSelect(role._id)}
            >
              <div className="role-icon">👤</div>
              <div className="role-name">{role.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* === MODULES + SUBMODULES === */}
      {selectedRole && (
        <>
          {/* MIDDLE SECTION */}
          <Card className="ura-card">
            <h3 className="card-header mb-4">
              {selectedRole.name} - Set Modules
            </h3>
            <div className="module-checklist">
              {allModules.map((module) => (
                <Form.Check
                  key={module._id}
                  type="checkbox"
                  label={`${module.name} (${module.submodules.length})`}
                  checked={assignedModules.has(module._id)}
                  onChange={() => handleModuleAssign(module._id)}
                ></Form.Check>
              ))}
            </div>
            <button
              className="assign-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Permissions"}
            </button>
          </Card>

          {/* BOTTOM SECTION */}
          <Card className="ura-card">
            <h3 className="card-header mb-4">
              {selectedRole.name} - Access Control
            </h3>
            <div className="ura-table-container">
              <Table hover bordered responsive>
                <thead className="table-secondary">
                  <tr>
                    <th>Main Module</th>
                    <th>Submodule</th>
                    <th>Add</th>
                    <th>Edit</th>
                    <th>Delete</th>
                    <th>Print</th>
                    <th>Export Excel</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSubmodules.map((sm) => (
                    <tr key={sm._id}>
                      <td>{sm.parentModuleName}</td>
                      <td>{sm.name}</td>
                      {[
                        "canAdd",
                        "canEdit",
                        "canDelete",
                        "canPrint",
                        "canExport",
                      ].map((perm) => (
                        <td key={perm}>
                          <input
                            type="checkbox"
                            checked={!!detailedPermissions[sm._id]?.[perm]}
                            onChange={() => handlePermissionChange(sm, perm)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default UserAccess;
