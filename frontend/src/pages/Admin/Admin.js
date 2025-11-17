import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { showSuccessToast, showErrorToast } from '../../store/slices/toastSlice';
import { useDispatch } from 'react-redux';

const AddProductForm = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    images: '', // comma-separated URLs
    inventory: 0,
    featured: false,
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic client-side validation
      if (form.inventory === '' || form.inventory === null || isNaN(Number(form.inventory))) {
        dispatch(showErrorToast('Please provide inventory quantity'));
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        brand: form.brand,
        images: form.images ? form.images.split(',').map(u => ({ url: u.trim() })) : [],
        inventory: { quantity: parseInt(form.inventory, 10) || 0 },
        featured: !!form.featured,
        status: form.status
      };

      const response = await api.post('/products', payload);
      dispatch(showSuccessToast('Product created successfully'));
      setForm({ name: '', description: '', price: '', category: '', brand: '', images: '', inventory: 0, featured: false, status: 'active' });
    } catch (err) {
      console.error('Create product error', err);
      dispatch(showErrorToast(err.response?.data?.message || 'Failed to create product'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-4">Add Product</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className="border p-2 rounded" required />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="border p-2 rounded" required />
        <input name="brand" value={form.brand} onChange={handleChange} placeholder="Brand" className="border p-2 rounded" />
        <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number" step="0.01" className="border p-2 rounded" required />
        <input name="inventory" value={form.inventory} onChange={handleChange} placeholder="Inventory" type="number" className="border p-2 rounded" />
        <select name="status" value={form.status} onChange={handleChange} className="border p-2 rounded">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-4">
        <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border p-2 rounded" rows={4} />
      </div>

      <div className="mt-4">
        <input name="images" value={form.images} onChange={handleChange} placeholder="Image URLs (comma separated)" className="w-full border p-2 rounded" />
        <p className="text-xs text-gray-500 mt-1">Provide public image URLs separated by commas.</p>
      </div>

      <div className="flex items-center space-x-4 mt-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} />
          <span>Featured</span>
        </label>

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Saving...' : 'Create Product'}
        </button>
      </div>
    </form>
  );
};

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const fetchUsers = async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${p}&limit=${limit}`);
      // Debug log
      console.log('Admin users response', res.data);

      const items = res.data?.data?.items || (Array.isArray(res.data?.data) ? res.data.data : []);
      setUsers(items);
    } catch (err) {
      console.error('Fetch users error', err);
      const message = err.response?.data?.message || err.message || 'Failed to fetch users';
      dispatch(showErrorToast(message));

      // If unauthorized or forbidden, redirect to home after showing error
      if (err.response?.status === 401 || err.response?.status === 403) {
        setUsers([]);
        return;
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(page); }, [page]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold mb-4">Users</h2>

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="text-center text-gray-600 py-6">No users found.</div>
          ) : (
            <table className="w-full text-left table-auto">
              <thead>
                <tr>
                  <th className="px-2 py-2">ID</th>
                  <th className="px-2 py-2">Name</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id || user._id} className="border-t">
                    <td className="px-2 py-2 text-sm">{user.id || user._id}</td>
                    <td className="px-2 py-2 text-sm">{user.name}</td>
                    <td className="px-2 py-2 text-sm">{user.email}</td>
                    <td className="px-2 py-2 text-sm">{user.role}</td>
                    <td className="px-2 py-2 text-sm">{user.isActive ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-2 text-sm">{new Date(user.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-100 rounded">Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-gray-100 rounded">Next</button>
      </div>
    </div>
  );
};

const Admin = () => {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex space-x-2 mb-6">
        <button onClick={() => setTab('dashboard')} className={`px-4 py-2 rounded ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Overview</button>
        <button onClick={() => setTab('products')} className={`px-4 py-2 rounded ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Add Product</button>
        <button onClick={() => setTab('users')} className={`px-4 py-2 rounded ${tab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Users</button>
      </div>

      <div>
        {tab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">Welcome to the admin dashboard. Use the tabs to manage products and users.</div>
        )}

        {tab === 'products' && <AddProductForm />}

        {tab === 'users' && <UsersTable />}
      </div>
    </div>
  );
};

export default Admin;
