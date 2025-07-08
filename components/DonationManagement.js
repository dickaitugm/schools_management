'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useAuth } from './AuthContext';
import { formatDateIndonesian } from '../utils/dateUtils';

const DonationManagement = () => {
  const { hasPermission, logActivity } = useAuth();
  const [donations, setDonations] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedDonation, setSelectedDonation] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    school_id: '',
    amount: '',
    donation_type: 'cash',
    description: '',
    status: 'pending',
    received_date: ''
  });

  const donationTypes = [
    { value: 'cash', label: 'Cash', icon: '💰' },
    { value: 'goods', label: 'Goods/Items', icon: '📦' },
    { value: 'service', label: 'Service', icon: '🤝' },
    { value: 'scholarship', label: 'Scholarship', icon: '🎓' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'received', label: 'Received', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    if (hasPermission('read_donations')) {
      fetchDonations();
      fetchSchools();
    }
    
    // Log page access
    logActivity('page_access', 'Accessed Donations page');
  }, []);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Since we don't have the API yet, let's simulate with sample data
      const sampleDonations = [
        {
          id: 1,
          donor_name: 'PT Maju Bersama',
          donor_email: 'contact@majubersama.com',
          donor_phone: '021-1234567',
          school_name: 'SD Harapan Bangsa',
          amount: 5000000,
          donation_type: 'cash',
          description: 'Donasi untuk pembangunan perpustakaan',
          status: 'received',
          received_date: '2024-12-01',
          created_at: '2024-11-15T10:00:00Z'
        },
        {
          id: 2,
          donor_name: 'Yayasan Peduli Pendidikan',
          donor_email: 'info@pedulipendidikan.org',
          donor_phone: '021-9876543',
          school_name: 'SMP Cerdas Mandiri',
          amount: 2000000,
          donation_type: 'scholarship',
          description: 'Beasiswa untuk 5 siswa berprestasi',
          status: 'pending',
          received_date: null,
          created_at: '2024-12-05T14:30:00Z'
        },
        {
          id: 3,
          donor_name: 'CV Barokah Jaya',
          donor_email: 'barokah@gmail.com',
          donor_phone: '0812-3456789',
          school_name: 'TK Bina Ceria',
          amount: 0,
          donation_type: 'goods',
          description: 'Donasi buku cerita anak dan alat tulis',
          status: 'received',
          received_date: '2024-11-28',
          created_at: '2024-11-25T09:15:00Z'
        }
      ];
      
      setDonations(sampleDonations);
      logActivity('view', 'Viewed donations list');
    } catch (error) {
      console.error('Error fetching donations:', error);
      setError('Failed to fetch donations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      if (response.ok) {
        const result = await response.json();
        // Handle both formats: direct array or nested data
        const schoolsData = result.data || result;
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } else {
        setSchools([]);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setSchools([]);
    }
  };

  const resetForm = () => {
    setFormData({
      donor_name: '',
      donor_email: '',
      donor_phone: '',
      school_id: '',
      amount: '',
      donation_type: 'cash',
      description: '',
      status: 'pending',
      received_date: ''
    });
  };

  const openModal = (type, donation = null) => {
    setModalType(type);
    setSelectedDonation(donation);
    
    if (donation) {
      setFormData({
        donor_name: donation.donor_name,
        donor_email: donation.donor_email,
        donor_phone: donation.donor_phone,
        school_id: donation.school_id || '',
        amount: donation.amount,
        donation_type: donation.donation_type,
        description: donation.description,
        status: donation.status,
        received_date: donation.received_date || ''
      });
    } else {
      resetForm();
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDonation(null);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (modalType === 'create') {
        const newDonation = {
          id: donations.length + 1,
          ...formData,
          school_name: schools.find(s => s.id == formData.school_id)?.name || 'Unknown School',
          created_at: new Date().toISOString()
        };
        setDonations([newDonation, ...donations]);
        setSuccess('Donation recorded successfully!');
        logActivity('create', `Recorded new donation from ${formData.donor_name}`);
      } else {
        const updatedDonations = donations.map(d => 
          d.id === selectedDonation.id 
            ? { ...d, ...formData, school_name: schools.find(s => s.id == formData.school_id)?.name || d.school_name }
            : d
        );
        setDonations(updatedDonations);
        setSuccess('Donation updated successfully!');
        logActivity('update', `Updated donation from ${formData.donor_name}`);
      }
      
      setTimeout(() => {
        closeModal();
        setSuccess(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error saving donation:', error);
      setError('Failed to save donation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (donation) => {
    if (!confirm(`Are you sure you want to delete donation from ${donation.donor_name}?`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setDonations(donations.filter(d => d.id !== donation.id));
      setSuccess('Donation deleted successfully!');
      logActivity('delete', `Deleted donation from ${donation.donor_name}`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting donation:', error);
      setError('Failed to delete donation');
    } finally {
      setLoading(false);
    }
  };

  // Filter donations based on search and filters
  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = !schoolFilter || donation.school_name.includes(schoolFilter);
    const matchesStatus = !statusFilter || donation.status === statusFilter;
    const matchesType = !typeFilter || donation.donation_type === typeFilter;
    const matchesDate = !dateFilter || donation.received_date?.includes(dateFilter);
    
    return matchesSearch && matchesSchool && matchesStatus && matchesType && matchesDate;
  });

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalAmount = () => {
    return filteredDonations
      .filter(d => d.status === 'received' && d.donation_type === 'cash')
      .reduce((sum, d) => sum + (d.amount || 0), 0);
  };

  if (loading && donations.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg">Loading donations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Donation Management</h1>
        {hasPermission('create_donations') && (
          <button
            onClick={() => openModal('create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <span className="text-lg">➕</span>
            Record Donation
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              💰
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalAmount())}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              📊
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Donations</p>
              <p className="text-2xl font-bold text-gray-900">{filteredDonations.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              ⏳
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredDonations.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              🎯
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredDonations.filter(d => 
                  new Date(d.created_at).getMonth() === new Date().getMonth()
                ).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search donations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schools</option>
              {Array.isArray(schools) && schools.map(school => (
                <option key={school.id} value={school.name}>{school.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              {donationTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSchoolFilter('');
                setStatusFilter('');
                setTypeFilter('');
                setDateFilter('');
              }}
              className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Donations Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{donation.donor_name}</div>
                      <div className="text-sm text-gray-500">{donation.donor_email}</div>
                      <div className="text-sm text-gray-500">{donation.donor_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {donation.school_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {donationTypes.find(t => t.value === donation.donation_type)?.icon} {donation.donation_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(donation.status)}`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donation.received_date ? formatDateIndonesian(donation.received_date) : 'Pending'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {hasPermission('update_donations') && (
                        <button
                          onClick={() => openModal('edit', donation)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                      )}
                      {hasPermission('delete_donations') && (
                        <button
                          onClick={() => handleDelete(donation)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDonations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <p className="text-xl mb-2">💝</p>
              <p>No donations found</p>
              {hasPermission('create_donations') && (
                <button
                  onClick={() => openModal('create')}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Record First Donation
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalType === 'create' ? 'Record New Donation' : 'Edit Donation'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name *</label>
              <input
                type="text"
                value={formData.donor_name}
                onChange={(e) => setFormData({...formData, donor_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor Email</label>
              <input
                type="email"
                value={formData.donor_email}
                onChange={(e) => setFormData({...formData, donor_email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor Phone</label>
              <input
                type="tel"
                value={formData.donor_phone}
                onChange={(e) => setFormData({...formData, donor_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School *</label>
              <select
                value={formData.school_id}
                onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select School</option>
                {schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type *</label>
              <select
                value={formData.donation_type}
                onChange={(e) => setFormData({...formData, donation_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {donationTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (IDR)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 (for non-cash donations)"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Received Date</label>
              <input
                type="date"
                value={formData.received_date}
                onChange={(e) => setFormData({...formData, received_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the donation purpose or details..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : modalType === 'create' ? 'Record Donation' : 'Update Donation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DonationManagement;
