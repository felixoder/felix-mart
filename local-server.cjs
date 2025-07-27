const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Additional CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Check if we should use mock mode
const clientId = process.env.CASHFREE_CLIENT_ID || '';
const clientSecret = process.env.CASHFREE_CLIENT_SECRET || '';

// Force disable mock mode - use real Cashfree API
const isProductionCredentials = clientSecret.includes('prod') || clientSecret.length > 50;

const MOCK_MODE = false; // DISABLED - Use real Cashfree API directly

console.log('🚀 Local Cashfree Server Starting...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 Client ID:', clientId.substring(0, 8) + '...');
console.log('🔑 Secret contains "prod":', clientSecret.includes('prod'));
console.log('🔑 Using production credentials:', isProductionCredentials);
console.log('🎭 Mock mode:', MOCK_MODE ? 'ENABLED (Safe for testing)' : 'DISABLED');

if (MOCK_MODE) {
  console.log('⚠️  MOCK MODE: All API calls will return mock data - no real transactions');
}

// Mock data for testing
const mockOrderId = 'order_' + Date.now();
const mockPaymentSessionId = 'mock_session_' + Math.random().toString(36).substr(2, 9);

// Create Cashfree order endpoint
app.post('/functions/v1/cashfree-checkout', async (req, res) => {
  try {
    console.log('📝 Cashfree checkout request:', req.body);

    // Real API call using production Cashfree credentials
    const orderData = {
      order_id: req.body.order_id || ('order_' + Date.now()),
      order_amount: req.body.amount || req.body.order_amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: req.body.customer_id,
        customer_name: req.body.customer_name || 'Customer',
        customer_email: req.body.customer_email,
        customer_phone: req.body.customer_phone
      },
      order_meta: {
        return_url: 'https://webhook.site/#!/unique-url-here', // Temporary for testing - replace with your domain
        notify_url: 'https://webhook.site/#!/unique-url-here'  // Temporary for testing - replace with your domain
      }
    };

    console.log('📤 Calling Cashfree Production API with:', orderData);

    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cashfree API Error:', response.status, errorText);
      throw new Error(`Cashfree API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Real Cashfree order created:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ Cashfree checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message 
    });
  }
});

// Verify payment endpoint
app.post('/functions/v1/verify-payment', async (req, res) => {
  try {
    console.log('🔍 Payment verification request:', req.body);

    // Real API call using production Cashfree credentials
    const orderId = req.body.order_id;
    console.log('📤 Verifying payment for order:', orderId);

    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Payment verification error:', response.status, errorText);
      throw new Error(`Payment verification failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Real payment verified:', result);
    res.json(result);

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    mock_mode: MOCK_MODE,
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 Local Cashfree server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log('🎯 Ready for testing!');
  
  if (MOCK_MODE) {
    console.log('\n🎭 MOCK MODE ACTIVE:');
    console.log('   • All payments will return success');
    console.log('   • No real money will be charged');
    console.log('   • Safe for development and testing');
  }
});
