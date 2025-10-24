import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaBox, FaCreditCard } from 'react-icons/fa';
import api from '../services/api';
import { fetchOrders } from '../store/slices/orderSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { orders } = useSelector(state => state.orders);
  
  // Safely extract user data as strings
  const safeUserName = user?.name && typeof user.name === 'string' ? user.name : 'Not provided';
  const safeUserEmail = user?.email && typeof user.email === 'string' ? user.email : 'Not provided';
  const safeUserPhone = user?.phone && typeof user.phone === 'string' ? user.phone : 'Not provided';
  const safeUserAddress = user?.address && typeof user.address === 'string' ? user.address : 'Not provided';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  
  // Initialize editedUser with current user data or empty strings
  const [editedUser, setEditedUser] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  // Simple initialization - run once when user is available
  useEffect(() => {
    if (user && editedUser.name === '' && editedUser.email === '') {
      setEditedUser({
        name: safeUserName === 'Not provided' ? '' : safeUserName,
        email: safeUserEmail === 'Not provided' ? '' : safeUserEmail,
        phone: safeUserPhone === 'Not provided' ? '' : safeUserPhone,
        address: safeUserAddress === 'Not provided' ? '' : safeUserAddress
      });
    }
  }, [user, editedUser.name, editedUser.email, safeUserName, safeUserEmail, safeUserPhone, safeUserAddress]);

  // Fetch user's orders to get count
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchOrders());
    }
  }, [dispatch, isAuthenticated, user]);

  // Update order count when orders change
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      setOrderCount(orders.length);
    }
  }, [orders]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('Saving user data:', editedUser);
      
      // Prepare data for API (exclude email as it's not allowed to be updated)
      const updateData = {
        name: editedUser.name,
        phone: editedUser.phone,
        address: editedUser.address
      };
      
      // Make API call to update user profile
      const response = await api.put('/auth/profile', updateData);
      
      if (response.data.success) {
        console.log('Profile updated successfully:', response.data);
        
        // Exit edit mode
        setIsEditing(false);
        
        // Show success message
        alert('Profile updated successfully!');
        
        // Optionally reload the page to get fresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>
        <p className="text-gray-600 mb-4">Please log in to view your profile.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className={`bg-white rounded-lg shadow-md p-6 mb-6 ${isEditing ? 'ring-2 ring-blue-300 bg-blue-50' : ''}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                Personal Information
                {isEditing && <span className="ml-2 text-sm text-blue-600 font-normal">(Editing Mode)</span>}
              </h2>
              <button
                onClick={handleEditToggle}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                {isEditing ? <FaTimes /> : <FaEdit />}
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser.name}
                    onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-gray-900">{safeUserName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaEnvelope className="inline mr-2" />
                  Email Address
                </label>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="email"
                      value={editedUser.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <span className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</span>
                  </div>
                ) : (
                  <p className="text-gray-900">{safeUserEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline mr-2" />
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUser.phone}
                    onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="text-gray-900">{safeUserPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Address
                </label>
                {isEditing ? (
                  <textarea
                    value={editedUser.address}
                    onChange={(e) => setEditedUser({...editedUser, address: e.target.value})}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    rows="3"
                    placeholder="Enter your address"
                  />
                ) : (
                  <p className="text-gray-900">{safeUserAddress}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-2 rounded-md ${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Order History */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-6">Order History</h3>
            {orderCount > 0 ? (
              <div className="text-center py-8">
                <FaBox className="mx-auto text-4xl mb-4 text-green-600" />
                <p className="text-gray-700 mb-2">You have {orderCount} order{orderCount !== 1 ? 's' : ''}</p>
                <button 
                  onClick={() => window.location.href = '/orders'}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  View All Orders
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaBox className="mx-auto text-4xl mb-4" />
                <p>No orders found</p>
                <button 
                  onClick={() => window.location.href = '/products'}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Start Shopping
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Account Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Member Since</span>
                <span className="font-medium">Recently</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium">{orderCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account Status</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.href = '/products'}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
              >
                <FaBox className="text-blue-600" />
                Browse Products
              </button>
              <button 
                onClick={() => window.location.href = '/cart'}
                className="w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 flex items-center gap-2"
              >
                <FaCreditCard className="text-green-600" />
                View Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;