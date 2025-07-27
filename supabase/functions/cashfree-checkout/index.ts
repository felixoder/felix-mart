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
    const { amount, customer_id, customer_email, customer_phone, order_id } = await req.json();

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
        return_url: `${req.headers.get('origin') || 'http://localhost:5173'}/order-success?order_id={order_id}`,
      },
    };

    // Create order directly with Cashfree API
    const response = await fetch(`https://${environment}.cashfree.com/pg/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "x-api-version": "2023-08-01",
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Cashfree API error: ${response.status} - ${errorData}`);
    }

    const responseData = await response.json();
    
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
