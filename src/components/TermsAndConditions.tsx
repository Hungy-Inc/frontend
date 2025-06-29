"use client";

import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaEye, FaTimes, FaSave, FaUpload } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface TermsAndConditions {
  id: number;
  version: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
}

interface TermsAndConditionsProps {
  apiUrl: string;
}

export default function TermsAndConditions({ apiUrl }: TermsAndConditionsProps) {
  const [termsAndConditions, setTermsAndConditions] = useState<TermsAndConditions[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTerms, setEditingTerms] = useState<TermsAndConditions | null>(null);
  const [showFileReplaceModal, setShowFileReplaceModal] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    isActive: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTermsAndConditions();
  }, []);

  const fetchTermsAndConditions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/terms-and-conditions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTermsAndConditions(data);
      } else {
        throw new Error('Failed to fetch terms and conditions');
      }
    } catch (error: any) {
      console.error('Error fetching terms and conditions:', error);
      toast.error(error.message || 'Failed to load terms and conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerms = async () => {
    if (!selectedFile || !formData.version || !formData.title) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);
      formDataToSend.append('version', formData.version);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('isActive', formData.isActive.toString());

      const response = await fetch(`${apiUrl}/api/terms-and-conditions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Terms and conditions added successfully');
        setShowAddModal(false);
        resetForm();
        fetchTermsAndConditions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add terms and conditions');
      }
    } catch (error: any) {
      console.error('Error adding terms and conditions:', error);
      toast.error(error.message || 'Failed to add terms and conditions');
    } finally {
      setUploading(false);
    }
  };

  const handleEditTerms = async () => {
    if (!editingTerms || !formData.version || !formData.title) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/terms-and-conditions/${editingTerms.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          version: formData.version,
          title: formData.title,
          isActive: formData.isActive
        })
      });

      if (response.ok) {
        toast.success('Terms and conditions updated successfully');
        setShowEditModal(false);
        setEditingTerms(null);
        resetForm();
        fetchTermsAndConditions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update terms and conditions');
      }
    } catch (error: any) {
      console.error('Error updating terms and conditions:', error);
      toast.error(error.message || 'Failed to update terms and conditions');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async () => {
    if (!editingTerms || !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('file', selectedFile);

      const response = await fetch(`${apiUrl}/api/terms-and-conditions/${editingTerms.id}/file`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('File replaced successfully');
        setShowFileReplaceModal(false);
        setEditingTerms(null);
        setSelectedFile(null);
        fetchTermsAndConditions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to replace file');
      }
    } catch (error: any) {
      console.error('Error replacing file:', error);
      toast.error(error.message || 'Failed to replace file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTerms = async (terms: TermsAndConditions) => {
    if (!confirm(`Are you sure you want to delete "${terms.title}" (${terms.version})?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/api/terms-and-conditions/${terms.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Terms and conditions deleted successfully');
        fetchTermsAndConditions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete terms and conditions');
      }
    } catch (error: any) {
      console.error('Error deleting terms and conditions:', error);
      toast.error(error.message || 'Failed to delete terms and conditions');
    }
  };

  const openFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resetForm = () => {
    setFormData({ version: '', title: '', isActive: false });
    setSelectedFile(null);
  };

  const startEdit = (terms: TermsAndConditions) => {
    setEditingTerms(terms);
    setFormData({
      version: terms.version,
      title: terms.title,
      isActive: terms.isActive
    });
    setShowEditModal(true);
  };

  const startFileReplace = (terms: TermsAndConditions) => {
    setEditingTerms(terms);
    setSelectedFile(null);
    setShowFileReplaceModal(true);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">Loading terms and conditions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Terms and Conditions</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <FaPlus size={14} />
          Add New
        </button>
      </div>

      {termsAndConditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No terms and conditions found. Click "Add New" to create one.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Version</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Title</th>
                <th className="border border-gray-300 px-4 py-2 text-left">File</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Size</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Created</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {termsAndConditions.map((terms) => (
                <tr key={terms.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2 font-medium">{terms.version}</td>
                  <td className="border border-gray-300 px-4 py-2">{terms.title}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => openFile(terms.fileUrl)}
                      className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                    >
                      <FaEye size={12} />
                      {terms.fileName}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {formatFileSize(terms.fileSize)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      terms.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {terms.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                    {formatDate(terms.createdAt)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(terms)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => startFileReplace(terms)}
                        className="text-green-500 hover:text-green-700"
                        title="Replace File"
                      >
                        <FaUpload size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteTerms(terms)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Terms and Conditions</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., 1.0, 2023-v1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Terms of Service"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, Word, Text, Images (Max 10MB)
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Set as active version
                </label>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddTerms}
                disabled={uploading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <FaSave size={14} />
                {uploading ? 'Uploading...' : 'Save'}
              </button>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Terms and Conditions</h3>
              <button onClick={() => { setShowEditModal(false); setEditingTerms(null); resetForm(); }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="editIsActive" className="text-sm text-gray-700">
                  Set as active version
                </label>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Current file: <strong>{editingTerms.fileName}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  To replace the file, use the "Replace File" button in the table.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleEditTerms}
                disabled={uploading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <FaSave size={14} />
                {uploading ? 'Updating...' : 'Update'}
              </button>
              <button
                onClick={() => { setShowEditModal(false); setEditingTerms(null); resetForm(); }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Replace Modal */}
      {showFileReplaceModal && editingTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Replace File</h3>
              <button onClick={() => { setShowFileReplaceModal(false); setEditingTerms(null); setSelectedFile(null); }}>
                <FaTimes />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Current file: <strong>{editingTerms.fileName}</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Size: {formatFileSize(editingTerms.fileSize)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, Word, Text, Images (Max 10MB)
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleReplaceFile}
                disabled={uploading || !selectedFile}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2"
              >
                <FaUpload size={14} />
                {uploading ? 'Uploading...' : 'Replace'}
              </button>
              <button
                onClick={() => { setShowFileReplaceModal(false); setEditingTerms(null); setSelectedFile(null); }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 