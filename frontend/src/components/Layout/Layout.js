import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from './Header';
import Footer from './Footer';
import { loadUser } from '../../store/slices/authSlice';
import { fetchCart } from '../../store/slices/cartSlice';
import { fetchWishlist } from '../../store/slices/wishlistSlice';

const Layout = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading: authLoading } = useSelector(state => state.auth);

  useEffect(() => {
    // Load user on app start if token exists
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  useEffect(() => {
    // Fetch cart and wishlist only after auth state is determined
    if (!authLoading) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, authLoading]);

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
