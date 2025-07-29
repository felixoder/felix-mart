# felixmart - Premium E-commerce Store

A modern, full-featured e-commerce platform built with React, TypeScript, Tailwind CSS, and Supabase, featuring integrated Cashfree payment processing.

## 🌟 Features

- **Complete E-commerce Solution**: Product catalog, shopping cart, user authentication
- **Cashfree Payment Integration**: Secure payment processing with Cashfree PG
- **Admin Panel**: Product management, inventory control, order management
- **Responsive Design**: Modern UI with Tailwind CSS and Shadcn/UI components
- **Real-time Database**: Powered by Supabase with Row Level Security
- **User Management**: Authentication, profiles, and order history

## 🚀 Quick Start

### Prerequisites

- Node.js & npm installed
- Supabase account
- Cashfree account (for payments)

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd felixmart

# Install dependencies
npm install

# Start development server
npm run dev
```

## 💳 Payment Integration

This project includes a complete **Cashfree payment integration**. For detailed setup instructions, testing, and deployment, see:

**📖 [Cashfree Integration Guide](./CASHFREE_INTEGRATION_GUIDE.md)**

The guide includes:
- Environment setup
- Database configuration
- Payment flow testing
- Troubleshooting
- Production deployment

## 🛠️ Development

### Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Main application pages
  ├── hooks/         # Custom React hooks
  ├── lib/           # Utility functions
  └── integrations/  # External service integrations

supabase/
  ├── functions/     # Edge functions for payments
  └── migrations/    # Database schema and data
```

### Key Components

- **Checkout Flow**: Complete payment processing with Cashfree
- **Order Management**: Track orders and payment status
- **Admin Dashboard**: Product and inventory management
- **User Authentication**: Secure login and user profiles
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed to various platforms:

- **Vercel**: Connect your GitHub repository and deploy automatically
- **Netlify**: Drag and drop the built files or connect via Git
- **Railway**: Connect via GitHub and deploy with automatic builds
- **Static hosting**: Build the project with `npm run build` and upload the `dist` folder

## Can I connect a custom domain to my project?

Yes, you can! The process depends on your hosting platform:

- **Vercel**: Go to Project Settings > Domains
- **Netlify**: Go to Site Settings > Domain Management
- **Railway**: Go to Project Settings > Domains

Each platform has its own documentation for setting up custom domains.
