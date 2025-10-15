'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type DonationCategory = {
  id: number;
  name: string;
  icon: string | null;
};

type DonationLocation = {
  id: number;
  name: string;
  location: string | null;
  contactInfo: string | null;
};


const months = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const baseUnits = ['Kilograms (kg)', 'Pounds (lb)'];

type WeighingCategory = {
  id: number;
  category: string;
  kilogram_kg_: number;
  pound_lb_: number;
};

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2020; y--) {
    years.push(y);
  }
  return years;
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories' | 'donors'>('inventory');
  const [donationLocations, setDonationLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tableData, setTableData] = useState<{ [donationLocation: string]: { [cat: string]: number } }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState(baseUnits[1]); // Default to Pounds (lb)
  const [weighingCategories, setWeighingCategories] = useState<WeighingCategory[]>([]);
  
  // Donation categories state
  const [donationCategories, setDonationCategories] = useState<DonationCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DonationCategory | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '' });

  // Donation Locations state
  const [donationLocationsList, setDonationLocationsList] = useState<DonationLocation[]>([]);
  const [donationLocationsLoading, setDonationLocationsLoading] = useState(false);
  const [showAddDonationLocationModal, setShowAddDonationLocationModal] = useState(false);
  const [showEditDonationLocationModal, setShowEditDonationLocationModal] = useState(false);
  const [editingDonationLocation, setEditingDonationLocation] = useState<DonationLocation | null>(null);
  const [donationLocationFormData, setDonationLocationFormData] = useState({ name: '', location: '', contactInfo: '' });

  // Fetch weighing categories
  useEffect(() => {
    const fetchWeighingCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weighing-categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWeighingCategories(data || []);
        }
      } catch (error) {
        console.error('Error fetching weighing categories:', error);
      }
    };
    
    fetchWeighingCategories();
  }, []);

  // Fetch donation categories
  const fetchDonationCategories = async () => {
    try {
      setCategoriesLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donation-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonationCategories(data || []);
      } else {
        toast.error('Failed to fetch donation categories');
      }
    } catch (err) {
      console.error('Error fetching donation categories:', err);
      toast.error('Failed to fetch donation categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch donation locations
  const fetchDonationLocations = async () => {
    try {
      setDonationLocationsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDonationLocationsList(data || []);
      } else {
        toast.error('Failed to fetch donation locations');
      }
    } catch (err) {
      console.error('Error fetching donation locations:', err);
      toast.error('Failed to fetch donation locations');
    } finally {
      setDonationLocationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchDonationCategories();
    } else if (activeTab === 'donors') {
      fetchDonationLocations();
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('token');
        // Fetch donor/category table
        const monthParam = selectedMonth === 0 ? 'all' : selectedMonth;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/donor-category-table?month=${monthParam}&year=${selectedYear}&unit=${selectedUnit}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch inventory table');
        const data = await res.json();
        setDonationLocations(data.donors);
        setCategories(data.categories);
        setTableData(data.table);
      } catch (err) {
        setDonationLocations([]);
        setCategories([]);
        setTableData({});
        setError('Failed to load inventory data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear, selectedUnit]);

  // Helper to format weight for display (no conversion needed - backend handles it)
  const formatWeight = (weight: number) => {
    if (weight == null || isNaN(weight)) return 0;
    return weight;
  };

  // Helper to get unit label for display
  const getUnitLabel = () => {
    if (selectedUnit === 'Kilograms (kg)') return 'kg';
    if (selectedUnit === 'Pounds (lb)') return 'lbs';
    return selectedUnit;
  };

  // Helper to get month and year from a record (simulate with dummy date for now)
  // In real data, you would need a date field per item. For now, assume all items are for the current year/month.
  // const getItemDate = (item: { name: string; weight: number; date?: string }) => {
  //   if (item.date) return new Date(item.date);
  //   return null;
  // };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
        unit: selectedUnit
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inventory/export-table?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${selectedYear}-${selectedMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export completed successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
    }
  };

  // Combine base units with weighing categories for dropdown
  const allUnits = [...baseUnits, ...weighingCategories.map(c => c.category)];

  // Donation categories CRUD functions
  const handleAddCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donation-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newCategory = await response.json();
        setDonationCategories(prev => [...prev, newCategory]);
        setFormData({ name: '', icon: '' });
        setShowAddModal(false);
        toast.success('Category added successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add category');
      }
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donation-categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedCategory = await response.json();
        setDonationCategories(prev => 
          prev.map(cat => cat.id === editingCategory.id ? updatedCategory : cat)
        );
        setFormData({ name: '', icon: '' });
        setShowEditModal(false);
        setEditingCategory(null);
        toast.success('Category updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update category');
      }
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donation-categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDonationCategories(prev => prev.filter(cat => cat.id !== categoryId));
        toast.success('Category deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    }
  };

  const openEditModal = (category: DonationCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon || '' });
    setShowEditModal(true);
  };

  // Donation Location CRUD functions
  const handleAddDonationLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donationLocationFormData)
      });

      if (response.ok) {
        const newDonationLocation = await response.json();
        setDonationLocationsList(prev => [...prev, newDonationLocation]);
        setDonationLocationFormData({ name: '', location: '', contactInfo: '' });
        setShowAddDonationLocationModal(false);
        toast.success('Donation location added successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add donation location');
      }
    } catch (err) {
      console.error('Error adding donation location:', err);
      toast.error('Failed to add donation location');
    }
  };

  const handleEditDonationLocation = async () => {
    if (!editingDonationLocation) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donors/${editingDonationLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(donationLocationFormData)
      });

      if (response.ok) {
        const updatedDonationLocation = await response.json();
        setDonationLocationsList(prev => 
          prev.map(donationLocation => donationLocation.id === editingDonationLocation.id ? updatedDonationLocation : donationLocation)
        );
        setDonationLocationFormData({ name: '', location: '', contactInfo: '' });
        setShowEditDonationLocationModal(false);
        setEditingDonationLocation(null);
        toast.success('Donation location updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update donation location');
      }
    } catch (err) {
      console.error('Error updating donation location:', err);
      toast.error('Failed to update donation location');
    }
  };

  const handleDeleteDonationLocation = async (donationLocationId: number) => {
    if (!confirm('Are you sure you want to delete this donation location?')) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/donors/${donationLocationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDonationLocationsList(prev => prev.filter(donationLocation => donationLocation.id !== donationLocationId));
        toast.success('Donation location deleted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete donation location');
      }
    } catch (err) {
      console.error('Error deleting donation location:', err);
      toast.error('Failed to delete donation location');
    }
  };

  const openEditDonationLocationModal = (donationLocation: DonationLocation) => {
    setEditingDonationLocation(donationLocation);
    setDonationLocationFormData({ 
      name: donationLocation.name, 
      location: donationLocation.location || '', 
      contactInfo: donationLocation.contactInfo || '' 
    });
    setShowEditDonationLocationModal(true);
  };

  return (
    <main className={styles.main}>
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'inventory' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          Inventory
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Donation Categories
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'donors' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('donors')}
        >
          Donation Locations
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          <div className={styles.headerContainer}>
            <div className={styles.pageTitle}>Current Inventory by Donation Location and Category</div>
            <div className={styles.filtersContainer}>
              <div className={styles.filtersRow}>
                <select className={styles.select} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select className={styles.select} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                  {getYearOptions().map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select className={styles.select} value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
                  {allUnits.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button onClick={handleExportExcel} className={styles.exportBtn}>
                  Export to Excel
                </button>
              </div>
            </div>
          </div>
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>
          ) : donationLocations.length === 0 || categories.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No inventory data found.</div>
          ) : (
            <table className={`${styles.table} ${styles.colScroll}`} style={{ width:`${(categories.length + 2) * 16.6667}%` }}>
              <thead>
                <tr>
                  <th>Donation Category</th>
                  {donationLocations.map(donationLocation => (
                    <th key={donationLocation}>{donationLocation} ({getUnitLabel()})</th>
                  ))}
                  <th>Total ({getUnitLabel()})</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat: string) => (
                  <tr key={cat}>
                    <td style={{alignItems:"center", fontWeight:"bold"}} >{cat}</td>
                    {donationLocations.map((donationLocation: string) => (
                      <td key={donationLocation}>{formatWeight(tableData[donationLocation]?.[cat] || 0).toFixed(2)}</td>
                    ))}
                    <td className={styles.totalCol}>
                      {formatWeight(donationLocations.reduce((sum, donationLocation) => sum + (tableData[donationLocation]?.[cat] || 0), 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.monthlyTotalRow}>
                  <td>Total</td>
                  {donationLocations.map((donationLocation: string) => (
                    <td key={donationLocation}>
                      {formatWeight(Object.values(tableData[donationLocation] || {}).reduce((sum, val) => sum + val, 0)).toFixed(2)}
                    </td>
                  ))}
                  <td className={styles.totalCol}>
                    {formatWeight(donationLocations.reduce((sum, donationLocation) => sum + Object.values(tableData[donationLocation] || {}).reduce((s, v) => s + v, 0), 0)).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}

      {/* Donation Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div className={styles.pageTitle} style={{ marginBottom: 0 }}>Donation Categories</div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Add Category
            </button>
          </div>

          {categoriesLoading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading categories...</div>
          ) : donationCategories.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No donation categories found.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.tableContainer}>
                <table className={`${styles.table} ${styles.colScroll}`}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Icon</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationCategories.map((category) => (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.icon || '-'}</td>
                        <td>
                          <button
                            onClick={() => openEditModal(category)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Donation Locations Tab */}
      {activeTab === 'donors' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div className={styles.pageTitle} style={{ marginBottom: 0 }}>Donation Locations</div>
            <button
              onClick={() => setShowAddDonationLocationModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Add Donation Location
            </button>
          </div>

          {donationLocationsLoading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading donation locations...</div>
          ) : donationLocationsList.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No donation locations found.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.tableContainer}>
                <table className={`${styles.table} ${styles.colScroll}`}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Contact Info</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationLocationsList.map((donationLocation) => (
                      <tr key={donationLocation.id}>
                        <td>{donationLocation.name}</td>
                        <td>{donationLocation.location || '-'}</td>
                        <td>{donationLocation.contactInfo || '-'}</td>
                        <td>
                          <button
                            onClick={() => openEditDonationLocationModal(donationLocation)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: '8px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDonationLocation(donationLocation.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add Donation Category</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter category name"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Icon (optional)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter icon name or emoji"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', icon: '' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!formData.name.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: formData.name.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: formData.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit Donation Category</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Category Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter category name"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Icon (optional)
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter icon name or emoji"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setFormData({ name: '', icon: '' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                disabled={!formData.name.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: formData.name.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: formData.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Donation Location Modal */}
      {showAddDonationLocationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add Donation Location</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Donation Location Name *
              </label>
              <input
                type="text"
                value={donationLocationFormData.name}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter donation location name"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Location (optional)
              </label>
              <input
                type="text"
                value={donationLocationFormData.location}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, location: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter location"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Contact Info (optional)
              </label>
              <input
                type="text"
                value={donationLocationFormData.contactInfo}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter contact information"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddDonationLocationModal(false);
                  setDonationLocationFormData({ name: '', location: '', contactInfo: '' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDonationLocation}
                disabled={!donationLocationFormData.name.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: donationLocationFormData.name.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: donationLocationFormData.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Donation Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donation Location Modal */}
      {showEditDonationLocationModal && editingDonationLocation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Edit Donation Location</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Donation Location Name *
              </label>
              <input
                type="text"
                value={donationLocationFormData.name}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter donation location name"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Location (optional)
              </label>
              <input
                type="text"
                value={donationLocationFormData.location}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, location: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter location"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                Contact Info (optional)
              </label>
              <input
                type="text"
                value={donationLocationFormData.contactInfo}
                onChange={(e) => setDonationLocationFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Enter contact information"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditDonationLocationModal(false);
                  setEditingDonationLocation(null);
                  setDonationLocationFormData({ name: '', location: '', contactInfo: '' });
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditDonationLocation}
                disabled={!donationLocationFormData.name.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: donationLocationFormData.name.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: donationLocationFormData.name.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Update Donation Location
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 