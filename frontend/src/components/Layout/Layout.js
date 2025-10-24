import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import { loadUser } from '../../store/slices/authSlice';
import { fetchCart } from '../../store/slices/cartSlice';

const Layout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load user on app start if token exists
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    // Fetch cart for both authenticated and guest users
    dispatch(fetchCart());
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
