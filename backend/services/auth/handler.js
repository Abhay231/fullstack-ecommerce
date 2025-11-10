require('dotenv').config();
const connectDB = require('../../utils/database');
const redisClient = require('../../utils/redis');
const User = require('../../models/User');
const { generateToken, authenticate } = require('../../utils/auth');
const crypto = require('crypto');
const sendEmail = require('../../utils/sendEmail'); 
const {
  lambdaWrapper,
  successResponse,
  errorResponse,
  parseBody,
  validateRequiredFields
} = require('../../utils/response');

// Initialize database connection
let dbConnection = null;
const initDB = async () => {
  if (!dbConnection) {
    dbConnection = await connectDB();
    await redisClient.connect();
  }
};

// Register user
const register = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const body = parseBody(event);
  validateRequiredFields(body, ['name', 'email', 'password']);

  const { name, email, password, phone, address } = body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse('User with this email already exists', 400);
  }

  // Validate password strength
  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters long', 400);
  }

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    password,
    phone,
    address
  });

  // Generate token
  const token = generateToken(user._id);

  // Cache user data
  await redisClient.set(`user:${user._id}`, user, 3600); // Cache for 1 hour

  return successResponse({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt
    },
    token
  }, 'User registered successfully', 201);
});

// Login user
const login = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const body = parseBody(event);
  validateRequiredFields(body, ['email', 'password']);

  const { email, password } = body;

  // Find user and include password for comparison
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return errorResponse('Invalid email or password', 401);
  }

  if (!user.isActive) {
    return errorResponse('Account is deactivated. Please contact support.', 401);
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return errorResponse('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken(user._id);

  // Cache user data
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    lastLogin: user.lastLogin
  };
  await redisClient.set(`user:${user._id}`, userData, 3600);

  return successResponse({
    user: userData,
    token
  }, 'Login successful');
});

// Get user profile
const getProfile = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  // Try to get from cache first
  let userData = await redisClient.get(`user:${user._id}`);
  
  if (!userData) {
    // If not in cache, fetch from database
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return errorResponse('User not found', 404);
    }
    
    userData = {
      id: dbUser._id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,
      address: dbUser.address,
      avatar: dbUser.avatar,
      isActive: dbUser.isActive,
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };
    
    // Cache the user data
    await redisClient.set(`user:${user._id}`, userData, 3600);
  }

  return successResponse(userData, 'Profile retrieved successfully');
});

// Update user profile
const updateProfile = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);

  const allowedUpdates = ['name', 'phone', 'address', 'avatar'];
  const updates = {};

  // Filter only allowed updates
  Object.keys(body).forEach(key => {
    if (allowedUpdates.includes(key) && body[key] !== undefined) {
      updates[key] = body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return errorResponse('No valid fields to update', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return errorResponse('User not found', 404);
  }

  // Update cache
  const userData = {
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    phone: updatedUser.phone,
    address: updatedUser.address,
    avatar: updatedUser.avatar,
    isActive: updatedUser.isActive,
    lastLogin: updatedUser.lastLogin,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
  await redisClient.set(`user:${user._id}`, userData, 3600);

  return successResponse(userData, 'Profile updated successfully');
});

// Change password
const changePassword = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);
  const body = parseBody(event);
  validateRequiredFields(body, ['currentPassword', 'newPassword']);

  const { currentPassword, newPassword } = body;

  // Get user with password
  const dbUser = await User.findById(user._id).select('+password');
  if (!dbUser) {
    return errorResponse('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await dbUser.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return errorResponse('Current password is incorrect', 400);
  }

  // Validate new password
  if (newPassword.length < 6) {
    return errorResponse('New password must be at least 6 characters long', 400);
  }

  // Update password
  dbUser.password = newPassword;
  await dbUser.save();

  // Clear user cache to force refresh
  await redisClient.del(`user:${user._id}`);

  return successResponse(null, 'Password changed successfully');
});

// Logout (invalidate token by clearing cache)
const logout = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const user = await authenticate(event);

  // Clear user cache
  await redisClient.del(`user:${user._id}`);

  return successResponse(null, 'Logged out successfully');
});

// Forgot password - generate reset token
// const forgotPassword = lambdaWrapper(async (event, context) => {
//   await initDB();
  
//   const body = parseBody(event);
//   validateRequiredFields(body, ['email']);

//   const { email } = body;

//   // Find user
//   const user = await User.findOne({ email: email.toLowerCase() });
  
//   // Don't reveal if user exists or not for security
//   if (!user) {
//     return successResponse(
//       { message: 'If that email exists, a password reset link has been sent.' },
//       'Password reset email sent'
//     );
//   }

//   // Generate reset token
//   const resetToken = user.getResetPasswordToken();
//   await user.save({ validateBeforeSave: false });

//   // Clear user cache
//   await redisClient.del(`user:${user._id}`);

//   // In a real application, you would send an email here
//   // For development, we'll return the reset token in the response
//   // In production, remove the resetToken from the response and send it via email
//   const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

//   // TODO: Send email with resetUrl
//   // For now, we'll return the token for development purposes
//   // In production, remove this and send email instead
  
//   if (process.env.NODE_ENV === 'development') {
//     return successResponse(
//       { 
//         message: 'Password reset token generated. Check your email for reset instructions.',
//         resetToken: resetToken, // Only in development
//         resetUrl: resetUrl
//       },
//       'Password reset email sent'
//     );
//   }

//   return successResponse(
//     { message: 'If that email exists, a password reset link has been sent to your email.' },
//     'Password reset email sent'
//   );
// });

const forgotPassword = lambdaWrapper(async (event, context) => {
  await initDB();

  const body = parseBody(event);
  validateRequiredFields(body, ['email']);

  const { email } = body;

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to avoid revealing if account exists
  if (!user) {
    return successResponse(
      { message: 'If that email exists, a password reset link has been sent.' },
      'Password reset email sent'
    );
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Clear cache if exists
  await redisClient.del(`user:${user._id}`);

  // Reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  try {
    // ✅ SEND EMAIL
    const message = `
      <p>Hello ${user.name},</p>
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <br/><br/>
      <p>If you didn't request this, ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message
    });

    // In Dev Mode: Also return token for testing
    if (process.env.NODE_ENV === 'development') {
      return successResponse(
        {
          message: 'Password reset email sent successfully (Development Mode)',
          resetUrl,
          resetToken
        },
        'Password reset email sent'
      );
    }

    return successResponse(
      { message: 'Password reset email sent to your email.' },
      'Password reset email sent'
    );

  } catch (error) {

    // Roll back reset tokens if email fails
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return errorResponse('Email could not be sent. Please try again later.', 500);
  }
});


// Reset password - use token to reset password
const resetPassword = lambdaWrapper(async (event, context) => {
  await initDB();
  
  const body = parseBody(event);
  validateRequiredFields(body, ['token', 'password']);

  const { token, password } = body;

  // Validate password
  if (password.length < 6) {
    return errorResponse('Password must be at least 6 characters long', 400);
  }

  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token and token not expired
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  }).select('+password +resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return errorResponse('Invalid or expired reset token', 400);
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  // Clear user cache
  await redisClient.del(`user:${user._id}`);

  // Generate new token for automatic login (optional)
  const authToken = generateToken(user._id);

  return successResponse(
    { 
      message: 'Password reset successfully',
      token: authToken // Optional: auto-login after reset
    },
    'Password reset successful'
  );
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword
};
