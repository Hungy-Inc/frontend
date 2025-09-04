"use client";

import React, { useEffect, useState } from "react";
import { FaEdit, FaUsers, FaCalendarAlt, FaBox, FaPlus, FaSave, FaTimes, FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import { toast } from 'react-toastify';
import TermsAndConditions from '../../components/TermsAndConditions';

interface OrganizationStats {
  totalUsers: number;
  totalShifts: number;
  totalDonations: number;
}

interface WeighingCategory {
  id: number;
  category: string;
  kilogram_kg_: number;
  pound_lb_: number;
}

interface WeighingRecord {
  id: number;
  category: string;
  kilogram_kg_: number;
  pound_lb_: number;
}

interface WeighingStats {
  totalWeighings: number;
  totalCategories: number;
  recentWeighings: WeighingRecord[];
  categoryStats: {
    categoryName: string;
    totalKilogram: number;
    totalPound: number;
    totalWeight: number;
  }[];
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
    address: "",
    email: ""
  });
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState("");
  const [incomingDollarValue, setIncomingDollarValue] = useState<number>(0);
  const [isEditingIncomingValue, setIsEditingIncomingValue] = useState(false);
  const [editingIncomingValue, setEditingIncomingValue] = useState<string>("");
  const [incomingValueUnit, setIncomingValueUnit] = useState<"kg" | "lb">("lb");

  // Weighing data state
  const [weighingCategories, setWeighingCategories] = useState<WeighingCategory[]>([]);
  const [weighingRecords, setWeighingRecords] = useState<WeighingRecord[]>([]);
  const [weighingStats, setWeighingStats] = useState<WeighingStats | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddWeighing, setShowAddWeighing] = useState(false);
  const [showEditWeighing, setShowEditWeighing] = useState(false);
  const [editingWeighingId, setEditingWeighingId] = useState<number | null>(null);
  
  // Add category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");
  const [newCategoryUnit, setNewCategoryUnit] = useState<"kg" | "lb">("lb");

  
  // Add weighing form state
  const [newWeighingData, setNewWeighingData] = useState({
    category: "",
    weight: "",
    unit: "kg" as "kg" | "lb"
  });
  
  // Edit weighing form state
  const [editWeighingData, setEditWeighingData] = useState({
    category: "",
    weight: "",
    unit: "kg" as "kg" | "lb"
  });

  useEffect(() => {
    fetchOrganizationDetails();
    fetchWeighingData();
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
      
      // Parse addresses to ensure proper format
      let parsedAddresses: string[] = [];
      if (userOrg.address) {
        try {
          // First try parsing as JSON
          parsedAddresses = JSON.parse(userOrg.address);
        } catch {
          // If not JSON, treat as comma-separated string
          parsedAddresses = userOrg.address.split(',').map((addr: string) => addr.trim()).filter((addr: string) => addr);
        }
      }
      
      setEditData({
        name: userOrg.name || "",
        address: JSON.stringify(parsedAddresses),
        email: userOrg.email || ""
      });
      
      // Load incoming dollar value from organization data
      const incomingValue = userOrg.incoming_dollar_value || 0;
      console.log('Organization data:', userOrg);
      console.log('Incoming dollar value loaded:', incomingValue);
      setIncomingDollarValue(incomingValue);

      // Set addresses from already parsed data
      setAddresses(Array.isArray(parsedAddresses) ? parsedAddresses : []);

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

  const fetchWeighingData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch weighing categories
      const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing-categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        setWeighingCategories(categories);
      }

      // Fetch weighing records
      const recordsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (recordsRes.ok) {
        const records = await recordsRes.json();
        setWeighingRecords(records);
      }

      // Fetch weighing statistics
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setWeighingStats(stats);
      }
    } catch (err: any) {
      console.error('Error fetching weighing data:', err);
      toast.error('Failed to load weighing data');
    }
  };

  const isOrgNameValid = /^[A-Za-z0-9\s]+$/.test(editData.name.trim());
  const isAddressValid = addresses.length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email.trim());
  const canUpdate = isOrgNameValid && isAddressValid && isEmailValid;

  const handleUpdate = async () => {
    if (!canUpdate) {
      toast.error('Organization name must contain only letters and spaces, at least one address is required, and email must be valid.');
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
          address: editData.address, // Already a JSON string
          email: editData.email.trim() || organization.email
        })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update organization");
      }
      const updatedOrg = await res.json();
      setOrganization(updatedOrg);
      
      // Update editData with the latest values from the server
      setEditData({
        name: updatedOrg.name || "",
        address: updatedOrg.address || "",
        email: updatedOrg.email || ""
      });
      
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

  const handleStartEditIncomingValue = () => {
    setIsEditingIncomingValue(true);
    // Convert stored kg value to display unit
    const displayValue = incomingValueUnit === "kg" 
      ? incomingDollarValue 
      : incomingDollarValue * 2.20462; // Convert $/kg to $/lb
    setEditingIncomingValue(displayValue.toFixed(2));
  };

  const handleSaveIncomingValue = async () => {
    const inputValue = parseFloat(editingIncomingValue);
    if (isNaN(inputValue) || inputValue < 0) {
      toast.error('Please enter a valid positive number');
      return;
    }

    // Convert entered value to per kg for storage (all calculations use per kg)
    const valuePerKg = incomingValueUnit === "kg" 
      ? inputValue 
      : inputValue / 2.20462; // Convert $/lb to $/kg
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        return;
      }

      console.log('Saving incoming dollar value (per kg):', valuePerKg);
      console.log('Original input value (per', incomingValueUnit + '):', inputValue);
      console.log('Organization ID:', organization.id);

      // Use the new dedicated endpoint for updating incoming dollar value only
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organization.id}/incoming-value`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          incoming_dollar_value: valuePerKg
        }),
      });

      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        toast.error(errorData.error || 'Failed to update incoming dollar value');
        return;
      }
      
      const updatedOrg = await res.json();
      console.log('Updated organization:', updatedOrg);

      // Update both the organization state and the incoming dollar value display state
      setOrganization((prev: any) => ({
        ...prev,
        incoming_dollar_value: updatedOrg.incoming_dollar_value
      }));
      
      // Update the display value state
      setIncomingDollarValue(updatedOrg.incoming_dollar_value);

      setIsEditingIncomingValue(false);
      setEditingIncomingValue("");
      toast.success('Incoming dollar value updated successfully!');
      
    } catch (error) {
      console.error('Error updating incoming dollar value:', error);
      toast.error('Failed to update incoming dollar value. Please try again.');
    }
  };

  const handleCancelEditIncomingValue = () => {
    setIsEditingIncomingValue(false);
    setEditingIncomingValue("");
  };

  // Weighing category functions
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }

    if (!newCategoryWeight.trim()) {
      toast.error('Weight is required');
      return;
    }

    // Check if category already exists
    const existingCategory = weighingCategories.find(
      cat => cat.category.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (existingCategory) {
      toast.error(`Category "${newCategoryName.trim()}" already exists. Please use a different name.`);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newCategoryName.trim(),
          weight: parseFloat(newCategoryWeight),
          unit: newCategoryUnit
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add category');
      }

      const newCategory = await res.json();
      setWeighingCategories(prev => [...prev, newCategory]);
      setNewCategoryName("");
      setNewCategoryWeight("");
      setNewCategoryUnit("kg");
      setShowAddCategory(false);
      toast.success('Category added successfully');
      fetchWeighingData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category');
    }
  };

  // Weighing record functions
  const handleAddWeighing = async () => {
    if (!newWeighingData.category || !newWeighingData.weight || !newWeighingData.weight.trim()) {
      toast.error('Category and weight are required');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newWeighingData.category,
          weight: parseFloat(newWeighingData.weight),
          unit: newWeighingData.unit
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add weighing record');
      }

      const newWeighing = await res.json();
      setWeighingRecords(prev => [newWeighing, ...prev]);
      setNewWeighingData({
        category: "",
        weight: "",
        unit: "kg" as "kg" | "lb"
      });
      setShowAddWeighing(false);
      toast.success('Weighing record added successfully');
      fetchWeighingData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Failed to add weighing record');
    }
  };

  const handleEditWeighing = (weighing: WeighingRecord) => {
    setEditingWeighingId(weighing.id);
    setEditWeighingData({
      category: weighing.category,
      weight: weighing.kilogram_kg_.toString(),
      unit: "kg" as "kg" | "lb"
    });
    setShowEditWeighing(true);
  };

  const handleSaveEditWeighing = async () => {
    if (!editingWeighingId || !editWeighingData.category || !editWeighingData.weight || !editWeighingData.weight.trim()) {
      toast.error('Category and weight are required');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing/${editingWeighingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: editWeighingData.category,
          weight: parseFloat(editWeighingData.weight),
          unit: editWeighingData.unit
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update weighing record');
      }

      const updatedWeighing = await res.json();
      setWeighingRecords(prev => prev.map(w => w.id === editingWeighingId ? updatedWeighing : w));
      setEditWeighingData({
        category: "",
        weight: "",
        unit: "kg" as "kg" | "lb"
      });
      setShowEditWeighing(false);
      setEditingWeighingId(null);
      toast.success('Weighing record updated successfully');
      fetchWeighingData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Failed to update weighing record');
    }
  };

  const handleCancelEditWeighing = () => {
    setEditingWeighingId(null);
    setEditWeighingData({
      category: "",
      weight: "",
      unit: "kg" as "kg" | "lb"
    });
    setShowEditWeighing(false);
  };

  const handleDeleteWeighing = async (weighingId: number) => {
    if (!window.confirm('Are you sure you want to delete this weighing record?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing/${weighingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete weighing record');
      }

      setWeighingRecords(prev => prev.filter(w => w.id !== weighingId));
      toast.success('Weighing record deleted successfully');
      fetchWeighingData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete weighing record');
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

          {/* Organization Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24, marginBottom: 24 }}>
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
                <label style={{ display: 'block', marginBottom: 8, color: '#666' }}>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    style={{ padding: 8, borderRadius: 5, border: '1px solid #eee', width: '100%', maxWidth: 400 }}
                    placeholder="organization@example.com"
                  />
                ) : (
                  <div style={{ fontSize: 16 }}>{organization?.email || 'N/A'}</div>
                )}
                {isEditing && !isEmailValid && editData.email.trim() && (
                  <div style={{ color: 'red', fontSize: 13 }}>Please enter a valid email address.</div>
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

          {/* Incoming Stats Card */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Incoming Stats</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666' }}>
                <FaArrowDown />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Incoming</span>
              </div>
            </div>

            {/* Incoming Dollar Value Section */}
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: 12, 
              padding: 24, 
              marginBottom: 24,
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#333' }}>Incoming Dollar Value</h3>
                  <select
                    value={incomingValueUnit}
                    onChange={(e) => setIncomingValueUnit(e.target.value as "kg" | "lb")}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #dee2e6',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#666',
                      background: '#fff'
                    }}
                  >
                    <option value="kg">per kg</option>
                    <option value="lb">per lb</option>
                  </select>
                </div>
                <button
                  onClick={handleStartEditIncomingValue}
                  style={{
                    background: '#fff',
                    border: '1px solid #dee2e6',
                    color: '#666',
                    borderRadius: 6,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <FaEdit />
                  Edit
                </button>
              </div>
              
              {isEditingIncomingValue ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>$</div>
                  <input
                    type="number"
                    value={editingIncomingValue}
                    onChange={(e) => setEditingIncomingValue(e.target.value)}
                    style={{
                      background: '#fff',
                      border: '1px solid #dee2e6',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#333',
                        width: '150px',
                      outline: 'none'
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                    <select
                      value={incomingValueUnit}
                      onChange={(e) => {
                        const newUnit = e.target.value as "kg" | "lb";
                        const currentValue = parseFloat(editingIncomingValue) || 0;
                        let convertedValue;
                        
                        // Convert between units when switching
                        if (incomingValueUnit === "kg" && newUnit === "lb") {
                          convertedValue = currentValue * 2.20462; // kg to lb
                        } else if (incomingValueUnit === "lb" && newUnit === "kg") {
                          convertedValue = currentValue / 2.20462; // lb to kg
                        } else {
                          convertedValue = currentValue;
                        }
                        
                        setIncomingValueUnit(newUnit);
                        setEditingIncomingValue(convertedValue.toFixed(2));
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #dee2e6',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#333',
                        background: '#fff'
                      }}
                    >
                      <option value="kg">per kg</option>
                      <option value="lb">per lb</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleSaveIncomingValue}
                    style={{
                      background: '#28a745',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    <FaSave />
                  </button>
                  <button
                    onClick={handleCancelEditIncomingValue}
                    style={{
                      background: '#dc3545',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    <FaTimes />
                  </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#333' }}>
                    ${(() => {
                      const displayValue = incomingValueUnit === "kg" 
                        ? incomingDollarValue 
                        : incomingDollarValue * 2.20462;
                      return displayValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: '#666' }}>
                    per {incomingValueUnit}
                  </div>
                </div>
              )}
            </div>

           
          </div>

          {/* Outgoing Stats Card */}
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', padding: 32, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Outgoing Stats</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f44336' }}>
                <FaArrowUp />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Outgoing</span>
              </div>
            </div>

            {/* Weighing Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#f44336', marginBottom: 8 }}>
                  {weighingStats?.totalWeighings || 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Total Weighings</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e91e63', marginBottom: 8 }}>
                  {weighingStats?.totalCategories || 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Categories</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ff5722', marginBottom: 8 }}>
                  {weighingStats?.categoryStats?.length || 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Active Categories</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#795548', marginBottom: 8 }}>
                  {weighingRecords.length > 0 ? weighingRecords.length : 0}
                </div>
                <div style={{ fontSize: 14, color: '#666' }}>Recent Records</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setShowAddCategory(true)}
                style={{
                  background: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <FaPlus />
                Add Category
              </button>
            </div>

            {/* Recent Weighing Records */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Recent Weighing Records</h3>
              {weighingRecords.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', padding: 20 }}>No weighing records found</div>
              ) : (
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {weighingRecords.slice(0, 10).map((weighing) => (
                    <div
                      key={weighing.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        border: '1px solid #eee',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: '#fff'
                      }}
                    >
                      <div style={{ display: 'flex', flex: 1, gap: 16, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, minWidth: 120 }}>{weighing.category}</span>
                        <span style={{ color: '#666', minWidth: 80 }}>{weighing.kilogram_kg_.toFixed(2)} kg</span>
                        <span style={{ color: '#666', minWidth: 80 }}>{weighing.pound_lb_.toFixed(2)} lb</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEditWeighing(weighing)}
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
                          onClick={() => handleDeleteWeighing(weighing.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#f44336',
                            cursor: 'pointer',
                            padding: 4
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        
        </>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 400,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Add New Category</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Category Name *</label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              />
              <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                Category names must be unique within your organization
              </div>
              {newCategoryName.trim() && weighingCategories.find(
                cat => cat.category.toLowerCase() === newCategoryName.trim().toLowerCase()
              ) && (
                <div style={{ color: '#f44336', fontSize: 12, marginTop: 4 }}>
                  Category "{newCategoryName.trim()}" already exists
                </div>
              )}
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Weight</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                value={newCategoryWeight}
                onChange={(e) => setNewCategoryWeight(e.target.value)}
                placeholder="Enter weight"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Unit</label>
              <select
                value={newCategoryUnit}
                onChange={(e) => setNewCategoryUnit(e.target.value as "kg" | "lb")}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddCategory(false)}
                style={{
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || !newCategoryWeight.trim() || !!weighingCategories.find(
                  cat => cat.category.toLowerCase() === newCategoryName.trim().toLowerCase()
                )}
                style={{
                  background: (!newCategoryName.trim() || !newCategoryWeight.trim() || !!weighingCategories.find(
                    cat => cat.category.toLowerCase() === newCategoryName.trim().toLowerCase()
                  )) ? '#ccc' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: (!newCategoryName.trim() || !newCategoryWeight.trim() || !!weighingCategories.find(
                    cat => cat.category.toLowerCase() === newCategoryName.trim().toLowerCase()
                  )) ? 'not-allowed' : 'pointer',
                  fontSize: 14
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Weighing Modal */}
      {showAddWeighing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Add New Weighing Record</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Category *</label>
              <select
                value={newWeighingData.category}
                onChange={(e) => setNewWeighingData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              >
                <option value="">Select a category</option>
                {weighingCategories.map(cat => (
                  <option key={cat.id} value={cat.category}>{cat.category}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Weight</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={newWeighingData.weight}
                  onChange={(e) => setNewWeighingData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Unit</label>
                <select
                  value={newWeighingData.unit}
                  onChange={(e) => setNewWeighingData(prev => ({ ...prev, unit: e.target.value as "kg" | "lb" }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddWeighing(false)}
                style={{
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddWeighing}
                disabled={!newWeighingData.category || !newWeighingData.weight.trim()}
                style={{
                  background: (!newWeighingData.category || !newWeighingData.weight.trim()) ? '#ccc' : '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: (!newWeighingData.category || !newWeighingData.weight.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 14
                }}
              >
                Add Weighing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Weighing Modal */}
      {showEditWeighing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            width: '90%',
            maxWidth: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 600 }}>Edit Weighing Record</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Category *</label>
              <select
                value={editWeighingData.category}
                onChange={(e) => setEditWeighingData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  fontSize: 14
                }}
              >
                <option value="">Select a category</option>
                {weighingCategories.map(cat => (
                  <option key={cat.id} value={cat.category}>{cat.category}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Weight</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  value={editWeighingData.weight}
                  onChange={(e) => setEditWeighingData(prev => ({ ...prev, weight: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Unit</label>
                <select
                  value={editWeighingData.unit}
                  onChange={(e) => setEditWeighingData(prev => ({ ...prev, unit: e.target.value as "kg" | "lb" }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #ddd',
                    fontSize: 14
                  }}
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEditWeighing}
                style={{
                  background: '#f5f5f5',
                  color: '#666',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditWeighing}
                disabled={!editWeighingData.category || !editWeighingData.weight.trim()}
                style={{
                  background: (!editWeighingData.category || !editWeighingData.weight.trim()) ? '#ccc' : '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 16px',
                  cursor: (!editWeighingData.category || !editWeighingData.weight.trim()) ? 'not-allowed' : 'pointer',
                  fontSize: 14
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Section */}
      <div style={{ marginTop: 24 }}>
        <TermsAndConditions 
          apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'} 
        />
      </div>
    </main>
  );
} 