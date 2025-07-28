import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const clientId = Deno.env.get("CASHFREE_CLIENT_ID")!;
const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET")!;
// Always use production API since we have production credentials
const environment = "api";

console.log('🔍 Verify Payment Environment:', environment);
console.log('🔑 Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'Not provided');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payment_session_id, order_id } = await req.json();
    
    console.log('🔍 Verifying payment for order:', order_id);
    console.log('🎫 Payment session ID:', payment_session_id);

    // Verify payment status directly using order endpoint
    const orderUrl = `https://${environment}.cashfree.com/pg/orders/${order_id}`;
    console.log('🔗 Order verification URL:', orderUrl);
    
    const orderResponse = await fetch(orderUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
    });

    if (!orderResponse.ok) {
      const orderError = await orderResponse.text();
      console.error('❌ Order verification failed:', orderError);
      throw new Error(`Failed to verify order: ${orderResponse.status} - ${orderError}`);
    }

    const orderData = await orderResponse.json();
    console.log('📋 Order data:', orderData);
    
    // Also try to get payment details
    const paymentUrl = `https://${environment}.cashfree.com/pg/orders/${order_id}/payments`;
    console.log('🔗 Payment verification URL:', paymentUrl);
    
    const paymentResponse = await fetch(paymentUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
    });

    let paymentData: any = null;
    
    if (paymentResponse.ok) {
      paymentData = await paymentResponse.json();
      console.log('💳 Payment data:', paymentData);
    } else {
      const paymentError = await paymentResponse.text();
      console.warn('⚠️ Payment details not available:', paymentError);
    }
    
    // Determine payment status from order or payment data
    let paymentStatus = "PENDING";
    if (orderData.order_status === "PAID") {
      paymentStatus = "SUCCESS";
    } else if (orderData.order_status === "FAILED" || orderData.order_status === "CANCELLED") {
      paymentStatus = "FAILED";
    } else if (paymentData && Array.isArray(paymentData) && paymentData.length > 0) {
      // Check the latest payment
      const latestPayment = paymentData[paymentData.length - 1];
      paymentStatus = latestPayment.payment_status || "PENDING";
    }
    
    console.log('✅ Final payment status:', paymentStatus);
    
    // Return payment status
    return new Response(
      JSON.stringify({
        payment_status: paymentStatus,
        order_status: orderData.order_status,
        order_amount: orderData.order_amount,
        order_currency: orderData.order_currency,
        order_id: order_id,
        raw_order_data: orderData,
        raw_payment_data: paymentData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Payment verification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        payment_status: "FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
