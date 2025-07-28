#!/bin/bash

# Deployment and Setup Script for Cashfree Integration
# This script helps set up the Cashfree payment integration

echo "🚀 felixmart - Cashfree Integration Setup"
echo "=============================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists supabase; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Function to deploy Supabase functions
deploy_functions() {
    echo "🔧 Deploying Supabase functions..."
    
    echo "Deploying cashfree-checkout function..."
    supabase functions deploy cashfree-checkout
    
    echo "Deploying verify-payment function..."
    supabase functions deploy verify-payment
    
    echo "✅ Functions deployed successfully!"
}

# Function to set environment variables
set_env_vars() {
    echo "🔑 Setting up environment variables..."
    
    if [ -f .env ]; then
        source .env
        if [ ! -z "$CASHFREE_CLIENT_ID" ] && [ ! -z "$CASHFREE_CLIENT_SECRET" ]; then
            echo "Setting Cashfree credentials in Supabase..."
            supabase secrets set CASHFREE_CLIENT_ID="$CASHFREE_CLIENT_ID"
            supabase secrets set CASHFREE_CLIENT_SECRET="$CASHFREE_CLIENT_SECRET"
            echo "✅ Environment variables set!"
        else
            echo "⚠️  Please add CASHFREE_CLIENT_ID and CASHFREE_CLIENT_SECRET to your .env file"
        fi
    else
        echo "⚠️  .env file not found. Please create one with your Cashfree credentials."
    fi
}

# Function to run database migrations
run_migrations() {
    echo "🗄️  Running database migrations..."
    
    echo "Applying payment tracking migration..."
    supabase db push
    
    echo "✅ Migrations completed!"
}

# Function to install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    
    if command_exists bun; then
        bun install
    else
        npm install
    fi
    
    echo "✅ Dependencies installed!"
}

# Function to start development server
start_dev() {
    echo "🚀 Starting development server..."
    
    if command_exists bun; then
        bun dev
    else
        npm run dev
    fi
}

# Main setup function
setup() {
    echo "Setting up Cashfree integration..."
    
    install_deps
    
    echo ""
    read -p "Do you want to deploy Supabase functions? (y/n): " deploy_choice
    if [ "$deploy_choice" = "y" ] || [ "$deploy_choice" = "Y" ]; then
        deploy_functions
    fi
    
    echo ""
    read -p "Do you want to set environment variables? (y/n): " env_choice
    if [ "$env_choice" = "y" ] || [ "$env_choice" = "Y" ]; then
        set_env_vars
    fi
    
    echo ""
    read -p "Do you want to run database migrations? (y/n): " migration_choice
    if [ "$migration_choice" = "y" ] || [ "$migration_choice" = "Y" ]; then
        run_migrations
    fi
    
    echo ""
    echo "🎉 Setup completed!"
    echo ""
    echo "📚 Next steps:"
    echo "1. Review the Cashfree Integration Guide: CASHFREE_INTEGRATION_GUIDE.md"
    echo "2. Update your .env file with Cashfree credentials"
    echo "3. Test the payment flow in sandbox mode"
    echo ""
    
    read -p "Do you want to start the development server now? (y/n): " start_choice
    if [ "$start_choice" = "y" ] || [ "$start_choice" = "Y" ]; then
        start_dev
    fi
}

# Function to test the integration
test_integration() {
    echo "🧪 Testing Cashfree Integration..."
    echo ""
    echo "Test flow:"
    echo "1. Navigate to http://localhost:5173"
    echo "2. Sign up or log in"
    echo "3. Add products to cart"
    echo "4. Go to checkout"
    echo "5. Fill shipping details"
    echo "6. Complete payment with test cards"
    echo ""
    echo "Test Cards (Sandbox):"
    echo "✅ Success: 4111 1111 1111 1111"
    echo "❌ Failure: 4111 1111 1111 1112"
    echo ""
    echo "Check the integration guide for more details!"
}

# Parse command line arguments
case "$1" in
    "setup")
        setup
        ;;
    "deploy")
        deploy_functions
        ;;
    "env")
        set_env_vars
        ;;
    "test")
        test_integration
        ;;
    "dev")
        start_dev
        ;;
    *)
        echo "Usage: $0 {setup|deploy|env|test|dev}"
        echo ""
        echo "Commands:"
        echo "  setup  - Complete setup including dependencies, functions, and env vars"
        echo "  deploy - Deploy Supabase functions only"
        echo "  env    - Set environment variables in Supabase"
        echo "  test   - Show testing instructions"
        echo "  dev    - Start development server"
        echo ""
        exit 1
        ;;
esac
