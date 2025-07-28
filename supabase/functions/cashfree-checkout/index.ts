import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const clientId = Deno.env.get("CASHFREE_CLIENT_ID")!;
const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET")!;
// Always use production API since we have production credentials
const environment = "api";

console.log('🌍 Cashfree Environment:', environment);
console.log('🔑 Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'Not provided');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { amount, customer_id, customer_email, customer_phone, order_id } = await req.json();

    console.log('💳 Creating Cashfree order:', {
      order_id,
      amount,
      customer_id,
      environment
    });

    // Determine the correct return URL based on environment
    const origin = req.headers.get('origin');
    let returnUrl: string;
    
    if (environment === "api") {
      // For production API, always use the production URL (HTTPS required)
      returnUrl = 'https://luxe-craft-shop1-mjc7bzy1e-debayans-projects.vercel.app/order-success?order_id={order_id}';
    } else {
      // For sandbox/development, we can use a test HTTPS URL or localhost with HTTPS
      if (origin && origin.includes('localhost')) {
        // For local development, use the production URL since Cashfree requires HTTPS
        returnUrl = 'https://luxe-craft-shop1-mjc7bzy1e-debayans-projects.vercel.app/order-success?order_id={order_id}';
      } else {
        returnUrl = `${origin || 'https://luxe-craft-shop1-mjc7bzy1e-debayans-projects.vercel.app'}/order-success?order_id={order_id}`;
      }
    }

    console.log('🔗 Return URL:', returnUrl);

    const order = {
      order_amount: amount,
      order_currency: "INR",
      order_id: order_id || `order_${Date.now()}`,
      customer_details: {
        customer_id,
        customer_email,
        customer_phone,
      },
      order_meta: {
        return_url: returnUrl,
      },
    };

    console.log('📤 Sending order to Cashfree:', order);

    // Create order directly with Cashfree API
    const cashfreeUrl = `https://${environment}.cashfree.com/pg/orders`;
    console.log('🔗 Cashfree API URL:', cashfreeUrl);
    
    const response = await fetch(cashfreeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(order),
    });

    console.log('📥 Cashfree response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Cashfree API error:', errorData);
      throw new Error(`Cashfree API error: ${response.status} - ${errorData}`);
    }

    const responseData = await response.json();
    console.log('✅ Cashfree order created successfully:', responseData.order_id);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cashfree checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
