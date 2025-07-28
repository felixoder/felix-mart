const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Supabase configuration - using service role key for admin operations
const SUPABASE_URL = "https://kwsqhrqhtcuacfvmxwji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3c3FocnFodGN1YWNmdm14d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NDEyNTgsImV4cCI6MjA2OTExNzI1OH0.w677z2scEUSeLvsVqA3pPBUx0TihKB3LP1QuedLgqvQ";

// For production, you would use the service role key here
// const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// For now, we'll use the anon client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Detect production vs test credentials
const isProductionCredentials = clientSecret.includes('prod');
const isTestCredentials = clientId.startsWith('TEST');

// Determine API base URL - use sandbox for test credentials
const CASHFREE_API_BASE = isTestCredentials ? 'https://sandbox.cashfree.com/pg' : 'https://api.cashfree.com/pg';

const MOCK_MODE = false; // DISABLED - Use real Cashfree API directly

console.log('🚀 Local Cashfree Server Starting...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 Client ID:', clientId.substring(0, 8) + '...');
console.log('🔑 Secret contains "prod":', clientSecret.includes('prod'));
console.log('🔑 Using production credentials:', isProductionCredentials);
console.log('🔑 Using test credentials:', isTestCredentials);
console.log('🌐 API Base URL:', CASHFREE_API_BASE);
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
        return_url: `http://localhost:5175/order-success?order_id={order_id}`, // Return to your app
        notify_url: 'http://localhost:3001/functions/v1/verify-payment'  // Use local server for webhooks
      }
    };

    console.log('📤 Calling Cashfree Production API with:', orderData);

    const response = await fetch(`${CASHFREE_API_BASE}/orders`, {
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
    console.log('🔍 Payment verification request received:', req.body);

    // Real API call using production Cashfree credentials
    const orderId = req.body.order_id;
    const sessionId = req.body.payment_session_id;
    console.log('📤 Verifying payment for order:', orderId);
    console.log('📤 Payment session ID:', sessionId);

    const cashfreeUrl = `${CASHFREE_API_BASE}/orders/${orderId}`;
    console.log('📤 Making request to Cashfree:', cashfreeUrl);

    const response = await fetch(cashfreeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': clientId,
        'x-client-secret': clientSecret
      }
    });

    console.log('📤 Cashfree response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Payment verification error:', response.status, errorText);
      res.status(response.status).json({ 
        error: 'Payment verification failed',
        details: errorText,
        order_id: orderId
      });
      return;
    }

    const result = await response.json();
    console.log('✅ Raw Cashfree response:', JSON.stringify(result, null, 2));
    
    // Ensure consistent response format for frontend
    const mappedResult = {
      ...result,
      // Map Cashfree response fields to expected format
      order_status: result.order_status,
      payment_status: result.order_status === 'PAID' ? 'SUCCESS' : result.order_status,
      order_id: result.order_id || result.cf_order_id,
      payment_session_id: result.payment_session_id || sessionId
    };
    
    console.log('📤 Mapped response being sent to frontend:', JSON.stringify(mappedResult, null, 2));
    res.json(mappedResult);

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message 
    });
  }
});

// Debug endpoint for testing payment verification
app.post('/debug/verify-payment', async (req, res) => {
  try {
    console.log('🔍 Debug payment verification request:', req.body);
    
    // Return a mock successful payment verification for testing
    const mockSuccessResponse = {
      order_id: req.body.order_id || 'test_order_id',
      order_status: 'PAID',
      payment_status: 'SUCCESS',
      payment_session_id: req.body.payment_session_id || 'test_session_id',
      order_amount: 100.00,
      order_currency: 'INR',
      payment_time: new Date().toISOString()
    };
    
    console.log('📤 Mock payment verification response:', mockSuccessResponse);
    res.json(mockSuccessResponse);
    
  } catch (error) {
    console.error('❌ Debug verification error:', error);
    res.status(500).json({ 
      error: 'Debug verification failed',
      details: error.message 
    });
  }
});

// Update order status endpoint
app.post('/functions/v1/update-order-status', async (req, res) => {
  try {
    console.log('🔄 Order status update request:', req.body);
    
    const { order_id, status, user_id } = req.body;
    
    if (!order_id || !status) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'order_id and status are required'
      });
    }
    
    console.log(`📝 Attempting to update order ${order_id} to status: ${status}`);
    
    try {
      // First, let's check if the order exists
      const { data: existingOrder, error: queryError } = await supabase
        .from('orders')
        .select('id, status, user_id')
        .eq('id', order_id)
        .single();
        
      if (queryError) {
        console.error('❌ Failed to find order:', queryError);
        return res.status(404).json({
          error: 'Order not found',
          details: queryError.message,
          order_id: order_id
        });
      }
      
      console.log('📋 Found existing order:', existingOrder);
      
      // Now try to update the order
      const { data, error } = await supabase
        .from('orders')
        .update({ status: status })
        .eq('id', order_id)
        .select();
        
      if (error) {
        console.error('❌ Database update failed:', error);
        return res.status(500).json({
          error: 'Database update failed',
          details: error.message,
          order_id: order_id,
          attempted_status: status,
          existing_order: existingOrder,
          solution: 'RLS policy may be preventing this update. User needs admin privileges or RLS policy needs to be updated.'
        });
      }
      
      console.log('✅ Database update successful:', data);
      console.log('📊 Number of rows updated:', data ? data.length : 0);
      
      res.json({
        order_id,
        old_status: existingOrder.status,
        new_status: status,
        updated_at: new Date().toISOString(),
        success: true,
        database_result: data,
        rows_updated: data ? data.length : 0
      });
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      res.status(500).json({
        error: 'Database connection failed',
        details: dbError.message,
        order_id: order_id,
        attempted_status: status
      });
    }
    
  } catch (error) {
    console.error('❌ Order status update error:', error);
    res.status(500).json({
      error: 'Failed to update order status',
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
