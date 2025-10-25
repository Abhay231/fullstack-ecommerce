# CI/CD Environment Configuration

## Required GitHub Secrets

To enable automatic deployment, you need to configure these secrets in your GitHub repository:

### AWS Credentials:
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key

### Frontend Secrets:
- `REACT_APP_API_URL` - Your API Gateway URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `AWS_S3_BUCKET_NAME` - Your S3 bucket name (ecomstore-frontend-hosting)
- `CLOUDFRONT_DISTRIBUTION_ID` - Your CloudFront distribution ID
- `CLOUDFRONT_DOMAIN_NAME` - Your CloudFront domain name

### Backend Secrets:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Your JWT secret key
- `STRIPE_SECRET_KEY` - Your Stripe secret key

## How to Add Secrets:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. Go to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add each secret with the exact name and value

## Workflow Features:

### Frontend Pipeline:
- ✅ Runs on every push to `frontend/` folder
- ✅ Installs dependencies and runs tests
- ✅ Builds optimized React app
- ✅ Deploys to S3 automatically
- ✅ Invalidates CloudFront cache
- ✅ Only deploys on main branch

### Backend Pipeline:
- ✅ Runs on every push to `backend/` folder
- ✅ Installs dependencies and runs tests
- ✅ Packages serverless application
- ✅ Deploys to AWS Lambda automatically
- ✅ Updates API Gateway endpoints
- ✅ Only deploys on main branch

## Deployment Triggers:

- **Pull Request**: Runs tests and builds (no deployment)
- **Push to main**: Runs tests, builds, and deploys
- **Path-based**: Only triggers when relevant files change
