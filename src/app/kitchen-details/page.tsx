"use client";

import React, { useEffect, useState } from "react";
import { FaEdit, FaUsers, FaCalendarAlt, FaBox, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { toast } from 'react-toastify';

interface OrganizationStats {
  totalUsers: number;
  totalShifts: number;
  totalDonations: number;
}

export default function KitchenDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organization, setOrganization] = useState<any>(null);
  const [stats, setStats] = useState<OrganizationStats>({
    totalUsers: 0,
    totalShifts: 0,
    totalDonations: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    address: ""
  });
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState("");

  useEffect(() => {
    fetchOrganizationDetails();
  }, []);

  const fetchOrganizationDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch organization details
      const orgRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!orgRes.ok) throw new Error("Failed to fetch organizations");
      const organizations = await orgRes.json();
      
      if (!organizations || organizations.length === 0) {
        throw new Error("No organization found for the current user");
      }

      const userOrg = organizations[0];
      setOrganization(userOrg);
      setEditData({
        name: userOrg.name || "",
        address: userOrg.address || ""
      });

      // Parse addresses from JSON string or comma-separated string
      try {
        let parsedAddresses: string[];
        if (userOrg.address) {
          try {
            // First try parsing as JSON
            parsedAddresses = JSON.parse(userOrg.address);
          } catch {
            // If not JSON, treat as comma-separated string
            parsedAddresses = userOrg.address.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr);
          }
        } else {
          parsedAddresses = [];
        }
        setAddresses(Array.isArray(parsedAddresses) ? parsedAddresses : []);
      } catch (err) {
        console.error('Error parsing addresses:', err);
        setAddresses([]);
      }

      // Fetch organization statistics
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${userOrg.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load organization details");
      toast.error(err.message || "Failed to load organization details");
    } finally {
      setLoading(false);
    }
  };

  const isOrgNameValid = /^[A-Za-z0-9\s]+$/.test(editData.name.trim());
  const isAddressValid = addresses.length > 0;
  const canUpdate = isOrgNameValid && isAddressValid;

  const handleUpdate = async () => {
    if (!canUpdate) {
      toast.error('Organization name must contain only letters and spaces, and at least one address is required.');
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editData.name.trim() || organization.name,
          address: editData.address // Already a JSON string
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update organization");
      }
      const updatedOrg = await res.json();
      setOrganization(updatedOrg);
      setIsEditing(false);
      toast.success("Organization details updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update organization details");
    }
  };

  const handleAddAddress = () => {
    if (newAddress.trim()) {
      // Add new address to the existing array
      const updatedAddresses = [...addresses, newAddress.trim()];
      setAddresses(updatedAddresses);
      // Update the editData address field with the new JSON string
      setEditData(prev => ({
        ...prev,
        address: JSON.stringify(updatedAddresses)
      }));
      setNewAddress("");
      setIsAddingAddress(false);
    }
  };

  const handleRemoveAddress = (index: number) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(updatedAddresses);
    // Update the editData address field with the new JSON string
    setEditData(prev => ({
      ...prev,
      address: JSON.stringify(updatedAddresses)
    }));
  };

  const handleStartEditAddress = (index: number) => {
    setEditingAddressIndex(index);
    setEditingAddress(addresses[index]);
  };

  const handleSaveEditAddress = () => {
    if (editingAddressIndex !== null && editingAddress.trim()) {
      const updatedAddresses = [...addresses];
      updatedAddresses[editingAddressIndex] = editingAddress.trim();
      setAddresses(updatedAddresses);
      // Update the editData address field with the new JSON string
      setEditData(prev => ({
        ...prev,
        address: JSON.stringify(updatedAddresses)
      }));
      setEditingAddressIndex(null);
      setEditingAddress("");
    }
  };

  const handleCancelEditAddress = () => {
    setEditingAddressIndex(null);
    setEditingAddress("");
  };

  return (
    <main style={{ padding: 32 }}>
      <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Kitchen Details</div>
      
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
      ) : error ? (
        <div style={{ textAlign: 'center', color: 'red' }}>{error}</div>
      ) : (
        <>
          {/* Organization Information Card */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Organization Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2196f3',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 16
                }}
              >
                <FaEdit />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#666' }}>Organization Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%', maxWidth: 400 }}
                  />
                ) : (
                  <div style={{ fontSize: 16 }}>{organization?.name || 'N/A'}</div>
                )}
                {isEditing && !isOrgNameValid && (
                  <div style={{ color: 'red', fontSize: 13 }}>Organization name must contain only letters and spaces.</div>
                )}
              </div>

              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, color: '#666' }}>Addresses</label>
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {addresses.map((address, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {editingAddressIndex === index ? (
                          <>
                            <input
                              type="text"
                              value={editingAddress}
                              onChange={(e) => setEditingAddress(e.target.value)}
                              style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #eee' }}
                            />
                            <button
                              onClick={handleSaveEditAddress}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#4CAF50',
                                cursor: 'pointer',
                                padding: 4
                              }}
                            >
                              <FaSave />
                            </button>
                            <button
                              onClick={handleCancelEditAddress}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4444',
                                cursor: 'pointer',
                                padding: 4
                              }}
                            >
                              <FaTimes />
                            </button>
                          </>
                        ) : (
                          <>
                            <div style={{ flex: 1, fontSize: 16 }}>{address}</div>
                            <button
                              onClick={() => handleStartEditAddress(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#2196f3',
                                cursor: 'pointer',
                                padding: 4
                              }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleRemoveAddress(index)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ff4444',
                                cursor: 'pointer',
                                padding: 4
                              }}
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                    {isAddingAddress ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="text"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="Enter new address"
                          style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #eee' }}
                        />
                        <button
                          onClick={handleAddAddress}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4CAF50',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingAddress(false);
                            setNewAddress("");
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ff4444',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAddingAddress(true)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          background: 'none',
                          border: '1px dashed #2196f3',
                          color: '#2196f3',
                          padding: '8px 16px',
                          borderRadius: 5,
                          cursor: 'pointer',
                          width: 'fit-content'
                        }}
                      >
                        <FaPlus /> Add Address
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 16 }}>
                    {addresses.length > 0 ? (
                      addresses.map((address, index) => (
                        <div key={index} style={{ marginBottom: index < addresses.length - 1 ? 8 : 0 }}>
                          {address}
                        </div>
                      ))
                    ) : (
                      'N/A'
                    )}
                  </div>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={handleUpdate}
                  style={{
                    background: canUpdate ? '#2196f3' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 24px',
                    fontSize: 16,
                    cursor: canUpdate ? 'pointer' : 'not-allowed',
                    marginTop: 16,
                    opacity: canUpdate ? 1 : 0.7
                  }}
                  disabled={!canUpdate}
                >
                  Update Details
                </button>
              )}
            </div>
          </div>

          {/* Organization Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <FaUsers style={{ color: '#2196f3', fontSize: 24 }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Total Users</h3>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#2196f3' }}>{stats.totalUsers}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <FaCalendarAlt style={{ color: '#4caf50', fontSize: 24 }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Total Shifts</h3>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#4caf50' }}>{stats.totalShifts}</div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <FaBox style={{ color: '#ff9800', fontSize: 24 }} />
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Total Donations</h3>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#ff9800' }}>{stats.totalDonations}</div>
            </div>
          </div>
        </>
      )}
    </main>
  );
} 