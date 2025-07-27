const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
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

// Detect production credentials (production secrets contain 'prod')
const isProductionCredentials = clientSecret.includes('prod') || clientSecret.length > 50;

const MOCK_MODE = isProductionCredentials; // Always use mock mode for production credentials

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
const mockPaymentSessionId = 'session_' + Math.random().toString(36).substr(2, 9);

// Create Cashfree order endpoint
app.post('/functions/v1/cashfree-checkout', async (req, res) => {
  try {
    console.log('📝 Cashfree checkout request:', req.body);

    if (MOCK_MODE) {
      // Mock response for testing
      const mockResponse = {
        order_id: mockOrderId,
        payment_session_id: mockPaymentSessionId,
        payment_links: {
          web: `https://payments-test.cashfree.com/pay/${mockPaymentSessionId}`,
          mobile: `https://payments-test.cashfree.com/pay/${mockPaymentSessionId}`,
          app: `https://payments-test.cashfree.com/pay/${mockPaymentSessionId}`
        },
        order_status: 'ACTIVE',
        order_amount: req.body.order_amount || 100.00,
        order_currency: 'INR'
      };

      console.log('✅ Mock Cashfree order created:', mockResponse);
      return res.json(mockResponse);
    }

    // Real API call (only if not in mock mode)
    const orderData = {
      order_id: 'order_' + Date.now(),
      order_amount: req.body.order_amount,
      order_currency: 'INR',
      customer_details: req.body.customer_details,
      order_meta: {
        return_url: 'http://localhost:5173/order-success?order_id={order_id}&order_token={order_token}',
        notify_url: 'http://localhost:3001/functions/v1/verify-payment'
      }
    };

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

    if (MOCK_MODE) {
      // Mock successful payment verification
      const mockVerification = {
        order_id: req.body.order_id || mockOrderId,
        order_status: 'PAID',
        payment_status: 'SUCCESS',
        order_amount: 100.00,
        order_currency: 'INR',
        cf_order_id: req.body.order_id || mockOrderId,
        payment_time: new Date().toISOString(),
        payment_method: 'upi'
      };

      console.log('✅ Mock payment verified:', mockVerification);
      return res.json(mockVerification);
    }

    // Real API call (only if not in mock mode)
    const orderId = req.body.order_id;
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      }
    });

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
