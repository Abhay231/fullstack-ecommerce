import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { store } from './store/store';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import ErrorBoundary from './components/Common/ErrorBoundary';
// Updated to fix profile update in production
import ToastContainer from './components/ToastContainer';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Profile from './pages/Profile';
import Admin from './pages/Admin/Admin';
import NotFound from './pages/NotFound';
import Wishlist from './pages/Wishlist';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_dummy_key');

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Elements stripe={stripePromise}>
          <Router>
            <div className="App min-h-screen bg-gray-50">
              <ToastContainer />
              
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected Routes with Layout */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/:id" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="wishlist" element={<Wishlist />} />
                  </Route>
                  
                  {/* Admin Routes */}
                  <Route element={<ProtectedRoute adminOnly />}>
                    <Route path="admin/*" element={<Admin />} />
                  </Route>
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </Elements>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
