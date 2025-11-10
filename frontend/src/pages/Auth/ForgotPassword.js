import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPassword, clearError } from '../../store/slices/authSlice';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const [resetUrl, setResetUrl] = useState(null);

  useEffect(() => {
    // Show error toast
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const result = await dispatch(forgotPassword(formData.email));
      if (result.type === 'auth/forgotPassword/fulfilled') {
        setIsSubmitted(true);
        
        // In development, show the reset token and URL
        if (result.payload.data?.resetToken) {
          setResetToken(result.payload.data.resetToken);
          setResetUrl(result.payload.data.resetUrl);
          toast.success('Password reset token generated! Check the response below.');
        } else {
          toast.success('If that email exists, a password reset link has been sent.');
        }
      }
    } catch (error) {
      console.error('Forgot password error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-blue-600">EcomStore</h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{ paddingLeft: '3rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full flex justify-center py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="spinner h-5 w-5"></div>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Mail className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Reset link sent!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        If that email exists in our system, a password reset link has been sent.
                        Please check your email and click on the link to reset your password.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Development Mode - Show Reset Token */}
              {resetToken && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Development Mode - Reset Token
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 space-y-2">
                        <p>
                          <strong>Reset Token:</strong>
                        </p>
                        <p className="break-all font-mono text-xs bg-yellow-100 p-2 rounded">
                          {resetToken}
                        </p>
                        {resetUrl && (
                          <>
                            <p className="mt-3">
                              <strong>Reset URL:</strong>
                            </p>
                            <a
                              href={resetUrl}
                              className="text-blue-600 hover:text-blue-500 underline break-all"
                            >
                              {resetUrl}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Back to Login */}
              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>

              {/* Try Again */}
              <div className="text-center">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setResetToken(null);
                    setResetUrl(null);
                    setFormData({ email: '' });
                  }}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Send another email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

