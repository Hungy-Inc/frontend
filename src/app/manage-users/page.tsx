"use client";
import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash, FaSave, FaTimes, FaUserPlus, FaEye, FaEyeSlash } from "react-icons/fa";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  password?: string;
  organizationId?: string;
  phone?: string;
}

const roles = ["VOLUNTEER", "STAFF", "ADMIN"];

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addData, setAddData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", role: "VOLUNTEER", organizationId: "" });
  const [adding, setAdding] = useState(false);
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      // Format the data to include the full name
      const formattedData = data.map((user: any) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`.trim()
      }));
      setUsers(formattedData);
    } catch (err) {
      setError("Failed to load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch organizations for dropdown
  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setOrganizations(data);
      } catch {
        setOrganizations([]);
      }
    };
    fetchOrgs();
  }, []);

  const startEdit = (user: User) => {
    setEditId(user.id);
    setEditData({ ...user });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({});
  };

  const handleEditChange = (field: keyof User, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const [firstName, ...lastArr] = (editData.name || '').split(' ');
      const lastName = lastArr.join(' ');
      const body = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: editData.email,
        role: editData.role
      };
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Failed to update user');
      const updated = await response.json();
      setUsers(users => users.map(u => u.id === id ? updated : u));
      setEditId(null);
      setEditData({});
    } catch (err) {
      alert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers(users => users.filter(u => u.id !== id));
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const handleAddChange = (field: string, value: string) => {
    setAddData(prev => ({ ...prev, [field]: value }));
  };

  const isEmail = (email: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const isValid = addData.firstName.trim() && addData.lastName.trim() && isEmail(addData.email) && addData.phone.trim() && addData.password.trim() && addData.confirmPassword.trim() && addData.role && addData.password === addData.confirmPassword;

  const addUser = async () => {
    setAdding(true);
    try {
      const token = localStorage.getItem("token");
      // Get organizationId from localStorage user
      let organizationId = "";
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          organizationId = user.organizationId ? String(user.organizationId) : "";
        } catch {}
      }
      const { firstName, lastName, email, phone, password, role } = addData;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName, email, phone, password, role, organizationId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.details) {
          // Handle validation errors
          if (typeof data.details === 'object') {
            const missingFields = Object.entries(data.details)
              .filter(([_, missing]) => missing)
              .map(([field]) => field)
              .join(', ');
            throw new Error(`Missing required fields: ${missingFields}`);
          }
          throw new Error(data.details);
        }
        throw new Error(data.error || 'Failed to add user');
      }
      
      setShowAdd(false);
      setAddData({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "", role: "VOLUNTEER", organizationId: "" });
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add user.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
        <span>Manage Users</span>
        <button onClick={() => {
          // Set org ID from localStorage user when opening modal
          let organizationId = "";
          const userStr = localStorage.getItem("user");
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              organizationId = user.organizationId ? String(user.organizationId) : "";
            } catch {}
          }
          setAddData(d => ({ ...d, organizationId }));
          setShowAdd(true);
        }} style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', fontSize: 24 }} title="Add User">
          <FaUserPlus />
        </button>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888' }}>No users found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', color: '#888', fontWeight: 600 }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Mobile</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {editId === user.id ? (
                    <>
                      <td style={{ padding: 12 }}>
                        <input
                          value={editData.name || ''}
                          onChange={e => handleEditChange('name', e.target.value)}
                          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                          disabled={saving}
                        />
                      </td>
                      <td style={{ padding: 12 }}>
                        <input
                          value={editData.email || ''}
                          onChange={e => handleEditChange('email', e.target.value)}
                          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                          disabled={saving}
                        />
                      </td>
                      <td style={{ padding: 12 }}>
                        <input
                          value={editData.phone || ''}
                          onChange={e => handleEditChange('phone', e.target.value)}
                          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                          disabled={saving}
                        />
                      </td>
                      <td style={{ padding: 12 }}>
                        <input
                          value={editData.role || ''}
                          onChange={e => handleEditChange('role', e.target.value)}
                          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #eee' }}
                          disabled={saving}
                        />
                      </td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <button onClick={() => saveEdit(user.id)} style={{ background: 'none', border: 'none', color: '#1db96b', cursor: 'pointer', marginRight: 12 }} title="Save" disabled={saving}>
                          <FaSave />
                        </button>
                        <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }} title="Cancel" disabled={saving}>
                          <FaTimes />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: 12 }}>{user.name}</td>
                      <td style={{ padding: 12 }}>{user.email}</td>
                      <td style={{ padding: 12 }}>{user.phone}</td>
                      <td style={{ padding: 12 }}>{user.role}</td>
                      <td style={{ padding: 12, textAlign: 'center' }}>
                        <button style={{ background: 'none', border: 'none', color: '#ff9800', cursor: 'pointer', marginRight: 12 }} title="Edit" onClick={() => startEdit(user)}>
                          <FaEdit />
                        </button>
                        <button style={{ background: 'none', border: 'none', color: '#e53935', cursor: 'pointer' }} title="Delete" onClick={() => deleteUser(user.id)} disabled={saving}>
                          <FaTrash />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Add User Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #ddd', position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 20, color: '#888', cursor: 'pointer' }}><FaTimes /></button>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Add User</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="First Name" value={addData.firstName} onChange={e => handleAddChange('firstName', e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} disabled={adding} />
              <input placeholder="Last Name" value={addData.lastName} onChange={e => handleAddChange('lastName', e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} disabled={adding} />
              <input placeholder="Email" value={addData.email} onChange={e => handleAddChange('email', e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} disabled={adding} />
              <input placeholder="Phone" value={addData.phone} onChange={e => handleAddChange('phone', e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} disabled={adding} />
              <div style={{ position: 'relative' }}>
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={addData.password}
                  onChange={e => handleAddChange('password', e.target.value)}
                  style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%' }}
                  disabled={adding}
                />
                <span
                  onClick={() => setShowPassword(v => !v)}
                  style={{ position: 'absolute', right: 10, top: 10, cursor: 'pointer', color: '#888' }}
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
              </div>
              <div style={{ position: 'relative', marginBottom: 0 }}>
                <input
                  placeholder="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={addData.confirmPassword}
                  onChange={e => handleAddChange('confirmPassword', e.target.value)}
                  style={{
                    padding: 8,
                    borderRadius: 5,
                    border: addData.confirmPassword.length > 0 && addData.password !== addData.confirmPassword ? '1.5px solid #e53935' : '1px solid #eee',
                    width: '100%'
                  }}
                  disabled={adding}
                />
                <span
                  onClick={() => setShowConfirmPassword(v => !v)}
                  style={{ position: 'absolute', right: 10, top: 10, cursor: 'pointer', color: '#888' }}
                >
                  {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                </span>
                {addData.confirmPassword.length > 0 && addData.password !== addData.confirmPassword && (
                  <div style={{ color: 'red', fontSize: 13, marginTop: 2, textAlign: 'center' }}>Passwords do not match</div>
                )}
              </div>
              <select value={addData.role} onChange={e => handleAddChange('role', e.target.value)} style={{ padding: 8, borderRadius: 5, border: '1px solid #eee' }} disabled={adding}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={addUser} style={{ background: isValid ? '#ff9800' : '#ccc', color: '#fff', fontWeight: 700, border: 'none', borderRadius: 6, padding: '10px 0', fontSize: 16, marginTop: 8, cursor: isValid ? 'pointer' : 'not-allowed', opacity: adding ? 0.7 : 1 }} disabled={adding || !isValid}>
                {adding ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 