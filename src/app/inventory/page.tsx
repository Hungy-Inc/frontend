'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type DonationCategory = {
  id: number;
  name: string;
  icon: string | null;
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories'>('inventory');
  const [donors, setDonors] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tableData, setTableData] = useState<{ [donor: string]: { [cat: string]: number } }>({});
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

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchDonationCategories();
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
        setDonors(data.donors);
        setCategories(data.categories);
        setTableData(data.table);
      } catch (err) {
        setDonors([]);
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

  return (
    <main className={styles.main}>
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 24, borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('inventory')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'inventory' ? '#ff9800' : 'transparent',
            color: activeTab === 'inventory' ? 'white' : '#ff9800',
            cursor: 'pointer',
            borderBottom: activeTab === 'inventory' ? '2px solid #ff9800' : '2px solid transparent',
            fontWeight: activeTab === 'inventory' ? '600' : '400',
            borderRadius: '8px 8px 0 0',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: activeTab === 'categories' ? '#ff9800' : 'transparent',
            color: activeTab === 'categories' ? 'white' : '#ff9800',
            cursor: 'pointer',
            borderBottom: activeTab === 'categories' ? '2px solid #ff9800' : '2px solid transparent',
            fontWeight: activeTab === 'categories' ? '600' : '400',
            borderRadius: '8px 8px 0 0',
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          Donation Categories
        </button>
      </div>

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
            <div className={styles.pageTitle} style={{ marginBottom: 0 }}>Current Inventory by Donor and Category</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <select
                className={styles.select}
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                style={{ marginRight: 8 }}
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                className={styles.select}
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{ marginRight: 8 }}
              >
                {getYearOptions().map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                className={styles.select}
                value={selectedUnit}
                onChange={e => setSelectedUnit(e.target.value)}
                style={{ marginRight: 8 }}
              >
                {allUnits.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={handleExportExcel}
                className={styles.exportBtn}
              >
                Export to Excel
              </button>
            </div>
          </div>
      <div className={styles.tableWrapper}>
        <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
          ) : error ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>{error}</div>
          ) : donors.length === 0 || categories.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>No inventory data found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Donor</th>
                  {categories.map(cat => (
                    <th key={cat}>{cat} ({getUnitLabel()})</th>
                  ))}
                  <th>Total ({getUnitLabel()})</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((donor: string) => (
                  <tr key={donor}>
                    <td>{donor}</td>
                    {categories.map((cat: string) => (
                      <td key={cat}>{formatWeight(tableData[donor][cat]).toFixed(2)}</td>
                    ))}
                    <td className={styles.totalCol}>
                      {formatWeight(Object.values(tableData[donor]).reduce((sum, val) => sum + val, 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.monthlyTotalRow}>
                  <td>Total</td>
                  {categories.map((cat: string) => (
                    <td key={cat}>
                      {formatWeight(donors.reduce((sum, donor) => sum + tableData[donor][cat], 0)).toFixed(2)}
                    </td>
                  ))}
                  <td className={styles.totalCol}>
                    {formatWeight(donors.reduce((sum, donor) => sum + Object.values(tableData[donor]).reduce((s, v) => s + v, 0), 0)).toFixed(2)}
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
                <table className={styles.table}>
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
    </main>
  );
} 