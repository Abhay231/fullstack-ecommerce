import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { fetchCart } from '../store/slices/cartSlice';
import { createOrder } from '../store/slices/orderSlice';
import { FiCreditCard, FiTruck, FiShield, FiArrowLeft, FiCheck } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

// Load Stripe (replace with your publishable key)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { items, totalPrice, isLoading } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  // Form states
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [billingInfo, setBillingInfo] = useState({
    sameAsShipping: true,
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');

  // Calculate totals
  const subtotal = totalPrice || 0;
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal >= 50 ? 0 : 9.99; // Free shipping over $50
  const total = subtotal + tax + shipping;

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const createPaymentIntent = async () => {
    console.log('=== ORDER CREATION DEBUG ===');
    console.log('A1. Starting order creation process');
    console.log('A2. Items to order:', items);
    console.log('A3. Shipping info:', shippingInfo);
    console.log('A4. Total amount:', total);
    
    try {
      // First create the order
      console.log('A5. Creating order with API call...');
      const orderResponse = await fetch(`${process.env.REACT_APP_API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: items.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.price,
            selectedVariants: item.selectedVariants || {}
          })),
          shippingAddress: {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            street: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country || 'US',
            phone: shippingInfo.phone
          },
          billingAddress: billingInfo.sameAsShipping ? {
            name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            street: shippingInfo.address,
            city: shippingInfo.city,
            state: shippingInfo.state,
            zipCode: shippingInfo.zipCode,
            country: shippingInfo.country || 'US',
            phone: shippingInfo.phone
          } : {
            name: `${billingInfo.firstName} ${billingInfo.lastName}`,
            street: billingInfo.address,
            city: billingInfo.city,
            state: billingInfo.state,
            zipCode: billingInfo.zipCode,
            country: billingInfo.country || 'US',
            phone: billingInfo.phone
          },
          orderSummary: {
            subtotal: total,
            tax: total * 0.08,
            shipping: total >= 50 ? 0 : 9.99,
            total: total + (total * 0.08) + (total >= 50 ? 0 : 9.99)
          }
        }),
      });

      console.log('A6. Order response status:', orderResponse.status);
      const orderData = await orderResponse.json();
      console.log('A7. Order response data:', orderData);
      
      if (!orderData.success) {
        console.log('A8. Order creation failed:', orderData.message);
        throw new Error(orderData.message || 'Failed to create order');
      }

      console.log('A9. Order created successfully:', orderData.data._id);

      // Then create payment intent for the order
      console.log('A10. Creating payment intent for order...');
      const paymentResponse = await fetch(`${process.env.REACT_APP_API_URL}/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId: orderData.data._id
        }),
      });

      console.log('A11. Payment intent response status:', paymentResponse.status);
      const paymentData = await paymentResponse.json();
      console.log('A12. Payment intent response data:', paymentData);

      if (paymentData.success && paymentData.data.paymentIntent.client_secret) {
        console.log('A13. Payment intent created successfully');
        setClientSecret(paymentData.data.paymentIntent.client_secret);
        setOrderId(orderData.data._id);
      } else {
        console.log('A14. Payment intent creation failed:', paymentData.message);
        throw new Error(paymentData.message || 'Failed to create payment intent');
      }
    } catch (err) {
      console.error('Payment intent creation error:', err);
      throw new Error('Failed to initialize payment. Please try again.');
    }
  };

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    const missingFields = requiredFields.filter(field => !shippingInfo[field]?.trim());
    
    if (missingFields.length > 0) {
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create payment intent now that we have valid shipping info
      await createPaymentIntent();
      setStep(2);
    } catch (err) {
      setError('Failed to proceed to payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    console.log('=== FRONTEND PAYMENT DEBUG ===');
    console.log('1. Starting payment process');
    console.log('2. Client Secret:', clientSecret);
    console.log('3. Order ID:', orderId);
    console.log('4. User token exists:', !!localStorage.getItem('token'));
    console.log('5. API URL:', process.env.REACT_APP_API_URL);

    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);

    // Confirm payment
    console.log('6. Confirming payment with Stripe...');
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
          email: shippingInfo.email,
          address: {
            line1: billingInfo.sameAsShipping ? shippingInfo.address : billingInfo.address,
            city: billingInfo.sameAsShipping ? shippingInfo.city : billingInfo.city,
            state: billingInfo.sameAsShipping ? shippingInfo.state : billingInfo.state,
            postal_code: billingInfo.sameAsShipping ? shippingInfo.zipCode : billingInfo.zipCode,
            country: billingInfo.sameAsShipping ? shippingInfo.country : billingInfo.country,
          },
        },
      },
    });

    if (stripeError) {
      console.log('7. Stripe error:', stripeError);
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    console.log('8. Payment intent result:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    if (paymentIntent.status === 'succeeded') {
      console.log('9. Payment succeeded, confirming with backend...');
      
      // Confirm payment on backend
      try {
        const confirmPayload = {
          paymentIntentId: paymentIntent.id
        };
        
        console.log('10. Sending confirmation request:', {
          url: `${process.env.REACT_APP_API_URL}/payments/confirm`,
          method: 'POST',
          payload: confirmPayload,
          hasToken: !!localStorage.getItem('token')
        });

        const confirmResponse = await fetch(`${process.env.REACT_APP_API_URL}/payments/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(confirmPayload),
        });

        console.log('11. Confirmation response status:', confirmResponse.status);
        console.log('12. Confirmation response ok:', confirmResponse.ok);

        const confirmData = await confirmResponse.json();
        console.log('13. Confirmation response data:', confirmData);

        if (confirmData.success) {
          console.log('14. Payment confirmation successful!');
          setSuccess(true);
          setStep(3);
          
          // Refresh cart to reflect the cleared cart from backend
          dispatch(fetchCart());
          
          // Redirect to order confirmation after a delay
          setTimeout(() => {
            navigate(`/orders/${confirmData.data.order.id}`);
          }, 2000);
        } else {
          console.log('15. Payment confirmation failed:', confirmData.message);
          throw new Error(confirmData.message || 'Payment confirmation failed');
        }
      } catch (err) {
        console.error('16. Payment confirmation error:', err);
        console.error('17. Error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        setError('Payment was processed but confirmation failed. Please contact support.');
      }
    } else {
      setError('Payment was not completed successfully');
    }

    setLoading(false);
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to your cart before checkout.</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. You will receive an email confirmation shortly.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to order details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Cart</span>
        </button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span>Shipping</span>
          </div>
          <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span>Payment</span>
          </div>
          <div className={`w-8 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Shipping Information */}
          {step === 1 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiTruck className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Shipping Information</h2>
              </div>

              <form onSubmit={handleShippingSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={shippingInfo.email}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.zipCode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue to Payment
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Payment Information */}
          {step === 2 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiCreditCard className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Payment Information</h2>
              </div>

              <form onSubmit={handlePaymentSubmit}>
                {/* Payment Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <FiCreditCard className="w-4 h-4 mr-2" />
                      Credit/Debit Card
                    </label>
                  </div>
                </div>

                {/* Card Details */}
                {paymentMethod === 'card' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Details
                    </label>
                    <div className="border border-gray-300 rounded-md p-3">
                      <CardElement options={cardElementOptions} />
                    </div>
                  </div>
                )}

                {/* Billing Address */}
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={billingInfo.sameAsShipping}
                      onChange={(e) => setBillingInfo(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
                      className="mr-3"
                    />
                    Billing address same as shipping address
                  </label>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !stripe}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-gray-600">
                <FiShield className="w-4 h-4" />
                <span>Your payment information is secure and encrypted</span>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <ProductImage
                    src={item.product?.images?.[0]?.url}
                    alt={item.product?.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
};

export default Checkout;
