# ECommerce Full Stack Application

A comprehensive MERN stack ecommerce application with AWS serverless backend architecture featuring API Gateway, Lambda functions, microservices, and Redis caching.

## 🏗️ Architecture

### Backend (AWS Serverless)
- **API Gateway** - RESTful API routing
- **AWS Lambda** - Serverless functions for microservices
- **MongoDB** - Database for data persistence
- **Redis** - Caching layer for performance optimization
- **Stripe** - Payment processing integration

### Frontend (React)
- **React 18** - Modern UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client for API calls

## 🚀 Features

### User Features
- ✅ User Registration & Authentication
- ✅ Product Browsing & Search
- ✅ Shopping Cart Management
- ✅ Order Processing & Tracking
- ✅ Payment Integration (Stripe)
- ✅ User Profile Management
- ✅ Order History

### Admin Features
- ✅ Product Management (CRUD)
- ✅ Order Management
- ✅ User Management
- ✅ Analytics Dashboard
- ✅ Inventory Management

### Technical Features
- ✅ Microservices Architecture
- ✅ Redis Caching
- ✅ JWT Authentication
- ✅ Error Handling & Validation
- ✅ Responsive Design
- ✅ API Rate Limiting
- ✅ Secure Payment Processing

## 📁 Project Structure

```
ecommerce-app/
├── backend/                    # AWS Lambda Backend
│   ├── models/                # MongoDB Models
│   ├── services/              # Microservices
│   │   ├── auth/             # Authentication Service
│   │   ├── products/         # Product Service
│   │   ├── cart/             # Cart Service
│   │   ├── orders/           # Order Service
│   │   └── payments/         # Payment Service
│   ├── utils/                # Utility functions
│   ├── serverless.yml        # Serverless configuration
│   └── package.json          # Backend dependencies
│
├── frontend/                  # React Frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Redux store & slices
│   │   ├── services/         # API services
│   │   └── App.js            # Main App component
│   ├── tailwind.config.js    # Tailwind configuration
│   └── package.json          # Frontend dependencies
│
└── README.md                 # Project documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- AWS Account (for deployment)
- Stripe Account (for payments)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configurations:
   ```env
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/ecommerce
   JWT_SECRET=your_jwt_secret_key_here
   REDIS_URL=redis://localhost:6379
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The backend will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:3001
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## 🚀 Deployment

### Backend Deployment (AWS)

1. **Install Serverless Framework:**
   ```bash
   npm install -g serverless
   ```

2. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

3. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

### Frontend Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting platform** (Netlify, Vercel, etc.)

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get single product
- `POST /products` - Create product (Admin)
- `PUT /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Cart
- `GET /cart` - Get user cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/update` - Update cart item
- `DELETE /cart/remove` - Remove item from cart

### Orders
- `POST /orders` - Create new order
- `GET /orders` - Get user orders
- `GET /orders/:id` - Get single order
- `PUT /orders/:id/status` - Update order status

### Payments
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 📝 Demo Credentials

### User Account
- **Email:** user@demo.com
- **Password:** password123

### Admin Account
- **Email:** admin@demo.com
- **Password:** password123

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Secure payment processing with Stripe
- Environment variable protection

## 🚀 Performance Optimizations

- Redis caching for frequently accessed data
- Database query optimization
- Image optimization and lazy loading
- Code splitting and lazy loading
- Minification and compression
- CDN integration ready

## 🛡️ Error Handling

- Comprehensive error handling middleware
- User-friendly error messages
- Logging and monitoring integration
- Graceful fallbacks for failed requests
- Transaction rollbacks for critical operations

## 📱 Responsive Design

- Mobile-first approach
- Cross-browser compatibility
- Touch-friendly interfaces
- Progressive Web App features
- Accessible design principles

## 🔮 Future Enhancements

- [ ] Real-time order tracking
- [ ] Product recommendations
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Mobile app development
- [ ] Social media integration
- [ ] Advanced search filters
- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Inventory alerts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Email: support@ecomstore.com
- Documentation: [Wiki](wiki)

## 🙏 Acknowledgments

- AWS for serverless infrastructure
- Stripe for payment processing
- MongoDB for database services
- Redis for caching solutions
- React and Redux communities

---

**Made with ❤️ by EcomStore Team**
