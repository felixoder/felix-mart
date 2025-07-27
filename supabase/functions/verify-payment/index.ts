import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const clientId = Deno.env.get("CASHFREE_CLIENT_ID")!;
const clientSecret = Deno.env.get("CASHFREE_CLIENT_SECRET")!;
const environment = "sandbox";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { payment_session_id, order_id } = await req.json();

    // Get access token
    const tokenResponse = await fetch(`https://${environment}.cashfree.com/pg/auth/v1/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to get access token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify payment status
    const paymentResponse = await fetch(
      `https://${environment}.cashfree.com/pg/orders/v1/${order_id}/payments`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "x-api-version": "2023-08-01",
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      throw new Error("Failed to verify payment");
    }

    const paymentData = await paymentResponse.json();
    
    // Return payment status
    return new Response(
      JSON.stringify({
        payment_status: paymentData.payment_status || "PENDING",
        payment_amount: paymentData.payment_amount,
        payment_currency: paymentData.payment_currency,
        payment_time: paymentData.payment_time,
        order_id: order_id,
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
