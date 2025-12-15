'use client';
import styles from '../incoming-stats/IncomingStats.module.css';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  useInventoryTable,
  useDonationCategories,
  useDonationCategoryMutations,
  useDonationLocations,
  useDonationLocationMutations,
  useExportInventory
} from '@/hooks/queries/useInventory';
import { CategoryForm } from '@/components/features/inventory/CategoryForm';
import { LocationForm } from '@/components/features/inventory/LocationForm';
import { DonationCategoryFormData, DonationLocationFormData } from '@/lib/schemas';

type DonationCategory = {
  id: number;
  name: string;
  icon: string | null;
};

type DonationLocation = {
  id: number;
  name: string;
  location: string;
  contactInfo: string | null;
};

import { MONTHS, BASE_UNITS } from '@/constants/appConstants';

const months = MONTHS;
const baseUnits = BASE_UNITS;

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

  // Inventory Filter State
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedUnit, setSelectedUnit] = useState(baseUnits[1]); // Default to Pounds (lb)

  // Weighing Categories Query
  const { data: weighingCategories = [] } = useQuery({
    queryKey: ['weighingCategories'],
    queryFn: () => api.getWeighingCategories(),
    staleTime: Infinity,
  });

  // Inventory Table Query
  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    error: inventoryError
  } = useInventoryTable(selectedMonth, selectedYear, selectedUnit);

  const donationLocations = inventoryData?.donors || [];
  const categories = inventoryData?.categories || [];
  const tableData = inventoryData?.table || {};

  // Donation Categories Query & Mutations
  const {
    data: donationCategories = [],
    isLoading: isCategoriesLoading
  } = useDonationCategories();

  const { addCategory, updateCategory, deleteCategory } = useDonationCategoryMutations();

  // Donation Locations Query & Mutations
  const {
    data: donationLocationsList = [],
    isLoading: isLocationsLoading
  } = useDonationLocations();

  const { addLocation, updateLocation, deleteLocation } = useDonationLocationMutations();

  // Export Mutation
  const exportInventoryMutation = useExportInventory();

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DonationCategory | null>(null);

  const [showAddDonationLocationModal, setShowAddDonationLocationModal] = useState(false);
  const [showEditDonationLocationModal, setShowEditDonationLocationModal] = useState(false);
  const [editingDonationLocation, setEditingDonationLocation] = useState<DonationLocation | null>(null);

  // Event Handlers
  const handleExportExcel = () => {
    exportInventoryMutation.mutate({ month: selectedMonth, year: selectedYear, unit: selectedUnit });
  };

  const handleAddCategory = (data: DonationCategoryFormData) => {
    addCategory.mutate(data, {
      onSuccess: () => {
        setShowAddModal(false);
      }
    });
  };

  const handleEditCategory = (data: DonationCategoryFormData) => {
    if (!editingCategory) return;
    updateCategory.mutate({ id: editingCategory.id, data }, {
      onSuccess: () => {
        setShowEditModal(false);
        setEditingCategory(null);
      }
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategory.mutate(id);
    }
  };

  const openEditModal = (category: DonationCategory) => {
    setEditingCategory(category);
    setShowEditModal(true);
  };

  const handleAddDonationLocation = (data: DonationLocationFormData) => {
    addLocation.mutate(data, {
      onSuccess: () => {
        setShowAddDonationLocationModal(false);
      }
    });
  };

  const handleEditDonationLocation = (data: DonationLocationFormData) => {
    if (!editingDonationLocation) return;
    updateLocation.mutate({ id: editingDonationLocation.id, data }, {
      onSuccess: () => {
        setShowEditDonationLocationModal(false);
        setEditingDonationLocation(null);
      }
    });
  };

  const handleDeleteDonationLocation = (id: number) => {
    if (confirm('Are you sure you want to delete this donation location?')) {
      deleteLocation.mutate(id);
    }
  };

  const openEditDonationLocationModal = (location: DonationLocation) => {
    setEditingDonationLocation(location);
    setShowEditDonationLocationModal(true);
  };

  // Helper functions
  const formatWeight = (weight: number) => {
    if (weight == null || isNaN(weight)) return 0;
    return weight;
  };

  const getUnitLabel = () => {
    if (selectedUnit === 'Kilograms (kg)') return 'kg';
    if (selectedUnit === 'Pounds (lb)') return 'lbs';
    return selectedUnit;
  };

  const allUnits = [...baseUnits, ...(weighingCategories as any[]).map((c: any) => c.category)];

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
                  {exportInventoryMutation.isPending ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
            </div>
          </div>
          <div className={styles.tableWrapper}>
            <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
              {isInventoryLoading ? (
                <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
              ) : inventoryError ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'red' }}>Failed to load inventory data.</div>
              ) : donationLocations.length === 0 || categories.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center' }}>No inventory data found.</div>
              ) : (
                <table className={`${styles.table} ${styles.colScroll}`} style={{ width: `${(categories.length + 2) * 16.6667}%` }}>
                  <thead>
                    <tr>
                      <th>Donation Category</th>
                      {donationLocations.map((donationLocation: string) => (
                        <th key={donationLocation}>{donationLocation} ({getUnitLabel()})</th>
                      ))}
                      <th>Total ({getUnitLabel()})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat: string) => (
                      <tr key={cat}>
                        <td style={{ alignItems: "center", fontWeight: "bold" }} >{cat}</td>
                        {donationLocations.map((donationLocation: string) => (
                          <td key={donationLocation}>{formatWeight(tableData[donationLocation]?.[cat] || 0).toFixed(2)}</td>
                        ))}
                        <td className={styles.totalCol}>
                          {formatWeight(donationLocations.reduce((sum: number, donationLocation: string) => sum + (tableData[donationLocation]?.[cat] || 0), 0)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className={styles.monthlyTotalRow}>
                      <td>Total</td>
                      {donationLocations.map((donationLocation: string) => (
                        <td key={donationLocation}>
                          {formatWeight((Object.values(tableData[donationLocation] || {}) as number[]).reduce((sum: number, val: number) => sum + val, 0)).toFixed(2)}
                        </td>
                      ))}
                      <td className={styles.totalCol}>
                        {formatWeight(donationLocations.reduce((sum: number, donationLocation: string) => sum + (Object.values(tableData[donationLocation] || {}) as number[]).reduce((s: number, v: number) => s + v, 0), 0)).toFixed(2)}
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

          {isCategoriesLoading ? (
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
                    {donationCategories.map((category: DonationCategory) => (
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

          {isLocationsLoading ? (
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
                    {donationLocationsList.map((donationLocation: DonationLocation) => (
                      <tr key={donationLocation.id}>
                        <td>{donationLocation.name}</td>
                        <td>{donationLocation.location}</td>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Add Category</h3>
            <CategoryForm
              onSubmit={handleAddCategory}
              onCancel={() => setShowAddModal(false)}
              isLoading={addCategory.isPending}
              submitLabel="Add Category"
            />
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Edit Category</h3>
            <CategoryForm
              defaultValues={{ name: editingCategory.name, icon: editingCategory.icon || '' }}
              onSubmit={handleEditCategory}
              onCancel={() => { setShowEditModal(false); setEditingCategory(null); }}
              isLoading={updateCategory.isPending}
              submitLabel="Update Category"
            />
          </div>
        </div>
      )}

      {/* Add Location Modal */}
      {showAddDonationLocationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Add Donation Location</h3>
            <LocationForm
              onSubmit={handleAddDonationLocation}
              onCancel={() => setShowAddDonationLocationModal(false)}
              isLoading={addLocation.isPending}
              submitLabel="Add Location"
            />
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditDonationLocationModal && editingDonationLocation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: 24, borderRadius: 8, width: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Edit Donation Location</h3>
            <LocationForm
              defaultValues={{
                name: editingDonationLocation.name,
                location: editingDonationLocation.location,
                contactInfo: editingDonationLocation.contactInfo || ''
              }}
              onSubmit={handleEditDonationLocation}
              onCancel={() => { setShowEditDonationLocationModal(false); setEditingDonationLocation(null); }}
              isLoading={updateLocation.isPending}
              submitLabel="Update Location"
            />
          </div>
        </div>
      )}
    </main>
  );
}