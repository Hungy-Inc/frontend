"use client";

import React, { useEffect, useState } from "react";
import { FaEdit, FaUsers, FaCalendarAlt, FaBox } from "react-icons/fa";
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

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editData)
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 8, color: '#666' }}>Address</label>
                {isEditing ? (
                  <textarea
                    value={editData.address}
                    onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                    style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%', maxWidth: 400, minHeight: 100 }}
                  />
                ) : (
                  <div style={{ fontSize: 16 }}>{organization?.address || 'N/A'}</div>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={handleUpdate}
                  style={{
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 24px',
                    fontSize: 16,
                    cursor: 'pointer',
                    alignSelf: 'flex-start'
                  }}
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