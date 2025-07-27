# Cashfree Payment Integration Guide

This project includes a complete Cashfree payment integration for your e-commerce store. Follow this guide to set up and test the payment system.

## Setup Instructions

### 1. Prerequisites

- Supabase project set up and running
- Cashfree account (Sandbox for testing)
- Node.js and npm/bun installed

### 2. Environment Configuration

1. **Supabase Environment Variables**: The project is already configured with your Supabase URL and keys in the `client.ts` file.

2. **Cashfree Environment Variables**: Update the `.env` file with your Cashfree credentials:
```bash
CASHFREE_CLIENT_ID="your_cashfree_client_id"
CASHFREE_CLIENT_SECRET="your_cashfree_client_secret"
```

### 3. Database Setup

Run the following migrations in your Supabase SQL editor:

1. **Main Schema**: Already applied (`20250726151943-6ae0c7a4-8f40-4fa6-9c16-5c9ece738f63.sql`)
2. **Payment Tracking**: Apply `20250727000000_add_payments_table.sql`
3. **Sample Products**: Apply `20250727000001_sample_products.sql` (optional for testing)

### 4. Deploy Supabase Functions

Deploy the edge functions to Supabase:

```bash
# Navigate to your project directory
cd /Users/debayan.ghosh/Desktop/welearn/my_e_com/luxe-craft-shop

# Deploy the Cashfree checkout function
supabase functions deploy cashfree-checkout

# Deploy the payment verification function
supabase functions deploy verify-payment
```

Make sure to set the environment variables in Supabase:

```bash
# Set Cashfree credentials in Supabase
supabase secrets set CASHFREE_CLIENT_ID="your_client_id"
supabase secrets set CASHFREE_CLIENT_SECRET="your_client_secret"
```

### 5. Install Dependencies

```bash
# Install npm dependencies
npm install

# Or if using bun
bun install
```

## Features Implemented

### 🛒 Complete E-commerce Flow
- Product browsing and search
- Shopping cart management
- User authentication with Supabase
- Order management
- Payment processing with Cashfree

### 💳 Payment Integration
- **Checkout Page**: Complete shipping information and payment form
- **Cashfree Integration**: Secure payment processing with Cashfree PG
- **Order Tracking**: Track order status and payment verification
- **Success/Failure Handling**: Proper redirect and status management

### 🔒 Security Features
- Row Level Security (RLS) enabled on all tables
- User-specific data access controls
- Admin-only product management
- Secure API endpoints

### 📱 User Interface
- Responsive design for all devices
- Modern UI with Tailwind CSS and Shadcn/UI
- Loading states and error handling
- Toast notifications for user feedback

## Key Components

### 1. Checkout Flow (`src/pages/Checkout.tsx`)
- Validates shipping information
- Creates order in database
- Initiates Cashfree payment session
- Handles payment success/failure

### 2. Order Success Page (`src/pages/OrderSuccess.tsx`)
- Verifies payment status with Cashfree
- Displays order details
- Handles payment confirmation

### 3. Orders Page (`src/pages/Orders.tsx`)
- Lists all user orders
- Shows order status and details
- Provides order management interface

### 4. Supabase Functions
- **cashfree-checkout**: Creates payment sessions
- **verify-payment**: Verifies payment status

## Testing the Integration

### 1. Local Development Setup

Since Supabase CLI deployment might have permission issues, we've created a local development server that mimics the Supabase functions.

#### Option A: Using Local Development Server (Recommended for Testing)

1. **Start both servers simultaneously:**
```bash
npm run dev:full
```

This will start:
- Frontend on `http://localhost:5173`
- Local Cashfree API server on `http://localhost:3001`

#### Option B: Start servers separately

1. **Start the local Cashfree server:**
```bash
npm run dev:server
```

2. **In another terminal, start the frontend:**
```bash
npm run dev
```

#### Option C: Deploy to Supabase (Production)

If you have Supabase CLI access and proper permissions:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Deploy functions
supabase functions deploy cashfree-checkout
supabase functions deploy verify-payment

# Set environment variables
supabase secrets set CASHFREE_CLIENT_ID="your_client_id"
supabase secrets set CASHFREE_CLIENT_SECRET="your_client_secret"
```

### 2. Test Flow

1. **User Registration**: 
   - Navigate to `/auth`
   - Create a new account or sign in

2. **Shopping**:
   - Browse products on the home page
   - Add items to cart
   - Review cart in sidebar

3. **Checkout**:
   - Navigate to `/checkout`
   - Fill shipping information
   - Click "Proceed to Payment"

4. **Payment**:
   - Use Cashfree test credentials for sandbox
   - Complete payment flow
   - Get redirected to success page

5. **Order Management**:
   - View orders in `/orders`
   - Check order details and status

### 3. Test Cards (Cashfree Sandbox)

Use these test card numbers in sandbox mode:

**Successful Payment:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date
- CVV: Any 3 digits

**Failed Payment:**
- Card Number: `4111 1111 1111 1112`
- Expiry: Any future date
- CVV: Any 3 digits

## Database Schema

### Key Tables

1. **products**: Product catalog
2. **cart_items**: Shopping cart management
3. **orders**: Order information
4. **order_items**: Order line items
5. **payments**: Payment tracking
6. **profiles**: User profiles with admin flags

### Important Policies

- Users can only access their own orders and cart items
- Admins can manage products and view all orders
- Public can view active products

## Admin Features

### Access Admin Panel
- Sign in with admin account (debayanghosh408@gmail.com has admin access by default)
- Navigate to `/admin`
- Manage products, inventory, and orders

### Admin Capabilities
- Add/edit/delete products
- Manage inventory
- View all orders
- Update order status

## Troubleshooting

### Common Issues

1. **Payment Not Redirecting**:
   - Check Cashfree credentials
   - Verify return URL configuration
   - Check browser console for errors

2. **Orders Not Creating**:
   - Verify Supabase connection
   - Check RLS policies
   - Ensure user is authenticated

3. **Functions Not Working**:
   - Verify functions are deployed
   - Check environment variables in Supabase
   - Review function logs

### Debug Mode

Enable debug logging by checking browser console and Supabase function logs:

```bash
# View function logs
supabase functions logs cashfree-checkout
supabase functions logs verify-payment
```

## Production Deployment

### 1. Environment Setup
- Switch Cashfree to production mode
- Update environment variables
- Configure production domains

### 2. Security Checklist
- Enable HTTPS
- Configure proper CORS
- Review RLS policies
- Set up monitoring

### 3. Go Live
- Deploy to production
- Test with real payments
- Monitor transactions

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase and Cashfree documentation
3. Check browser console and function logs
4. Verify environment variables and configurations

## Features Summary

✅ **Complete Payment Integration**
✅ **Order Management System**
✅ **User Authentication**
✅ **Admin Panel**
✅ **Responsive Design**
✅ **Security Best Practices**
✅ **Error Handling**
✅ **Test Environment Ready**

Your Cashfree payment integration is now complete and ready for testing!
